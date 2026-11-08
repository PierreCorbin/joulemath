import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {
  CONFIRM_TTL_MS,
  CONSENT_TEXT,
  CONSENT_VERSION,
  MAX_CONFIRM_SENDS,
  MAX_SIGNUPS_PER_HOUR,
  handleConfirmGet,
  handleConfirmPost,
  handleSubscribe,
  handleUnsubscribeGet,
  handleUnsubscribePost,
  routeConfirm,
  routeSubscribe,
  routeUnsubscribe,
} from '../functions/lib/newsletter.mjs';
import {deliverMail} from '../functions/lib/mail.mjs';
import {messageFor} from '../functions/lib/signup-messages.mjs';
import {requestPlane} from '../functions/lib/plane.mjs';

const EMAIL = 'person@example.com';
const BTC = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
const MACHINE = '999001';
const IP = '203.0.113.8';
const START = Date.UTC(2026, 10, 8, 12, 0, 0);
const RECORD_KEYS = ['confirmExpires', 'confirmSendResetAt', 'confirmSends', 'confirmTokenHash', 'confirmedAt', 'consentText', 'consentVersion', 'email', 'history', 'plane', 'requestedAt', 'src', 'status', 'suppressedAt', 'unsubTokenHash', 'v'];

const originalFetch = globalThis.fetch;
let liveFetches = 0;
before(() => {
  globalThis.fetch = async () => {
    liveFetches += 1;
    throw new Error('blocked live fetch');
  };
});
after(() => {
  globalThis.fetch = originalFetch;
});

function mockKv() {
  const store = new Map();
  return {
    store,
    async get(key) {return store.has(key) ? store.get(key).value : null;},
    async put(key, value, opts) {store.set(key, {value, opts: opts || null});},
    async delete(key) {store.delete(key);},
  };
}

function explosive(name) {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      throw new Error(name + ' ' + String(prop));
    },
  });
}

function envWith(over = {}) {
  return {SUBSCRIBERS: mockKv(), EVENTS: mockKv(), ...over};
}

function dump(kv) {
  return [...kv.store.entries()].map(([key, row]) => key + '\n' + row.value).join('\n');
}

function records(kv) {
  return [...kv.store.entries()]
    .filter(([key]) => key.startsWith('sub:'))
    .map(([, row]) => JSON.parse(row.value));
}

function metric(kv, name) {
  let n = 0;
  for (const [key, row] of kv.store.entries()) {
    if (key.startsWith('metric:') && key.endsWith(':signup:' + name)) n += parseInt(row.value, 10) || 0;
  }
  return n;
}

function assertPrivate(kv, {token, email = EMAIL, ip = IP} = {}) {
  const text = dump(kv);
  assert.equal(text.includes(ip), false);
  assert.equal(text.includes(BTC), false);
  assert.equal(text.includes(MACHINE), false);
  if (token) assert.equal(text.includes(token), false);
  for (const key of kv.store.keys()) {
    assert.equal(key.includes(email), false);
    assert.equal(key.includes(ip), false);
    if (token) assert.equal(key.includes(token), false);
  }
  for (const [key, row] of kv.store.entries()) {
    if (!key.startsWith('sub:')) assert.equal(String(row.value).includes(email), false);
  }
}

async function postSubscribe(env, body, deps = {}) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json',
    'cf-connecting-ip': deps.ip || IP,
    ...(deps.headers || {}),
  };
  const request = new Request(deps.url || 'https://joulemath.com/api/subscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const res = await handleSubscribe(request, env, deps);
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) return {res, json: null};
  return {res, json: await res.json()};
}

function good(over = {}) {
  return {email: EMAIL, consent: 'yes', consent_version: CONSENT_VERSION, src: 'home', btc: BTC, machine_id: MACHINE, website: '', ...over};
}

function mailDeps(env, extra = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      now: extra.now || (() => START),
      ip: extra.ip,
      url: extra.url,
      headers: extra.headers,
      sendMail: async message => {
        calls.push(message);
        if (extra.fail) return {ok: false, reason: extra.reason || 'delivery_failed'};
        if (extra.throw) throw new Error('smtp down');
        return {ok: true};
      },
      randomBytes: extra.randomBytes,
    },
    env,
  };
}

test('planes follow the host and ignore a shared preview binding', () => {
  assert.equal(requestPlane(new Request('https://joulemath.com/api/subscribe')), 'production');
  assert.equal(requestPlane(new Request('https://www.joulemath.com/api/subscribe')), 'production');
  assert.equal(requestPlane(new Request('https://joulemath.pages.dev/api/subscribe')), 'production');
  assert.equal(requestPlane(new Request('https://Joulemath.com./api/subscribe')), 'production');
  assert.equal(requestPlane(new Request('https://abc.joulemath.pages.dev/api/subscribe')), 'preview');
  assert.equal(requestPlane(new Request('https://joulemath.com.evil.example/api/subscribe')), 'preview');
  assert.equal(requestPlane(new Request('http://localhost:8788/api/subscribe')), 'preview');
});

test('messages claim a send or a place on the list only with the matching flags', () => {
  const sent = 'Check your email to confirm. You are not on the list until you confirm.';
  const again = 'This email is still waiting for confirmation. We sent another confirmation email.';
  assert.equal(messageFor({status: 'confirm_sent', emailSent: true}, 200), sent);
  assert.equal(messageFor({status: 'confirm_sent', emailSent: false}, 200).includes('Check your email'), false);
  assert.equal(messageFor({status: 'saved_unsent', emailSent: false, reason: 'mailer_not_configured'}, 200).includes('Check your email'), false);
  assert.match(messageFor({status: 'saved_unsent', emailSent: false, reason: 'mailer_not_configured'}, 200), /not set up yet/);
  assert.match(messageFor({status: 'saved_unsent', emailSent: false, reason: 'delivery_failed'}, 200), /could not be sent/);
  assert.equal(messageFor({status: 'already_pending_sent', emailSent: true}, 200), again);
  assert.equal(messageFor({status: 'already_pending_sent', emailSent: false}, 200).includes('We sent'), false);
  assert.equal(messageFor({status: 'already_confirmed', onList: true, emailSent: false}, 200).includes('already confirmed'), true);
  assert.equal(messageFor({status: 'already_confirmed', onList: false, emailSent: true}, 200).includes('already confirmed'), false);
  assert.match(messageFor({status: 'confirmed', onList: true, emailSent: false}, 200), /not on the list until now/);
  assert.equal(messageFor({status: 'preview_isolated'}, 403), 'This preview does not accept newsletter signups.');
  assert.equal(messageFor({}, 0), 'Something went wrong. Nothing was confirmed. Try again later.');
  for (const text of [sent, again]) assert.equal(text.includes('Thanks, you are on the list'), false);
});

test('a new signup stays pending until the confirmation link is posted', async () => {
  const env = envWith();
  const box = mailDeps(env);
  const {res, json} = await postSubscribe(env, good(), box.deps);
  assert.equal(res.status, 200);
  assert.equal(json.status, 'confirm_sent');
  assert.equal(json.emailSent, true);
  assert.equal(json.onList, false);
  assert.equal(json.stored, true);
  assert.equal(JSON.stringify(json).includes(EMAIL), false);
  assert.equal(box.calls.length, 1);
  assert.equal(new URL(box.calls[0].confirmUrl).origin, 'https://joulemath.com');
  assert.match(box.calls[0].text, /not subscribed until you open this link/);
  const confirm = new URL(box.calls[0].confirmUrl).searchParams.get('token');
  const unsub = new URL(box.calls[0].unsubscribeUrl).searchParams.get('token');
  assert.notEqual(confirm, unsub);
  const rec = records(env.SUBSCRIBERS)[0];
  assert.deepEqual(Object.keys(rec).sort(), RECORD_KEYS);
  assert.equal(rec.status, 'pending');
  assert.equal(rec.email, EMAIL);
  assert.equal(rec.consentVersion, CONSENT_VERSION);
  assert.equal(rec.consentText, CONSENT_TEXT);
  assert.equal(rec.src, 'home');
  assert.equal(rec.plane, 'production');
  assert.equal(rec.history[0].a, 'request');
  assert.equal(rec.confirmSends, 1);
  assertPrivate(env.SUBSCRIBERS, {token: confirm});
  assertPrivate(env.SUBSCRIBERS, {token: unsub});
  assert.equal(metric(env.EVENTS, 'attempt'), 1);
  assert.equal(metric(env.EVENTS, 'saved'), 1);
  assert.equal(metric(env.EVENTS, 'confirmed'), 0);

  const before = dump(env.SUBSCRIBERS);
  const preview = await routeConfirm(new Request(box.calls[0].confirmUrl), explosive('confirm-get'));
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /Confirm subscription/);
  assert.equal(dump(env.SUBSCRIBERS), before);

  const early = await handleConfirmPost(new Request('https://joulemath.com/api/confirm?token=' + unsub, {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json'}, body: '{}',
  }), env, {now: () => START});
  assert.equal((await early.json()).status, 'invalid_token');
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'pending');

  const confirmed = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': IP},
    body: JSON.stringify({token: confirm}),
  }), env, {now: () => START});
  const confirmedJson = await confirmed.json();
  assert.equal(confirmedJson.status, 'confirmed');
  assert.equal(confirmedJson.onList, true);
  assert.equal(confirmedJson.emailSent, false);
  assert.equal(JSON.stringify(confirmedJson).includes(EMAIL), false);
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'confirmed');
  assert.equal(records(env.SUBSCRIBERS)[0].confirmTokenHash, null);
  assert.equal(metric(env.EVENTS, 'confirmed'), 1);
  assertPrivate(env.SUBSCRIBERS, {token: confirm});

  const again = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.9'},
    body: JSON.stringify({token: confirm}),
  }), env, {now: () => START + 1000});
  assert.equal((await again.json()).status, 'already_confirmed');
  assert.equal(metric(env.EVENTS, 'confirmed'), 1);

  const unsubGet = await handleUnsubscribeGet(new Request(box.calls[0].unsubscribeUrl));
  assert.match(await unsubGet.text(), /Unsubscribe/);
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'confirmed');

  const removed = await handleUnsubscribePost(new Request(box.calls[0].unsubscribeUrl, {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', 'cf-connecting-ip': '203.0.113.10'},
    body: 'List-Unsubscribe=One-Click',
  }), env, {now: () => START + 2000});
  const removedJson = await removed.json();
  assert.equal(removedJson.status, 'unsubscribed');
  assert.equal(removedJson.onList, false);
  assert.equal(removedJson.emailSent, false);
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'suppressed');
  assert.ok(records(env.SUBSCRIBERS)[0].history.some(item => item.a === 'suppress'));

  const late = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.11'},
    body: JSON.stringify({token: confirm}),
  }), env, {now: () => START + 3000});
  assert.equal((await late.json()).status, 'invalid_token');
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'suppressed');

  const box2 = mailDeps(env, {now: () => START + 4000});
  const resub = await postSubscribe(env, good(), {...box2.deps, ip: '203.0.113.12'});
  assert.equal(resub.json.status, 'confirm_sent');
  assert.equal(resub.json.onList, false);
  assert.equal(resub.json.emailSent, true);
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'pending');
  assert.equal(metric(env.EVENTS, 'saved'), 1);
  assert.equal(metric(env.EVENTS, 'reconsent'), 1);
  const confirm2 = new URL(box2.calls[0].confirmUrl).searchParams.get('token');
  assert.notEqual(confirm2, confirm);
  const second = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.13'},
    body: JSON.stringify({token: confirm2}),
  }), env, {now: () => START + 5000});
  assert.equal((await second.json()).onList, true);
  assert.equal(metric(env.EVENTS, 'confirmed'), 2);
  const oldUnsub = await handleUnsubscribePost(new Request('https://joulemath.com/api/unsubscribe?token=' + unsub, {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.14'}, body: '{}',
  }), env, {now: () => START + 6000});
  assert.equal((await oldUnsub.json()).status, 'invalid_token');
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'confirmed');
});

test('duplicate confirmed address does not send another email', async () => {
  const env = envWith();
  const box = mailDeps(env);
  await postSubscribe(env, good(), box.deps);
  const confirm = new URL(box.calls[0].confirmUrl).searchParams.get('token');
  await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.20'},
    body: JSON.stringify({token: confirm}),
  }), env, {now: () => START});
  const again = await postSubscribe(env, good(), {...box.deps, ip: '203.0.113.21'});
  assert.equal(again.json.status, 'already_confirmed');
  assert.equal(again.json.onList, true);
  assert.equal(again.json.emailSent, false);
  assert.equal(box.calls.length, 1);
  assert.equal(records(env.SUBSCRIBERS).length, 1);
  assert.equal(metric(env.EVENTS, 'saved'), 1);
});

test('invalid, consent, honeypot, and extra fields do not become subscribers', async () => {
  const env = envWith();
  const calls = [];
  const deps = {now: () => START, sendMail: async message => {calls.push(message); return {ok: true};}};
  for (const email of ['nope', 'a@b.c', 'Ann <person@example.com>', 'person@example.com\nBcc:x@y.z', 'person@example.com,other@example.com', '']) {
    const {json} = await postSubscribe(env, good({email}), {...deps, ip: '203.0.113.30'});
    assert.equal(json.status, 'invalid_email');
    assert.equal(json.stored, false);
  }
  const consent = await postSubscribe(env, good({consent: ''}), {...deps, ip: '203.0.113.31'});
  assert.equal(consent.json.status, 'consent_required');
  const version = await postSubscribe(env, good({consent_version: '2020-01-01'}), {...deps, ip: '203.0.113.32'});
  assert.equal(version.json.reason, 'consent_version');
  assert.equal(env.SUBSCRIBERS.store.size, 0);
  assert.equal(calls.length, 0);
  assert.equal(metric(env.EVENTS, 'saved'), 0);
  assert.ok(metric(env.EVENTS, 'attempt') >= 1);

  const honeyEnv = envWith();
  const honey = await postSubscribe(honeyEnv, good({website: 'https://spam.example'}), {...deps, ip: '203.0.113.33'});
  assert.equal(honey.json.onList, false);
  assert.equal(honey.json.emailSent, false);
  assert.equal(honey.json.status, 'saved_unsent');
  assert.equal(honeyEnv.SUBSCRIBERS.store.size, 0);
  assert.equal(honeyEnv.EVENTS.store.size, 0);
  assert.equal(calls.length, 0);

  const envMail = envWith({NEWSLETTER_FROM: 'joulemath <news@joulemath.com>', RESEND_API_KEY: 'test-key'});
  const before = liveFetches;
  const honeyLive = await postSubscribe(envMail, good({website: 'bot'}), {now: () => START, ip: '203.0.113.34'});
  assert.equal(honeyLive.json.status, 'confirm_sent');
  assert.equal(honeyLive.json.emailSent, true);
  assert.equal(honeyLive.json.onList, false);
  assert.equal(envMail.SUBSCRIBERS.store.size, 0);
  assert.equal(liveFetches, before);

  const kept = await postSubscribe(env, good({src: '<script>alert(1)</script>', email: '  Person@Example.COM  '}), {...deps, ip: '203.0.113.35'});
  assert.equal(kept.json.emailSent, true);
  const rec = records(env.SUBSCRIBERS)[0];
  assert.equal(rec.email, EMAIL);
  assert.equal(rec.src, 'unknown');
  assert.equal(JSON.stringify(rec).includes('<script>'), false);
  assert.equal(JSON.stringify(rec).includes(MACHINE), false);
});

test('mail failure and a missing provider keep the pending record and do not claim a send', async () => {
  const env = envWith();
  const box = mailDeps(env, {fail: true, reason: 'provider_down'});
  const failed = await postSubscribe(env, good(), box.deps);
  assert.equal(failed.json.status, 'saved_unsent');
  assert.equal(failed.json.emailSent, false);
  assert.equal(failed.json.onList, false);
  assert.equal(failed.json.stored, true);
  assert.equal(failed.json.reason, 'provider_down');
  assert.equal(messageFor(failed.json, 200).includes('Check your email'), false);
  assert.match(messageFor(failed.json, 200), /could not be sent/);
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'pending');
  assert.equal(metric(env.EVENTS, 'saved'), 1);
  assert.equal(metric(env.EVENTS, 'confirmed'), 0);
  const leaked = new URL(box.calls[0].confirmUrl).searchParams.get('token');
  const denied = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.40'},
    body: JSON.stringify({token: leaked}),
  }), env, {now: () => START});
  assert.equal((await denied.json()).status, 'invalid_token');

  const thrown = envWith();
  const boom = mailDeps(thrown, {throw: true});
  const blew = await postSubscribe(thrown, good({email: 'other@example.com'}), {...boom.deps, ip: '203.0.113.41'});
  assert.equal(blew.json.emailSent, false);
  assert.equal(blew.json.stored, true);
  assert.equal(records(thrown.SUBSCRIBERS)[0].status, 'pending');

  const bare = envWith();
  const fetches = liveFetches;
  const quiet = await postSubscribe(bare, good({email: 'quiet@example.com'}), {now: () => START, ip: '203.0.113.42'});
  assert.equal(quiet.json.status, 'saved_unsent');
  assert.equal(quiet.json.reason, 'mailer_not_configured');
  assert.equal(quiet.json.emailSent, false);
  assert.equal(quiet.json.stored, true);
  assert.equal(liveFetches, fetches);
  assert.match(messageFor(quiet.json, 200), /not set up yet/);

  const keyed = envWith({RESEND_API_KEY: 'test-key', NEWSLETTER_FROM: 'news@joulemath.com'});
  const noFetch = await postSubscribe(keyed, good({email: 'nofetch@example.com'}), {now: () => START, ip: '203.0.113.43'});
  assert.equal(noFetch.json.emailSent, false);
  assert.equal(noFetch.json.stored, true);
  assert.equal(liveFetches, fetches);
});

test('expired, replayed, and weak tokens do not confirm', async () => {
  const env = envWith();
  let now = START;
  const box = mailDeps(env, {now: () => now});
  await postSubscribe(env, good(), box.deps);
  const token = new URL(box.calls[0].confirmUrl).searchParams.get('token');
  now = START + CONFIRM_TTL_MS + 1;
  const expired = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.50'},
    body: JSON.stringify({token}),
  }), env, {now: () => now});
  assert.equal((await expired.json()).status, 'invalid_token');
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'pending');
  assert.equal(metric(env.EVENTS, 'confirmed'), 0);
  const resent = await postSubscribe(env, good(), {...box.deps, ip: '203.0.113.51'});
  assert.equal(resent.json.status, 'already_pending_sent');
  assert.equal(resent.json.emailSent, true);
  assert.equal(resent.json.onList, false);
  const fresh = new URL(box.calls[1].confirmUrl).searchParams.get('token');
  assert.notEqual(fresh, token);
  const old = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.52'},
    body: JSON.stringify({token}),
  }), env, {now: () => now});
  assert.equal((await old.json()).status, 'invalid_token');
  const ok = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.53'},
    body: JSON.stringify({token: fresh}),
  }), env, {now: () => now});
  assert.equal((await ok.json()).status, 'confirmed');
  assertPrivate(env.SUBSCRIBERS, {token: fresh});

  const weak = envWith();
  const blocked = await postSubscribe(weak, good({email: 'weak@example.com'}), {
    now: () => START, ip: '203.0.113.54', randomBytes: () => new Uint8Array(32),
  });
  assert.equal(blocked.json.status, 'unavailable');
  assert.equal(blocked.json.emailSent, false);
  assert.equal(blocked.json.stored, false);
  assert.equal(records(weak.SUBSCRIBERS).length, 0);

  const tampered = fresh.slice(0, -1) + (fresh.endsWith('a') ? 'b' : 'a');
  const bad = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.55'},
    body: JSON.stringify({token: tampered}),
  }), env, {now: () => now});
  assert.equal((await bad.json()).status, 'invalid_token');
});

test('resend cap, IP cap, legacy key, and a cancelled pending request', async () => {
  const env = envWith();
  const box = mailDeps(env);
  for (let i = 0; i < MAX_CONFIRM_SENDS; i++) {
    const out = await postSubscribe(env, good(), {...box.deps, ip: '203.0.113.60'});
    assert.equal(out.json.emailSent, true);
  }
  const limited = await postSubscribe(env, good(), {...box.deps, ip: '203.0.113.60'});
  assert.equal(limited.json.status, 'already_pending');
  assert.equal(limited.json.emailSent, false);
  assert.equal(limited.json.reason, 'resend_limited');
  assert.equal(box.calls.length, MAX_CONFIRM_SENDS);
  assert.equal(metric(env.EVENTS, 'saved'), 1);
  const still = new URL(box.calls[0].confirmUrl).searchParams.get('token');
  const ok = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.61'},
    body: JSON.stringify({token: still}),
  }), env, {now: () => START});
  assert.equal((await ok.json()).status, 'invalid_token');
  const latest = new URL(box.calls.at(-1).confirmUrl).searchParams.get('token');
  const yes = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.62'},
    body: JSON.stringify({token: latest}),
  }), env, {now: () => START});
  assert.equal((await yes.json()).status, 'confirmed');

  const crowd = envWith();
  const crowdMail = mailDeps(crowd);
  for (let i = 0; i < MAX_SIGNUPS_PER_HOUR; i++) {
    const out = await postSubscribe(crowd, good({email: `p${i}@example.com`}), {...crowdMail.deps, ip: '203.0.113.70'});
    assert.equal(out.json.emailSent, true);
  }
  const sixth = await postSubscribe(crowd, good({email: 'p9@example.com'}), {...crowdMail.deps, ip: '203.0.113.70'});
  assert.equal(sixth.res.status, 429);
  assert.equal(sixth.json.status, 'rate_limited');
  assert.equal(sixth.json.stored, false);
  assert.equal(records(crowd.SUBSCRIBERS).length, MAX_SIGNUPS_PER_HOUR);
  const otherIp = await postSubscribe(crowd, good({email: 'p9@example.com'}), {...crowdMail.deps, ip: '203.0.113.71'});
  assert.equal(otherIp.json.emailSent, true);

  const legacy = envWith();
  legacy.SUBSCRIBERS.store.set('sub:' + EMAIL, {value: JSON.stringify({email: EMAIL, ts: '2026-11-01T00:00:00.000Z', src: 'blog', btc: BTC}), opts: null});
  const moved = mailDeps(legacy);
  const migrated = await postSubscribe(legacy, good(), {...moved.deps, ip: '203.0.113.80'});
  assert.equal(migrated.json.emailSent, true);
  assert.equal(migrated.json.onList, false);
  assert.equal(legacy.SUBSCRIBERS.store.has('sub:' + EMAIL), false);
  assert.equal(JSON.stringify(records(legacy.SUBSCRIBERS)[0]).includes(BTC), false);
  assert.equal(records(legacy.SUBSCRIBERS)[0].status, 'pending');
  assert.ok(records(legacy.SUBSCRIBERS)[0].history.some(item => item.a === 'legacy'));
  assert.equal(metric(legacy.EVENTS, 'saved'), 0);
  assert.equal(metric(legacy.EVENTS, 'legacy_moved'), 1);

  const pending = envWith();
  const pendingMail = mailDeps(pending);
  const first = await postSubscribe(pending, good({email: 'later@example.com'}), {...pendingMail.deps, ip: '203.0.113.90'});
  const confirm = new URL(pendingMail.calls[0].confirmUrl).searchParams.get('token');
  const unsub = new URL(pendingMail.calls[0].unsubscribeUrl).searchParams.get('token');
  const cancelled = await handleUnsubscribePost(new Request('https://joulemath.com/api/unsubscribe', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.91'},
    body: JSON.stringify({token: unsub}),
  }), pending, {now: () => START});
  assert.equal((await cancelled.json()).status, 'cancelled');
  assert.equal(records(pending.SUBSCRIBERS)[0].status, 'suppressed');
  const ignored = await handleConfirmPost(new Request('https://joulemath.com/api/confirm', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.92'},
    body: JSON.stringify({token: confirm}),
  }), pending, {now: () => START});
  assert.equal((await ignored.json()).status, 'invalid_token');
  assert.equal(first.json.onList, false);
});

test('preview hosts cannot write or read production KV', async () => {
  const prod = explosive('subscribers');
  const events = explosive('events');
  const isolated = await postSubscribe(
    {SUBSCRIBERS: prod, EVENTS: events},
    good({website: 'bot'}),
    {url: 'https://abc123.joulemath.pages.dev/api/subscribe', now: () => START, ip: '203.0.113.100'},
  );
  assert.equal(isolated.json.status, 'preview_isolated');
  assert.equal(isolated.json.emailSent, false);
  assert.equal(isolated.json.stored, false);
  assert.equal(isolated.res.status, 403);

  const shared = mockKv();
  const sharedEnv = {SUBSCRIBERS: shared, SUBSCRIBERS_PREVIEW: shared, EVENTS: mockKv(), EVENTS_PREVIEW: mockKv()};
  const blocked = await postSubscribe(sharedEnv, good(), {url: 'https://preview.joulemath.pages.dev/api/subscribe', now: () => START, sendMail: async () => ({ok: true}), ip: '203.0.113.101'});
  assert.equal(blocked.json.status, 'preview_isolated');
  assert.equal(shared.store.size, 0);

  const production = mockKv();
  const preview = mockKv();
  const productionEvents = mockKv();
  const previewEvents = mockKv();
  const split = {
    SUBSCRIBERS: production,
    EVENTS: productionEvents,
    SUBSCRIBERS_PREVIEW: preview,
    EVENTS_PREVIEW: previewEvents,
    RESEND_API_KEY: 'test-key',
    NEWSLETTER_FROM: 'news@joulemath.com',
  };
  const before = liveFetches;
  const saved = await postSubscribe(split, good({email: 'preview@example.com'}), {
    url: 'https://branch.joulemath.pages.dev/api/subscribe', now: () => START, ip: '203.0.113.102',
    sendMail: async () => {throw new Error('preview must not send');},
  });
  assert.equal(saved.json.status, 'saved_unsent');
  assert.equal(saved.json.reason, 'preview_mail_disabled');
  assert.equal(saved.json.emailSent, false);
  assert.equal(saved.json.onList, false);
  assert.equal(saved.json.stored, true);
  assert.equal(production.store.size, 0);
  assert.equal(productionEvents.store.size, 0);
  assert.equal(records(preview)[0].status, 'pending');
  assert.equal(records(preview)[0].plane, 'preview');
  assert.equal(metric(previewEvents, 'saved'), 1);
  assert.equal(liveFetches, before);

  const forbid = await postSubscribe(envWith(), good(), {headers: {origin: 'https://evil.example'}, now: () => START, ip: '203.0.113.103'});
  assert.equal(forbid.json.status, 'forbidden');
  assert.equal(forbid.json.stored, false);
});

test('provider calls use the configured transport and never the global fetch from the library', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({url, init});
    return {ok: true, status: 202};
  };
  const message = {
    to: 'person@example.com',
    subject: 'Confirm your joulemath weekly email',
    text: 'https://joulemath.com/api/confirm?token=abc',
    confirmUrl: 'https://joulemath.com/api/confirm?token=abc',
    unsubscribeUrl: 'https://joulemath.com/api/unsubscribe?token=def',
  };
  const before = liveFetches;
  const resend = await deliverMail({RESEND_API_KEY: 'rk_test', POSTMARK_SERVER_TOKEN: 'pm_test', NEWSLETTER_FROM: 'joulemath <news@joulemath.com>'}, 'production', message, {fetch});
  assert.equal(resend.ok, true);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.to[0], message.to);
  assert.equal(body.headers['List-Unsubscribe'], `<${message.unsubscribeUrl}>`);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer rk_test');
  const post = [];
  const postmark = await deliverMail({POSTMARK_SERVER_TOKEN: 'pm_test', NEWSLETTER_FROM: 'news@joulemath.com'}, 'production', message, {
    fetch: async (url, init) => {post.push({url, init}); return {ok: false, status: 422, text: async () => message.to};},
  });
  assert.equal(postmark.ok, false);
  assert.equal(postmark.reason, 'delivery_failed');
  assert.equal(post[0].url, 'https://api.postmarkapp.com/email');
  const badFrom = await deliverMail({RESEND_API_KEY: 'rk_test', NEWSLETTER_FROM: 'news@joulemath.com\nBcc: x@y.z'}, 'production', message, {fetch});
  assert.equal(badFrom.reason, 'mailer_not_configured');
  assert.equal(calls.length, 1);
  const preview = await deliverMail({RESEND_API_KEY: 'rk_test', NEWSLETTER_FROM: 'news@joulemath.com'}, 'preview', message, {fetch, sendMail: async () => ({ok: true})});
  assert.equal(preview.reason, 'preview_mail_disabled');
  assert.equal(liveFetches, before);

  const env = envWith({RESEND_API_KEY: 'rk_test', NEWSLETTER_FROM: 'news@joulemath.com'});
  const wired = await routeSubscribe(new Request('https://joulemath.com/api/subscribe', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json', 'cf-connecting-ip': '203.0.113.110'},
    body: JSON.stringify(good({email: 'wired@example.com'})),
  }), env);
  const wiredJson = await wired.json();
  assert.equal(wiredJson.emailSent, false);
  assert.equal(wiredJson.stored, true);
  assert.equal(wiredJson.reason, 'delivery_failed');
  assert.equal(liveFetches, before + 1);
  assert.equal(records(env.SUBSCRIBERS)[0].status, 'pending');

  const method = await routeSubscribe(new Request('https://joulemath.com/api/subscribe'), env);
  assert.equal(method.status, 405);
  const nav = await postSubscribe(envWith(), good({email: 'nav@example.com'}), {
    now: () => START,
    ip: '203.0.113.111',
    headers: {'sec-fetch-mode': 'navigate', accept: 'text/html'},
    sendMail: async () => ({ok: true}),
  });
  assert.match(nav.res.headers.get('content-type'), /text\/html/);
  const html = await nav.res.text();
  assert.match(html, /not on the list until you confirm/);
  assert.equal(html.includes('nav@example.com'), false);
});

test('multipart form posts and corrupt records fail closed', async () => {
  const env = envWith();
  const form = new FormData();
  form.set('email', 'form@example.com');
  form.set('consent', 'yes');
  form.set('consent_version', CONSENT_VERSION);
  form.set('src', 'gpu');
  form.set('website', '');
  form.set('machine_id', MACHINE);
  const calls = [];
  const res = await handleSubscribe(new Request('https://joulemath.com/api/subscribe', {
    method: 'POST',
    headers: {accept: 'application/json', 'cf-connecting-ip': '203.0.113.120'},
    body: form,
  }), env, {now: () => START, sendMail: async message => {calls.push(message); return {ok: true};}});
  const json = await res.json();
  assert.equal(json.emailSent, true);
  assert.equal(records(env.SUBSCRIBERS)[0].src, 'gpu');
  assert.equal(JSON.stringify(records(env.SUBSCRIBERS)[0]).includes(MACHINE), false);

  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('form@example.com'));
  const hash = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
  env.SUBSCRIBERS.store.set('sub:' + hash, {value: '{', opts: null});
  const corrupt = await postSubscribe(env, good({email: 'form@example.com'}), {now: () => START, ip: '203.0.113.121', sendMail: async () => ({ok: true})});
  assert.equal(corrupt.json.status, 'unavailable');
  assert.equal(corrupt.json.emailSent, false);
  assert.equal(env.SUBSCRIBERS.store.get('sub:' + hash).value, '{');
  assert.equal(calls.length, 1);
});
