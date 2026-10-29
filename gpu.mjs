import { build4090 } from './gpu4090.mjs';
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
const UTIL=0.7, W=1000; // our assumptions: 70% of hours rented, 1,000 W per H100 SXM incl. its server share
const RATES=[['Ornn index',3.03],['RunPod Community',2.69],['Vast median',3.20]];
const PRICES=[0.04,0.06,0.08,0.10];
const BUY=36125, LIFE=4;
export function buildGpu(a){
  const gross=r=>r*24*UTIL*(1000/W), pw=p=>24*p;
  const btcKw=1000/13.5*a.hp; // 1 kW of S21 XP at Bitmain's 13.5 J/TH
  const tbl=`<table><thead><tr><th>Power price</th>${RATES.map(([n,r])=>`<th>${n} $${r.toFixed(2)}/hr</th>`).join('')}</tr></thead><tbody>
<tr><td>Gross / kW / day</td>${RATES.map(([n,r])=>`<td>${$(gross(r))}</td>`).join('')}</tr>
${PRICES.map(p=>`<tr${p===0.06?' class="hl"':''}><td>Net at $${p.toFixed(2)}/kWh</td>${RATES.map(([n,r])=>`<td><b>${$(gross(r)-pw(p))}</b></td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  const ornnNet=gross(3.03)-pw(0.06);
  const deprHr=BUY/(LIFE*365*24);
  const calc=`/?gpuw=1000&amp;rate=3.03&amp;gprice=36125&amp;util=70`;
  const url='/gpu/h100/';
  const title='NVIDIA H100 rental price, specs and profit per kW';
  const desc='H100 SXM and PCIe specs from NVIDIA, rental prices from Ornn, RunPod, Lambda and Vast.ai with dates, and what one kW of H100 nets per day at $0.04 to $0.10/kWh.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>NVIDIA H100: rent price, specs and profit per kW</h1>
<p class="lead">The H100 is still the default AI rental GPU. One GPU rents for about $2.69 to $4.50 an hour on fixed-price clouds, and the Ornn index read $3.03 on October 25, 2026. Here is what that means per kilowatt.</p>
<h2>Specs</h2>
<table><thead><tr><th></th><th>H100 SXM</th><th>H100 PCIe</th></tr></thead><tbody>
<tr><td>Max TDP</td><td>Up to 700 W (configurable)</td><td>350 W</td></tr>
<tr><td>Memory</td><td>80 GB</td><td>80 GB HBM2e</td></tr>
<tr><td>Memory bandwidth</td><td>3.35 TB/s</td><td>2,000 GB/s</td></tr>
<tr><td>FP8 Tensor Core</td><td>3,958 teraFLOPS*</td><td>Not covered here</td></tr>
</tbody></table>
<p class="note">SXM: <a href="${NV}">NVIDIA H100 product page</a>, read Oct 22, 2026 (*with sparsity, per NVIDIA's footnote). PCIe: <a href="${NVPB}">NVIDIA H100 PCIe product brief PB-11133-001</a> (maximum TDP 350 W). The current NVIDIA page lists the H100 NVL (350 to 400 W) as its PCIe option.</p>
<h2>Rental prices, per GPU per hour</h2>
<table><thead><tr><th>Source</th><th>Date</th><th>H100 SXM</th><th>H100 PCIe</th></tr></thead><tbody>
${RENT.map(([n,u,d,s,p])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">These are what renters pay, not what a host nets after the platform cut. Vast is a live marketplace with only a handful of single H100 offers, so its median moves a lot. Our Vast query: rentable, on-demand, exactly one GPU. Side by side: <a href="/blog/h100-price-per-hour-across-clouds-october-26-2026/">what an H100 hour costs across 7 clouds (Oct 26)</a>. Older H200, A100 and RTX 4090 prices: <a href="/blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/">Oct 21 post</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-h100&amp;p=rent" rel="sponsored nofollow">See live H100 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2>Revenue per kW per day</h2>
<p>Our assumptions, not sourced: about 1,000 W per H100 SXM including its share of the server (so 1 kW is one GPU), rented 70% of hours, power paid for all 24 hours.</p>
${tbl}
<p class="note">Gross = rate × 24 × 70%. Net = gross minus 24 kWh of power. No platform cut, hosting, cooling markup or hardware cost. Our arithmetic on the prices above.</p>
<p>For scale: a kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<h2>Rent vs buy, short take</h2>
<p>An 8x H100 SXM server was listed at $289,000 on Oct 13, 2026 (<a href="https://gygo.com/buy/">GYGO</a>), about $36,125 per GPU. Mercatus puts typical 8x servers at $250,000 to $320,000 (<a href="https://www.mercatus-ai.com/blog/h100-server-price">Mercatus</a>). Spread over 4 years (our assumption), $36,125 is about ${$(deprHr)} per GPU-hour before power, hosting or financing.</p>
<p>So if you just need compute, renting at $2.69 to $3.03 an hour is simpler unless you keep the GPU busy most of the time for years. If you are a host with cheap power, the gap between that ~${$(deprHr)} hardware cost and a ~$3 rental rate is the business, and utilization decides whether you see it.</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 1,000 W, the Ornn $3.03 rate, $36,125 per GPU and 70% utilization. Or enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to pull live GPU occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an H100?</h3><p>About $2.69 to $4.50 per GPU-hour for one H100 SXM on fixed-price clouds we checked on October 26, 2026 (RunPod Community $2.69, Lambda 1x $4.29, Nebius $4.50). CoreWeave's 8-GPU box works out to $6.16 per GPU. The Ornn index of real trades read $3.03 on October 25, 2026.</p>
<h3 id="faq-power">How much power does an H100 use?</h3><p>NVIDIA lists the H100 SXM at up to 700 W max TDP and the H100 PCIe at 350 W. A full server draws more per GPU; we assume about 1,000 W per SXM GPU all-in.</p>
<h3 id="faq-kw">What does one kW of H100 earn per day?</h3><p>At the $3.03 Ornn rate and 70% utilization, about ${$(gross(3.03))} gross per kW per day, or about ${$(ornnNet)} after $0.06/kWh power. That is renter price, before platform cut and hardware.</p>
<h3 id="faq-buy">How much does it cost to buy an H100?</h3><p>About $31,250 to $40,000 per GPU based on 8x server listings and estimates of $250,000 to $320,000 per server, with one listing at $289,000 on October 13, 2026.</p>
<h3 id="faq-sxm">What is the difference between H100 SXM and PCIe?</h3><p>SXM is the server-board version with up to 700 W and 3.35 TB/s of memory bandwidth. PCIe is a card with a 350 W max TDP and 2,000 GB/s. PCIe rents for less: $1.99 vs $2.69 on RunPod Community.</p>
<h3 id="faq-vs-btc">Does H100 rental beat Bitcoin mining per kW?</h3><p>On gross revenue per kW, yes by a wide margin at current prices. But a GPU kW needs far more hardware money and only earns when rented, while an ASIC earns every hour it is on.</p>
<p>Related: <a href="/">mine vs AI calculator</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a> · <a href="/power-prices/">industrial power prices</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand. Nothing here is financial advice.</p>
<!--signup--></article>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":'2026-10-26',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPUs","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA H100","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  fs.writeFileSync('dist/gpu/index.html',a.page({title:'AI GPU rental prices and profit per kW | joulemath',desc:'Specs, sourced rental prices and per-kW revenue for AI GPUs.',url:'/gpu/',ld:{"@context":"https://schema.org","@type":"CollectionPage","name":"AI GPUs","url":SITE+'/gpu/'},
   body:`<div class="prose post"><p class="eyebrow">GPUs</p><h1>AI GPUs: rent price and profit per kW</h1><p class="lead">Sourced specs and rental prices, and what a kilowatt of each GPU brings in.</p><ul><li><a href="${url}">NVIDIA H100</a>: SXM and PCIe, Ornn, RunPod, Lambda and Vast.ai prices.</li><li><a href="/gpu/rtx-4090/">NVIDIA RTX 4090</a>: Vast.ai, RunPod and SaladCloud prices, used card prices, power cost and owner payback.</li></ul><p>Own a gaming card? <a href="/guides/rent-out-your-gpu/">What renting out an RTX 4090, 5090 or 3090 earns after power</a>.</p><p>Or compare against mining in the <a href="/">per-kW calculator</a>.</p></div>`}));
  build4090(a);console.log('gpu: pages 3');
}
