// GET /api/confirm shows a button. POST is the only call that confirms a subscriber.
// Mailbox link scanners prefetch GET and must not confirm anyone.
import {routeConfirm} from '../lib/newsletter.mjs';

export function onRequest(ctx) {
  return routeConfirm(ctx.request, ctx.env || {});
}
