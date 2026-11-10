// NVIDIA H200 page: dist/gpu/h200/index.html. Same shell and hashprice as the H100 page (gpu.mjs).
// Every figure below is copied from a linked source on the date given; per-kW math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const NV='https://www.nvidia.com/en-us/data-center/h200/';
const ORNN='https://data.ornn.com/markets/h200', RP='https://www.runpod.io/pricing', NEB='https://nebius.com/prices', VAST='https://console.vast.ai/api/v0/bundles/';
// Fresh read, Tue Nov 10, 2026. Vast: public offers API, 10:11 CET, rentable, not rented, on-demand, exactly 1 GPU.
const NOW=[
 ['Ornn Compute Price Index (OCPI-H200)',ORNN,'Settled Nov 9, 2026, read Nov 10','$7.17','Not indexed','1 day +5.1%, 7 days +0.7%, 30 days +19.3%'],
 ['Nebius on-demand (published list)',NEB,'Read Nov 10, 2026','HGX H200 $5.40','Not listed','Preemptible from $0.79 (dynamic spot)'],
 ['RunPod Secure Cloud',RP,'Page "Updated November 4, 2026", read Nov 10','$5.29','Not listed','Billed per second'],
 ['RunPod Community Cloud',RP,'Same page','$3.59','Not listed','H100 SXM Community $2.69'],
 ['Vast.ai marketplace, 1 GPU (low / median / high)',VAST,'API query Nov 10, 2026, 10:11 CET','$3.17 / $4.08 / $4.49 (4 offers)','$3.32 / $3.93 / $6.09 (16 offers)','NVL verified median $3.88 (9 of 16)'],
];
// Our assumptions for per-kW: 70% of hours rented; ~1,000 W all-in per H200 SXM (NVIDIA up to 700 W TDP + ~300 W server share, our add; same as our H100 page).
const UTIL=0.7, W=1000;
const RATES=[['Ornn index',7.17],['Vast median',4.08],['RunPod Community',3.59]];
const PRICES=[0.04,0.06,0.08,0.10];
export function buildH200(a){
  const gross=r=>r*24*UTIL*(1000/W), pw=p=>24*p;
  const btcKw=1000/13.5*a.hp; // 1 kW of S21 XP at Bitmain's 13.5 J/TH
  const tbl=`<table><thead><tr><th>Power price</th>${RATES.map(([n,r])=>`<th>${n} $${r.toFixed(2)}/hr</th>`).join('')}</tr></thead><tbody>
<tr><td>Gross / kW / day</td>${RATES.map(([n,r])=>`<td>${$(gross(r))}</td>`).join('')}</tr>
${PRICES.map(p=>`<tr${p===0.06?' class="hl"':''}><td>Net at $${p.toFixed(2)}/kWh</td>${RATES.map(([n,r])=>`<td><b>${$(gross(r)-pw(p))}</b></td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  const rpNet=gross(3.59)-pw(0.06), ornnNet=gross(7.17)-pw(0.06);
  const calc=`/?gpuw=1000&amp;rate=3.59&amp;util=70`;
  const url='/gpu/h200/';
  const title='NVIDIA H200 rental price per hour (Nov 2026): specs and profit per kW';
  const desc='H200 rental price per hour on Nov 10, 2026: RunPod $3.59 Community / $5.29 Secure, Vast.ai median $4.08, Nebius $5.40, Ornn index $7.17. Specs from NVIDIA and what one kW of H200 nets per day.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>NVIDIA H200 rental price per hour, specs and profit per kW</h1>
<p class="lead"><b>Short answer:</b> on November 10, 2026 one H200 rented for <b>$3.59 an hour on RunPod Community</b>, a median <b>$4.08 on Vast.ai</b> (4 offers) and <b>$5.40 on Nebius</b> on demand. The Ornn index of real neocloud trades settled much higher, at <b>$7.17</b> on November 9, up 19.3% in 30 days. Here is why the gap is so wide and what an H200 earns per kilowatt.</p>
<p class="note">Last updated November 10, 2026.</p>
<h2 id="price-now">How much does an H200 cost per hour right now?</h2>
<p>Between $3.17 and $7.17 per GPU-hour, depending on where you rent. Self-serve clouds and marketplaces sit at $3.59 to $5.40. The Ornn index, built from transacted deals, sits at $7.17.</p>
<table><thead><tr><th>Source</th><th>Date</th><th>H200 SXM</th><th>H200 NVL</th><th>Also</th></tr></thead><tbody>
${NOW.map(([n,u,d,s,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Renter prices per GPU-hour. Our Vast query: rentable, not rented, on-demand, exactly one GPU; Vast lists "H200" and "H200 NVL" as separate cards, and we read "H200" as the SXM board. Thin sample: only four single-GPU H200 offers (hosts in Canada, Japan and Romania), one of them verified. Other GPUs side by side: <a href="/gpu/">GPU rental prices</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-h200&amp;p=rent" rel="sponsored nofollow">See live H200 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2 id="why-gap">Why is the Ornn H200 index so much higher than RunPod or Vast?</h2>
<p>Because they measure different things. Ornn says its OCPI-H200 is a volume-weighted average of transacted H200 rentals across neoclouds, "real trades, not scraped listings, surveys, or rate cards" (<a href="${ORNN}">Ornn H200 index</a>, read Nov 10). RunPod, Vast and Nebius are posted prices for one GPU you can grab right now. The index has also moved fast: its three-month range is $4.23 to $7.31, and it was $5.21 on October 12. Our read, not sourced: the trade index likely weights multi-GPU, dedicated deals more heavily than single-card marketplace listings, so treat $7.17 as what the market is clearing at and $3.59 to $5.40 as what a single self-serve card costs.</p>
<table><thead><tr><th>Date (settle)</th><th>OCPI-H200</th></tr></thead><tbody>
<tr><td>Nov 9, 2026</td><td>$7.17</td></tr><tr><td>Nov 8, 2026</td><td>$6.82</td></tr><tr><td>Nov 3, 2026</td><td>$7.31 (3-month high)</td></tr><tr><td>Nov 1, 2026</td><td>$6.21</td></tr><tr><td>Oct 26, 2026</td><td>$6.21</td></tr><tr><td>Oct 12, 2026</td><td>$5.21</td></tr>
</tbody></table>
<p class="note">Source: <a href="${ORNN}">Ornn Data, OCPI-H200 daily settles</a>, read November 10, 2026.</p>
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
<tr><td><a href="https://data.ornn.com/">Ornn index, settled Nov 9</a></td><td>$3.30</td><td>$7.17</td><td>2.17x</td></tr>
<tr><td><a href="${RP}">RunPod Community</a></td><td>$2.69</td><td>$3.59</td><td>1.33x</td></tr>
<tr><td><a href="${VAST}">Vast.ai median, 1 GPU, Nov 10 10:11 CET</a></td><td>$3.54 (8 offers)</td><td>$4.08 (4 offers)</td><td>1.15x</td></tr>
<tr><td><a href="${NEB}">Nebius on-demand</a></td><td>$4.50</td><td>$5.40</td><td>1.20x</td></tr>
</tbody></table>
<p>On self-serve clouds you pay 15% to 33% more for 76% more memory, which is a good deal if the extra memory lets you run a model on fewer cards. More H100 numbers: <a href="/gpu/h100/">H100 rent price per kW</a>.</p>
<h2 id="per-kw">What does one kW of H200 earn per day?</h2>
<p>Our assumptions, not sourced: about 1,000 W per H200 SXM all-in (NVIDIA's 700 W TDP plus about 300 W of server share, our add, same as our H100 page), so one kilowatt is about one GPU. Rented 70% of hours, power paid for all 24 hours.</p>
${tbl}
<p class="note">Gross = rate × 24 × 70% × (1,000 W / 1,000 W). Net = gross minus 24 kWh of power. No platform cut, hosting, cooling markup or hardware cost. Our arithmetic on the prices above.</p>
<p>For scale: a kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 1,000 W, the RunPod Community $3.59 rate and 70% utilization. Or enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to pull live GPU occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an H200?</h3><p>On November 10, 2026: $3.59 per GPU-hour on RunPod Community Cloud and $5.29 on RunPod Secure Cloud, $5.40 on demand on Nebius, and a median $4.08 for one H200 on Vast.ai (4 offers, $3.17 to $4.49). H200 NVL on Vast had a median of $3.93 (16 offers). The Ornn index of real trades settled at $7.17 on November 9.</p>
<h3 id="faq-power">How much power does an H200 use?</h3><p>NVIDIA lists the H200 SXM at up to 700 W TDP and the H200 NVL at up to 600 W, both configurable. A full server draws more per GPU; we assume about 1,000 W per SXM GPU all-in.</p>
<h3 id="faq-memory">How much memory does the H200 have?</h3><p>141 GB of GPU memory at 4.8 TB/s on both the SXM and NVL versions, per NVIDIA. The H100 SXM has 80 GB at 3.35 TB/s.</p>
<h3 id="faq-kw">What does one kW of H200 earn per day?</h3><p>At the $3.59 RunPod Community rate, 1,000 W all-in and 70% utilization, about ${$(gross(3.59))} gross per kW per day, or about ${$(rpNet)} after $0.06/kWh power. At the $7.17 Ornn rate it is about ${$(gross(7.17))} gross, or ${$(ornnNet)} net. That is renter price, before platform cut and hardware.</p>
<h3 id="faq-vs-h100">Is the H200 more expensive than the H100?</h3><p>Yes. On November 9 to 10, 2026 the H200 cost 1.15x the H100 SXM on the Vast.ai median, 1.20x on Nebius, 1.33x on RunPod Community and 2.17x on the Ornn trade index ($7.17 vs $3.30).</p>
<h3 id="faq-vs-btc">Does H200 rental beat Bitcoin mining per kW?</h3><p>On gross revenue per kW, yes by a wide margin at current prices. But a GPU kW needs far more hardware money and only earns when rented, while an ASIC earns every hour it is on.</p>
<p>Related: <a href="/">mine vs AI calculator</a> · <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/gpu/a100/">A100 rent price per kW</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/fleet/">Fleet Check</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 10, 2026. Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out H200s?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-h200&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"datePublished":'2026-11-10',"dateModified":'2026-11-10',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPU rental prices","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA H200","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  return url;
}
