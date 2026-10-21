// Affiliate redirect to Vast.ai. /go/vast?c=<campaign>&p=<position>
// c/p only show up in our request logs; they are not forwarded to Vast.
export function onRequest() {
  return new Response(null, { status: 302, headers: { Location: 'https://cloud.vast.ai/?ref_id=756575', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
