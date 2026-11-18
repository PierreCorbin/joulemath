// NVIDIA A100 page: dist/gpu/a100/index.html. Same shell and hashprice as the H100 page (gpu.mjs).
// Every figure below is copied from a linked source on the date given; per-kW math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const NV='https://www.nvidia.com/en-us/data-center/a100/';
const ORNN='https://data.ornn.com/', RP='https://www.runpod.io/pricing', LAM='https://lambda.ai/pricing', VAST='https://console.vast.ai/api/v0/bundles/';
// Fresh read, Nov 18, 2026 (data/snapshots/2026-11-18.md). Vast: public offers API, 11:08 CET, rentable, on-demand, exactly 1 GPU.
const NOW=[
 ['Ornn Compute Price Index (OCPI-A100)',ORNN,'Settled Nov 17, 2026, read Nov 18','$1.00','Not indexed','1 day +1.0%, 1 week -4.8%, 1 month +4.2%'],
 ['RunPod Community Cloud',RP,'Page "Updated November 12, 2026", read Nov 18','$1.39','$1.19','Secure Cloud $2.19 / $2.09'],
 ['RunPod Secure Cloud',RP,'Same page','$2.19','$2.09','Clusters A100 SXM $2.15'],
 ['Lambda on-demand (published list)',LAM,'Read Nov 18, 2026, plus tax; list in effect since Nov 16, 2026','8x 80 GB $3.19','1x 40 GB $1.99','1x A100 SXM 40 GB $1.99'],
 ['Vast.ai marketplace, 1 GPU (low / median / high)',VAST,'API query Nov 18, 2026, 11:08 CET','$0.41 / $0.80 / $1.62 (25 offers)','$0.39 / $0.74 / $1.39 (14 offers)','Verified SXM median $0.80 (15 of 25)'],
];
// Our assumptions for per-kW: 70% of hours rented; ~550 W all-in per A100 SXM (NVIDIA 400 W TDP + ~150 W server share, our add).
const UTIL=0.7, W=550;
const RATES=[['Ornn index',1.00],['RunPod Community',1.39],['Vast median',0.80]];
const PRICES=[0.04,0.06,0.08,0.10];
export function buildA100(a){
  const gross=r=>r*24*UTIL*(1000/W), pw=p=>24*p;
  const btcKw=1000/13.5*a.hp; // 1 kW of S21 XP at Bitmain's 13.5 J/TH
  const tbl=`<table><thead><tr><th>Power price</th>${RATES.map(([n,r])=>`<th>${n} $${r.toFixed(2)}/hr</th>`).join('')}</tr></thead><tbody>
<tr><td>Gross / kW / day</td>${RATES.map(([n,r])=>`<td>${$(gross(r))}</td>`).join('')}</tr>
${PRICES.map(p=>`<tr${p===0.06?' class="hl"':''}><td>Net at $${p.toFixed(2)}/kWh</td>${RATES.map(([n,r])=>`<td><b>${$(gross(r)-pw(p))}</b></td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  const ornnNet=gross(1.00)-pw(0.06);
  const calc=`/?gpuw=550&amp;rate=1.00&amp;util=70`;
  const url='/gpu/a100/';
  const title='NVIDIA A100 rental price per hour (Nov 2026): specs and profit per kW';
  const desc='A100 rental price per hour on Nov 18, 2026: Vast.ai median $0.80 SXM / $0.74 PCIe, RunPod Community $1.39 / $1.19, Ornn index $1.00. Specs and profit per kW.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a> · Last updated <time datetime="2026-11-18">November 18, 2026</time></p><h1>NVIDIA A100 rental price per hour, specs and profit per kW</h1>
<p class="lead"><b>Short answer:</b> on November 18, 2026 one A100 SXM rented for a median <b>$0.80 an hour on Vast.ai</b> (25 offers) and <b>$1.39 on RunPod Community</b>; an A100 PCIe for $0.74 (14 offers) and $1.19. The <a href="${ORNN}">Ornn index</a> of real trades settled at <b>$1.00</b> on November 17, down 4.8% in a week. Here is what that means per kilowatt.</p>
<h2 id="price-now">How much does an A100 cost per hour right now?</h2>
<table><thead><tr><th>Source</th><th>Date</th><th>A100 SXM</th><th>A100 PCIe</th><th>Also</th></tr></thead><tbody>
${NOW.map(([n,u,d,s,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${s}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Renter prices per GPU-hour. Our Vast query: rentable, on-demand, exactly one GPU; 15 of the 25 SXM offers were verified hosts, with a median of $0.80. Offers mix 40 GB and 80 GB cards. RunPod Secure Cloud went from $1.79 to $2.19 (SXM) and $2.09 (PCIe) on its page dated November 12; Community did not move. Lambda's 8x A100 80 GB list now shows $3.19 per GPU, up from $2.79 on our November 5 read. Other GPUs side by side: <a href="/gpu/">GPU rental prices</a>. Newer H100 numbers: <a href="/gpu/h100/">H100 rent price</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-a100&amp;p=rent" rel="sponsored nofollow">See live A100 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2 id="specs">What are the A100 SXM and PCIe specs?</h2>
<table><thead><tr><th></th><th>A100 80GB SXM</th><th>A100 80GB PCIe</th></tr></thead><tbody>
<tr><td>Max TDP</td><td>400 W (up to 500 W on CTS SKU)</td><td>300 W</td></tr>
<tr><td>Memory</td><td>80 GB HBM2e</td><td>80 GB HBM2e</td></tr>
<tr><td>Memory bandwidth</td><td>2,039 GB/s</td><td>1,935 GB/s</td></tr>
<tr><td>FP16 Tensor Core</td><td>312 TFLOPS (624 with sparsity*)</td><td>Same peak*</td></tr>
<tr><td>MIG</td><td>Up to 7 instances @ 10 GB</td><td>Up to 7 instances @ 10 GB</td></tr>
</tbody></table>
<p class="note">Source: <a href="${NV}">NVIDIA A100 product page</a>, read November 5, 2026 (*with sparsity, per NVIDIA's footnote). 40 GB variants also exist and show up in marketplace offers; NVIDIA's table above is the 80 GB SKU. The SXM board is the HGX server version; PCIe is the dual-slot card.</p>
<h2 id="per-kw">What does one kW of A100 earn per day?</h2>
<p>Our assumptions, not sourced: about 550 W per A100 SXM all-in (NVIDIA's 400 W TDP plus about 150 W of server share, our add), so one kilowatt is roughly 1.8 GPUs. Rented 70% of hours, power paid for all 24 hours.</p>
${tbl}
<p class="note">Gross = rate × 24 × 70% × (1,000 W / 550 W). Net = gross minus 24 kWh of power. No platform cut, hosting, cooling markup or hardware cost. Our arithmetic on the prices above.</p>
<p>For scale: a kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<h2 id="vs-h100">How does A100 rent compare to H100?</h2>
<p>An A100 SXM is cheaper per hour than an H100 SXM: RunPod Community $1.39 vs $2.69, Ornn $1.00 vs $2.92, Vast median $0.80 vs $1.80 (only 3 H100 offers). H100 figures from our <a href="/gpu/h100/">H100 page</a>, same Nov 18 read. Per kilowatt the gap shrinks a bit because the A100 draws less (400 W TDP vs up to 700 W), but H100 still clears more revenue per kW at current rents. For consumer cards see the <a href="/gpu/rtx-4090/">RTX 4090 page</a>.</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 550 W, the Ornn $1.00 rate and 70% utilization. Or enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to pull live GPU occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an A100?</h3><p>On November 18, 2026: a median $0.80 per GPU-hour for one A100 SXM on Vast.ai (25 offers, $0.41 to $1.62) and $0.74 for A100 PCIe (14 offers). RunPod Community listed $1.39 SXM and $1.19 PCIe; Secure Cloud $2.19 and $2.09. The Ornn index of real trades settled at $1.00 on November 17. Lambda's published list shows 8x A100 80 GB at $3.19 per GPU and 1x 40 GB at $1.99, in effect since November 16, 2026.</p>
<h3 id="faq-power">How much power does an A100 use?</h3><p>NVIDIA lists the A100 80GB SXM at 400 W max TDP (up to 500 W on a custom thermal solution SKU) and the A100 80GB PCIe at 300 W. A full server draws more per GPU; we assume about 550 W per SXM GPU all-in.</p>
<h3 id="faq-kw">What does one kW of A100 earn per day?</h3><p>At the $1.00 Ornn rate (settled November 17, 2026), 550 W all-in and 70% utilization, about ${$(gross(1.00))} gross per kW per day, or about ${$(ornnNet)} after $0.06/kWh power. That is renter price, before platform cut and hardware.</p>
<h3 id="faq-sxm">What is the difference between A100 SXM and PCIe?</h3><p>SXM is the HGX server-board version with 400 W TDP and 2,039 GB/s of memory bandwidth on the 80 GB SKU. PCIe is a dual-slot card at 300 W and 1,935 GB/s. PCIe usually rents for less on marketplaces and on RunPod Community ($1.19 vs $1.39).</p>
<h3 id="faq-memory">Does the A100 come in 40 GB and 80 GB?</h3><p>Yes. NVIDIA ships both; the 80 GB SKU has HBM2e at over 2 TB/s on SXM. Vast.ai single-GPU offers on November 18 still mixed 40 GB and 80 GB cards. Check the listing before you rent.</p>
<h3 id="faq-vs-btc">Does A100 rental beat Bitcoin mining per kW?</h3><p>On gross revenue per kW, yes at current prices. But a GPU kW needs far more hardware money and only earns when rented, while an ASIC earns every hour it is on.</p>
<p>Related: <a href="/">mine vs AI calculator</a> · <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/fleet/">Fleet Check</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a> · <a href="/power-prices/">industrial power prices</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 18, 2026. Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out A100s?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-a100&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"datePublished":'2026-11-05',"dateModified":'2026-11-18',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPU rental prices","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA A100","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  return url;
}
