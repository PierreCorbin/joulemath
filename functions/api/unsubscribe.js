// GET /api/unsubscribe shows a button. POST, including List-Unsubscribe one-click, suppresses the address.
import {routeUnsubscribe} from '../lib/newsletter.mjs';

export function onRequest(ctx) {
  return routeUnsubscribe(ctx.request, ctx.env || {});
}
