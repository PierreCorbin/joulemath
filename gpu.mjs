import { build4090 } from './gpu4090.mjs';
import { buildA100 } from './gpuA100.mjs';
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
// Fresh read, Nov 3, 2026. Vast: public offers API, 10:23 CET, rentable, on-demand, exactly 1 GPU (count = offers returned, capped at 64).
const NOW=[
 ['Ornn Compute Price Index (OCPI-H100)',ORNN,'Settled Nov 2, 2026, read Nov 3','$3.38','Not indexed','1 day +11.9%, 1 month +25.2%'],
 ['RunPod Community Cloud',RP,'Page "Updated October 28, 2026", read Nov 3','$2.69','$1.99','H100 NVL $2.59'],
 ['RunPod Secure Cloud',RP,'Same page','$3.99','$2.89','H100 NVL $3.19'],
 ['Lambda on-demand, 1x GPU',LAM,'Read Nov 3, 2026, plus tax','$4.29','$3.29','8x $3.99, 4x $4.09, 2x $4.19 per GPU'],
 ['Vast.ai marketplace, 1 GPU (low / median / high)',VAST,'API query Nov 3, 2026, 10:23 CET','$2.15 / $2.40 / $3.00 (7 offers)','$2.85 / $3.09 / $3.24 (3 offers)','H100 NVL $2.34 / $3.30 / $3.82 (5 offers)'],
];
// GPU hub table, Nov 3, 2026: [gpu, vast median (offers), runpod community, runpod secure, lambda, ornn]
const HUB=[
 ['B300','Not checked','$6.94','$8.99','Not checked','Not checked'],
 ['B200','$6.25 (1 offer)','$5.98','$7.99','1x $6.99, 8x $6.69','$9.41'],
 ['H200','$3.29 (3 offers)','$3.59','$5.29','Not checked','$7.12'],
 ['GH200','Not checked','Not listed','Not listed','$2.29','Not checked'],
 ['<a href="/gpu/h100/">H100 SXM</a>','$2.40 (7 offers)','$2.69','$3.99','1x $4.29, 8x $3.99','$3.38'],
 ['H100 NVL','$3.30 (5 offers)','$2.59','$3.19','Not checked','Not checked'],
 ['H100 PCIe','$3.09 (3 offers)','$1.99','$2.89','$3.29','Not checked'],
 ['<a href="/gpu/a100/">A100 SXM</a>','$0.80 (21 offers)','$1.39','$1.79','8x 80 GB $2.79','$1.08'],
 ['<a href="/gpu/a100/">A100 PCIe</a>','$0.67 (12 offers)','$1.19','$1.79','Not checked','Not checked'],
 ['RTX PRO 6000','Not checked','$1.69','$2.49','Not checked','$1.52'],
 ['L40S','Not checked','$0.79','$1.09','Not checked','Not checked'],
 ['RTX 5090','$0.60 (64 offers)','$0.69','$1.19','Not listed','Not checked'],
 ['<a href="/gpu/rtx-4090/">RTX 4090</a>','$0.43 (64 offers)','$0.34','$0.89','Not listed','Not checked'],
 ['RTX 3090','$0.19 (64 offers)','$0.22','$0.50','Not listed','Not checked'],
];
const UTIL=0.7, W=1000; // our assumptions: 70% of hours rented, 1,000 W per H100 SXM incl. its server share
const RATES=[['Ornn index',3.38],['RunPod Community',2.69],['Vast median',2.40]];
const PRICES=[0.04,0.06,0.08,0.10];
const BUY=36125, LIFE=4;
export function buildGpu(a){
  const gross=r=>r*24*UTIL*(1000/W), pw=p=>24*p;
  const btcKw=1000/13.5*a.hp; // 1 kW of S21 XP at Bitmain's 13.5 J/TH
  const tbl=`<table><thead><tr><th>Power price</th>${RATES.map(([n,r])=>`<th>${n} $${r.toFixed(2)}/hr</th>`).join('')}</tr></thead><tbody>
<tr><td>Gross / kW / day</td>${RATES.map(([n,r])=>`<td>${$(gross(r))}</td>`).join('')}</tr>
${PRICES.map(p=>`<tr${p===0.06?' class="hl"':''}><td>Net at $${p.toFixed(2)}/kWh</td>${RATES.map(([n,r])=>`<td><b>${$(gross(r)-pw(p))}</b></td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  const ornnNet=gross(3.38)-pw(0.06);
  const deprHr=BUY/(LIFE*365*24);
  const calc=`/?gpuw=1000&amp;rate=3.38&amp;gprice=36125&amp;util=70`;
  const url='/gpu/h100/';
  const title='NVIDIA H100 rental price per hour (Nov 2026): specs and profit per kW';
  const desc='H100 rental price per hour on Nov 3, 2026: Vast.ai median $2.40, RunPod $2.69, Lambda $4.29, Ornn index $3.38. SXM vs PCIe specs from NVIDIA, and what one kW of H100 nets per day.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>NVIDIA H100 rental price per hour, specs and profit per kW</h1>
<p class="lead"><b>Short answer:</b> on November 3, 2026 one H100 SXM rented for a median <b>$2.40 an hour on Vast.ai</b>, <b>$2.69 on RunPod Community</b> and <b>$4.29 on Lambda</b> (1x). The Ornn index of real trades settled at <b>$3.38</b> on November 2, up 25.2% in a month. Here is what that means per kilowatt.</p>
<h2 id="price-now">How much does an H100 cost per hour right now?</h2>
<table><thead><tr><th>Source</th><th>Date</th><th>H100 SXM</th><th>H100 PCIe</th><th>Also</th></tr></thead><tbody>
${NOW.map(([n,u,d,s,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Renter prices per GPU-hour. Our Vast query: rentable, on-demand, exactly one GPU; 4 of the 7 SXM offers were verified hosts, with a median of $2.22. Other GPUs side by side: <a href="/gpu/">GPU rental prices</a>.</p>
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
<p class="note">These are what renters pay, not what a host nets after the platform cut. Vast is a live marketplace with only a handful of single H100 offers, so its median moves a lot. Our Vast query: rentable, on-demand, exactly one GPU. Side by side: <a href="/blog/h100-price-per-hour-across-clouds-october-26-2026/">what an H100 hour costs across 7 clouds (Oct 26)</a>. Older H200, A100 and RTX 4090 prices: <a href="/blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/">Oct 21 post</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-h100&amp;p=rent" rel="sponsored nofollow">See live H100 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2 id="per-kw">What does one kW of H100 earn per day?</h2>
<p>Our assumptions, not sourced: about 1,000 W per H100 SXM including its share of the server (so 1 kW is one GPU), rented 70% of hours, power paid for all 24 hours.</p>
${tbl}
<p class="note">Gross = rate × 24 × 70%. Net = gross minus 24 kWh of power. No platform cut, hosting, cooling markup or hardware cost. Our arithmetic on the prices above.</p>
<p>For scale: a kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<h2 id="rent-vs-buy">Should you rent or buy an H100?</h2>
<p>An 8x H100 SXM server was listed at $289,000 on Oct 13, 2026 (<a href="https://gygo.com/buy/">GYGO</a>), about $36,125 per GPU. Mercatus puts typical 8x servers at $250,000 to $320,000 (<a href="https://www.mercatus-ai.com/blog/h100-server-price">Mercatus</a>). Spread over 4 years (our assumption), $36,125 is about ${$(deprHr)} per GPU-hour before power, hosting or financing.</p>
<p>So if you just need compute, renting at $2.40 to $3.38 an hour is simpler unless you keep the GPU busy most of the time for years. If you are a host with cheap power, the gap between that ~${$(deprHr)} hardware cost and a ~$3 rental rate is the business, and utilization decides whether you see it.</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 1,000 W, the Ornn $3.38 rate, $36,125 per GPU and 70% utilization. Or enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to pull live GPU occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an H100?</h3><p>On November 3, 2026: a median $2.40 per GPU-hour for one H100 SXM on Vast.ai (7 offers, $2.15 to $3.00), $2.69 on RunPod Community, $3.99 on RunPod Secure and $4.29 on Lambda 1x. The Ornn index of real trades settled at $3.38 on November 2. On October 26 Nebius was $4.50 and CoreWeave's 8-GPU box worked out to $6.16 per GPU.</p>
<h3 id="faq-power">How much power does an H100 use?</h3><p>NVIDIA lists the H100 SXM at up to 700 W max TDP and the H100 PCIe at 350 W. A full server draws more per GPU; we assume about 1,000 W per SXM GPU all-in.</p>
<h3 id="faq-kw">What does one kW of H100 earn per day?</h3><p>At the $3.38 Ornn rate and 70% utilization, about ${$(gross(3.38))} gross per kW per day, or about ${$(ornnNet)} after $0.06/kWh power. That is renter price, before platform cut and hardware.</p>
<h3 id="faq-buy">How much does it cost to buy an H100?</h3><p>About $31,250 to $40,000 per GPU based on 8x server listings and estimates of $250,000 to $320,000 per server, with one listing at $289,000 on October 13, 2026.</p>
<h3 id="faq-sxm">What is the difference between H100 SXM and PCIe?</h3><p>SXM is the server-board version with up to 700 W and 3.35 TB/s of memory bandwidth. PCIe is a card with a 350 W max TDP and 2,000 GB/s. PCIe rents for less: $1.99 vs $2.69 on RunPod Community.</p>
<h3 id="faq-vs-btc">Does H100 rental beat Bitcoin mining per kW?</h3><p>On gross revenue per kW, yes by a wide margin at current prices. But a GPU kW needs far more hardware money and only earns when rented, while an ASIC earns every hour it is on.</p>
<p>Related: <a href="/">mine vs AI calculator</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a> · <a href="/power-prices/">industrial power prices</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 3, 2026. Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out H100s?</h2><p>Flash handles the books and payments for GPU and AI compute providers, including Vast.ai accounting.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-h100&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":'2026-11-03',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPU rental prices","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA H100","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  const hubFaq=[['faq-h100','How much does it cost to rent an H100 per hour?','On November 3, 2026 one H100 SXM rented for a median $2.40 an hour on Vast.ai (7 offers), $2.69 on RunPod Community, $3.99 on RunPod Secure and $4.29 on Lambda (1x GPU). The Ornn index of executed trades settled at $3.38 on November 2.'],
   ['faq-cheapest','What is the cheapest GPU to rent?','Of the cards in the table, the RTX 3090: a median $0.19 an hour on Vast.ai and $0.22 on RunPod Community on November 3, 2026. For data-center GPUs, an A100 SXM had a Vast.ai median of $0.80 and RunPod Community listed $1.39.'],
   ['faq-b200','How much does a B200 cost to rent?','RunPod listed the B200 at $5.98 an hour on Community Cloud and $7.99 on Secure Cloud (page dated October 28, 2026). Lambda listed $6.99 for 1x and $6.69 per GPU for 8x. The Ornn B200 index settled at $9.41 on November 2. Vast.ai had a single on-demand offer at $6.25.'],
   ['faq-why-differ','Why do GPU rental prices differ so much between providers?','Vast.ai is a marketplace where hosts set their own prices, so rates move with supply and offer quality. RunPod and Lambda post fixed on-demand prices, and RunPod Secure Cloud runs in data centers, which costs more than Community Cloud. Ornn is an index of executed trades, not a list price.'],
   ['faq-rent-out','Can I rent out my own GPU?','Yes, if it is a gaming card on Salad, or a dedicated Linux box on Vast.ai. RunPod Community Cloud is closed to new hosts. What a 4090, 5090 or 3090 keeps after power is in our guide to renting out your GPU.']];
  const hubBody=`<div class="prose post"><p class="eyebrow">GPU rental prices · Updated November 3, 2026</p><h1>GPU rental prices per hour: H100, H200, B200, A100, RTX 4090</h1>
<p class="lead"><b>Short answer:</b> on November 3, 2026 an <b>H100 SXM</b> rented for a median <b>$2.40 an hour</b> on Vast.ai and $2.69 on RunPod Community, an <b>H200</b> for $3.29 to $3.59, a <b>B200</b> for $5.98 to $6.99 and an <b>RTX 4090</b> for $0.34 to $0.43. Every price below is per GPU-hour, dated and linked.</p>
<h2 id="prices">How much does it cost to rent a GPU per hour?</h2>
<table><thead><tr><th>GPU</th><th><a href="${VAST}">Vast.ai</a> median, 1 GPU</th><th><a href="${RP}">RunPod</a> Community</th><th>RunPod Secure</th><th><a href="${LAM}">Lambda</a></th><th><a href="${ORNN}">Ornn index</a></th></tr></thead><tbody>
${HUB.map(r=>`<tr>${r.map((c,k)=>k?`<td>${c}</td>`:`<td><b>${c}</b></td>`).join('')}</tr>`).join('\n')}
</tbody></table>
<p class="note">What renters pay, USD per GPU-hour, read November 3, 2026. Vast.ai: our query of its public offers API at 10:23 CET, rentable, on-demand, exactly one GPU; offer counts stop at 64. RunPod: pricing page dated October 28, 2026. Lambda: on-demand, plus tax; it also lists an A100 40 GB at $1.99. Ornn: OCPI settlement prices for November 2, 2026. "Not checked" means we did not read that price, not that it does not exist.</p>
<h2 id="pages">Which GPUs have full pages?</h2>
<ul><li><a href="${url}">NVIDIA H100 rental price per hour</a>: SXM vs PCIe specs, Ornn, RunPod, Lambda and Vast.ai prices, and profit per kW.</li><li><a href="/gpu/a100/">NVIDIA A100 rental price per hour</a>: SXM vs PCIe specs, Ornn, RunPod, Lambda and Vast.ai prices, and profit per kW.</li><li><a href="/gpu/rtx-4090/">NVIDIA RTX 4090</a>: Vast.ai, RunPod and SaladCloud prices, used card prices, power cost and owner payback.</li></ul>
<p>Own a gaming card? <a href="/guides/rent-out-your-gpu/">What renting out an RTX 4090, 5090 or 3090 earns after power</a>. Or compare against mining in the <a href="/">per-kW calculator</a>, and see what the same kilowatts earn on the <a href="/asic/">ASIC pages</a>.</p>
<h2 id="notes">Latest GPU price notes</h2><ul><li><a href="/blog/h100-price-per-hour-across-clouds-october-26-2026/">H100 price per hour across clouds (October 26, 2026)</a></li><li><a href="/blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/">GPU rental prices: H100, H200, A100 and RTX 4090 (October 2026)</a></li><li><a href="/blog/hashprice-vs-gpu-rent-what-1-kw-earns-this-week/">Hashprice vs GPU rent: what 1 kW earns</a></li><li><a href="/blog/bitcoin-miners-pivot-to-ai-hosting-deals-and-why/">Bitcoin miners pivot to AI hosting: the deals and why</a></li></ul>
<h2 id="faq">FAQ</h2>
${hubFaq.map(([id,q,a])=>`<h3 id="${id}">${q}</h3>\n<p>${a}</p>`).join('\n')}
<p>Already hosting GPUs? Benchmark a Vast.ai machine in <a href="/fleet/">Fleet Check</a>.</p></div>
<section class="cta"><div><h2>Run GPUs for AI?</h2><p>Flash handles the books and payments for GPU and AI compute providers, including Vast.ai accounting.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-hub&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const hubLd={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","name":"GPU rental prices per hour","url":SITE+'/gpu/',"dateModified":'2026-11-03',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+'/'},{"@type":"ListItem","position":2,"name":"GPU rental prices","item":SITE+'/gpu/'}]}},
   {"@type":"FAQPage","mainEntity":hubFaq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
  fs.writeFileSync('dist/gpu/index.html',a.page({title:'GPU rental prices per hour (Nov 2026): H100, H200, B200, A100, RTX 4090 | joulemath',desc:'GPU rental prices per hour on Nov 3, 2026 from Vast.ai, RunPod, Lambda and the Ornn index: H100 $2.40 to $4.29, H200, B200, A100, RTX 5090, 4090 and 3090. Every price dated and linked.',url:'/gpu/',ld:hubLd,body:hubBody}));
  build4090(a);buildA100(a);console.log('gpu: pages 4');
}
