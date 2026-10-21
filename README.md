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

## Data sources

- Bitcoin network data (hashrate, difficulty, fees): [mempool.space API](https://mempool.space/docs/api)
- Prices: [CoinGecko API](https://www.coingecko.com/en/api)
- ASIC and GPU specs and rental rates: manufacturer specs and public market listings, compiled by hand

Formulas and assumptions are documented at https://joulemath.com/methodology/.

## Report a data error

Found a wrong spec, price or formula? Please [open an issue](https://github.com/PierreCorbin/joulemath/issues/new) with the page URL, the value you think is wrong, the correct value and a source.

## License

Code: MIT, see [LICENSE](LICENSE). Written content, data compilations and images: all rights reserved, see [CONTENT-LICENSE](CONTENT-LICENSE).
