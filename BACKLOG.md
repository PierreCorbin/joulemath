# joulemath content backlog

Ranked by expected traffic + revenue. Ship top to bottom. Re-ranked 2026-11-02 (see "Week of Nov 2" below). Rule: queries and pages already getting impressions first, then the AI plan with GPU/Vast pages pushed up (Flash Vast.ai integration live Nov 1, GPU is the main push).

1. [x] (shipped 2026-11-03, 8ff2910) /mining-calculator/ AEO pass. Top impressions page (65 impressions through Oct 28; queries "asic profit calculator" 11, "asic profitability calculator" 9). Today it has 2 H2s and no FAQPage. Add sourced short answer up top, question H2s, FAQ + FAQPage JSON-LD, 9-model compare table, last-updated date, links to every /asic/ model page.
2. [x] (shipped 2026-11-03, 8ff2910: per-model used price, upgrade and payback sections; S19 XP break-even by place on /power-prices/, 871f881) S19 XP + ASIC model pages, round 2. "antminer s19 xp profitability" had 8 impressions, /asic/antminer-s19-xp/ 20. Round 1 shipped 2026-11-01 (29efff8: short answer, question H2s, compare table, FAQ). Next: break-even by power price table and S19 XP vs S21 XP "upgrade or keep" section with payback.
3. [ ] GSC follow-up on the 7 robots-blocked + 12 crawled-not-indexed pages. Code fixes shipped 2026-11-01 (29efff8 robots.txt and thin pages, 71e0b13 www 301 and RSS noindex). Still open: "Validate fix" in Search Console, request indexing for /mining-calculator/, /asic/antminer-s19-xp/, /gpu/, /gpu/h100/, /gpu/rtx-4090/. Indexing report still dated Oct 23 (22 indexed / 42 not).
4. [x] (shipped 2026-11-03, 0c69822) /gpu/ hub AEO pass. No FAQPage, 2 H2s. Add short answer with today's one-GPU-hour table (Vast median, RunPod, Lambda, Ornn), question H2s, FAQ schema. Flash GPU/Vast.ai CTA already live (29efff8).
5. [ ] 'Rent vs buy an H100'. Reuses /gpu/h100/ data (GYGO $289,000 8x server, Ornn H100 $3.02 settled Nov 1, payback ~24 months at 70% rented, our math in data/snapshots/2026-11-02.md).
6. [ ] A100 page. 33 single-GPU Vast offers on Nov 2 (median $0.80 SXM4, $0.74 PCIe); Ornn A100 +19.1% in a month. Cheap-GPU searches.
7. [ ] H200 page. Ornn $6.21 vs RunPod $3.59 vs Vast $3.29 (Nov 2): big spread, newsy.
8. [ ] RTX 5090 page (new). Vast 64+ offers, median $0.64 (64 cheapest, Nov 2); the 5090 vs 4090 X card got 40 impressions Nov 1. Same template as /gpu/rtx-4090/, Vast host payback angle.
9. [ ] B200 page. Ornn $9.44 (+19.8% 1M); Lambda $6.69 to $6.99, RunPod $5.98, only 1 open Vast offer Nov 2.
10. [ ] Energy-to-Compute Index (dated target Nov 1 missed). Start as the weekly Monday X rent card (week 3 drafts, Mon Nov 9) and promote to a page once it has 3 weekly reads.
11. [ ] Inference cost calculator (cost per million tokens). Needs sourced throughput numbers first; Ornn token index (OpenAI -40%, Anthropic -38% in a month, settled Oct 31) is a hook.
12. [ ] LLM query power cost.
13. [ ] AI data center power demand.
14. [ ] GPU hosting cost line on power price pages (AEO pass on the 5 power pages done 2026-11-01, 29efff8).

Shipped 2026-11-03 SEO/AEO run (Pierre: "improve it all so we rank higher"):
- [x] 8ff2910 calculator + ASIC cluster AEO. 871f881 power prices: Quebec "Hydro-Quebec Rate CB" title/FAQ, ASIC-by-place tables, hub short answer + break-even + FAQ schema. 2c7242e /methodology/ "how to calculate mining profitability and hashprice", live worked example, TechArticle. d64fc39 rent-out guide Nov 3 prices. 0c69822 /gpu/ hub + H100 Nov 3 prices and FAQ. 2ba9901 Oct GPU post Nov 3 update. cd388d9 pivot post Nov 3 update (Cipher Q3 first AI rent). dd59828 Breadcrumb schema sitewide, WebSite+Organization on home, joulemath.pages.dev 301 to apex, preview hosts noindex.
- [x] All 34 sitemap URLs 200 live with no em dashes; IndexNow pinged (200).
- [ ] Pierre: GSC "Request indexing" for the list in the Nov 3 report, then "Validate fix" on crawled-not-indexed.
- Note: the /go/flash and /go/vast 504s in Cloudflare analytics are earlyHintsCache prefetches (origin status 0), not real visitors; every eyeball request got its 302. Filter on requestSource=eyeball.

Done since Oct 26 (git log):
- [x] H100 page (Oct 22), prices refreshed Oct 26; blog "What an H100 hour costs across 7 clouds" (Oct 26, 0a3a0a1/8224ea3).
- [x] 'Rent out your GPU' guide (Oct 27, 983d7f2).
- [x] Fleet Check /fleet/ + Flash funnel (Oct 27, cb3ac73, d9ecde5, b876f8c, 179f0a2).
- [x] Two-lens takeaway on home calculator (Oct 28, 2d95dab).
- [x] Sortable /asic/ table + ~60 char titles for home and /asic/ (Oct 28, da7a6b4).
- [x] RTX 4090 page (Oct 29, 7281ec4); GPUs in main nav (Oct 29, 79c20e3).
- [x] ~60 char titles site-wide, fuller metas, build-generated /llms.txt (Oct 30, d0ea0bd).
- [x] robots.txt opened to search + AI crawlers (only /go/ and /api/ blocked), AEO on ASIC model, power and mining guide pages, Flash GPU/Vast.ai CTA on /gpu/, /gpu/h100/, /gpu/rtx-4090/, rent-out guide, Fleet Check (Nov 1, 29efff8).
- [x] AEO pass on miners-to-AI post, 301 www to apex, RSS noindex (Nov 1, 71e0b13).
- [x] Antminer S19j Pro page /asic/antminer-s19j-pro/ (Nov 3, 03b3216): "Is the Antminer S19j Pro still profitable in 2026?", verdict vs sourced power prices, used price payback vs S19 XP and S21 XP (ING Mining eBay 90-day medians to Oct 30), 2028 halving break-even, Bitmain bins table, FAQPage. Picked over #5 to support the ASIC calculator cluster (SEO & AEO Desk ASIC gap #1). Dated short answers on all ASIC model pages. #5 Rent vs buy an H100 stays next in line for content.
- Old item "SEO quick wins" folded into #1 to #3.

Recurring: weekly AI post (Mon). Oct 26 shipped "What an H100 hour costs across 7 clouds".

## Week of Nov 2 (written 2026-11-02)

Data, Oct 26 to Nov 1 2026 (UTC days) plus Nov 2 to ~09:10 Warsaw. Full market numbers: data/snapshots/2026-11-02.md.
- GSC (read Nov 2, Search Console, Oct 25 to 31): 172 impressions (week 1: 136), 0 clicks, avg position 60.8 (week 1: 59.2). Top queries: asic profit calculator 11, asic profitability 10, asic miner profit calculator 9, antminer s19 xp profitability 8, asic miner profitability calculator 8, asic profitability calculator 8, nvidia h100 rental 6 (plus h100 rental price / h100 gpu rent / rent h100 gpu ~2 to 3 each). Top pages: /mining-calculator/ 70 imp pos 81.8, /methodology/ 24 pos 26.0, /asic/antminer-s19-xp/ 20 pos 71.9, GPU rental prices Oct blog 18 pos 70.2, /gpu/ 11, /power-prices/ 7, /power-prices/canada-quebec/ 7, /guides/rent-out-your-gpu/ 6 pos 22.5. Indexing report still dated Oct 23: 22 indexed / 42 not (18 alternate canonical, 7 robots-blocked, 2 noindex, 2 redirect, 1 duplicate, 12 crawled-not-indexed, validation started). Bing (Oct 22 to 31): 11 impressions, 0 clicks; GPU rental blog post ranks pos ~6 for long-tail Vast.ai/H100/H200/RTX 4090 price-per-hour queries..
- Cloudflare Web Analytics (GraphQL rumPageloadEventsAdaptiveGroups, both site tags, sampleInterval 1 so unsampled, read Nov 2 ~09:08 CET): 21 page loads / 21 visits, all on the joulemath.com tag, 0 on pages.dev. Oct 26: 2, Oct 27: 1, Oct 28: 1, Oct 29: 9, Oct 30: 1, Oct 31: 4, Nov 1: 3, Nov 2 so far: 0. 2 of 21 were ChromeHeadless (bots), so ~19 real. Down from 47 the week before (that week had launch-day self-checks). The joulemath.com tag is in "lite" mode, which likely drops EU visitors.
- Top pages: / 13, /blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/ 4, /guides/rent-out-your-gpu/ 2, /asic/ 1, /calculators/ 1. The GSC top page (/mining-calculator/) recorded no RUM load.
- Referrers: 21 of 21 empty. AEO signal: chatgpt.com 0, perplexity.ai 0, copilot 0, gemini 0. X (x.com / t.co) 0.
- Countries: US 14, CL 2, TW 1, IN 1, HK 1, MA 1, KR 1. Devices: desktop 13, mobile 8.
- Events (node scripts/events-report.mjs 8, KV joulemath-events, Oct 26 to Nov 2 UTC): 0 counters. No go:flash, go:vast, outbound, preset or signup events.
- X @joulemath (X API, read Nov 2 ~09:08 CET): 7 followers (6 last week), 65 following, 77 posts total. Oct 26 to Nov 2: 56 posts incl. replies and self-replies, 1,120 impressions, 26 likes, 1 repost. Best: RTX 4090 rent card Oct 28 (71 imp, 1 repost), IREN/Perplexity quote Oct 31 (54), H200 per GPU-hour card Oct 30 (47). GPU rent cards beat mining cards. Link clicks: not available (non_public_metrics not authorized).
- Market (snapshot): BTC $78,095, hashprice $0.0333/TH/day (-7% w/w), difficulty 148.36 T, next retarget ~Nov 13 est. -1.4%. Ornn H100 $3.02 (+11% 1M), B200 $9.44 (+20% 1M), A100 $1.06 (+19% 1M).

Ranking reasoning:
- Pierre, Nov 1: no ASIC pivot, GPU stays and becomes the main push with Flash's Vast.ai integration live. So the ASIC cluster gets the items that already earn impressions (#1 to #3, mostly site-improve work), and GPU/Vast gets the new content slots (#4 to #9).
- Traffic is still tiny and referrer-less: zero AI-engine and zero X referrals, so every page needs to win on search first. AEO structure (short answer, question H2s, FAQPage) is the cheapest lever, and /mining-calculator/ and /gpu/ are the two hubs still missing it.
- Revenue and Flash: 0 go:* clicks this week. GPU pages now carry the Flash Vast.ai CTA, so more GPU pages = more Flash surface.

Routines, should priorities change? Yes, slightly:
- Site improve (Wed/Fri): stop open-ended SEO tweaks; do (1) /mining-calculator/ AEO pass (#1) Wed Nov 4, (2) /gpu/ hub AEO pass (#4) Fri Nov 6. S19 XP round 2 (#2) next after that.
- Content ship (Tue/Thu): (1) 'Rent vs buy an H100' (#5) Tue Nov 3, (2) A100 page (#6) Thu Nov 5. H200 next.
- X: 2 posts a day (week 3 drafts, /workspace/joulemath-x-drafts-week3.md), 4 LINK-IN-POST tests to see if any X referral shows up in RUM.

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

### SEO & AEO Desk gaps (AEO check Nov 2, full notes in /workspace/seo/joulemath/aeo-check-2026-11-02.md)
No AI citations yet; Google top 10 none; web search #1 for S19 XP, S21 XP, mine-vs-rent. Gap is authority and indexing, plus missing multi-provider price tables on GPU pages.
GPU first (main push):
- [ ] Dated multi-provider price table on /gpu/h100/ and /gpu/rtx-4090/ (getdeploying-style)
- [ ] Vast.ai host earnings calculator (rate x utilization minus 25% cut minus power)
- [ ] /gpu/rtx-5090/, /gpu/h200/, /gpu/b200/ rental price pages
- [ ] Electricity cost per GPU hour calculator
- [ ] Self-hosted LLM cost per 1M tokens vs API break-even
- [ ] GPU rental vs mining per kWh for home hosts guide
ASIC:
- [x] S19j Pro page (shipped Nov 3, /asic/antminer-s19j-pro/)
- [ ] Breakeven electricity by miner table (mostly covered by /asic/ hub and mining guide tables); S21 XP Hyd page
- [ ] Hashprice today live page; ASIC payback/ROI calculator; used ASIC payback (partly done Nov 4: used-value table on /asic/); difficulty sensitivity guide; post-2028-halving toggle

- [ ] Switch Cloudflare Web Analytics from lite to full mode (approved in week 2 plan; EU visits likely undercounted). Checked Nov 4 via the Cloudflare MCP: joulemath.com RUM site (site tag bd7a52a2787e422e8b6bcd73af52607b) still has lite: true, so EU visitors are still excluded. Not flipped on Nov 4 (verify-only run). Fix: PUT /accounts/{account}/rum/site_info/bd7a52a2787e422e8b6bcd73af52607b with lite:false, auto_install:true, or Web Analytics > joulemath.com > Edit > untick "Exclude EU visitor data".

### Nov 4 site-improve (shipped, commits 3083ca9, 3837e0a)
- [x] /asic/ hub: Flash miners CTA, question H2 over the sortable table (sort hint only with JS), sourced lead, hydro/immersion and used-value sections, 5 FAQs in FAQPage
- [x] Thickened crawled-not-indexed pages: M63S and M66S (per-MW cost and earnings, payback vs MicroBT 1-year warranty), S19k Pro (per-MW used comparison, more Bitmain specs, Secure Boot note); same-family links on every model page; /mining-calculator/ links into them
- [x] GPU and Vast.ai accounting Flash CTA added to home and the three GPU blog posts (/gpu/, /gpu/h100/, /gpu/rtx-4090/, rent-out guide and /fleet/ already had it)
- [ ] Check GSC around Nov 11 for whether M63S, M66S, S19k Pro and S19 XP moved from crawled-not-indexed to indexed
