# joulemath content backlog

Ranked by expected traffic + revenue. Ship top to bottom. Re-ranked 2026-10-26 (see "Week of Oct 26" below).

1. [x] H100 page (/gpu/h100/), shipped 2026-10-22. Prices refreshed 2026-10-26 (8 sources).
2. [x] 'Rent out your GPU' guide. Shipped 2026-10-27: https://joulemath.com/guides/rent-out-your-gpu/ (commit 983d7f2, IndexNow 200).
3. [x] Two-lens takeaway on the home calculator (Pierre, Oct 24). Shipped 2026-10-28: "Two ways to read this" box under the home result (monthly cash, long-term upside, why operators blend), live from the calculator's own numbers; method at /methodology/#two-lens.
4. [x] RTX 4090 page. Shipped 2026-10-29: https://joulemath.com/gpu/rtx-4090/ (commit 7281ec4, IndexNow 200).
5. [ ] Energy-to-Compute Index (dated target ~Nov 1). Weekly linkable number for X and AI answer engines.
6. [ ] 'Rent vs buy an H100'. Reuses /gpu/h100/ data (GYGO server price, 4-year life, 8-source rent table).
7. [ ] Inference cost calculator (cost per million tokens). High intent, but needs sourced throughput numbers first.
8. [ ] H200 page. Ornn H200 index +24% in a month (Oct 25), newsy.
9. [ ] B200 page. Ornn B200 +21% in a month; few public prices (Lambda, RunPod, Together, Nebius, Vast).
10. [ ] A100 page. Cheap-GPU searches; lots of Vast offers.
11. [ ] SEO quick wins: thicken mining-calculator and ASIC pages, ~60 char titles (home and /asic/ done 2026-10-28), sortable /asic/ table (done 2026-10-28). Mining side, Flash leads.
12. [ ] LLM query power cost.
13. [ ] AI data center power demand.
14. [ ] Power price pages + GPU hosting cost (Texas, Paraguay, Ethiopia, UAE, Canada already live; add GPU hosting cost line).

Recurring: weekly AI post (Mon). Oct 26 shipped "What an H100 hour costs across 7 clouds".

## Week of Oct 26 (written 2026-10-26)

Data, Oct 19 to Oct 25 2026 (UTC days) plus Oct 26 to ~09:15 Warsaw:
- Cloudflare Web Analytics, both site tags, unsampled per-day reads: 47 page loads / 47 visits. Oct 21: 20 (17 pages.dev, 3 .com), Oct 22: 11, Oct 23: 4, Oct 24: 5, Oct 25: 7, Oct 26 so far: 0. Nothing before launch (Oct 21).
- Top pages: / only (all 47). No other page recorded a load.
- Referrers: none recorded (all direct or empty). No search or X referral seen yet.
- Countries: US 34, CA 4, FR 4, NL 1, IN 1, KR 1, SG 1, BR 1. Some of this is likely us (Pierre in FR/PL, bot checks).
- Events (scripts/events-report.mjs, Oct 19 to 26 UTC): go:flash 1, go:vast 1, presets 8 (cheap-power 4, default 2, curtailment 1, used-asics 1), basis usd 2. No outbound provider clicks.
- X @joulemath: 4 followers (5 on Oct 24/25), 21 posts Oct 22 to 26, 234 impressions, 3 likes, 1 repost, 1 reply. Best: the "47% less BTC" miners-with-AI-leases quote (54 imp).
- Search Console / Bing Webmaster: no access (no connector). No search data.

Ranking reasoning:
- No search data yet, so ranking leans on target-list.md intent signals and revenue fit, not measured volume.
- Home is the only page with traffic, so the two-lens home change stays near the top.
- AI-first: 3 of the top 4 open items are AI GPU pages/guides (half-AI rule). Vast affiliate is the only live AI revenue path.
- Mining items (#11) keep Flash leads moving; only 1 /go/flash click so far.
- Next week: if Search Console gets connected, re-rank by real impressions.

## PRIORITY for Fri Oct 23 site-improve run (Pierre asked, Oct 22)
- [x] (shipped Oct 23) Calculator result -> "Where to run this" comparator block. If AI wins: GPU clouds (RunPod, Massed Compute, Vast, Lambda) with cited current $/hr. If mining wins: hosting + ASIC sellers + Flash CTA (/go/flash). Neutral comparator; plain links now, label affiliate links clearly, swap in referral links as approvals land (Massed Compute pending, RunPod not signed up). Cite every price.

- Cite GPU 4-year life (CoreWeave 10-K depreciation policy) on /methodology/.
- Profile guides as future content: small investor guide ($10k to $50k, hosted ASICs vs marketplace GPU) and institutional guide (MW scale, enterprise hosting, wholesale colo, direct GPU contracts).

## Next site-improve & explainer angle (Pierre, Oct 24)
- Surface the two-lens takeaway clearly on the home calculator: AI GPUs cover monthly fiat cash flow; holding mined BTC wins on long-term upside if BTC appreciates (and why operators blend both so they don't have to sell mined BTC at weak prices to pay power bills).
