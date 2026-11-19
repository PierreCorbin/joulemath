// RTX 4090 page: dist/gpu/rtx-4090/index.html. Same shell and hashprice as the H100 page (gpu.mjs).
// Every figure below is copied from a linked source on the date given; payback and per-kW math is ours and labeled as such.
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const $0=n=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
const NV='https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/', NVN='https://nvidianews.nvidia.com/news/nvidia-delivers-quantum-leap-in-performance-introduces-new-era-of-neural-rendering-with-geforce-rtx-40-series';
const VAST='https://console.vast.ai/api/v0/bundles/', RP='https://www.runpod.io/pricing', SC='https://salad.com/pricing/', SER='https://salad.com/earning-rates/', SERJ='https://cdn.salad.com/site-data/earning-rates.json';
const VASTA='https://vast.ai/article/how-much-money-can-you-earn-renting-out-your-gpu-on-vast-ai';
const GS='https://gpusold.com/gpu/rtx-4090-24', PW='https://www.pcprice.watch/search/RTX4090/US/GPU', GP='https://www.getpcparts.com/market-prices/gpu-graphics-cards/rtx-4090';
const CLM='https://api.clore.ai/v1/marketplace', CLF='https://docs.clore.ai/for-renters/fee-structure';
const EIA='https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_5_06_a', EU='https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_204/default/table', ECB='https://data.ecb.europa.eu/data/datasets/EXR/EXR.D.USD.EUR.SP00.A';
const VQ='Vast.ai public API, Nov 19, 2026, 10:20 CET';
// What renters pay, USD per GPU-hour, one RTX 4090.
const RENT=[
 ['Vast.ai marketplace, all offers (low / median / high)',VAST,VQ,'$0.32 / $0.47 / $0.61','64 rentable on-demand single-GPU offers (API returns 64, the cheapest sample)'],
 ['Vast.ai marketplace, verified hosts only',VAST,VQ,'median $0.48','36 of the 64 offers'],
 ['Clore.ai marketplace, host list price (low / median)',CLM,'Clore public API, Nov 19, 2026, 10:20 CET','$0.33 / $0.52','$8.00 / $12.50 per day, 69 open single-GPU servers; Clore fees come on top'],
 ['RunPod Community Cloud',RP,'Page "Updated November 12, 2026", read Nov 19, 2026','$0.34','On-demand pod, 24 GB'],
 ['RunPod Secure Cloud',RP,'Same page','$0.89','Pod in RunPod data centers'],
 ['RunPod Serverless, 24 GB 4090 PRO tier',RP,'Same page','$1.34','Billed while a worker runs'],
 ['SaladCloud, Lowest priority',SC,'Read Nov 19, 2026','$0.160','Batch tier, can be interrupted'],
 ['SaladCloud, High priority',SC,'Read Nov 19, 2026','$0.440','Not preempted by other jobs'],
];
// Our assumptions (same as /guides/rent-out-your-gpu/): whole PC = 450 W card + 150 W, 100 W idle on Vast.
const CARDW=450, PCW=600, IDLEW=100;
const US=0.1816, EUR=0.2832, FX=1.1188, EUP=EUR*FX; // EIA Aug 2026; Eurostat H1 2026; ECB Oct 26, 2026
const SAL=0.2625;            // Salad avg earnings per switched-on hour, RTX 4090, Nov 12 to 18, 2026 (earning-rates.json updated Nov 19, 09:11 CET)
const VMED=0.469, VCUT=1.25, VHOST=VMED/VCUT; // Vast renter median / 1.25 = rough host rate
const USED=[['$2,365',2365,'Get PC Parts average sold, week to Nov 14'],['$3,192',3192,'PCPrice.Watch 90-day sold median']];
const CL=[12.50/24*0.80, 12.50/24*0.95]; // Clore 4090 median list $12.50/day, host keeps 80% (paid USD/BTC) or 95% (paid CLORE)
export function build4090(a){
  const H=720; // 30 days
  const sc=[
    ['Salad, average week',SAL*H, PCW/1000*H],
    ['Vast, rented 50%',VHOST*H*0.5, (PCW*H*0.5+IDLEW*H*0.5)/1000],
    ['Vast, rented 80%',VHOST*H*0.8, (PCW*H*0.8+IDLEW*H*0.2)/1000],
  ]; // [name, gross $/mo, kWh/mo]
  const net=(s,p)=>s[1]-s[2]*p;
  const pb=(price,n)=>n>0?(price/n).toFixed(0)+' mo':'never';
  const PRICES=[[0.10,'$0.10/kWh'],[US,'US avg $0.1816'],[0.25,'$0.25/kWh'],[EUP,'EU avg $'+EUP.toFixed(4)]];
  const perHr=PRICES.map(([p,n])=>`<tr${p===US?' class="hl"':''}><td>${n}</td><td>${$(CARDW/1000*p,3)}</td><td>${$(PCW/1000*p,3)}</td><td>${$(PCW/1000*p*H)}</td></tr>`).join('\n');
  const netTbl=sc.map(s=>`<tr><td>${s[0]}</td><td>${$0(s[1])}</td><td>${Math.round(s[2])} kWh</td><td><b>${$0(net(s,US))}</b></td><td><b>${$0(net(s,EUP))}</b></td></tr>`).join('\n');
  const pbTbl=sc.map(s=>`<tr><td>${s[0]}</td>${USED.map(([l,v])=>`<td>${pb(v,net(s,US))}</td><td>${pb(v,net(s,EUP))}</td>`).join('')}</tr>`).join('\n');
  const salUS=net(sc[0],US), salEU=net(sc[0],EUP);
  const btcKw=1000/13.5*a.hp, salKw=SAL*24/(PCW/1000);
  const hrsRP=3192/0.34, hrsV=3192/VMED;
  const calc=`/?gpuw=600&amp;rate=0.469&amp;gprice=3192&amp;util=50`;
  const url='/gpu/rtx-4090/';
  const title='RTX 4090 rent price per hour, power and payback (Nov 2026)';
  const desc='RTX 4090 rent price per hour on Nov 19, 2026: Vast.ai median $0.47, RunPod Community $0.34, Clore $0.52, SaladCloud $0.16 to $0.44. Host earnings, used card prices, power and payback. Every figure sourced.';
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a> · Last updated <time datetime="2026-11-19">November 19, 2026</time></p><h1>RTX 4090 rent price per hour, power cost and payback</h1>
<p class="lead"><b>Short answer:</b> on November 19, 2026 one RTX 4090 rented for a median <b>$0.47 an hour on Vast.ai</b> (64 offers, <a href="${VAST}">Vast API</a>, 10:20 CET) and <b>$0.34 on RunPod Community</b> (<a href="${RP}">RunPod</a>). Clore hosts listed a median $12.50 a day ($0.52 an hour). Renting yours out on Salad keeps roughly ${$0(salUS)} a month at US power and ${$0(salEU)} at EU power. A used card sells for about $2,400 to $3,200, so buying one just to rent it out takes years to pay back. Need more memory? See the <a href="/gpu/rtx-5090/">RTX 5090 rent price</a>.</p>
<h2>Specs that matter for the money</h2>
<table><thead><tr><th></th><th>RTX 4090</th></tr></thead><tbody>
<tr><td>Total graphics power</td><td>450 W</td></tr>
<tr><td>Required system power (PSU)</td><td>850 W</td></tr>
<tr><td>Idle power</td><td>19 W</td></tr>
<tr><td>Average gaming power</td><td>315 W</td></tr>
<tr><td>Memory</td><td>24 GB GDDR6X, 384-bit</td></tr>
<tr><td>CUDA cores</td><td>16,384</td></tr>
<tr><td>AI TOPS</td><td>1,321</td></tr>
<tr><td>Launch price</td><td>$1,599 (Oct 12, 2022)</td></tr>
</tbody></table>
<p class="note">Specs: <a href="${NV}">NVIDIA RTX 4090 page</a>, read Oct 29, 2026 (idle and gaming power are NVIDIA's footnoted test figures). Launch price: <a href="${NVN}">NVIDIA newsroom</a> RTX 40 Series announcement. 24 GB is the number renters care about: it decides which AI models fit on one card.</p>
<h2>What renting one costs, per hour</h2>
<table><thead><tr><th>Where</th><th>Date</th><th>Price per GPU-hour</th><th>Notes</th></tr></thead><tbody>
${RENT.map(([n,u,d,p,x])=>`<tr><td><a href="${u}">${n}</a></td><td>${d}</td><td>${p}</td><td>${x}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">These are what renters pay, except Clore, which shows the host's base price before Clore fees (<a href="${CLF}">Clore fee doc</a>). Our Vast query: rentable, not rented, on-demand, exactly one RTX 4090, ordered by price. The API returns at most 64 offers, so the median is of the cheapest sample. Vast is a live market, so these move by the hour. Earlier snapshots: <a href="/blog/gpu-rental-prices-h100-h200-a100-rtx-4090-october-2026/">Oct 21 GPU rental prices</a>.</p>
<p class="hint"><a href="/go/vast?c=gpu-rtx-4090&amp;p=rent" rel="sponsored nofollow">See live RTX 4090 offers on Vast.ai</a> (affiliate link, we may earn a referral fee).</p>
<h2>What it earns if you rent yours out</h2>
<p>Hosts get less than renters pay. Three real numbers (all cards side by side: <a href="/gpu/host-earnings/">what GPU hosts earn per GPU</a>):</p>
<ul>
<li><b>Salad:</b> RTX 4090 machines averaged <b>$0.2625</b> per switched-on hour for Nov 12 to 18, 2026, idle time included. The middle half of machines made $0.234 to $0.286. A job was running 97% of the time (<a href="${SER}">Salad earning rates</a>, data file <a href="${SERJ}">earning-rates.json</a> updated Nov 19, 2026, 09:11 CET / 08:11 UTC).</li>
<li><b>Clore.ai:</b> the median open single-4090 server listed at <b>$12.50 a day</b> on Nov 19, 2026, 10:20 CET (<a href="${CLM}">Clore API</a>). After <a href="${CLF}">Clore fees</a> the host keeps about <b>${$(CL[0])} to ${$(CL[1])}</b> an hour while rented (80% if the renter pays in USD or BTC, 95% in CLORE, our math). 82 of 178 RTX 4090 servers (46%) were rented at that moment.</li>
<li><b>Vast.ai:</b> you set your price. Vast says renter prices are "typically about 25% above what hosts earn" (<a href="${VASTA}">Vast.ai host earnings article</a>). So the $0.469 median renter price is roughly <b>${$(VHOST,3)}</b> an hour to the host, only while rented. Vast does not publish occupancy.</li>
</ul>
<h2>Power cost per hour</h2>
<table><thead><tr><th>Power price</th><th>Card only, 450 W</th><th>Whole PC, 600 W</th><th>PC, 30 days at full load</th></tr></thead><tbody>
${perHr}
</tbody></table>
<p class="note">450 W is NVIDIA's total graphics power. 600 W for the whole PC (card plus 150 W) is our assumption. US average residential 18.16 cents/kWh, August 2026 (<a href="${EIA}">EIA Table 5.6.A</a>). EU average household €0.2832/kWh, H1 2026, 2,500 to 4,999 kWh band, all taxes (<a href="${EU}">Eurostat nrg_pc_204</a>), $${EUP.toFixed(4)} at the ECB rate of 1.1188 on Oct 26, 2026 (<a href="${ECB}">ECB</a>). $0.10 and $0.25 are round reference points.</p>
<h2>Net per month after power</h2>
<table><thead><tr><th>Scenario</th><th>Gross / month</th><th>Power used</th><th>Net, US power</th><th>Net, EU power</th></tr></thead><tbody>
${netTbl}
</tbody></table>
<p class="note">Method (ours): 30 days. Salad: $0.2625 × 720 hours, PC at 600 W every hour. Vast: ${$(VHOST,3)} host rate × rented hours, 600 W while rented, 100 W idle (our guess). Rented share is our assumption. Before card wear, internet, platform payout fees and tax.</p>
<h2>Payback if you buy a card to rent out</h2>
<p>Used RTX 4090 prices, all from US eBay sold data, read November 19, 2026:</p>
<table><thead><tr><th>Source</th><th>Date</th><th>Price</th><th>What it measures</th></tr></thead><tbody>
<tr><td><a href="${GP}">Get PC Parts</a></td><td>Week to Nov 14, 2026</td><td>$2,365</td><td>Average sold price (90-day average $2,476)</td></tr>
<tr><td><a href="${GS}">GPU Sold</a></td><td>Updated Nov 18, 2026</td><td>$3,050</td><td>Typical sold price, 97 sales in 14 days, most $2,999 to $3,199</td></tr>
<tr><td><a href="${PW}">PCPrice.Watch</a></td><td>Nov 19, 2026</td><td>$3,192</td><td>90-day sold median, 157 sales (7-day median $3,378)</td></tr>
</tbody></table>
<p class="note">The trackers disagree because they filter sales and windows differently. The card launched at $1,599 in 2022. We use $2,365 and $3,192 below.</p>
<table><thead><tr><th rowspan="2">Scenario</th><th colspan="2">Card at $2,365</th><th colspan="2">Card at $3,192</th></tr><tr><th>US power</th><th>EU power</th><th>US power</th><th>EU power</th></tr></thead><tbody>
${pbTbl}
</tbody></table>
<p class="note">Payback months = card price ÷ net per month from the table above. Inputs and method are ours. It assumes you already have the rest of the PC, rates stay flat, and the card is worth nothing at the end. A used 4090 still resells for real money, so the true picture is better than this; a rate drop makes it worse.</p>
<p>Short version: if you already own a 4090, renting it out is extra cash on top of a card you paid for. Buying one just to rent out is roughly a one-to-five year bet on rates holding up.</p>
<h2>Rent one or buy one?</h2>
<p>If you only need the GPU for AI work, $3,192 buys about ${Math.round(hrsRP).toLocaleString('en-US')} hours on RunPod Community at $0.34, or about ${Math.round(hrsV).toLocaleString('en-US')} hours at the $0.469 Vast median, before you pay a cent of power. That is about ${Math.round(hrsV/730)} to ${Math.round(hrsRP/730)} months of nonstop use. Owning wins if you also game on it or keep it busy for years.</p>
<h2>Rent out vs mining, per kW</h2>
<p>A 4090 is not a Bitcoin miner; Bitcoin runs on ASICs. The fair comparison is what a kilowatt earns. A 600 W 4090 PC on Salad at $0.2625 an hour grosses about <b>${$(salKw)}</b> per kW per day. A kW of Antminer S21 XP (13.5 J/TH, <a href="https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications">Bitmain</a>) grosses about <b>${$(btcKw)}</b> a day at the current hashprice. ${a.dataLine}</p>
<p>The GPU kW wins on gross, but it costs about ${$0(3192/(PCW/1000))} in used cards per kW and depends on someone wanting the card. An ASIC earns every hour it is on. More on both in the <a href="/guides/rent-out-your-gpu/">rent out your GPU guide</a>.</p>
<div class="callout"><b>Run your own numbers or check a live Vast.ai machine.</b> The calculator is preloaded with 600 W, the $0.469 Vast median, $3,192 per card and 50% utilization. Already hosting? Enter your Vast.ai <code>machine_id</code> in <a href="/fleet/">Fleet Check</a> to see live occupancy and 36-month net returns. Stored only in your browser.<br><a class="btn" href="${calc}">Open the per-kW calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark Vast.ai machine ID <span aria-hidden="true">→</span></a></div>
<h2>FAQ</h2>
<h3 id="faq-rent">How much does it cost to rent an RTX 4090?</h3><p>About $0.16 to $0.89 per hour for one card. On November 19, 2026 the Vast.ai median was $0.47 across 64 offers ($0.32 to $0.61), RunPod Community Cloud listed $0.34 and Secure Cloud $0.89, and Clore hosts listed a median $0.52 an hour before fees. SaladCloud's interruptible Lowest tier is $0.16.</p>
<h3 id="faq-earn">How much can an RTX 4090 earn if I rent it out?</h3><p>Salad's 4090 machines averaged $0.2625 per switched-on hour for Nov 12 to 18, 2026, about ${$0(sc[0][1])} a month. After power for a 600 W PC that is about ${$0(salUS)} at the US average price and ${$0(salEU)} at the EU average.</p>
<h3 id="faq-power">How much power does an RTX 4090 use?</h3><p>NVIDIA lists 450 W total graphics power, 19 W idle and 315 W average while gaming, with an 850 W power supply. A whole PC at full load is about 600 W, which costs about ${$(PCW/1000*US,3)} an hour at the US average of 18.16 cents/kWh.</p>
<h3 id="faq-price">How much is a used RTX 4090?</h3><p>About $2,365 to $3,192 on US eBay in mid November 2026, depending on the tracker: $2,365 average sold the week to Nov 14 on Get PC Parts, $3,050 on GPU Sold (14 days) and $3,192 90-day sold median on PCPrice.Watch. It launched at $1,599 in 2022.</p>
<h3 id="faq-payback">How long does an RTX 4090 take to pay back by renting it out?</h3><p>At Salad's average rate and US average power, a $3,192 card takes about ${Math.round(3192/salUS)} months and a $2,365 card about ${Math.round(2365/salUS)} months. At EU power it is roughly ${Math.round(2365/salEU)} to ${Math.round(3192/salEU)} months. Our math, before resale value.</p>
<h3 id="faq-vs-btc">Does a rented RTX 4090 beat Bitcoin mining per kW?</h3><p>On gross revenue per kW, yes: about ${$(salKw)} per kW per day on Salad versus about ${$(btcKw)} for a kW of S21 XP at the current hashprice. But the GPU kW costs far more hardware money and only earns when someone wants it.</p>
<p>Related: <a href="/gpu/rtx-5090/">RTX 5090 rent price per hour</a> · <a href="/gpu/host-earnings/">what GPU hosts earn per GPU</a> · <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/gpu/a100/">A100 rent price per kW</a> · <a href="/guides/rent-out-your-gpu/">rent out your GPU</a> · <a href="/">mine vs AI calculator</a> · <a href="/calculators/">all calculators</a> · <a href="/methodology/#sources-gpu">GPU defaults and sources</a> · <a href="/asic/">ASIC profitability by model</a>.</p>
<p class="note">Prices change constantly; this page is updated by hand, last on November 19, 2026 (prices read 10:20 to 10:25 CET; full read in our snapshot notes). Nothing here is financial advice.</p>
<!--signup--></article>
<section class="cta"><div><h2>Renting out GPUs?</h2><p>Connect Vast.ai to Flash to track earnings, fees and payouts by machine. Get help with payments and sync to QuickBooks in one click.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=gpu-rtx-4090&amp;p=cta&amp;op=ai_gpu">See Flash for compute providers <span aria-hidden="true">→</span></a></section>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"datePublished":'2026-10-29',"dateModified":'2026-11-19',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPUs","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"NVIDIA RTX 4090","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  return url;
}
