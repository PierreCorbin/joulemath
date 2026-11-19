// RTX 5090 page: dist/gpu/rtx-5090/index.html. Same shell and hashprice as the H100 page (gpu.mjs), same template as /gpu/rtx-4090/.
// Every figure below is copied from a linked source read on Nov 19, 2026 (data/snapshots/2026-11-19.md); host, payback and per-kW math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const $0=n=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
const NV='https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/', NVN='https://nvidianews.nvidia.com/news/nvidia-blackwell-geforce-rtx-50-series-opens-new-world-of-ai-computer-graphics';
const VAST='https://console.vast.ai/api/v0/bundles/', RP='https://www.runpod.io/pricing', SC='https://salad.com/pricing/', SER='https://salad.com/earning-rates/', SERJ='https://cdn.salad.com/site-data/earning-rates.json';
const ORNN='https://data.ornn.com/', VASTA='https://vast.ai/article/how-much-money-can-you-earn-renting-out-your-gpu-on-vast-ai';
const CLM='https://api.clore.ai/v1/marketplace', CLD='https://clore.ai/api-docs', CLF='https://docs.clore.ai/for-renters/fee-structure';
const GS='https://gpusold.com/gpu/rtx-5090-32', PW='https://www.pcprice.watch/search/RTX5090/US/GPU', GP='https://www.getpcparts.com/market-prices/gpu-graphics-cards/rtx-5090';
const EIA='https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_5_06_a', EU='https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_204/default/table', ECB='https://data.ecb.europa.eu/data/datasets/EXR/EXR.D.USD.EUR.SP00.A';
const D='Nov 19, 2026', DL='November 19, 2026', VQ='Vast.ai public API, Nov 19, 2026, 10:20 CET';
// What renters pay, USD per GPU-hour, one RTX 5090.
const RENT=[
 ['Vast.ai marketplace, all offers (low / median / high)',VAST,VQ,'$0.38 / $0.60 / $0.71','64 rentable on-demand single-GPU offers (API returns 64, the cheapest sample)'],
 ['Vast.ai marketplace, verified hosts only',VAST,VQ,'median $0.60','29 of the 64 offers'],
 ['Clore.ai marketplace, host list price (low / median)',CLM,'Clore public API, Nov 19, 2026, 10:20 CET','$0.42 / $0.67','$10.00 / $15.99 per day, 83 open single-GPU servers; Clore fees come on top'],
 ['RunPod Community Cloud',RP,'Page "Updated November 12, 2026", read Nov 19, 2026','$0.69','On-demand pod, 32 GB'],
 ['RunPod Secure Cloud',RP,'Same page','$1.39','Pod in RunPod data centers'],
 ['RunPod Serverless, 32 GB 5090 PRO tier',RP,'Same page','$1.89','Billed while a worker runs'],
 ['SaladCloud, Lowest priority',SC,'Read Nov 19, 2026','$0.250','Batch tier, can be interrupted'],
 ['SaladCloud, High priority',SC,'Read Nov 19, 2026','$0.600','Not preempted by other jobs'],
 ['Ornn OCPI index (executed trades)',ORNN,'Settled Nov 18, 2026','$0.68','Flat on the week, -1.4% on the month (Oct 19: $0.69)'],
];
// Our assumptions (same as /guides/rent-out-your-gpu/): whole PC = 575 W card + 150 W, 100 W idle on Vast and Clore.
const CARDW=575, PCW=725, IDLEW=100;
const US=0.1816, EUR=0.2832, FX=1.1188, EUP=EUR*FX; // EIA Aug 2026; Eurostat H1 2026; ECB Oct 26, 2026
const SAL=0.3648;             // Salad mean earnings per switched-on hour, RTX 5090, Nov 12 to 18, 2026 (earning-rates.json updated Nov 19, 09:11 CET)
const VMED=0.602, VCUT=1.25, VHOST=VMED/VCUT; // Vast renter median / 1.25 = rough host rate
const CLD_DAY=15.99, CLU=CLD_DAY/24*0.80, CLC=CLD_DAY/24*0.95; // Clore median list per day; host keeps 80% (USD/BTC) or 95% (CLORE)
const USED=[['$5,999',5999],['$6,423',6423]];
export function build5090(a){
  const H=720; // 30 days
  const kw=u=>(PCW*H*u+IDLEW*H*(1-u))/1000;
  const sc=[
    ['Salad, average week',SAL*H, PCW/1000*H],
    ['Vast, rented 50%',VHOST*H*0.5, kw(0.5)],
    ['Clore (paid in USD), rented 50%',CLU*H*0.5, kw(0.5)],
    ['Vast, rented 80%',VHOST*H*0.8, kw(0.8)],
  ]; // [name, gross $/mo, kWh/mo]
  const net=(s,p)=>s[1]-s[2]*p;
  const pb=(price,n)=>n>0?(price/n).toFixed(0)+' mo':'never';
  const PRICES=[[0.10,'$0.10/kWh'],[US,'US avg $0.1816'],[0.25,'$0.25/kWh'],[EUP,'EU avg $'+EUP.toFixed(4)]];
  const perHr=PRICES.map(([p,n])=>`<tr${p===US?' class="hl"':''}><td>${n}</td><td>${$(CARDW/1000*p,3)}</td><td>${$(PCW/1000*p,3)}</td><td>${$(PCW/1000*p*H)}</td></tr>`).join('\n');
  const netTbl=sc.map(s=>`<tr><td>${s[0]}</td><td>${$0(s[1])}</td><td>${Math.round(s[2])} kWh</td><td><b>${$0(net(s,US))}</b></td><td><b>${$0(net(s,EUP))}</b></td></tr>`).join('\n');
  const pbTbl=sc.map(s=>`<tr><td>${s[0]}</td>${USED.map(([l,v])=>`<td>${pb(v,net(s,US))}</td><td>${pb(v,net(s,EUP))}</td>`).join('')}</tr>`).join('\n');
  const salUS=net(sc[0],US), salEU=net(sc[0],EUP);
  const nUS=sc.map(x=>net(x,US)), pbAll=sc.flatMap(x=>[5999/net(x,US),6423/net(x,EUP)]), pbLo=Math.min(...pbAll), pbHi=Math.max(...pbAll);
  const yr=m=>(Math.round(m/12*2)/2).toString();
  const btcKw=1000/13.5*a.hp, salKw=SAL*24/(PCW/1000);
  const hrsRP=5999/0.69, hrsV=5999/VMED;
  const calc=`/?gpuw=725&amp;rate=0.602&amp;gprice=5999&amp;util=50`;
  const url='/gpu/rtx-5090/';
  const title='RTX 5090 rent price per hour and host earnings (Nov 2026)';
  const desc=`RTX 5090 rental price per hour on ${D}: Vast.ai median $0.60, RunPod $0.69 Community / $1.39 Secure, Ornn index $0.68, Clore $0.67. What a 5090 host earns, power cost and payback. Every figure sourced.`;
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a> · Last updated <time datetime="2026-11-19">${DL}</time></p><h1>RTX 5090 rent price per hour, host earnings and payback</h1>
<p class="lead"><b>Short answer:</b> on ${DL} one RTX 5090 rented for a median <b>$0.60 an hour on Vast.ai</b> (64 offers, <a href="${VAST}">Vast API</a>, 10:20 CET) and <b>$0.69 on RunPod Community</b> ($1.39 Secure, <a href="${RP}">RunPod</a>). The <a href="${ORNN}">Ornn index</a> of real trades settled at $0.68 on Nov 18. A host keeps about $0.36 to $0.63 an hour, and a used card sells for about $6,000, so buying one just to rent out takes ${yr(pbLo)} years or more to pay back.</p>
<h2 id="rent">How much does it cost to rent an RTX 5090 per hour?</h2>
<p>About $0.60 to $0.69 an hour on the big marketplaces, $1.39 in a data center. Every row below is per GPU-hour for one card, dated and linked.</p>
<table><thead><tr><th>Where</th><th>Date</th><th>Price per GPU-hour</th><th>Notes</th></tr></thead><tbody>
${RENT.map(([n,u,d,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">These are what renters pay, except Clore, which shows the host's base price before Clore fees (<a href="${CLF}">Clore fee doc</a>; daily price per <a href="${CLD}">Clore API docs</a>, divided by 24 by us). Our Vast query: rentable, not rented, on-demand, exactly one RTX 5090, ordered by price. The API returns at most 64 offers, so the median is of the cheapest sample. Vast was at $0.678 on Nov 16 and $0.61 on Nov 17, so it moves by the day. Ornn settles daily at 12:00 AM ET.</p>
<p class="hint"><a href="/go/vast?c=gpu-rtx-5090&amp;p=rent" rel="sponsored nofollow">See live RTX 5090 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2 id="specs">What specs matter when renting a 5090?</h2>
<p>32 GB of memory is the big one: it is 8 GB more than a 4090, which decides which AI models fit on one card. The other number is power: 575 W for the card alone.</p>
<table><thead><tr><th></th><th>RTX 5090</th></tr></thead><tbody>
<tr><td>Memory</td><td>32 GB GDDR7, 512-bit</td></tr>
<tr><td>Total graphics power</td><td>575 W</td></tr>
<tr><td>Required system power (PSU)</td><td>1,000 W</td></tr>
<tr><td>CUDA cores</td><td>21,760</td></tr>
<tr><td>AI TOPS</td><td>3,352</td></tr>
<tr><td>Launch price</td><td>$1,999 (on sale Jan 30, 2025)</td></tr>
</tbody></table>
<p class="note">Specs: <a href="${NV}">NVIDIA RTX 5090 page</a>, read ${D}. Launch price and date: <a href="${NVN}">NVIDIA newsroom</a>, Jan 6, 2025.</p>
<h2 id="earn">How much does an RTX 5090 earn if you rent it out?</h2>
<p>About $0.36 to $0.63 an hour, depending on the platform and how you get paid. Hosts get less than renters pay. Three real numbers (all cards side by side: <a href="/gpu/host-earnings/">what GPU hosts earn per GPU</a>):</p>
<table><thead><tr><th>Platform</th><th>Host rate per hour</th><th>When it pays</th><th>Source</th></tr></thead><tbody>
<tr><td>Salad</td><td><b>${$(SAL,4)}</b></td><td>Every switched-on hour, idle included (work 97% of the time)</td><td><a href="${SER}">Salad earning rates</a>, Nov 12 to 18, 2026</td></tr>
<tr><td>Vast.ai</td><td><b>~${$(VHOST)}</b></td><td>Only while rented</td><td>$0.602 renter median ÷ 1.25, our estimate from <a href="${VASTA}">Vast's 25% figure</a></td></tr>
<tr><td>Clore.ai</td><td><b>${$(CLU)} to ${$(CLC)}</b></td><td>Only while rented</td><td>$15.99/day median list, <a href="${CLM}">Clore API</a>, after <a href="${CLF}">fees</a> (our math)</td></tr>
</tbody></table>
<ul>
<li><b>Salad:</b> RTX 5090 machines averaged <b>${$(SAL,4)}</b> per switched-on hour for Nov 12 to 18, 2026. The middle half made $0.320 to $0.394 (data file <a href="${SERJ}">earning-rates.json</a> updated Nov 19, 2026, 09:11 CET / 08:11 UTC). That is down from $0.3769 a week earlier.</li>
<li><b>Vast.ai:</b> you set your price. Vast says live prices are "typically about 25% above what hosts earn" and that consumer GPUs like the RTX 5090 "typically earn $0.30-$0.60 per GPU-hour" (<a href="${VASTA}">Vast host earnings article</a>, May 18, 2026). Vast does not publish occupancy.</li>
<li><b>Clore.ai:</b> host keeps about 80% of list when the renter pays in USD or BTC and 95% when paid in CLORE (<a href="${CLF}">Clore fee structure</a>, our math). At 10:20 CET on ${D}, 136 of 278 RTX 5090 servers on Clore (49%) were rented. That is a snapshot, not an average.</li>
</ul>
<h2 id="power">How much power does a rented 5090 use per hour?</h2>
<p>About 0.73 kWh an hour for a whole PC at full load, which is ${$(PCW/1000*US,3)} at the US average price.</p>
<table><thead><tr><th>Power price</th><th>Card only, 575 W</th><th>Whole PC, 725 W</th><th>PC, 30 days at full load</th></tr></thead><tbody>
${perHr}
</tbody></table>
<p class="note">575 W is NVIDIA's total graphics power. 725 W for the whole PC (card plus 150 W) is our assumption. US average residential 18.16 cents/kWh, August 2026 (<a href="${EIA}">EIA Table 5.6.A</a>). EU average household €0.2832/kWh, H1 2026, 2,500 to 4,999 kWh band, all taxes (<a href="${EU}">Eurostat nrg_pc_204</a>), $${EUP.toFixed(4)} at the ECB rate of 1.1188 on Oct 26, 2026 (<a href="${ECB}">ECB</a>). $0.10 and $0.25 are round reference points.</p>
<h2 id="net">What does a 5090 host net per month after power?</h2>
<p>Roughly ${$0(Math.min(...nUS))} to ${$0(Math.max(...nUS))} a month at US power, and much less at EU power.</p>
<table><thead><tr><th>Scenario</th><th>Gross / month</th><th>Power used</th><th>Net, US power</th><th>Net, EU power</th></tr></thead><tbody>
${netTbl}
</tbody></table>
<p class="note">Method (ours): 30 days. Salad: ${$(SAL,4)} × 720 hours, PC at 725 W every hour. Vast: ${$(VHOST,3)} host rate × rented hours. Clore: ${$(CLU,3)} (80% of the $15.99/day median list) × rented hours. 725 W while rented, 100 W idle (our guess). Rented share is our assumption, not data. Before card wear, internet, payout fees and tax.</p>
<h2 id="payback">How long does a 5090 take to pay back by renting it out?</h2>
<p>About ${Math.round(5999/salUS)} months on Salad at US power for a $5,999 card, and about ${Math.round(5999/salEU)} months at EU power. Used RTX 5090 prices, all from US eBay sold data:</p>
<table><thead><tr><th>Source</th><th>Date</th><th>Price</th><th>What it measures</th></tr></thead><tbody>
<tr><td><a href="${GS}">GPU Sold</a></td><td>Updated Nov 18, 2026</td><td>$5,999</td><td>Typical sold price, 98 sales in 14 days, most $5,502 to $6,265</td></tr>
<tr><td><a href="${GP}">Get PC Parts</a></td><td>Week to Nov 14, 2026</td><td>$6,102</td><td>Average sold price (90-day average $5,080, up 26% in 30 days)</td></tr>
<tr><td><a href="${PW}">PCPrice.Watch</a></td><td>Nov 19, 2026</td><td>$6,423</td><td>90-day sold median, 176 sales (7-day median $6,656)</td></tr>
</tbody></table>
<p class="note">Used 5090s sell for about 3 times the $1,999 launch price. We use $5,999 and $6,423 below.</p>
<table><thead><tr><th rowspan="2">Scenario</th><th colspan="2">Card at $5,999</th><th colspan="2">Card at $6,423</th></tr><tr><th>US power</th><th>EU power</th><th>US power</th><th>EU power</th></tr></thead><tbody>
${pbTbl}
</tbody></table>
<p class="note">Payback months = card price ÷ net per month from the table above. Inputs and method are ours. It assumes you already have the rest of the PC, rates stay flat, and the card is worth nothing at the end. A used 5090 still resells for real money, so the true picture is better than this; a rate drop makes it worse.</p>
<p>Short version: if you already own a 5090, renting it out is extra cash on a card you paid for. At today's card prices, buying one just to rent out is a ${yr(pbLo)} to ${yr(pbHi)} year bet, longer than the <a href="/gpu/rtx-4090/">RTX 4090</a>.</p>
<h2 id="vs-4090">Is the RTX 5090 worth renting over a 4090?</h2>
<p>For memory, yes. On ${D} the 5090 cost about $0.13 more per hour on Vast ($0.60 vs $0.47 median) and $0.35 more on RunPod Community ($0.69 vs $0.34), for 32 GB instead of 24 GB.</p>
<table><thead><tr><th></th><th>RTX 5090</th><th>RTX 4090</th></tr></thead><tbody>
<tr><td>Vast.ai median (renter)</td><td>$0.602</td><td>$0.469</td></tr>
<tr><td>RunPod Community / Secure</td><td>$0.69 / $1.39</td><td>$0.34 / $0.89</td></tr>
<tr><td>Clore median list, per day</td><td>$15.99</td><td>$12.50</td></tr>
<tr><td>Clore servers rented at read time</td><td>49% of 278</td><td>46% of 178</td></tr>
<tr><td>Salad host, per switched-on hour</td><td>$0.3648</td><td>$0.2625</td></tr>
<tr><td>Used price (GPU Sold, 14 days)</td><td>$5,999</td><td>$3,050</td></tr>
<tr><td>Card power</td><td>575 W</td><td>450 W</td></tr>
</tbody></table>
<p class="note">Same reads as above, ${D}, 10:20 CET. 4090 sources and details: <a href="/gpu/rtx-4090/">RTX 4090 rent price, power and payback</a>.</p>
<p>For a host the 5090 earns about 39% more per hour on Salad, but the used card costs about twice as much, so the 4090 pays back faster.</p>
<h2 id="rent-or-buy">Should you rent a 5090 or buy one?</h2>
<p>Rent, unless you will keep it busy for more than a year. A $5,999 used card buys about ${Math.round(hrsRP).toLocaleString('en-US')} hours on RunPod Community at $0.69, or about ${Math.round(hrsV).toLocaleString('en-US')} hours at the $0.602 Vast median, before any power. That is about ${Math.round(hrsRP/730)} to ${Math.round(hrsV/730)} months of nonstop use.</p>
<h2 id="vs-btc">Does a rented 5090 beat Bitcoin mining per kW?</h2>
<p>On gross revenue, yes. A 725 W 5090 PC on Salad at ${$(SAL,4)} an hour grosses about <b>${$(salKw)}</b> per kW per day. A kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<p>But the GPU kW costs about ${$0(5999/(PCW/1000))} in used cards and only earns when someone wants it. An ASIC earns every hour it is on. More in the <a href="/guides/rent-out-your-gpu/">rent out your GPU guide</a>.</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 725 W, the $0.602 Vast median, $5,999 per card and 50% utilization. Already hosting? Enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to see live occupancy and 36-month net returns. Stored only in your browser.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2 id="faq">FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an RTX 5090 per hour?</h3><p>About $0.25 to $1.39 per hour for one card. On ${DL} the Vast.ai median was $0.60 across 64 offers ($0.38 to $0.71), RunPod Community Cloud listed $0.69 and Secure Cloud $1.39, and the Ornn index settled at $0.68 on Nov 18. SaladCloud's interruptible Lowest tier is $0.25.</p>
<h3 id="faq-earn">How much does an RTX 5090 earn hosting?</h3><p>Salad's 5090 machines averaged ${$(SAL,4)} per switched-on hour for Nov 12 to 18, 2026, about ${$0(sc[0][1])} a month. After power for a 725 W PC that is about ${$0(salUS)} at the US average price and ${$0(salEU)} at the EU average. On Vast a host keeps roughly ${$(VHOST)} an hour while rented, on Clore ${$(CLU)} to ${$(CLC)}.</p>
<h3 id="faq-power">How much power does an RTX 5090 use?</h3><p>NVIDIA lists 575 W total graphics power and a 1,000 W power supply. A whole PC at full load is about 725 W (our assumption), which costs about ${$(PCW/1000*US,3)} an hour at the US average of 18.16 cents/kWh.</p>
<h3 id="faq-price">How much is a used RTX 5090?</h3><p>About $6,000 to $6,400 on US eBay in November 2026: $5,999 typical sold price on GPU Sold (14 days to Nov 18), $6,102 on Get PC Parts (week to Nov 14) and $6,423 90-day sold median on PCPrice.Watch. It launched at $1,999 in January 2025.</p>
<h3 id="faq-payback">How long does an RTX 5090 take to pay back by renting it out?</h3><p>At Salad's average rate and US average power, a $5,999 card takes about ${Math.round(5999/salUS)} months and a $6,423 card about ${Math.round(6423/salUS)} months. At EU power it is roughly ${Math.round(5999/salEU)} to ${Math.round(6423/salEU)} months. Our math, before resale value.</p>
<h3 id="faq-vs-4090">Is an RTX 5090 or 4090 better to rent out?</h3><p>The 5090 earns more per hour ($0.3648 vs $0.2625 on Salad, Nov 12 to 18, 2026), but a used 5090 costs about twice as much ($5,999 vs $3,050 on GPU Sold), so a 4090 pays back faster if you are buying a card to rent out.</p>
<p>Related: <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/gpu/host-earnings/">what GPU hosts earn per GPU</a> · <a href="/gpu/">GPU rental prices</a> · <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/guides/rent-out-your-gpu/">rent out your GPU</a> · <a href="/">mine vs AI calculator</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on ${DL} (reads 10:20 to 10:25 CET). Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out GPUs?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-rtx-5090&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"datePublished":'2026-11-19',"dateModified":'2026-11-19',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPUs","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA RTX 5090","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  return url;
}
