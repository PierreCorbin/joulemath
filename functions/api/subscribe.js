// POST /api/subscribe. Saves a pending subscriber and sends a confirmation link when mail is configured.
// A 2xx response is not "on the list". emailSent and onList in the JSON are the claims the form may repeat.
import {routeSubscribe} from '../lib/newsletter.mjs';

export function onRequest(ctx) {
  return routeSubscribe(ctx.request, ctx.env || {});
}
