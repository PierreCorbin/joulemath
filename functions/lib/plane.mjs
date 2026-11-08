// Production hosts are the only ones allowed to touch the production KV bindings.
// Every other host, including preview Pages deployments and local dev, is the preview plane.
const PRODUCTION_HOSTS = new Set([
  'joulemath.com',
  'www.joulemath.com',
  'joulemath.pages.dev',
]);

export function requestHost(request) {
  try {
    return new URL(request.url).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return '';
  }
}

export function requestPlane(request) {
  return PRODUCTION_HOSTS.has(requestHost(request)) ? 'production' : 'preview';
}

function sameBinding(a, b) {
  return a != null && b != null && a === b;
}

// Preview never receives the production binding, even when a deploy attached it by mistake.
// A preview binding that is the same object as production is treated as missing.
export function bindingsFor(request, env) {
  const plane = requestPlane(request);
  env = env || {};
  if (plane === 'production') {
    return {plane, subscribers: env.SUBSCRIBERS || null, events: env.EVENTS || null};
  }
  let subscribers = env.SUBSCRIBERS_PREVIEW || null;
  let events = env.EVENTS_PREVIEW || null;
  if (sameBinding(subscribers, env.SUBSCRIBERS) || sameBinding(events, env.EVENTS)) {
    return {plane, subscribers: null, events: null, blocked: 'shared_kv'};
  }
  return {plane, subscribers, events};
}

export function allowedOrigins(request) {
  const plane = requestPlane(request);
  if (plane === 'production') {
    return new Set(['https://joulemath.com', 'https://www.joulemath.com', 'https://joulemath.pages.dev']);
  }
  return new Set([new URL(request.url).origin]);
}

// Browser form posts carry Origin. A missing Origin is allowed (tests, and clients that strip it).
// Origin: null is a sandboxed iframe and is rejected. Unsubscribe and confirm do not use this check:
// the token is the authorization, and mailbox one-click posts have a foreign Origin.
export function originAllowed(request) {
  const origin = request.headers.get('origin');
  const allowed = allowedOrigins(request);
  if (origin) return origin !== 'null' && allowed.has(origin);
  const referer = request.headers.get('referer');
  if (!referer) return true;
  try {
    return allowed.has(new URL(referer).origin);
  } catch {
    return false;
  }
}
