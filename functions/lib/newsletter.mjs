// Double opt-in list. Records live in the plane's SUBSCRIBERS KV. Server metrics live in that plane's EVENTS KV
// under metric: dates. Browser /api/e counters are a different key prefix and cannot increment these.
// Raw confirm and unsubscribe tokens are emailed, then only their SHA-256 hashes are stored.
// GET never changes state (mailbox prefetch). POST is the confirmation and the unsubscribe.
import {bindingsFor, originAllowed, requestPlane} from './plane.mjs';
import {deliverMail, mailPlan} from './mail.mjs';
import {messageFor} from './signup-messages.mjs';

export const CONSENT_VERSION = '2026-11-08';
export const CONSENT_TEXT = 'Send me the weekly joulemath email. I can unsubscribe any time.';
export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;
export const MAX_SIGNUPS_PER_HOUR = 5;
export const MAX_TOKEN_POSTS_PER_HOUR = 30;
export const MAX_CONFIRM_SENDS = 3;
export const SEND_WINDOW_MS = 24 * 60 * 60 * 1000;
const METRIC_TTL_SECONDS = 400 * 86400;
const SOURCES = new Set(['home', 'blog', 'asic', 'power', 'gpu']);
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
};

function nowMs(deps) {
  return deps && typeof deps.now === 'function' ? deps.now() : Date.now();
}

function dayKey(now) {
  return new Date(now).toISOString().slice(0, 10);
}

function json(body, status) {
  return new Response(JSON.stringify(body), {status, headers: JSON_HEADERS});
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

function html(title, inner, status = 200) {
  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head><body style="font:18px/1.45 system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;color:#1c1d21"><h1 style="font-size:1.3rem">${esc(title)}</h1>${inner}<p><a href="/">Back to joulemath</a></p></body></html>`;
  return new Response(doc, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function wantsHtml(request) {
  const accept = request.headers.get('accept') || '';
  if (accept.includes('application/json')) return false;
  return request.headers.get('sec-fetch-mode') === 'navigate';
}

function respond(request, body, status) {
  const safe = {
    ok: status < 400 && body.ok !== false,
    status: body.status,
    emailSent: body.emailSent === true,
    onList: body.onList === true,
    stored: body.stored === true,
  };
  if (body.reason) safe.reason = body.reason;
  if (status >= 400) safe.ok = false;
  if (!wantsHtml(request)) return json(safe, status);
  const title = safe.status === 'confirmed' ? 'Subscription confirmed'
    : safe.status === 'unsubscribed' || safe.status === 'cancelled' || safe.status === 'already_unsubscribed' ? 'Unsubscribe'
    : safe.ok ? 'Check your email' : 'Signup';
  return html(title, `<p>${esc(messageFor(safe, status))}</p>`, status);
}

async function sha256Hex(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function mintToken(deps) {
  const bytes = deps && typeof deps.randomBytes === 'function'
    ? deps.randomBytes(32)
    : crypto.getRandomValues(new Uint8Array(32));
  if (!(bytes instanceof Uint8Array) || bytes.length !== 32) {
    const err = new Error('token');
    err.code = 'token';
    throw err;
  }
  let acc = 0;
  for (const b of bytes) acc |= b;
  if (acc === 0) {
    const err = new Error('token');
    err.code = 'token';
    throw err;
  }
  const token = b64url(bytes);
  if (!TOKEN_RE.test(token)) {
    const err = new Error('token');
    err.code = 'token';
    throw err;
  }
  return token;
}

export function normalizeEmail(raw) {
  const email = String(raw || '').trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || email.includes('..') || !EMAIL_RE.test(email)) return '';
  const tld = email.split('@')[1].split('.').at(-1);
  if (!tld || tld.length < 2 || tld.length > 24) return '';
  return email;
}

function allowSrc(raw) {
  const src = String(raw || '').slice(0, 40);
  return SOURCES.has(src) ? src : 'unknown';
}

function honeypotTripped(data) {
  if (!data || !Object.prototype.hasOwnProperty.call(data, 'website')) return false;
  const value = data.website;
  if (typeof value === 'string') return value.trim() !== '';
  return value != null && value !== false;
}

async function readData(request) {
  const len = request.headers.get('content-length');
  if (len && Number(len) > 4096) return {error: 'too_large'};
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      const text = await request.text();
      if (text.length > 4096) return {error: 'too_large'};
      const data = text ? JSON.parse(text) : {};
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {error: 'bad_request'};
      return {data};
    }
    const form = await request.formData();
    const data = {};
    for (const [key, value] of form.entries()) {
      if (key === 'website' && typeof value !== 'string') {
        data.website = '1';
        continue;
      }
      if (typeof value !== 'string') continue;
      if (value.length > 2000) return {error: 'too_large'};
      data[key] = value;
    }
    return {data};
  } catch {
    return {error: 'bad_request'};
  }
}

function parseRec(raw) {
  let rec;
  try {
    rec = JSON.parse(raw);
  } catch {
    const err = new Error('corrupt');
    err.code = 'corrupt';
    throw err;
  }
  if (!rec || typeof rec !== 'object' || typeof rec.email !== 'string' || typeof rec.status !== 'string') {
    const err = new Error('corrupt');
    err.code = 'corrupt';
    throw err;
  }
  return rec;
}

async function bump(kv, now, name) {
  if (!kv) return;
  try {
    const key = `metric:${dayKey(now)}:signup:${name}`;
    const n = parseInt(await kv.get(key) || '0', 10) + 1;
    if (!Number.isFinite(n)) return;
    await kv.put(key, String(n), {expirationTtl: METRIC_TTL_SECONDS});
  } catch {
    // A metrics failure must not decide whether a signup was saved or a mail was sent.
  }
}

async function ipKey(env, ip, kind, now) {
  const pepper = String((env && env.NEWSLETTER_IP_PEPPER) || 'joulemath-rl-v1');
  const hash = await sha256Hex(`${pepper}:${ip || '0'}`);
  const hour = Math.floor(now / 3600000);
  return `rl:${kind}:${hash}:${hour}`;
}

async function overLimit(kv, key, max) {
  const n = parseInt(await kv.get(key) || '0', 10) || 0;
  if (n >= max) return true;
  await kv.put(key, String(n + 1), {expirationTtl: 3700});
  return false;
}

function pushHistory(rec, entry) {
  const history = Array.isArray(rec.history) ? rec.history.slice(-9) : [];
  history.push(entry);
  rec.history = history;
}

function publicRecord(email, plane, src, now) {
  const at = new Date(now).toISOString();
  return {
    v: 1,
    email,
    status: 'pending',
    src,
    consentVersion: CONSENT_VERSION,
    consentText: CONSENT_TEXT,
    requestedAt: at,
    confirmedAt: null,
    suppressedAt: null,
    confirmTokenHash: null,
    confirmExpires: null,
    unsubTokenHash: null,
    confirmSends: 0,
    confirmSendResetAt: now,
    plane,
    history: [{t: at, a: 'request', src, v: CONSENT_VERSION}],
  };
}

async function putToken(kv, tokenHash, emailHash, purpose, exp) {
  const opts = purpose === 'confirm' ? {expirationTtl: Math.ceil(CONFIRM_TTL_MS / 1000) + 3600} : undefined;
  await kv.put('tok:' + tokenHash, JSON.stringify({h: emailHash, p: purpose, exp: exp || null}), opts);
}

async function deleteToken(kv, tokenHash) {
  if (tokenHash) await kv.delete('tok:' + tokenHash);
}

function mailMessage(origin, email, confirmToken, unsubToken) {
  const confirmUrl = `${origin}/api/confirm?token=${encodeURIComponent(confirmToken)}`;
  const unsubscribeUrl = `${origin}/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
  return {
    to: email,
    subject: 'Confirm your joulemath weekly email',
    confirmUrl,
    unsubscribeUrl,
    text: `Confirm your joulemath weekly email\n\nYou asked to get the weekly joulemath email. You are not subscribed until you open this link:\n\n${confirmUrl}\n\nThe link expires in 48 hours. If you did not ask for this, ignore it, or decline here:\n\n${unsubscribeUrl}\n`,
  };
}

function originFor(request, plane) {
  if (plane === 'production') return 'https://joulemath.com';
  return new URL(request.url).origin;
}

// The hidden website field gets the same JSON a real signup would, and nothing is written.
// That is deliberate so a bot cannot learn the field. The form still must not call anyone "on the list".
function honeypotBody(env, plane) {
  const plan = mailPlan(env, plane);
  if (plan.mode === 'resend' || plan.mode === 'postmark') {
    return {ok: true, status: 'confirm_sent', emailSent: true, onList: false, stored: true};
  }
  return {ok: true, status: 'saved_unsent', emailSent: false, onList: false, stored: true, reason: plan.reason};
}

function canSend(rec, now) {
  if (!rec.confirmSendResetAt || now >= rec.confirmSendResetAt) {
    rec.confirmSends = 0;
    rec.confirmSendResetAt = now + SEND_WINDOW_MS;
  }
  return (rec.confirmSends || 0) < MAX_CONFIRM_SENDS;
}

async function loadExisting(kv, email) {
  const emailHash = await sha256Hex(email);
  const key = 'sub:' + emailHash;
  const legacyKey = 'sub:' + email;
  const current = await kv.get(key);
  if (current) {
    const legacyRaw = await kv.get(legacyKey);
    return {key, emailHash, rec: parseRec(current), legacy: legacyRaw ? {present: true} : null, legacyKey};
  }
  const legacyRaw = await kv.get(legacyKey);
  let legacy = null;
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw);
      legacy = parsed && typeof parsed === 'object' ? parsed : {unreadable: true};
    } catch {
      legacy = {unreadable: true};
    }
  }
  return {key, emailHash, rec: null, legacy, legacyKey};
}

async function issueUnsub(kv, emailHash, deps) {
  const token = mintToken(deps);
  const hash = await sha256Hex(token);
  await putToken(kv, hash, emailHash, 'unsub', null);
  return {token, hash};
}

async function mintConfirm(deps, now) {
  const token = mintToken(deps);
  return {token, hash: await sha256Hex(token), exp: now + CONFIRM_TTL_MS};
}

async function sendConfirm(env, plane, request, email, confirmToken, unsubToken, deps) {
  const message = mailMessage(originFor(request, plane), email, confirmToken, unsubToken);
  const sent = await deliverMail(env, plane, message, deps);
  return {sent, message};
}

function fail(err, request) {
  if (err && (err.code === 'token' || err.code === 'corrupt')) {
    return respond(request, {ok: false, status: 'unavailable', emailSent: false, onList: false, stored: false}, 503);
  }
  return respond(request, {ok: false, status: 'error', emailSent: false, onList: false, stored: false}, 500);
}

export async function handleSubscribe(request, env, deps = {}) {
  try {
    const parsed = await readData(request);
    if (parsed.error) {
      const status = parsed.error === 'too_large' ? 413 : 400;
      return respond(request, {ok: false, status: parsed.error, emailSent: false, onList: false, stored: false}, status);
    }
    const data = parsed.data;
    const bound = bindingsFor(request, env);
    if (bound.plane !== 'production' && !bound.subscribers) {
      return respond(request, {ok: false, status: 'preview_isolated', emailSent: false, onList: false, stored: false}, 403);
    }
    if (!bound.subscribers) {
      return respond(request, {ok: false, status: 'unavailable', emailSent: false, onList: false, stored: false}, 503);
    }
    if (honeypotTripped(data)) return respond(request, honeypotBody(env, bound.plane), 200);
    if (!originAllowed(request)) {
      return respond(request, {ok: false, status: 'forbidden', emailSent: false, onList: false, stored: false}, 403);
    }

    const now = nowMs(deps);
    const kv = bound.subscribers;
    await bump(bound.events, now, 'attempt');
    const email = normalizeEmail(data.email);
    if (!email) return respond(request, {ok: false, status: 'invalid_email', emailSent: false, onList: false, stored: false}, 400);
    if (String(data.consent || '') !== 'yes') {
      return respond(request, {ok: false, status: 'consent_required', emailSent: false, onList: false, stored: false}, 400);
    }
    if (String(data.consent_version || '') !== CONSENT_VERSION) {
      return respond(request, {ok: false, status: 'consent_required', reason: 'consent_version', emailSent: false, onList: false, stored: false}, 400);
    }

    const ip = request.headers.get('cf-connecting-ip') || '0';
    if (await overLimit(kv, await ipKey(env, ip, 's', now), MAX_SIGNUPS_PER_HOUR)) {
      return respond(request, {ok: false, status: 'rate_limited', emailSent: false, onList: false, stored: false}, 429);
    }

    const found = await loadExisting(kv, email);
    const src = allowSrc(data.src);
    if (found.rec && found.legacy) await kv.delete(found.legacyKey);
    if (found.rec && found.rec.status === 'confirmed') {
      return respond(request, {ok: true, status: 'already_confirmed', emailSent: false, onList: true, stored: true}, 200);
    }

    const original = found.rec;
    const pendingAlready = !!(original && original.status === 'pending');
    let rec = original;
    let created = false;
    if (!rec || rec.status === 'suppressed') {
      const fresh = publicRecord(email, bound.plane, src, now);
      if (rec && rec.status === 'suppressed') {
        fresh.history = Array.isArray(rec.history) ? rec.history.slice(-8) : [];
        pushHistory(fresh, {t: new Date(now).toISOString(), a: 'request', src, v: CONSENT_VERSION});
        await deleteToken(kv, rec.unsubTokenHash);
        await deleteToken(kv, rec.confirmTokenHash);
        await bump(bound.events, now, 'reconsent');
      } else if (found.legacy) {
        const legacyAt = Date.parse(found.legacy.ts);
        if (Number.isFinite(legacyAt)) {
          fresh.history.unshift({t: new Date(legacyAt).toISOString(), a: 'legacy', src: allowSrc(found.legacy.src), v: null});
          fresh.history = fresh.history.slice(-10);
        }
        await bump(bound.events, now, 'legacy_moved');
      } else {
        created = true;
      }
      const unsub = await issueUnsub(kv, found.emailHash, deps);
      fresh.unsubTokenHash = unsub.hash;
      fresh._unsubToken = unsub.token;
      rec = fresh;
      await kv.put(found.key, JSON.stringify(stripTemp(rec)));
      if (found.legacy) await kv.delete(found.legacyKey);
      if (created) await bump(bound.events, now, 'saved');
    }

    if (!canSend(rec, now)) {
      await kv.put(found.key, JSON.stringify(stripTemp(rec)));
      return respond(request, {ok: true, status: 'already_pending', emailSent: false, onList: false, stored: true, reason: 'resend_limited'}, 200);
    }

    // Resends only have the unsubscribe hash, not the raw token the email has to contain.
    // Keep the previous token valid until the provider accepts the new message.
    let liveUnsub = rec._unsubToken || null;
    let previousUnsub = null;
    if (!liveUnsub) {
      const unsub = await issueUnsub(kv, found.emailHash, deps);
      previousUnsub = rec.unsubTokenHash;
      rec.unsubTokenHash = unsub.hash;
      liveUnsub = unsub.token;
    }

    const previousHash = rec.confirmTokenHash || null;
    const previousExp = rec.confirmExpires || null;
    const minted = await mintConfirm(deps, now);
    await putToken(kv, minted.hash, found.emailHash, 'confirm', minted.exp);
    rec.confirmTokenHash = minted.hash;
    rec.confirmExpires = minted.exp;
    await kv.put(found.key, JSON.stringify(stripTemp(rec)));

    let sent;
    try {
      sent = (await sendConfirm(env, bound.plane, request, email, minted.token, liveUnsub, deps)).sent;
    } catch {
      sent = {ok: false, reason: 'delivery_failed'};
    }
    if (!sent.ok) {
      await deleteToken(kv, minted.hash);
      if (previousUnsub) await deleteToken(kv, rec.unsubTokenHash);
      rec.confirmTokenHash = previousHash;
      rec.confirmExpires = previousExp;
      if (previousUnsub) rec.unsubTokenHash = previousUnsub;
      await kv.put(found.key, JSON.stringify(stripTemp(rec)));
      const status = pendingAlready ? 'already_pending' : 'saved_unsent';
      return respond(request, {ok: true, status, emailSent: false, onList: false, stored: true, reason: sent.reason || 'delivery_failed'}, 200);
    }

    try {
      if (previousHash && previousHash !== minted.hash) await deleteToken(kv, previousHash);
      if (previousUnsub) await deleteToken(kv, previousUnsub);
      rec.confirmSends = (rec.confirmSends || 0) + 1;
      await kv.put(found.key, JSON.stringify(stripTemp(rec)));
      if (pendingAlready) await bump(bound.events, now, 'resent');
    } catch {
      // The provider already accepted the message, and the confirm hash was saved before that call.
    }
    const status = pendingAlready ? 'already_pending_sent' : 'confirm_sent';
    return respond(request, {ok: true, status, emailSent: true, onList: false, stored: true}, 200);
  } catch (err) {
    return fail(err, request);
  }
}

function stripTemp(rec) {
  const out = {};
  for (const [key, value] of Object.entries(rec)) {
    if (key.startsWith('_')) continue;
    out[key] = value;
  }
  return out;
}

function tokenFrom(request, data) {
  const bodyToken = data && typeof data.token === 'string' ? data.token : '';
  if (bodyToken) return bodyToken.trim();
  return new URL(request.url).searchParams.get('token') || '';
}

async function readTokenRequest(request) {
  const len = request.headers.get('content-length');
  if (len && Number(len) > 4096) return {error: 'too_large'};
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      const text = await request.text();
      if (text.length > 4096) return {error: 'too_large'};
      const data = text ? JSON.parse(text) : {};
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {error: 'bad_request'};
      return {data};
    }
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data') || ct.includes('text/plain')) {
      const form = await request.formData();
      const data = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === 'string') data[key] = value;
      }
      return {data};
    }
    const text = await request.text();
    if (text.length > 4096) return {error: 'too_large'};
    if (!text) return {data: {}};
    if (text.includes('List-Unsubscribe')) return {data: {listUnsubscribe: text}};
    const params = new URLSearchParams(text);
    return {data: Object.fromEntries(params.entries())};
  } catch {
    return {error: 'bad_request'};
  }
}

function formPage(action, token, heading, text, button) {
  return html(heading, `<p>${esc(text)}</p><form method="post" action="${action}"><input type="hidden" name="token" value="${esc(token)}"><button type="submit">${esc(button)}</button></form>`);
}

export async function handleConfirmGet(request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!TOKEN_RE.test(token)) return html('Link not valid', '<p>This link is invalid or expired.</p>', 400);
  return formPage('/api/confirm', token, 'Confirm your subscription', 'You are not subscribed yet. Confirm to get the weekly joulemath email.', 'Confirm subscription');
}

export async function handleUnsubscribeGet(request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!TOKEN_RE.test(token)) return html('Link not valid', '<p>This link is invalid or expired.</p>', 400);
  return formPage('/api/unsubscribe', token, 'Unsubscribe', 'This stops the weekly joulemath email for the address on this link.', 'Unsubscribe');
}

async function lookupToken(kv, token, purpose, now) {
  if (!TOKEN_RE.test(token)) return {invalid: true};
  const tokenHash = await sha256Hex(token);
  const raw = await kv.get('tok:' + tokenHash);
  if (!raw) return {invalid: true};
  let ptr;
  try {
    ptr = JSON.parse(raw);
  } catch {
    return {invalid: true};
  }
  if (!ptr || typeof ptr.h !== 'string') return {invalid: true};
  if (ptr.p === 'confirm-used' && purpose === 'confirm') return {tokenHash, emailHash: ptr.h, used: true};
  if (ptr.p !== purpose) return {invalid: true};
  if (ptr.exp != null && now > ptr.exp) return {expired: true, tokenHash};
  const recRaw = await kv.get('sub:' + ptr.h);
  if (!recRaw) return {invalid: true};
  const rec = parseRec(recRaw);
  if (purpose === 'confirm' && rec.confirmTokenHash !== tokenHash) return {invalid: true};
  if (purpose === 'unsub' && rec.unsubTokenHash !== tokenHash) return {invalid: true};
  return {tokenHash, emailHash: ptr.h, rec, key: 'sub:' + ptr.h};
}

export async function handleConfirmPost(request, env, deps = {}) {
  try {
    const bound = bindingsFor(request, env);
    if (bound.plane !== 'production' && !bound.subscribers) {
      return respond(request, {ok: false, status: 'preview_isolated', emailSent: false, onList: false, stored: false}, 403);
    }
    if (!bound.subscribers) return respond(request, {ok: false, status: 'unavailable', emailSent: false, onList: false, stored: false}, 503);
    const parsed = await readTokenRequest(request);
    if (parsed.error) {
      const status = parsed.error === 'too_large' ? 413 : 400;
      return respond(request, {ok: false, status: parsed.error, emailSent: false, onList: false, stored: false}, status);
    }
    const now = nowMs(deps);
    const ip = request.headers.get('cf-connecting-ip') || '0';
    if (await overLimit(bound.subscribers, await ipKey(env, ip, 'c', now), MAX_TOKEN_POSTS_PER_HOUR)) {
      return respond(request, {ok: false, status: 'rate_limited', emailSent: false, onList: false, stored: false}, 429);
    }
    const token = tokenFrom(request, parsed.data);
    const found = await lookupToken(bound.subscribers, token, 'confirm', now);
    if (found.used) {
      const recRaw = await bound.subscribers.get('sub:' + found.emailHash);
      const rec = recRaw ? parseRec(recRaw) : null;
      if (rec && rec.status === 'confirmed') {
        return respond(request, {ok: true, status: 'already_confirmed', emailSent: false, onList: true, stored: true}, 200);
      }
      return respond(request, {ok: false, status: 'invalid_token', emailSent: false, onList: false, stored: false}, 400);
    }
    if (found.expired) {
      await deleteToken(bound.subscribers, found.tokenHash);
      return respond(request, {ok: false, status: 'invalid_token', emailSent: false, onList: false, stored: false}, 400);
    }
    if (found.invalid || !found.rec) {
      return respond(request, {ok: false, status: 'invalid_token', emailSent: false, onList: false, stored: false}, 400);
    }
    if (found.rec.status === 'suppressed') {
      return respond(request, {ok: false, status: 'invalid_token', emailSent: false, onList: false, stored: false}, 400);
    }
    if (found.rec.status === 'confirmed') {
      return respond(request, {ok: true, status: 'already_confirmed', emailSent: false, onList: true, stored: true}, 200);
    }
    found.rec.status = 'confirmed';
    found.rec.confirmedAt = new Date(now).toISOString();
    found.rec.confirmTokenHash = null;
    found.rec.confirmExpires = null;
    pushHistory(found.rec, {t: found.rec.confirmedAt, a: 'confirm', src: found.rec.src, v: found.rec.consentVersion});
    await bound.subscribers.put(found.key, JSON.stringify(stripTemp(found.rec)));
    await bound.subscribers.put('tok:' + found.tokenHash, JSON.stringify({h: found.emailHash, p: 'confirm-used', exp: now + 7 * 86400000}), {expirationTtl: 7 * 86400});
    await bump(bound.events, now, 'confirmed');
    return respond(request, {ok: true, status: 'confirmed', emailSent: false, onList: true, stored: true}, 200);
  } catch (err) {
    return fail(err, request);
  }
}

export async function handleUnsubscribePost(request, env, deps = {}) {
  try {
    const bound = bindingsFor(request, env);
    if (bound.plane !== 'production' && !bound.subscribers) {
      return respond(request, {ok: false, status: 'preview_isolated', emailSent: false, onList: false, stored: false}, 403);
    }
    if (!bound.subscribers) return respond(request, {ok: false, status: 'unavailable', emailSent: false, onList: false, stored: false}, 503);
    const parsed = await readTokenRequest(request);
    if (parsed.error) {
      const status = parsed.error === 'too_large' ? 413 : 400;
      return respond(request, {ok: false, status: parsed.error, emailSent: false, onList: false, stored: false}, status);
    }
    const now = nowMs(deps);
    const ip = request.headers.get('cf-connecting-ip') || '0';
    if (await overLimit(bound.subscribers, await ipKey(env, ip, 'u', now), MAX_TOKEN_POSTS_PER_HOUR)) {
      return respond(request, {ok: false, status: 'rate_limited', emailSent: false, onList: false, stored: false}, 429);
    }
    const token = tokenFrom(request, parsed.data);
    const found = await lookupToken(bound.subscribers, token, 'unsub', now);
    if (found.invalid || found.expired || !found.rec) {
      return respond(request, {ok: false, status: 'invalid_token', emailSent: false, onList: false, stored: false}, 400);
    }
    if (found.rec.status === 'suppressed') {
      return respond(request, {ok: true, status: 'already_unsubscribed', emailSent: false, onList: false, stored: true}, 200);
    }
    const wasConfirmed = found.rec.status === 'confirmed';
    found.rec.status = 'suppressed';
    found.rec.suppressedAt = new Date(now).toISOString();
    found.rec.confirmedAt = wasConfirmed ? found.rec.confirmedAt : null;
    await deleteToken(bound.subscribers, found.rec.confirmTokenHash);
    found.rec.confirmTokenHash = null;
    found.rec.confirmExpires = null;
    pushHistory(found.rec, {t: found.rec.suppressedAt, a: 'suppress', src: found.rec.src, v: found.rec.consentVersion});
    await bound.subscribers.put(found.key, JSON.stringify(stripTemp(found.rec)));
    await bump(bound.events, now, 'suppressed');
    const status = wasConfirmed ? 'unsubscribed' : 'cancelled';
    return respond(request, {ok: true, status, emailSent: false, onList: false, stored: true}, 200);
  } catch (err) {
    return fail(err, request);
  }
}

function liveDeps(plane) {
  // The adapter enables provider fetch only on production. Preview cannot send, even if the API key is on the project.
  return plane === 'production' ? {fetch: globalThis.fetch} : {};
}

export function routeSubscribe(request, env) {
  if (request.method !== 'POST') {
    return respond(request, {ok: false, status: 'method_not_allowed', emailSent: false, onList: false, stored: false}, 405);
  }
  return handleSubscribe(request, env, liveDeps(requestPlane(request)));
}

export function routeConfirm(request, env) {
  if (request.method === 'GET' || request.method === 'HEAD') return handleConfirmGet(request);
  if (request.method === 'POST') return handleConfirmPost(request, env, liveDeps(requestPlane(request)));
  return respond(request, {ok: false, status: 'method_not_allowed', emailSent: false, onList: false, stored: false}, 405);
}

export function routeUnsubscribe(request, env) {
  if (request.method === 'GET' || request.method === 'HEAD') return handleUnsubscribeGet(request);
  if (request.method === 'POST') return handleUnsubscribePost(request, env, liveDeps(requestPlane(request)));
  return respond(request, {ok: false, status: 'method_not_allowed', emailSent: false, onList: false, stored: false}, 405);
}
