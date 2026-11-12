// Rent vs buy an H100: dist/gpu/rent-vs-buy-h100/index.html. Same shell as the other GPU pages (gpu.mjs).
// Every price below is copied from a linked source on the date given; break-even and payback math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=x=>Math.round(x*100)+'%';
const ORNN='https://data.ornn.com/', RP='https://www.runpod.io/pricing', LAM='https://lambda.ai/pricing', VAST='https://console.vast.ai/api/v0/bundles/';
const GYGO='https://gygo.com/buy/', MERC='https://www.mercatus-ai.com/blog/h100-server-price', GATE='https://gatewellusa.com/ai-compute/p/nvidia-hgx-h100-8gpu';
const CBRE='https://www.cbre.com/insights/books/north-america-data-center-trends', VASTCUT='https://vast.ai/article/how-much-money-can-you-earn-renting-out-your-gpu-on-vast-ai';
// Rent side, fresh reads Thu Nov 12, 2026 (Vast API 10:14 CET; Ornn free-tier index settled Nov 11; RunPod page "Updated November 9, 2026"; Lambda list effective Nov 16).
const RENT=[
 ['Vast.ai median, 1x H100 SXM',VAST,'API query Nov 12, 10:14 CET (6 offers, $2.20 to $2.67)',2.34],
 ['RunPod Community Cloud, H100 SXM',RP,'Page "Updated November 9, 2026"',2.69],
 ['Ornn index (OCPI H100 SXM)',ORNN,'Settled Nov 11, 2026',3.25],
 ['RunPod Secure Cloud, H100 SXM',RP,'Same page',3.99],
 ['Lambda 8x H100 SXM, per GPU',LAM,'List effective Nov 16, 2026',4.59],
 ['Lambda 1x H100 SXM',LAM,'Same list',4.89],
];
// Own side. BUY: one eighth of an 8x H100 SXM server listed at $289,000 (GYGO, Oct 13, 2026).
// Our assumptions, labeled on the page: 4-year straight-line life, no resale; 1,000 W per GPU all-in; power $0.06/kWh; colo at CBRE's $196.25/kW-month (power excluded).
const BUY=289000/8, LIFE=4, KW=1, PWR=0.06, COLO=196.25;
const HRS=LIFE*365*24;
const deprHr=BUY/HRS, pwrHr=KW*PWR, coloHr=COLO*12/(365*24)*KW, ownHr=deprHr+pwrHr+coloHr;
// Host side: buy, then rent it out 70% of hours. Vast hosts get renter price / 1.25 (Vast article). Ornn row has no cut applied (it is a trade price).
const UTIL=0.7;
const hostDay=(r,cut)=>r/cut*24*UTIL - 24*KW*PWR - COLO*12/365*KW;
export function buildRentBuy(a){
  const be=r=>ownHr/r;
  const url='/gpu/rent-vs-buy-h100/';
  const title='Rent vs buy an H100 (Nov 2026): break-even utilization and payback';
  const vast=RENT[0][3], rpc=RENT[1][3], ornn=RENT[2][3], lam8=RENT[4][3];
  const desc=`Should you rent or buy an NVIDIA H100? Owning costs about ${$(ownHr)} per GPU-hour at full use (Nov 12, 2026 math). Buying beats renting only above ${pct(be(rpc))} busy at RunPod's $2.69 or ${pct(be(vast))} at Vast's $2.34.`;
  const rentTbl=`<table><thead><tr><th>Rent option</th><th>Date</th><th>$/GPU-hr</th><th>Per year, 24/7 (our math)</th><th>Buy wins above (our math)</th></tr></thead><tbody>
${RENT.map(([n,u,d,r])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${$(r)}</td><td>${$(r*8760,0)}</td><td><b>${be(r)>1?'never':pct(be(r))}</b> busy</td></tr>`).join('\n')}
</tbody></table>`;
  const ownTbl=`<table><thead><tr><th>Cost of owning one H100</th><th>Per GPU-hour</th><th>Per year</th><th>Basis</th></tr></thead><tbody>
<tr><td>Hardware</td><td>${$(deprHr)}</td><td>${$(deprHr*8760,0)}</td><td>$36,125 (1/8 of a <a href="${GYGO}">$289,000 8x H100 SXM server</a>, listed Oct 13, 2026) over 4 years, no resale</td></tr>
<tr><td>Colocation</td><td>${$(coloHr)}</td><td>${$(coloHr*8760,0)}</td><td>1 kW at <a href="${CBRE}">CBRE's</a> $196.25/kW-month North America wholesale asking rate, power excluded</td></tr>
<tr><td>Power</td><td>${$(pwrHr)}</td><td>${$(pwrHr*8760,0)}</td><td>1 kW all-in at $0.06/kWh (our assumption)</td></tr>
<tr class="hl"><td><b>Total, running 24/7</b></td><td><b>${$(ownHr)}</b></td><td><b>${$(ownHr*8760,0)}</b></td><td>Before financing, networking, staff and downtime</td></tr>
</tbody></table>`;
  const utils=[0.25,0.5,0.75,1];
  const useTbl=`<table><thead><tr><th>How busy you keep it</th><th>Owning, per used hour (our math)</th><th>vs Vast ${$(vast)}</th><th>vs RunPod ${$(rpc)}</th><th>vs Lambda 8x ${$(lam8)}</th></tr></thead><tbody>
${utils.map(u=>{const c=ownHr/u;const w=r=>c<r?'buy':'rent';return `<tr${u===0.5?' class="hl"':''}><td>${pct(u)} of hours</td><td>${$(c)}</td><td>${w(vast)}</td><td>${w(rpc)}</td><td>${w(lam8)}</td></tr>`;}).join('\n')}
</tbody></table>`;
  const H=[['Vast.ai median, host keeps renter price / 1.25',vast,1.25],['RunPod Community rate, same 1.25 haircut',rpc,1.25],['Ornn trade index, no haircut',ornn,1]];
  const hostTbl=`<table><thead><tr><th>If you buy and rent it out at</th><th>Renter $/hr</th><th>Net per day (our math)</th><th>Payback on $36,125</th></tr></thead><tbody>
${H.map(([n,r,c])=>{const d=hostDay(r,c);return `<tr><td>${n}</td><td>${$(r)}</td><td>${$(d)}</td><td><b>${d>0?(BUY/d/30.44).toFixed(0)+' months':'never'}</b></td></tr>`;}).join('\n')}
</tbody></table>`;
  const vastPay=BUY/hostDay(vast,1.25)/30.44, ornnPay=BUY/hostDay(ornn,1)/30.44;
  const calc=`/?gpuw=1000&amp;rate=2.34&amp;gprice=36125&amp;util=70`;
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>Rent vs buy an H100: when does owning pay off?</h1>
<p class="lead"><b>Short answer:</b> owning one H100 costs about <b>${$(ownHr)} per GPU-hour</b> if it runs 24/7 for 4 years ($36,125 card share of a <a href="${GYGO}">$289,000 8x server</a>, plus colo and power; our math, Nov 12, 2026). Renting costs <b>$2.34 an hour</b> (Vast.ai median, Nov 12) to <b>$4.89</b> (Lambda list from Nov 16). So buying only wins if you keep it busy more than about <b>${pct(be(rpc))} of all hours</b> against RunPod's $2.69, or ${pct(be(vast))} against Vast. Below that, rent.</p>
<p class="note">Last updated November 12, 2026. Prices are dated and linked; the break-even math is ours.</p>
<h2 id="short">Is it cheaper to rent or buy an H100?</h2>
<p>For most teams, renting is cheaper. At the November 12, 2026 rates below, an owned H100 has to be busy ${pct(be(lam8))} to ${pct(be(vast))} of every hour, every day, for four years before it beats renting, depending on which rental price you compare against. If your jobs come in bursts, that bar is hard to clear.</p>
${rentTbl}
<p class="note">Renter prices per GPU-hour. Vast.ai: our query of its public offers API, rentable, not rented, on-demand, exactly one H100 SXM; thin sample of 6 offers. Ornn: free-tier OCPI settlement, a volume-weighted average of transacted rentals. Lambda: plus tax; until November 16 its page says to log in for current pricing, and its 8x H100 list was $3.99 per GPU-hour when we read it on November 9. "Buy wins above" = owning cost ${$(ownHr)} ÷ rent rate (our math).</p>
<h2 id="own-cost">How much does it cost to own an H100 per hour?</h2>
<p>About ${$(ownHr)} per GPU-hour if it runs around the clock, and most of that is the card itself. The hardware share is ${$(deprHr)} an hour over 4 years; colo and power add ${$(coloHr+pwrHr)}.</p>
${ownTbl}
<p class="note">Server prices vary: Mercatus puts typical 8x H100 servers at $250,000 to $320,000 (<a href="${MERC}">Mercatus</a>) and Gatewell posted $295,000 to $320,000 on October 18, 2026 (<a href="${GATE}">Gatewell</a>), so $31,250 to $40,000 per GPU. The 4-year life matches the GPU depreciation we use on the <a href="/methodology/">methodology page</a>. Colo for a single box is often pricier than CBRE's wholesale average, and AI-ready dense space carries a premium CBRE does not quantify.</p>
<h2 id="utilization">How busy does an H100 need to be before buying wins?</h2>
<p>Roughly half the time against self-serve clouds. Your cost per useful hour is the owning cost divided by how busy you keep it, because the card, the rack and most of the power bill keep costing you while it sits idle.</p>
${useTbl}
<p class="note">Owning per used hour = ${$(ownHr)} ÷ share of hours busy. We charge full power and colo even when idle, which slightly overstates the idle cost (an idle GPU draws less). Our arithmetic.</p>
<h2 id="host">What if you buy an H100 to rent it out?</h2>
<p>Then the price you can rent it at decides everything. At today's Vast.ai median the payback runs about ${vastPay.toFixed(0)} months, longer than the 4-year life we assume. At the Ornn trade index it is about ${ornnPay.toFixed(0)} months. Both assume 70% of hours rented.</p>
${hostTbl}
<p class="note">Net per day = renter rate ÷ haircut × 24 × 70% minus 24 kWh at $0.06 minus colo at $196.25/kW-month. Vast says what renters pay is "typically about 25% above what hosts earn" (<a href="${VASTCUT}">Vast.ai</a>), so we divide by 1.25; we apply the same haircut to RunPod as a stand-in, since we have no published host share for it. The Ornn row has no haircut and assumes you sell capacity at the index. No financing, no resale, no tax. Our math.</p>
<p>That gap between ${vastPay.toFixed(0)} and ${ornnPay.toFixed(0)} months is why hosts chase longer contracts at index-like prices instead of single-card marketplace rates. Our read, not sourced.</p>
<h2 id="when-buy">When does buying an H100 make sense?</h2>
<ul><li>You will run it hard: training or steady inference that keeps it busy well over half the time for years.</li><li>You have cheap power and space already, so colo is not $196 a kW-month.</li><li>You need the box on site for data rules, or you want to resell idle hours on a marketplace.</li></ul>
<p>Rent when your load is bursty, when you might want H200 or B200 next year, or when you do not want $36,000 per card tied up in hardware that a newer chip can undercut. More prices: <a href="/gpu/h100/">H100 rental price per hour</a>, <a href="/gpu/h200/">H200 rental price</a>, <a href="/gpu/">all GPU rental prices</a>.</p>
<div class="callout"><b>Run your own numbers.</b> The calculator is preloaded with 1,000 W, the $2.34 Vast median, $36,125 per GPU and 70% utilization. Already hosting? Enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to see live occupancy and 36-month net returns.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark a Vast.ai machine <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-cheaper">Is it cheaper to rent or buy an H100 in 2026?</h3><p>Usually cheaper to rent. On November 12, 2026 owning works out to about ${$(ownHr)} per GPU-hour at full use over 4 years, against $2.34 (Vast.ai median) to $4.89 (Lambda) to rent. Buying wins only if the GPU is busy more than about ${pct(be(lam8))} (Lambda) to ${pct(be(vast))} (Vast.ai) of all hours.</p>
<h3 id="faq-buy">How much does it cost to buy an H100?</h3><p>About $36,125 per GPU, one eighth of an 8x H100 SXM server listed at $289,000 on October 13, 2026. Other quotes put 8x servers at $250,000 to $320,000, or $31,250 to $40,000 per GPU.</p>
<h3 id="faq-own-hr">What does it cost per hour to own an H100?</h3><p>About ${$(ownHr)} per GPU-hour running 24/7: ${$(deprHr)} for the hardware over 4 years, ${$(coloHr)} for colocation at $196.25 per kW-month and ${$(pwrHr)} for 1 kW of power at $0.06/kWh. Financing, networking and staff are extra.</p>
<h3 id="faq-breakeven">What utilization do you need to justify buying an H100?</h3><p>About ${pct(be(rpc))} of all hours against RunPod Community's $2.69, ${pct(be(vast))} against the $2.34 Vast.ai median and ${pct(be(lam8))} against Lambda's $4.59 8x list price.</p>
<h3 id="faq-payback">How long does an H100 take to pay back if you rent it out?</h3><p>At 70% rented: about ${vastPay.toFixed(0)} months at the November 12 Vast.ai median after Vast's cut, colo and power, or about ${ornnPay.toFixed(0)} months if you sell at the $3.25 Ornn trade index.</p>
<h3 id="faq-rent-year">How much does it cost to rent an H100 for a year?</h3><p>Running 24/7 for a year: about ${$(vast*8760,0)} at the $2.34 Vast.ai median, ${$(rpc*8760,0)} at RunPod Community's $2.69 and ${$(lam8*8760,0)} at Lambda's $4.59 8x rate.</p>
<p>Related: <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/gpu/h200/">H200 rent price</a> · <a href="/gpu/a100/">A100 rent price</a> · <a href="/guides/rent-out-your-gpu/">rent out your own GPU</a> · <a href="/">mine vs AI calculator</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 12, 2026. Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Bought GPUs and renting them out?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-rent-vs-buy&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"Article","headline":'Rent vs buy an H100: when does owning pay off?',"description":desc,"url":SITE+url,"datePublished":'2026-11-12',"dateModified":'2026-11-12',"author":{"@type":"Organization","name":"joulemath"},"publisher":{"@type":"Organization","name":"joulemath","url":SITE},"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPU rental prices","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"Rent vs buy an H100","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  return url;
}
