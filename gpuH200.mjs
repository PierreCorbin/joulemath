// NVIDIA H200 page: dist/gpu/h200/index.html. Same shell and hashprice as the H100 page (gpu.mjs).
// Every figure below is copied from a linked source on the date given; per-kW math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const NV='https://www.nvidia.com/en-us/data-center/h200/';
const ORNN='https://data.ornn.com/markets/h200', RP='https://www.runpod.io/pricing', NEB='https://nebius.com/prices', VAST='https://console.vast.ai/api/v0/bundles/';
// Fresh read, Fri Nov 20, 2026 (data/snapshots/2026-11-20.md). Vast: public offers API, 11:04 CET, rentable, not rented, on-demand, exactly 1 GPU.
const NOW=[
 ['Ornn Compute Price Index (OCPI-H200)',ORNN,'Settled Nov 19, 2026, read Nov 20','$6.40','Not indexed','1 day -10.0% (Nov 18 $7.11), 1 week -10.1% (Nov 12 $7.12), since Oct 19 +2.1%'],
 ['Nebius on-demand (published list)',NEB,'Read Nov 20, 2026','HGX H200 $5.40','Not listed','HGX H100 $4.50; preemptible prices are dynamic'],
 ['RunPod Secure Cloud',RP,'Page "Updated November 12, 2026", read Nov 20','$5.29','Not listed','H100 SXM Secure $4.39'],
 ['RunPod Community Cloud',RP,'Same page','$3.59','Not listed','H100 SXM Community $2.69'],
 ['Vast.ai marketplace, 1 GPU (low / median / high)',VAST,'API query Nov 20, 2026, 11:04 CET','$3.40 / $4.25 / $5.96 (6 offers)','$3.00 / $4.00 / $6.80 (19 offers)','Verified medians: SXM $3.88 (5 of 6), NVL $4.00 (14 of 19)'],
];
// Our assumptions for per-kW: 70% of hours rented; ~1,000 W all-in per H200 SXM (NVIDIA up to 700 W TDP + ~300 W server share, our add; same as our H100 page).
const UTIL=0.7, W=1000;
const RATES=[['Ornn index',6.40],['Vast median',4.25],['RunPod Community',3.59]];
const PRICES=[0.04,0.06,0.08,0.10];
export function buildH200(a){
  const gross=r=>r*24*UTIL*(1000/W), pw=p=>24*p;
  const btcKw=1000/13.5*a.hp; // 1 kW of S21 XP at Bitmain's 13.5 J/TH
  const tbl=`<table><thead><tr><th>Power price</th>${RATES.map(([n,r])=>`<th>${n} $${r.toFixed(2)}/hr</th>`).join('')}</tr></thead><tbody>
<tr><td>Gross / kW / day</td>${RATES.map(([n,r])=>`<td>${$(gross(r))}</td>`).join('')}</tr>
${PRICES.map(p=>`<tr${p===0.06?' class="hl"':''}><td>Net at $${p.toFixed(2)}/kWh</td>${RATES.map(([n,r])=>`<td><b>${$(gross(r)-pw(p))}</b></td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  const rpNet=gross(3.59)-pw(0.06), ornnNet=gross(6.40)-pw(0.06);
  const calc=`/?gpuw=1000&amp;rate=3.59&amp;util=70`;
  const url='/gpu/h200/';
  const title='H200 rental price per hour, Nov 2026: $3.59 to $6.40';
  const desc='H200 rent per hour on Nov 20, 2026: RunPod $3.59 / $5.29, Vast.ai median $4.25 (H200 NVL $4.00), Nebius $5.40, Ornn index $6.40. H200 vs H100 and profit per kW.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>NVIDIA H200 rental price per hour, specs and profit per kW</h1>
<p class="lead"><b>Short answer (Nov 20, 2026):</b> one H200 rents for <b>$3.59 an hour on RunPod Community</b>, a median <b>$4.25 on Vast.ai</b> (only 6 offers, so noisy) and <b>$5.40 on Nebius</b> on demand. The <a href="${ORNN}">Ornn index</a> of real neocloud trades settled at <b>$6.40</b> on November 19, 1.51x the Vast median and down 10% from $7.11 a day earlier. The H200 NVL was cheaper on Vast, at a $4.00 median across 19 offers.</p>
<p class="note">Last updated November 20, 2026. These prices also sit in our <a href="/gpu/">weekly GPU rent index</a>.</p>
<h2 id="price-now">How much does an H200 cost per hour right now?</h2>
<p>Between $3.40 (the cheapest single H200 SXM on Vast) and $6.40 (the Ornn trade index) per GPU-hour, depending on where you rent. Self-serve clouds sit at $3.59 to $5.40. Lambda does not list an H200 on-demand instance (read November 20).</p>
<table><thead><tr><th>Source</th><th>Date</th><th>H200 SXM</th><th>H200 NVL</th><th>Also</th></tr></thead><tbody>
${NOW.map(([n,u,d,s,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Renter prices per GPU-hour. Our Vast query: rentable, not rented, on-demand, exactly one GPU; Vast lists "H200" and "H200 NVL" as separate cards, and we read "H200" as the SXM board. Thin sample: only six single-GPU H200 SXM offers, so the median moves a lot from day to day. Other GPUs side by side: <a href="/gpu/">GPU rental prices</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-h200&amp;p=rent" rel="sponsored nofollow">See live H200 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2 id="nvl">Is the H200 NVL cheaper to rent than the H200 SXM?</h2>
<p>On Vast.ai, yes, a little. On November 20, 2026 the H200 NVL median was <b>$4.00</b> across 19 single-GPU offers against <b>$4.25</b> for the H200 SXM across 6, so the NVL was about 6% cheaper (our math). The NVL market is also deeper: three times as many open offers, 14 of them verified. Both have 141 GB at 4.8 TB/s; the NVL is a PCIe card at up to 600 W with an NVLink bridge, the SXM sits on an HGX board at up to 700 W (<a href="${NV}">NVIDIA</a>). RunPod, Nebius and Ornn only quote the HGX/SXM H200.</p>
<table><thead><tr><th>Vast.ai read</th><th>H200 SXM median (offers)</th><th>H200 NVL median (offers)</th></tr></thead><tbody>
<tr><td>Nov 9, 2026</td><td>$4.14 (7)</td><td>$4.00 (12)</td></tr>
<tr><td>Nov 16, 2026</td><td>$4.34 (7)</td><td>$4.27 (12)</td></tr>
<tr><td>Nov 20, 2026</td><td>$4.25 (6)</td><td>$4.00 (19)</td></tr>
</tbody></table>
<p class="note">Our weekly snapshots of the <a href="${VAST}">Vast public offers API</a>, same filter each time (data/snapshots/2026-11-09.md, 2026-11-16.md, 2026-11-20.md in the <a href="https://github.com/PierreCorbin/joulemath/tree/main/data/snapshots">repo</a>).</p>
<h2 id="why-gap">Why is the Ornn H200 index so much higher than RunPod or Vast?</h2>
<p>Because they measure different things. Ornn says its OCPI-H200 is a volume-weighted average of transacted H200 rentals across neoclouds, "real trades, not scraped listings, surveys, or rate cards" (<a href="${ORNN}">Ornn H200 index</a>). RunPod, Vast and Nebius are posted prices for one GPU you can grab right now. The index also swings hard: in the 35 days to November 19 it ran from $5.49 (October 30) to $7.75 (November 11). Our read, not sourced: the trade index likely weights multi-GPU, dedicated deals more heavily than single-card marketplace listings, so treat $6.40 as what the market is clearing at and $3.59 to $5.40 as what a single self-serve card costs.</p>
<p>The gap to Vast has narrowed since early November, from 1.89x to about 1.5x:</p>
<table><thead><tr><th>Our Vast read</th><th>Vast H200 median (offers)</th><th>Ornn settle (day before)</th><th>Ornn / Vast (our math)</th><th>Gap per hour</th></tr></thead><tbody>
<tr><td>Nov 2, 2026</td><td>$3.29 (4)</td><td>Nov 1: $6.21</td><td>1.89x</td><td>$2.92</td></tr>
<tr><td>Nov 9, 2026</td><td>$4.14 (7)</td><td>Nov 8: $6.82</td><td>1.65x</td><td>$2.68</td></tr>
<tr><td>Nov 10, 2026</td><td>$4.08 (4)</td><td>Nov 9: $7.17</td><td>1.76x</td><td>$3.09</td></tr>
<tr><td>Nov 16, 2026</td><td>$4.34 (7)</td><td>Nov 15: $6.28</td><td>1.45x</td><td>$1.94</td></tr>
<tr><td>Nov 18, 2026</td><td>$4.34 (5)</td><td>Nov 17: $6.58</td><td>1.51x</td><td>$2.24</td></tr>
<tr><td>Nov 19, 2026</td><td>$4.61 (5)</td><td>Nov 18: $7.11</td><td>1.54x</td><td>$2.50</td></tr>
<tr><td>Nov 20, 2026</td><td>$4.25 (6)</td><td>Nov 19: $6.40</td><td>1.51x</td><td>$2.15</td></tr>
</tbody></table>
<p class="note">Sources: <a href="https://data.ornn.com/api/public-index/gpu/H200/index-history">Ornn OCPI-H200 daily settles</a> (read November 20, 2026) and our Vast snapshots for each date. Vast samples are 4 to 7 offers, so the ratio is noisy.</p>
<h2 id="specs">What are the H200 SXM and H200 NVL specs?</h2>
<table><thead><tr><th></th><th>H200 SXM</th><th>H200 NVL</th></tr></thead><tbody>
<tr><td>Max TDP</td><td>Up to 700 W (configurable)</td><td>Up to 600 W (configurable)</td></tr>
<tr><td>GPU memory</td><td>141 GB</td><td>141 GB</td></tr>
<tr><td>Memory bandwidth</td><td>4.8 TB/s</td><td>4.8 TB/s</td></tr>
<tr><td>FP8 Tensor Core</td><td>3,958 TFLOPS*</td><td>3,341 TFLOPS*</td></tr>
<tr><td>Form factor</td><td>SXM (HGX H200, 4 or 8 GPUs)</td><td>PCIe dual-slot air-cooled</td></tr>
<tr><td>Interconnect</td><td>NVLink 900 GB/s, PCIe Gen5 128 GB/s</td><td>2- or 4-way NVLink bridge 900 GB/s, PCIe Gen5 128 GB/s</td></tr>
</tbody></table>
<p class="note">Source: <a href="${NV}">NVIDIA H200 product page</a>, read November 10, 2026 (*with sparsity; NVIDIA marks these as preliminary specifications).</p>
<h2 id="vs-h100">Is an H200 worth the premium over an H100?</h2>
<p>For big models that need memory, often yes. The H200 has 141 GB at 4.8 TB/s against 80 GB at 3.35 TB/s on the H100 SXM (<a href="${NV}">NVIDIA H200</a>, <a href="https://www.nvidia.com/en-us/data-center/h100/">NVIDIA H100</a>), at the same 700 W TDP. The price premium depends on where you look:</p>
<table><thead><tr><th>Source</th><th>H100 SXM</th><th>H200</th><th>H200 premium (our math)</th></tr></thead><tbody>
<tr><td><a href="https://data.ornn.com/">Ornn index, settled Nov 19</a></td><td>$2.78</td><td>$6.40</td><td>2.30x</td></tr>
<tr><td><a href="${RP}">RunPod Community</a></td><td>$2.69</td><td>$3.59</td><td>1.33x</td></tr>
<tr><td><a href="${RP}">RunPod Secure</a></td><td>$4.39</td><td>$5.29</td><td>1.21x</td></tr>
<tr><td><a href="${NEB}">Nebius on-demand</a></td><td>$4.50</td><td>$5.40</td><td>1.20x</td></tr>
<tr><td><a href="${VAST}">Vast.ai median, 1 GPU, Nov 20 11:04 CET</a></td><td>$2.20 (6 offers)</td><td>$4.25 (6 offers)</td><td>1.93x (thin, noisy)</td></tr>
</tbody></table>
<p>On fixed-price clouds you pay 20% to 33% more for 76% more memory, which is a good deal if the extra memory lets you run a model on fewer cards. The Ornn premium is much bigger because the H100 index has slid to $2.78 while the H200 held above $6. More H100 numbers: <a href="/gpu/h100/">H100 rent price per kW</a>, and whether to own one: <a href="/gpu/rent-vs-buy-h100/">rent vs buy an H100</a>.</p>
<h2 id="per-kw">What does one kW of H200 earn per day?</h2>
<p>Our assumptions, not sourced: about 1,000 W per H200 SXM all-in (NVIDIA's 700 W TDP plus about 300 W of server share, our add, same as our H100 page), so one kilowatt is about one GPU. Rented 70% of hours, power paid for all 24 hours.</p>
${tbl}
<p class="note">Gross = rate × 24 × 70% × (1,000 W / 1,000 W). Net = gross minus 24 kWh of power. No platform cut, hosting, cooling markup or hardware cost. Our arithmetic on the prices above.</p>
<p>For scale: a kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 1,000 W, the RunPod Community $3.59 rate and 70% utilization. Or enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to pull live GPU occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an H200?</h3><p>On November 20, 2026: $3.59 per GPU-hour on RunPod Community Cloud and $5.29 on RunPod Secure Cloud, $5.40 on demand on Nebius, and a median $4.25 for one H200 on Vast.ai (6 offers, $3.40 to $5.96). H200 NVL on Vast had a median of $4.00 (19 offers). The Ornn index of real trades settled at $6.40 on November 19.</p>
<h3 id="faq-power">How much power does an H200 use?</h3><p>NVIDIA lists the H200 SXM at up to 700 W TDP and the H200 NVL at up to 600 W, both configurable. A full server draws more per GPU; we assume about 1,000 W per SXM GPU all-in.</p>
<h3 id="faq-memory">How much memory does the H200 have?</h3><p>141 GB of GPU memory at 4.8 TB/s on both the SXM and NVL versions, per NVIDIA. The H100 SXM has 80 GB at 3.35 TB/s.</p>
<h3 id="faq-kw">What does one kW of H200 earn per day?</h3><p>At the $3.59 RunPod Community rate, 1,000 W all-in and 70% utilization, about ${$(gross(3.59))} gross per kW per day, or about ${$(rpNet)} after $0.06/kWh power. At the $6.40 Ornn rate it is about ${$(gross(6.40))} gross, or ${$(ornnNet)} net. That is renter price, before platform cut and hardware.</p>
<h3 id="faq-vs-h100">Is the H200 more expensive than the H100?</h3><p>Yes. On November 19 to 20, 2026 the H200 cost 1.20x the H100 SXM on Nebius, 1.21x on RunPod Secure, 1.33x on RunPod Community and 2.30x on the Ornn trade index ($6.40 vs $2.78). On Vast the medians were 1.93x apart, but both samples were only 6 offers.</p>
<h3 id="faq-nvl">Is the H200 NVL cheaper than the H200 SXM?</h3><p>On Vast.ai on November 20, 2026, yes: a $4.00 median across 19 H200 NVL offers against $4.25 across 6 H200 SXM offers, about 6% less. Same 141 GB of memory; the NVL is a PCIe card at up to 600 W.</p>
<h3 id="faq-ornn">Why is the Ornn H200 price higher than Vast or RunPod?</h3><p>Ornn indexes executed H200 trades across neoclouds, while Vast and RunPod are posted prices for a single card. On November 20, 2026 the Ornn settle ($6.40) was 1.51x the Vast median ($4.25), down from 1.89x on November 2.</p>
<h3 id="faq-vs-btc">Does H200 rental beat Bitcoin mining per kW?</h3><p>On gross revenue per kW, yes by a wide margin at current prices. But a GPU kW needs far more hardware money and only earns when rented, while an ASIC earns every hour it is on.</p>
<p>Related: <a href="/gpu/">weekly GPU rent index</a> · <a href="/">mine vs AI calculator</a> · <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/gpu/rent-vs-buy-h100/">rent vs buy an H100</a> · <a href="/gpu/host-earnings/">what GPU hosts earn</a> · <a href="/gpu/a100/">A100 rent price per kW</a> · <a href="/gpu/rtx-5090/">RTX 5090 rent price</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/fleet/">Fleet Check</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 20, 2026. Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out H200s?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-h200&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"datePublished":'2026-11-10',"dateModified":'2026-11-20',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPU rental prices","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA H200","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title,desc,url,ld,body}));
  return url;
}
