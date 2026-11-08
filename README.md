# joulemath

The economics of turning energy into compute: Bitcoin mining vs AI calculators.

joulemath compares what a kilowatt earns when it runs Bitcoin ASICs versus when it runs rented AI GPUs. It includes a mining profitability calculator, GPU rental revenue per kW, breakeven math, guides, reports and a blog.

Live site: https://joulemath.com

## Build

Requires Node.js 20 or newer.

```
node build.mjs
```

The static site is written to `dist/`. Pushes to `main` deploy to Cloudflare Pages through GitHub Actions. The Cloudflare API token lives only in GitHub secrets.

`npm test` runs the newsletter lifecycle against in-memory KV. It does not send email or call Cloudflare.

## Newsletter

The form at `/api/subscribe` stores a pending address only. The address is confirmed only by `POST /api/confirm` with the token from the confirmation email. `GET` on that URL does not confirm. Unsubscribe is `POST /api/unsubscribe`.

Browser `signup:attempt` events are form submits, not subscribers. Server counters `metric:<date>:signup:saved` and `metric:<date>:signup:confirmed` are written only by the subscribe and confirm handlers.

Production KV bindings `SUBSCRIBERS` and `EVENTS` are `joulemath-subscribers` and `joulemath-events`. Preview hosts never use those bindings. They use `SUBSCRIBERS_PREVIEW` and `EVENTS_PREVIEW`, and until those exist a preview signup is refused and nothing is written.

Confirmation email is sent only on the production host, and only when both of these are set on the production Pages project (not in git):

- `NEWSLETTER_FROM`: `joulemath <news@joulemath.com>` or a plain address. No newlines. The domain has to be verified at the provider.
- One provider key: `RESEND_API_KEY` (used when both are set) or `POSTMARK_SERVER_TOKEN`.

Optional: `NEWSLETTER_IP_PEPPER`, a secret mixed into the one-hour signup rate-limit hash. Without it, a fixed label is used. The raw IP is not stored.

Until the from-address and a provider key are set, a real signup is stored as pending and the form says confirmation email is not set up. It does not say the email was sent, and it does not put the address on the list.

Preview namespaces, created by hand with `.github/workflows/kv-setup.yml` (manual dispatch, not part of deploy):

- `joulemath-subscribers-preview` bound on preview as `SUBSCRIBERS_PREVIEW`
- `joulemath-events-preview` bound on preview as `EVENTS_PREVIEW`

That workflow removes production `SUBSCRIBERS` and `EVENTS` from the preview deployment config. It does not read or write subscriber values. Preview still does not send email after that. Do not point preview at the production namespace ids.

## Data sources

- Bitcoin network data (hashrate, difficulty, fees): [mempool.space API](https://mempool.space/docs/api)
- Prices: [CoinGecko API](https://www.coingecko.com/en/api)
- ASIC and GPU specs and rental rates: manufacturer specs and public market listings, compiled by hand

Formulas and assumptions are documented at https://joulemath.com/methodology/.

## Report a data error

Found a wrong spec, price or formula? Please [open an issue](https://github.com/PierreCorbin/joulemath/issues/new) with the page URL, the value you think is wrong, the correct value and a source.

## License

Code: MIT, see [LICENSE](LICENSE). Written content, data compilations and images: all rights reserved, see [CONTENT-LICENSE](CONTENT-LICENSE).
