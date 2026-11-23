import {gitDate} from './dates.mjs';
import { build4090 } from './gpu4090.mjs';
import { build5090 } from './gpu5090.mjs';
import { buildA100 } from './gpuA100.mjs';
import { buildH200 } from './gpuH200.mjs';
import { buildRentBuy } from './gpuRentBuy.mjs';
import { buildHosts } from './gpuHosts.mjs';
// GPU pages: dist/gpu/<slug>/index.html + dist/gpu/index.html. Uses the page shell and hashprice from buildAsic.
// Every figure below is copied from a linked source on the date given; per-kW math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const NV='https://www.nvidia.com/en-us/data-center/h100/', NVPB='https://www.nvidia.com/content/dam/en-zz/Solutions/gtcs22/data-center/h100/PB-11133-001_v01.pdf';
const ORNN='https://data.ornn.com/', RP='https://www.runpod.io/pricing', LAM='https://lambda.ai/pricing', VAST='https://console.vast.ai/api/v0/bundles/';
const MC='https://massedcompute.com/pricing/', TOG='https://www.together.ai/pricing', NEB='https://nebius.com/prices', CW='https://www.coreweave.com/pricing';
// Rental prices, USD per GPU-hour, what renters pay.
const RENT=[
 ['Ornn Compute Price Index (OCPI-H100)',ORNN,'H100 SXM, page "Updated October 25, 2026 at 20:00 UTC", read Oct 26, 2026','$3.03','Index of executed trades'],
 ['RunPod Community Cloud',RP,'Page "Updated October 8, 2026", read Oct 26, 2026','$2.69','$1.99'],
 ['RunPod Secure Cloud',RP,'Same page','$3.99','$2.89'],
 ['Lambda on-demand, 1x GPU',LAM,'Read Oct 26, 2026, plus tax','$4.29','$3.29'],
 ['Lambda on-demand, 8x GPU',LAM,'Read Oct 26, 2026, plus tax','$3.99','Not listed'],
 ['Massed Compute, 1x H100 SXM5',MC,'Read Oct 26, 2026','$3.14','Not checked'],
 ['Together AI GPU clusters, on-demand',TOG,'Read Oct 26, 2026','$3.99','Not listed'],
 ['Nebius HGX H100, on-demand',NEB,'Read Oct 26, 2026','$4.50','Not listed'],
 ['CoreWeave HGX H100, 8 GPUs ($49.24/hr)',CW,'Read Oct 26, 2026; per GPU is our division','$6.16','Not checked'],
 ['Vast.ai marketplace, 1 GPU (low / median / high)',VAST,'API query Oct 26, 2026, 09:06 CET','$1.93 / $3.20 / $9.10 (4 offers)','No offers'],
];
// Fresh read, Nov 18, 2026 (data/snapshots/2026-11-18.md). Vast: public offers API, 11:08 CET, rentable, on-demand, exactly 1 GPU (count = offers returned, capped at 64).
const NOW=[
 ['Ornn Compute Price Index (OCPI-H100)',ORNN,'Settled Nov 17, 2026, read Nov 18','$2.92','Not indexed','Nov 16 $3.16, Nov 10 $3.10; 1 month +4.3%'],
 ['RunPod Community Cloud',RP,'Page "Updated November 12, 2026", read Nov 18','$2.69','$1.99','H100 NVL $2.59'],
 ['RunPod Secure Cloud',RP,'Same page','$4.39','$2.89','H100 NVL $3.19'],
 ['Lambda on-demand, 1x GPU',LAM,'Read Nov 18, 2026, plus tax; list in effect since Nov 16, 2026','$4.89','$3.79','8x $4.59, 4x $4.69, 2x $4.79 per GPU'],
 ['Vast.ai marketplace, 1 GPU (low / median / high)',VAST,'API query Nov 18, 2026, 11:08 CET','$1.74 / $1.80 / $5.09 (3 offers)','$2.14 / $2.40 / $2.67 (2 offers)','H100 NVL $2.34 / $3.47 / $4.73 (4 offers)'],
];
// GPU hub table, Nov 20, 2026 (data/snapshots/2026-11-20.md): [gpu, vast median (offers), runpod community, runpod secure, lambda, ornn settled Nov 19, clore median open 1-GPU offer]
const CLM='https://api.clore.ai/v1/marketplace';
const HUB=[
 ['B300','Not checked','$6.94','$8.99','Not checked','$11.66','Not checked'],
 ['B200','$7.89 (6 offers)','$5.98','$7.99','1x $7.99, 8x $7.69','$9.17','Not checked'],
 ['<a href="/gpu/h200/">H200</a>','$4.25 (6 offers)','$3.59','$5.29','Not listed','$6.40','Not checked'],
 ['<a href="/gpu/h200/#nvl">H200 NVL</a>','$4.00 (19 offers)','Not listed','Not listed','Not listed','Not indexed','Not checked'],
 ['GH200','Not checked','Not listed','Not listed','$2.59','Not checked','Not checked'],
 ['<a href="/gpu/h100/">H100 SXM</a>','$2.20 (6 offers)','$2.69','$4.39','1x $4.89, 8x $4.59','$2.78','Not checked'],
 ['H100 NVL','$3.90 (2 offers)','$2.59','$3.19','Not checked','Not indexed','Not checked'],
 ['H100 PCIe','$2.61 (2 offers)','$1.99','$2.89','$3.79','Not indexed','Not checked'],
 ['<a href="/gpu/a100/">A100 SXM</a>','$0.87 (31 offers)','$1.39','$2.19','8x 80 GB $3.19','$1.00','Not checked'],
 ['<a href="/gpu/a100/">A100 PCIe</a>','$0.77 (16 offers)','$1.19','$2.09','40 GB $1.99','Not indexed','Not checked'],
 ['RTX PRO 6000','Not checked','$1.69','$2.69','Not checked','$1.56 (WS)','Not checked'],
 ['L40S','$0.72 (8 offers)','$0.79','$1.09','Not checked','Not indexed','Not checked'],
 ['<a href="/gpu/rtx-5090/">RTX 5090</a>','$0.60 (64 offers)','$0.69','$1.39','Not listed','$0.67','$0.79 ($19.00/day)'],
 ['<a href="/gpu/rtx-4090/">RTX 4090</a>','$0.47 (64 offers)','$0.34','$0.89','Not listed','Not indexed','$0.63 ($15.00/day)'],
 ['RTX 3090','$0.22 (64 offers)','$0.22','$0.50','Not listed','Not indexed','$0.21 ($5.00/day)'],
];
// Weekly index (our snapshots): [gpu, vast Nov 9, Nov 16, Nov 20, ornn settled Nov 8, Nov 15, Nov 19, what moved]
const WEEK=[
 ['H100 SXM','$2.50 (4)','$2.10 (8)','$2.20 (6)','$3.37','$3.06','$2.78','Ornn down 9.2% in a week, its lowest settle since at least Oct 16. Vast up 4.9% on only 6 offers (noisy).'],
 ['H200','$4.14 (7)','$4.34 (7)','$4.25 (6)','$6.82','$6.28','$6.40','Ornn up 1.9% on the week but down 10% from $7.11 the day before. Vast down 2.2%.'],
 ['H200 NVL','$4.00 (12)','$4.27 (12)','$4.00 (19)','Not indexed','Not indexed','Not indexed','More offers (19), median down 6.3%, now under the H200 SXM.'],
 ['B200','0 offers','$9.96 (4)','$7.89 (6)','$9.94','$9.66','$9.17','Vast median down 20.8% on 6 offers (noisy). Ornn down 5.1%, lowest since Oct 20.'],
 ['A100 SXM','$0.80 (23)','$0.67 (23)','$0.87 (31)','$1.03','$1.02','$1.00','Vast median up 29.7% with more offers; Ornn flat near $1.00.'],
 ['L40S','Not read','$0.80 (8)','$0.72 (8)','Not indexed','Not indexed','Not indexed','Vast down 9.8%.'],
 ['RTX 5090','$0.695','$0.678','$0.602','$0.68','$0.68','$0.67','Vast down 11.2% (64 cheapest offers). Ornn flat. Clore open-offer median up 36% to $19.00/day as 59% of 5090 servers were rented.'],
 ['RTX 4090','$0.456','$0.47','$0.469','Not indexed','Not indexed','Not indexed','Flat on Vast. Clore open-offer median up 37% to $15.00/day.'],
 ['RTX 3090','$0.20','$0.216','$0.216','Not indexed','Not indexed','Not indexed','Flat.'],
];
const UTIL=0.7, W=1000; // our assumptions: 70% of hours rented, 1,000 W per H100 SXM incl. its server share
const RATES=[['Ornn index',2.92],['RunPod Community',2.69],['Vast median',1.80]];
const PRICES=[0.04,0.06,0.08,0.10];
const BUY=36125, LIFE=4;
export function buildGpu(a){
  const gross=r=>r*24*UTIL*(1000/W), pw=p=>24*p;
  const btcKw=1000/13.5*a.hp; // 1 kW of S21 XP at Bitmain's 13.5 J/TH
  const tbl=`<table><thead><tr><th>Power price</th>${RATES.map(([n,r])=>`<th>${n} $${r.toFixed(2)}/hr</th>`).join('')}</tr></thead><tbody>
<tr><td>Gross / kW / day</td>${RATES.map(([n,r])=>`<td>${$(gross(r))}</td>`).join('')}</tr>
${PRICES.map(p=>`<tr${p===0.06?' class="hl"':''}><td>Net at $${p.toFixed(2)}/kWh</td>${RATES.map(([n,r])=>`<td><b>${$(gross(r)-pw(p))}</b></td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  const ornnNet=gross(2.92)-pw(0.06);
  const deprHr=BUY/(LIFE*365*24);
  const h100Faq=[
   ['faq-rent','How much does it cost to rent an H100?','On November 18, 2026: a median $1.80 per GPU-hour for one H100 SXM on Vast.ai (only 3 offers, $1.74 to $5.09; it was $2.10 across 8 offers on November 16 and $2.34 across 6 on November 17), $2.69 on RunPod Community, $4.39 on RunPod Secure and $4.89 on Lambda 1x (published list, in effect since November 16). The Ornn index of real trades settled at $2.92 on November 17. On October 26 Nebius was $4.50 and CoreWeave\'s 8-GPU box worked out to $6.16 per GPU.'],
   ['faq-power','How much power does an H100 use?','NVIDIA lists the H100 SXM at up to 700 W max TDP and the H100 PCIe at 350 W. A full server draws more per GPU; we assume about 1,000 W per SXM GPU all-in.'],
   ['faq-kw','What does one kW of H100 earn per day?',`At the $2.92 Ornn rate (settled November 17, 2026) and 70% utilization, about ${$(gross(2.92))} gross per kW per day, or about ${$(ornnNet)} after $0.06/kWh power. That is renter price, before platform cut and hardware.`],
   ['faq-buy','How much does it cost to buy an H100?','About $31,250 to $40,000 per GPU based on 8x server listings and estimates of $250,000 to $320,000 per server, with one listing at $289,000 on October 13, 2026.'],
   ['faq-sxm','What is the difference between H100 SXM and PCIe?','SXM is the server-board version with up to 700 W and 3.35 TB/s of memory bandwidth. PCIe is a card with a 350 W max TDP and 2,000 GB/s. PCIe rents for less: $1.99 vs $2.69 on RunPod Community (page dated November 12, 2026).'],
   ['faq-vs-btc','Does H100 rental beat Bitcoin mining per kW?','On gross revenue per kW, yes by a wide margin at current prices. But a GPU kW needs far more hardware money and only earns when rented, while an ASIC earns every hour it is on.']];
  const calc=`/?gpuw=1000&amp;rate=2.92&amp;gprice=36125&amp;util=70`;
  const url='/gpu/h100/';
  const title='NVIDIA H100 rental price per hour (Nov 2026): specs and profit per kW';
  const desc='H100 rental price per hour on Nov 18, 2026: Vast.ai median $1.80 (3 offers), RunPod $2.69, Lambda $4.89, Ornn index $2.92. SXM vs PCIe specs and profit per kW.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>NVIDIA H100 rental price per hour, specs and profit per kW</h1>
<p class="eyebrow">Last updated <time datetime="2026-11-18">November 18, 2026</time></p>
<p class="lead"><b>Short answer:</b> on November 18, 2026 one H100 SXM rented for <b>$2.69 an hour on RunPod Community</b>, <b>$4.39 on RunPod Secure</b> and <b>$4.89 on Lambda</b> (1x, published list). Vast.ai had only 3 single H100 SXM offers, with a median of <b>$1.80</b>. The <a href="https://data.ornn.com/">Ornn index</a> of real trades settled at <b>$2.92</b> on November 17, down from $3.16 the day before. At $2.92 and 70% rented, one kW of H100 grosses about ${$(gross(2.92))} a day. Here is the math.</p>
<h2 id="price-now">How much does an H100 cost per hour right now?</h2>
<table><thead><tr><th>Source</th><th>Date</th><th>H100 SXM</th><th>H100 PCIe</th><th>Also</th></tr></thead><tbody>
${NOW.map(([n,u,d,s,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Renter prices per GPU-hour. Our Vast query: rentable, on-demand, exactly one GPU; only 1 of the 3 SXM offers was a verified host ($5.09). Thin sample: three single-GPU SXM offers today, so the Vast median moves a lot day to day (it was $2.10 across 8 offers on Nov 16 and $2.34 across 6 on Nov 17, from our snapshots). RunPod Secure H100 SXM went from $3.99 to $4.39 on the page dated November 12; Community did not move. Other GPUs side by side: <a href="/gpu/">GPU rental prices</a>.</p>
<h2 id="specs">What are the H100 SXM and PCIe specs?</h2>
<table><thead><tr><th></th><th>H100 SXM</th><th>H100 PCIe</th></tr></thead><tbody>
<tr><td>Max TDP</td><td>Up to 700 W (configurable)</td><td>350 W</td></tr>
<tr><td>Memory</td><td>80 GB</td><td>80 GB HBM2e</td></tr>
<tr><td>Memory bandwidth</td><td>3.35 TB/s</td><td>2,000 GB/s</td></tr>
<tr><td>FP8 Tensor Core</td><td>3,958 teraFLOPS*</td><td>Not covered here</td></tr>
</tbody></table>
<p class="note">SXM: <a href="${NV}">NVIDIA H100 product page</a>, read Oct 22, 2026 (*with sparsity, per NVIDIA's footnote). PCIe: <a href="${NVPB}">NVIDIA H100 PCIe product brief PB-11133-001</a> (maximum TDP 350 W). The current NVIDIA page lists the H100 NVL (350 to 400 W) as its PCIe option.</p>
<h2 id="price-oct">What did an H100 cost on October 26, 2026?</h2>
<p>Our earlier read, kept so you can see the move.</p>
<table><thead><tr><th>Source</th><th>Date</th><th>H100 SXM</th><th>H100 PCIe</th></tr></thead><tbody>
${RENT.map(([n,u,d,s,p])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">These are what renters pay, not what a host nets after the platform cut (host side: <a href="/gpu/host-earnings/">what GPU hosts earn per GPU</a>). Vast is a live marketplace with only a handful of single H100 offers, so its median moves a lot. Our Vast query: rentable, on-demand, exactly one GPU. Side by side: <a href="/blog/h100-price-per-hour-across-clouds-october-26-2026/">what an H100 hour costs across 7 clouds (Oct 26)</a>. Older H200, A100 and RTX 4090 prices: <a href="/blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/">Oct 21 post</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-h100&amp;p=rent" rel="sponsored nofollow">See live H100 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2 id="per-kw">What does one kW of H100 earn per day?</h2>
<p>Our assumptions, not sourced: about 1,000 W per H100 SXM including its share of the server (so 1 kW is one GPU), rented 70% of hours, power paid for all 24 hours.</p>
${tbl}
<p class="note">Gross = rate × 24 × 70%. Net = gross minus 24 kWh of power. No platform cut, hosting, cooling markup or hardware cost. Our arithmetic on the prices above.</p>
<p>For scale: a kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<h2 id="rent-vs-buy">Should you rent or buy an H100?</h2>
<p>An 8x H100 SXM server was listed at $289,000 on Oct 13, 2026 (<a href="https://gygo.com/buy/">GYGO</a>), about $36,125 per GPU. Mercatus puts typical 8x servers at $250,000 to $320,000 (<a href="https://www.mercatus-ai.com/blog/h100-server-price">Mercatus</a>). Spread over 4 years (our assumption), $36,125 is about ${$(deprHr)} per GPU-hour before power, hosting or financing.</p>
<p>So if you just need compute, renting at $2.69 to $2.92 an hour (RunPod Community, Ornn index) is simpler unless you keep the GPU busy most of the time for years. If you are a host with cheap power, the gap between that ~${$(deprHr)} hardware cost and a ~$3 rental rate is the business, and utilization decides whether you see it. Full math: <a href="/gpu/rent-vs-buy-h100/">rent vs buy an H100</a>.</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 1,000 W, the Ornn $2.92 rate, $36,125 per GPU and 70% utilization. Or enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to pull live GPU occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2 id="faq">H100 rental FAQ</h2>
${h100Faq.map(([id,q,a])=>`<h3 id="${id}">${q}</h3><p>${a}</p>`).join('\n')}
<p>Related: <a href="/">mine vs AI calculator</a> · <a href="/gpu/host-earnings/">what GPU hosts earn per GPU</a> · <a href="/gpu/h200/">H200 rent price and H200 vs H100</a> · <a href="/gpu/a100/">A100 rent price per kW</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a> · <a href="/power-prices/">industrial power prices</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 18, 2026. Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out H100s?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-h100&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":'2026-11-18',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPU rental prices","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA H100","item":SITE+url}]}},
   {"@type":"FAQPage","mainEntity":h100Faq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  const hubFaq=[['faq-h100','How much does it cost to rent an H100 per hour?','On November 20, 2026 one H100 SXM rented for a median $2.20 an hour on Vast.ai (only 6 offers, so noisy), $2.69 on RunPod Community, $4.39 on RunPod Secure and $4.89 on Lambda (1x GPU, published list; 8x is $4.59 per GPU). The Ornn index of executed trades settled at $2.78 on November 19, down 9.2% in a week.'],
   ['faq-week','Are GPU rental prices going up or down this week?','Mostly down. From November 15 to 19, 2026 the Ornn index fell 9.2% for the H100 (to $2.78), 5.1% for the B200 (to $9.17) and 1.5% for the RTX 5090 (to $0.67), while the H200 rose 1.9% (to $6.40). On Vast.ai the RTX 5090 median fell 11.2% from November 16 to 20 and the RTX 4090 was flat. RunPod and Lambda list prices did not change.'],
   ['faq-cheapest','What is the cheapest GPU to rent?','Of the cards in the table, the RTX 3090: a median $0.22 an hour on Vast.ai and $0.22 on RunPod Community on November 20, 2026. For data-center GPUs, an A100 SXM had a Vast.ai median of $0.87 (31 offers) and RunPod Community listed $1.39.'],
   ['faq-b200','How much does a B200 cost to rent?','On November 20, 2026 RunPod listed the B200 at $5.98 an hour on Community Cloud and $7.99 on Secure Cloud (page dated November 12). Lambda listed $7.99 for 1x and $7.69 per GPU for 8x. Vast.ai had 6 single-GPU on-demand offers, $7.50 to $11.89, median $7.89. The Ornn B200 index settled at $9.17 on November 19.'],
   ['faq-why-differ','Why do GPU rental prices differ so much between providers?','Vast.ai and Clore are marketplaces where hosts set their own prices, so rates move with supply and how many cards are already rented. RunPod and Lambda post fixed on-demand prices, and RunPod Secure Cloud runs in data centers, which costs more than Community Cloud. Ornn is an index of executed trades, not a list price.'],
   ['faq-rent-out','Can I rent out my own GPU?','Yes, if it is a gaming card on Salad, or a dedicated Linux box on Vast.ai or Clore. RunPod Community Cloud is closed to new hosts. What a 4090, 5090 or 3090 keeps after power is in our guide to renting out your GPU.']];
  const hubBody=`<div class="prose post"><p class="eyebrow">GPU rental prices · Updated November 20, 2026</p><h1>GPU rental prices per hour: H100, H200, B200, A100, RTX 5090, 4090</h1>
<p class="lead"><b>Short answer (Nov 20, 2026):</b> one <b>H100 SXM</b> rents for <b>$2.20 to $4.89 an hour</b> (Vast.ai median $2.20 on only 6 offers, RunPod Community $2.69, Lambda 1x $4.89), an <b>H200</b> for $3.59 to $5.40 on self-serve clouds, a <b>B200</b> for $5.98 to $7.99 and an <b>RTX 4090</b> for $0.34 to $0.63. The <a href="${ORNN}">Ornn index</a> of real trades settled November 19 at <b>$2.78</b> for the H100, down 9.2% in a week, and $6.40 for the H200. Every price below is per GPU-hour, dated and linked.</p>
<p class="note">Last updated November 20, 2026. We re-read every source each week and keep the old reads, so this page doubles as a weekly GPU rent index.</p>
<h2 id="prices">How much does it cost to rent a GPU per hour?</h2>
<table><thead><tr><th>GPU</th><th><a href="${VAST}">Vast.ai</a> median, 1 GPU</th><th><a href="${RP}">RunPod</a> Community</th><th>RunPod Secure</th><th><a href="${LAM}">Lambda</a></th><th><a href="${ORNN}">Ornn index</a></th><th><a href="${CLM}">Clore</a> median, 1 GPU</th></tr></thead><tbody>
${HUB.map(r=>`<tr>${r.map((c,k)=>k?`<td>${c}</td>`:`<td><b>${c}</b></td>`).join('')}</tr>`).join('\n')}
</tbody></table>
<p class="note">What renters pay, USD per GPU-hour, read November 20, 2026. Vast.ai: our query of its public offers API at 11:04 CET, rentable, on-demand, exactly one GPU; offer counts stop at 64, and anything under about 10 offers is a thin, noisy sample. RunPod: pricing page dated November 12, 2026, read 11:02 CET. Lambda: on-demand, plus tax, read 11:02 CET; no H200 instance listed. Ornn: OCPI settlement prices for November 19, 2026 (free-tier index). Clore: median listed price of open single-GPU servers from its public marketplace API at 11:03 CET, per day divided by 24 (our math). "Not checked" means we did not read that price, not that it does not exist.</p>
<h2 id="weekly">How did GPU rental prices move this week?</h2>
<p>Down for most data-center cards. The Ornn H100 index fell from $3.06 to $2.78 between the November 15 and November 19 settles, and the B200 from $9.66 to $9.17. Fixed list prices did not move: RunPod's page is still dated November 12 (its Secure Cloud rise from $3.99 to $4.39 on the H100 landed then) and Lambda's November 16 list is unchanged. Our three weekly reads side by side:</p>
<table><thead><tr><th>GPU</th><th>Vast Nov 9</th><th>Vast Nov 16</th><th>Vast Nov 20</th><th>Ornn Nov 8</th><th>Ornn Nov 15</th><th>Ornn Nov 19</th><th>What moved</th></tr></thead><tbody>
${WEEK.map(r=>`<tr>${r.map((c,k)=>k?`<td>${c}</td>`:`<td><b>${c}</b></td>`).join('')}</tr>`).join('\n')}
</tbody></table>
<p class="note">Vast medians (offer count in brackets) from our snapshots of November 9, 16 and 20, 2026, same filter each time; Ornn settles from its <a href="https://data.ornn.com/api/public-index/gpu/H100%20SXM/index-history">index history</a>. Percent changes are our math. On Clore, 54.8% of 2,785 listed servers were rented at the November 20 read (44.5% on November 16), so the cheap open offers were gone and the median of what is left went up. Raw reads: <a href="https://github.com/PierreCorbin/joulemath/tree/main/data/snapshots">data/snapshots on GitHub</a>.</p>
<h2 id="pages">Which GPUs have full pages?</h2>
<ul><li><a href="${url}">NVIDIA H100 rental price per hour</a>: SXM vs PCIe specs, Ornn, RunPod, Lambda and Vast.ai prices, and profit per kW.</li><li><a href="/gpu/rent-vs-buy-h100/">Rent vs buy an H100</a>: what owning costs per GPU-hour, the utilization where buying wins, and host payback.</li><li><a href="/gpu/host-earnings/">What GPU hosts earn per GPU</a>: host rates per hour on Vast, Clore and Salad, platform fees, how often cards get rented and monthly net after power.</li><li><a href="/gpu/h200/">NVIDIA H200 rental price per hour</a>: RunPod, Vast.ai, Nebius and Ornn prices, why the trade index runs higher, H200 vs H100, and profit per kW.</li><li><a href="/gpu/a100/">NVIDIA A100 rental price per hour</a>: SXM vs PCIe specs, Ornn, RunPod, Lambda and Vast.ai prices, and profit per kW.</li><li><a href="/gpu/rtx-4090/">NVIDIA RTX 4090</a>: Vast.ai, RunPod, Clore and SaladCloud prices, used card prices, power cost and owner payback.</li><li><a href="/gpu/rtx-5090/">NVIDIA RTX 5090 rent price per hour</a>: Vast.ai, RunPod, Ornn, Clore and SaladCloud prices, what a 5090 host earns, used card prices and payback.</li></ul>
<p>Own a gaming card? <a href="/guides/rent-out-your-gpu/">What renting out an RTX 4090, 5090 or 3090 earns after power</a>, and <a href="/gpu/host-earnings/">what hosts keep per GPU on Vast, Clore and Salad</a>. Or compare against mining in the <a href="/">per-kW calculator</a>, and see what the same kilowatts earn on the <a href="/asic/">ASIC pages</a>.</p>
<h2 id="notes">Latest GPU price notes</h2><ul><li><a href="/blog/h100-price-per-hour-across-clouds-october-26-2026/">H100 price per hour across clouds (October 26, 2026)</a></li><li><a href="/blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/">GPU rental prices: H100, H200, A100 and RTX 4090 (October 2026)</a></li><li><a href="/blog/hashprice-vs-gpu-rent-what-1-kw-earns-this-week/">Hashprice vs GPU rent: what 1 kW earns</a></li><li><a href="/blog/bitcoin-miners-pivot-to-ai-hosting-deals-and-why/">Bitcoin miners pivot to AI hosting: the deals and why</a></li></ul>
<h2 id="faq">FAQ</h2>
${hubFaq.map(([id,q,a])=>`<h3 id="${id}">${q}</h3>\n<p>${a}</p>`).join('\n')}
<p>Already hosting GPUs? Benchmark a Vast.ai machine in <a href="/fleet/">Fleet Check</a>.</p></div>
<h2 id="vast-books">How do Vast.ai hosts track earnings and payments?</h2>
<p>Connect your Vast.ai account to Flash to track earnings, fees and payouts by machine. The integration is available to hosts today, and Flash can help with payments as well as sync to QuickBooks in one click.</p>
<section class="cta"><div><h2>Run GPUs for AI?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-hub&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const hubLd={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","name":"GPU rental prices per hour","url":SITE+'/gpu/',"dateModified":'2026-11-20',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+'/'},{"@type":"ListItem","position":2,"name":"GPU rental prices","item":SITE+'/gpu/'}]}},
   {"@type":"FAQPage","mainEntity":hubFaq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
  fs.writeFileSync('dist/gpu/index.html',a.page({title:'GPU rental prices per hour, Nov 2026: H100, H200, B200, RTX 5090',desc:'Nov 20, 2026 GPU rent per hour: H100 $2.20 to $4.89, H200 $3.59 to $6.40, B200 $5.98 to $9.17, plus A100, RTX 5090 and 4090. Weekly moves, every price dated.',url:'/gpu/',ld:hubLd,body:hubBody}));
  // /calculators/ (static src page): dated short answer, question H2s and FAQPage, filled at build from live hashprice and the Nov 20 GPU read above.
  {const cf='dist/calculators/index.html';let ch=fs.readFileSync(cf,'utf8');const xp=a.models.find(o=>o.m.slug==='antminer-s21-xp');
   const esc=t=>t.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
   const cdesc=`${a.dshort}: hashprice ${$(a.hp,4)}/TH/s/day, an S21 XP breaks even near $${xp.be.toFixed(3)}/kWh, an H100 rents for $2.69/hr on RunPod. Free ASIC, GPU and per-kW calculators.`;
   const cfaq=[['faq-asic','Is there a free ASIC mining profitability calculator?',`Yes. The joulemath ASIC calculator uses live hashprice from the mempool.space API (${$(a.hp,4)} per TH/s per day on ${a.dshort}) and gives daily profit, break-even power price and payback for 10 Antminer and WhatsMiner models. At that hashprice one Antminer S21 XP grosses about ${$(xp.rev)} a day and breaks even near $${xp.be.toFixed(3)}/kWh.`],
    ['faq-mine-vs-gpu','How do I compare Bitcoin mining vs renting GPUs?',`Use the per-kW calculator on the home page. It puts one kW of ASICs next to one kW of rented GPUs at your power price. For scale, one kW of S21 XP grosses about ${$(1000/13.5*a.hp)} a day at today's hashprice, while one H100 SXM rents for $2.69 an hour on RunPod Community (read November 20, 2026).`],
    ['faq-data','Do the calculators store my data?','No. The calculators run in your browser. Fleet Check keeps your Bitcoin addresses and Vast.ai machine IDs only in your browser (localStorage), not on any server, and the code is open source on GitHub.']];
   const cans=`<p class="lead"><b>Short answer (${a.dshort}):</b> at a hashprice of <b>${$(a.hp,4)} per TH/s per day</b> (<a href="https://mempool.space/docs/api">mempool.space</a>), one Antminer S21 XP grosses about <b>${$(xp.rev)} a day</b> and breaks even near <b>$${xp.be.toFixed(3)}/kWh</b>. One H100 SXM rents for <b>$2.69 an hour</b> on <a href="${RP}">RunPod Community</a> (read November 20, 2026). Pick a calculator below to run your own numbers.</p><p class="note">${a.updated}. Hashprice refreshes on every rebuild; GPU prices are read by hand and dated.</p>`;
   const cbody=`<h2 id="which">Which calculator should I use?</h2><ul><li>Running ASICs: the <a href="/mining-calculator/">ASIC profitability calculator</a>, or a model page like the <a href="/asic/antminer-s21-xp/">S21 XP</a> or <a href="/asic/antminer-s19j-pro/">S19j Pro</a>.</li><li>Deciding between mining and AI: the <a href="/">mine vs AI per-kW calculator</a>, then the <a href="/gpu/">weekly GPU rent index</a> and <a href="/gpu/h200/">H200</a> or <a href="/gpu/a100/">A100</a> prices.</li><li>Already running machines: <a href="/fleet/">Fleet Check</a> for BTC payout addresses and Vast.ai machine IDs.</li><li>Checking a site: <a href="/power-prices/">industrial power prices by country</a>.</li></ul>
<h2 id="faq">Calculator FAQ</h2>
${cfaq.map(([id,q,t])=>`<h3 id="${id}">${q}</h3><p>${t}</p>`).join('\n')}`;
   const cld={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","name":"Free Bitcoin mining and GPU rental calculators","url":SITE+'/calculators/',"dateModified":gitDate(['gpu.mjs','src/calculators'])},{"@type":"FAQPage","mainEntity":cfaq.map(([,q,t])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":t}}))}]};
   for(const m of ['<!--calc-desc-->','<!--calc-ld-->','<!--calc-answer-->','<!--calc-faq-->'])if(!ch.includes(m))throw new Error('calculators marker missing '+m);
   ch=ch.replaceAll('<!--calc-desc-->',esc(cdesc)).replace('<!--calc-ld-->',`<script type="application/ld+json">${JSON.stringify(cld).replace(/</g,'\\u003c')}</script>`).replace('<!--calc-answer-->',cans).replace('<!--calc-faq-->',cbody);
   fs.writeFileSync(cf,ch);}
  build4090(a);build5090(a);buildA100(a);buildH200(a);buildRentBuy(a);buildHosts(a);console.log('gpu: pages 8');
}
