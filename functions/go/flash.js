// Tracked outbound redirect to Flash. /go/flash?c=<campaign>&p=<position>
const clean = (v, d) => {
  const s = (v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  return s || d;
};
export function onRequest({ request }) {
  const u = new URL(request.url);
  const c = clean(u.searchParams.get('c'), 'site');
  const p = clean(u.searchParams.get('p'), '');
  const t = new URL('https://paywithflash.com/mining');
  t.searchParams.set('utm_source', 'joulemath');
  t.searchParams.set('utm_medium', 'referral');
  t.searchParams.set('utm_campaign', c);
  if (p) t.searchParams.set('utm_content', p);
  return new Response(null, { status: 302, headers: { Location: t.toString(), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
