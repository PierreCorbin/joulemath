// GPU host earnings page: dist/gpu/host-earnings/index.html. Cross-platform rate table for people renting out GPUs.
// Every figure is copied from the Nov 17, 2026 read in data/snapshots/2026-11-17.md; host estimates and monthly math are ours and labeled.
// Editorial page: no Flash pitch or CTA box here (GTM ask, Nov 16).
import fs from 'fs';
const SITE='https://joulemath.com';
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const $0=n=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
const VAST='https://console.vast.ai/api/v0/bundles/', VASTA='https://vast.ai/article/how-much-money-can-you-earn-renting-out-your-gpu-on-vast-ai', VASTJ='https://vast.ai/article/june-2024-product-update';
const CLM='https://api.clore.ai/v1/marketplace', CLD='https://clore.ai/api-docs', CLF='https://docs.clore.ai/for-renters/fee-structure';
const SER='https://salad.com/earning-rates/', SERJ='https://cdn.salad.com/site-data/earning-rates.json';
const RPD='https://github.com/runpod/docs/blob/72e717d5/hosting/overview.mdx', RP='https://www.runpod.io/pricing';
const EIA='https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_5_06_a';
const D='Nov 17, 2026', DL='November 17, 2026';
const VCUT=1.25, CL_CLORE=0.95, CL_USD=0.80; // Vast "about 25% above what hosts earn"; Clore fee doc: host gets 95 (CLORE) or 80 (BTC/USDT/USDC) of 100
const US=0.1816, W=600, IDLE=100, H=720; // EIA Aug 2026; our assumptions: 600 W box while working, 100 W idle, 30 days
// Consumer cards. Clore: [listed servers, rented now, 1x open offers, median $/day]. Vast: [offers, renter median $/hr]. Salad: mean $/switched-on hr (Nov 10 to 16).
const CONS=[
 ['RTX 5090',[277,137,75,16.00],[64,0.61],0.3755],
 ['RTX 4090',[179,55,82,10.94],[64,0.479],0.2681],
 ['RTX 3090',[195,71,85,4.00],[64,0.216],0.1124],
 ['RTX 5080',[166,47,64,6.50],[33,0.268],0.1562],
 ['RTX 5070 Ti',[180,45,70,8.97],[36,0.23],0.1179],
];
// Data-center cards on Vast: [name, offers, low, median, high] renter $/hr.
const DC=[['H100 SXM',6,1.735,2.336,2.478],['H100 PCIe',2,2.536,2.602,2.669],['H100 NVL',3,3.07,3.416,3.734],['H200',6,3.659,4.476,5.938],['H200 NVL',20,3.001,4.073,7.046],['A100 SXM4 (40/80 GB mix)',26,0.383,0.824,1.858],['A100 PCIe (40/80 GB mix)',18,0.389,0.626,1.338],['L40S',11,0.535,0.775,0.877]];
const clHr=c=>c[1][3]/24;
const kwh=u=>(W*H*u+IDLE*H*(1-u))/1000;
const net=(rate,u)=>rate*H*u-kwh(u)*US;
const salNet=s=>s*H-W/1000*H*US;
export function buildHosts(a){
  const url='/gpu/host-earnings/';
  const g=n=>CONS.find(c=>c[0]===n);
  const c90=g('RTX 4090'), c50=g('RTX 5090');
  const title='What GPU hosts earn per GPU (Nov 2026): Vast, Clore, Salad, RunPod';
  const desc=`What renting out a GPU earns per hour on ${D}: RTX 4090 hosts keep ${$(clHr(c90)*CL_USD)} to ${$(clHr(c90)*CL_CLORE)} on Clore, ${$(c90[2][1]/VCUT)} on Vast, ${$(c90[3])} on Salad. Plus 5090, 3090, H100, H200, fees and monthly net after power.`;
  const rateRows=CONS.map(c=>`<tr><td>${c[0]}</td><td>${$(c[1][3])}/day</td><td>${$(clHr(c)*CL_CLORE)} / ${$(clHr(c)*CL_USD)}</td><td>${$(c[2][1],3)} (${c[2][0]}${c[2][0]===64?', cap':''})</td><td><b>${$(c[2][1]/VCUT)}</b></td><td>${$(c[3],4)}</td></tr>`).join('\n');
  const dcRows=DC.map(d=>`<tr><td>${d[0]}</td><td>${d[1]}</td><td>${$(d[2])} to ${$(d[4])}</td><td>${$(d[3],3)}</td><td><b>${$(d[3]/VCUT)}</b></td></tr>`).join('\n');
  const utilRows=CONS.map(c=>`<tr><td>${c[0]}</td><td>${c[1][0]}</td><td>${c[1][1]}</td><td><b>${Math.round(100*c[1][1]/c[1][0])}%</b></td><td>${c[1][2]}</td></tr>`).join('\n');
  const U=[0.25,0.5,0.8];
  const moRows=CONS.map(c=>{const r=clHr(c)*CL_USD;return `<tr><td>${c[0]}</td><td>${$(r,3)}</td>${U.map(u=>`<td>${$0(net(r,u))}</td>`).join('')}<td>${$0(salNet(c[3]))}</td></tr>`;}).join('\n');
  const v90=c90[2][1]/VCUT, n90_50=net(clHr(c90)*CL_USD,0.5), s90=salNet(c90[3]);
  const h100=DC[0], h200=DC[3];
  const all=CONS.flatMap(c=>[clHr(c)*CL_USD,clHr(c)*CL_CLORE,c[2][1]/VCUT]), lo=Math.min(...all), hi=Math.max(...all);
  const body=`<article class="prose post"><p class="eyebrow"><a href="/gpu/">GPUs</a></p><h1>What GPU hosts earn per GPU (Nov 2026): Vast, Clore, Salad, RunPod</h1>
<p class="lead"><b>Short answer:</b> on ${DL}, an <b>RTX 4090</b> host keeps about <b>${$(clHr(c90)*CL_USD)} to ${$(clHr(c90)*CL_CLORE)} an hour on Clore</b> (median list ${$(c90[1][3])}/day, <a href="${CLM}">Clore API</a>, after <a href="${CLF}">Clore fees</a>), about <b>${$(v90)} on Vast</b> (renter median ${$(c90[2][1],3)} / 1.25, our estimate from <a href="${VASTA}">Vast's own 25% figure</a>) and <b>${$(c90[3],4)} per switched-on hour on Salad</b> (Nov 10 to 16 average, <a href="${SER}">Salad earning rates</a>). An <b>RTX 5090</b>: ${$(clHr(c50)*CL_USD)} to ${$(clHr(c50)*CL_CLORE)} on Clore, ${$(c50[2][1]/VCUT)} on Vast, ${$(c50[3],4)} on Salad. Clore and Vast pay only while rented. An <b>H100 SXM</b> host on Vast keeps about <b>${$(h100[3]/VCUT)}</b> an hour (our estimate).</p>
<p class="note">Last updated ${DL}. Prices read ${D}, 10:23 CET. Host figures marked "our estimate" are our math on the linked numbers. Nothing here is financial advice.</p>
<h2 id="per-hour">How much does a GPU host earn per hour?</h2>
<p>For a gaming or workstation card, roughly ${$(lo)} to ${$(hi)} an hour while rented, depending on the card and the platform. The table is what lands with the host, not what renters pay, on ${D}.</p>
<table><thead><tr><th>GPU</th><th>Clore median list</th><th>Clore host $/hr, paid in CLORE / in USD or BTC</th><th>Vast renter median $/hr (offers)</th><th>Vast host $/hr, our estimate</th><th>Salad mean $/switched-on hr</th></tr></thead><tbody>
${rateRows}
</tbody></table>
<p class="note">Clore: median of single-GPU servers not rented at read time, <code>on_demand_usd</code> per day (<a href="${CLD}">Clore API docs</a>), divided by 24, times 95% or 80% (fees below). Vast: median of rentable, on-demand, single-GPU offers from the <a href="${VAST}">Vast public API</a>; it returns at most 64 offers, so 4090, 5090 and 3090 medians are of the cheapest 64 (biased low). Host ≈ median / 1.25 because Vast says live prices are "typically about 25% above what hosts earn" (<a href="${VASTA}">Vast</a>). Salad: <a href="${SERJ}">earning-rates.json</a> updated ${D}, 09:08 CET, average per switched-on hour for Nov 10 to 16, idle time included. All read ${D}.</p>
<p>Vast's own range for hosts: consumer GPUs like the RTX 5090 "typically earn $0.30-$0.60 per GPU-hour" (<a href="${VASTA}">Vast</a>, article dated May 18, 2026). Our ${$(c50[2][1]/VCUT)} 5090 estimate sits inside it.</p>
<h2 id="data-center">What do H100, H200, A100 and L40S hosts earn on Vast?</h2>
<p>On ${D}, an H100 SXM host on Vast keeps about ${$(h100[3]/VCUT)} an hour and an H200 host about ${$(h200[3]/VCUT)} while rented (renter medians ${$(h100[3],3)} and ${$(h200[3],3)} divided by 1.25, our estimate). Vast itself says H100s and H200s "bring in $2.15-$4.00+ per GPU-hour" for hosts (<a href="${VASTA}">Vast</a>).</p>
<table><thead><tr><th>GPU</th><th>Single-GPU offers</th><th>Renter range $/hr</th><th>Renter median $/hr</th><th>Host $/hr, our estimate</th></tr></thead><tbody>
${dcRows}
</tbody></table>
<p class="note">Source: <a href="${VAST}">Vast public offers API</a>, read ${D}, 10:23 CET. Same filter as above. H100 PCIe and H100 NVL are 2 and 3 offers, so treat those as thin. Clore has almost no data-center cards (4 H100 servers, 2 A100, 1 L40S, 1 H200 on ${D}), so there is no Clore H100 market rate. Renter prices across clouds: <a href="/gpu/h100/">H100</a>, <a href="/gpu/h200/">H200</a>, <a href="/gpu/a100/">A100</a>.</p>
<h2 id="fees">How much do Vast, Clore, Salad and RunPod take from hosts?</h2>
<p>Vast charges no host fee but renters pay about 25% above the host price. Clore takes 5% from the host, plus 15% when the renter pays in BTC, USDT or USDC. Salad publishes what hosts earn. RunPod Community Cloud no longer takes new hosts.</p>
<table><thead><tr><th>Platform</th><th>How the host gets paid</th><th>Fee or cut</th><th>Source</th></tr></thead><tbody>
<tr><td>Vast</td><td>Host sets an hourly price, earns while rented</td><td>No host fee since June 2024; renter prices "typically about 25% above what hosts earn"</td><td><a href="${VASTJ}">Vast June 2024 update</a>, <a href="${VASTA}">Vast host article</a> (May 18, 2026)</td></tr>
<tr><td>Clore</td><td>Host sets a daily price, earns while rented</td><td>On-demand base fee 10%, split 50/50, so the host pays 5%. Extra 15% hoster fee when the renter pays in BTC, USDT or USDC, 0% in CLORE (can be cut with MFP Lock). Host gets 95 of 100 paid in CLORE, 80 of 100 paid in BTC.</td><td><a href="${CLF}">Clore fee structure</a>, read ${D}</td></tr>
<tr><td>Salad</td><td>Pays per switched-on hour for whatever jobs land on the PC</td><td>Salad publishes host earnings directly, so no fee math needed</td><td><a href="${SER}">Salad earning rates</a>, updated ${D}</td></tr>
<tr><td>RunPod Community Cloud</td><td>Closed to new hosts</td><td>Kept 24% when it was open</td><td><a href="${RPD}">RunPod hosting docs</a> (last version before removal, Apr 1, 2026)</td></tr>
</tbody></table>
<p class="note">RunPod still rents Community Cloud GPUs to renters (<a href="${RP}">RunPod pricing</a>), so its prices are what your card competes with, but you cannot list a new machine there.</p>
<h2 id="rented">How often do GPUs actually get rented?</h2>
<p>Nobody publishes a full utilization number, but Clore shows which servers are rented right now. At 10:23 CET on ${D}, ${Math.round(100*1178/2830*10)/10}% of all 2,830 Clore servers were rented (1,178). By card it ranged from ${Math.round(100*45/180)}% (5070 Ti) to ${Math.round(100*137/277)}% (5090).</p>
<table><thead><tr><th>GPU</th><th>Clore servers listed</th><th>Rented now</th><th>Share rented</th><th>Open single-GPU offers</th></tr></thead><tbody>
${utilRows}
</tbody></table>
<p class="note">Source: <a href="${CLM}">Clore marketplace API</a>, servers where every GPU is that model, ${D} 10:23 CET. On Nov 16 the same read showed 44.5% overall, 4090 36%, 5090 51%, 3090 52%. This is a snapshot, not an average over time, so read it as a demand hint. Vast shows occupancy rates in the host dashboard once you register a machine (<a href="${VASTA}">Vast</a>). Salad's "work" share (95% to 97% for these cards) is the share of switched-on time with a job, not a rental rate.</p>
<h2 id="monthly">How much does a GPU host make per month after power?</h2>
<p>An RTX 4090 on Clore paid in USD nets about ${$0(n90_50)} a month if it is rented half the time, after US average power. On Salad, running 24/7, it nets about ${$0(s90)}. These are our scenarios, not measured utilization.</p>
<table><thead><tr><th rowspan="2">GPU</th><th rowspan="2">Clore host $/hr (paid in USD)</th><th colspan="3">Clore net per month, rented</th><th rowspan="2">Salad net per month, on 24/7</th></tr><tr><th>25%</th><th>50%</th><th>80%</th></tr></thead><tbody>
${moRows}
</tbody></table>
<p class="note">Our math and assumptions: 30 days (720 hours). Clore host rate = median list ÷ 24 × 80% (renter pays in USD or BTC; paid in CLORE it is 95%, about 19% more). Rented shares of 25%, 50% and 80% are scenarios we picked, not data. Power: the whole box draws 600 W while working and 100 W idle (our round numbers, same as our <a href="/gpu/rtx-4090/">RTX 4090 page</a>; smaller cards like the 5070 Ti and 3090 draw less, a 5090 box more), at the US average residential price of 18.16 cents/kWh for August 2026 (<a href="${EIA}">EIA Table 5.6.A</a>). Salad: mean per switched-on hour × 720, with 600 W every hour. Before card wear, internet, payout fees and tax.</p>
<p>At cheaper power the picture improves: plug your own rate, wattage and utilization into the <a href="/?gpuw=600&amp;rate=${(clHr(c90)*CL_USD).toFixed(3)}&amp;util=50">per-kW calculator</a>. Already hosting on Vast? <a href="/fleet/">Fleet Check</a> pulls live occupancy for a machine ID, stored only in your browser.</p>
<h2 id="which">Which platform should a GPU host use?</h2>
<p>It depends on the box. Salad runs on a normal Windows gaming PC and pays for switched-on time. Vast and Clore pay more per rented hour, but you only earn while someone rents the machine, and Vast wants a dedicated Ubuntu box. RunPod Community is not an option for new hosts. Setup, gaming while rented and risks for a home PC are in our <a href="/guides/rent-out-your-gpu/">guide to renting out your GPU</a>.</p>
<h2>FAQ</h2>
<h3 id="faq-earn">How much can I earn renting out my GPU?</h3><p>On ${DL}, an RTX 4090 host keeps about ${$(clHr(c90)*CL_USD)} to ${$(clHr(c90)*CL_CLORE)} per rented hour on Clore, about ${$(v90)} on Vast (our estimate) and ${$(c90[3],4)} per switched-on hour on Salad. After US average power, that is roughly ${$0(net(clHr(c90)*CL_USD,0.25))} to ${$0(net(clHr(c90)*CL_USD,0.8))} a month on Clore at 25% to 80% rented, or ${$0(s90)} on Salad.</p>
<h3 id="faq-4090">How much does an RTX 4090 host earn per hour?</h3><p>About ${$(c90[3])} to ${$(clHr(c90)*CL_CLORE)} on ${D}: ${$(c90[3],4)} per switched-on hour on Salad (Nov 10 to 16 average), about ${$(v90)} while rented on Vast (our estimate from a ${$(c90[2][1],3)} renter median), and ${$(clHr(c90)*CL_USD)} to ${$(clHr(c90)*CL_CLORE)} while rented on Clore (${$(c90[1][3])}/day median list after fees).</p>
<h3 id="faq-5090">How much does an RTX 5090 host earn per hour?</h3><p>On ${D}: ${$(c50[3],4)} per switched-on hour on Salad, about ${$(c50[2][1]/VCUT)} while rented on Vast (our estimate from a ${$(c50[2][1],3)} renter median) and ${$(clHr(c50)*CL_USD)} to ${$(clHr(c50)*CL_CLORE)} while rented on Clore (${$(c50[1][3])}/day median list after fees). Vast says 5090 hosts typically earn $0.30 to $0.60 per GPU-hour.</p>
<h3 id="faq-h100">How much does an H100 host earn on Vast?</h3><p>About ${$(h100[3]/VCUT)} per rented hour for one H100 SXM on ${D}: the renter median was ${$(h100[3],3)} across ${h100[1]} single-GPU offers, and Vast says renters pay about 25% above what hosts earn. Vast's own range for H100 and H200 hosts is $2.15 to $4.00+ per GPU-hour.</p>
<h3 id="faq-fees">What fee does Vast take from hosts?</h3><p>Vast has charged no host fee since June 2024. Instead, the price renters see is typically about 25% above what the host earns, so a host keeps roughly 80% of the renter price.</p>
<h3 id="faq-clore">How much does Clore take from hosts?</h3><p>Clore takes 5% of an on-demand rental from the host (half of a 10% base fee), plus an extra 15% hoster fee when the renter pays in BTC, USDT or USDC. So the host gets about 95% of the list price when paid in CLORE and about 80% when paid in BTC or stablecoins.</p>
<h3 id="faq-runpod">Can I still host GPUs on RunPod?</h3><p>Not as a new host. RunPod Community Cloud is closed to new hosts, and its hosting docs were removed on April 1, 2026. It used to keep 24% of Community Cloud revenue.</p>
<h3 id="faq-util">How often are rented-out GPUs actually busy?</h3><p>There is no public average. As a snapshot, ${Math.round(100*1178/2830*10)/10}% of Clore's 2,830 servers were rented at 10:23 CET on ${D}, from ${Math.round(100*45/180)}% of RTX 5070 Ti servers to ${Math.round(100*137/277)}% of RTX 5090 servers.</p>
<p>Related: <a href="/gpu/">GPU rental prices</a> · <a href="/gpu/rtx-4090/">RTX 4090 rent price and payback</a> · <a href="/gpu/h100/">H100 rent price per kW</a> · <a href="/gpu/h200/">H200 rent price</a> · <a href="/gpu/a100/">A100 rent price</a> · <a href="/gpu/rent-vs-buy-h100/">rent vs buy an H100</a> · <a href="/guides/rent-out-your-gpu/">rent out your GPU (home PC guide)</a> · <a href="/">mine vs AI per-kW calculator</a> · <a href="/calculators/">all calculators</a> · <a href="/fleet/">Fleet Check</a> · <a href="/methodology/#sources-gpu">GPU sources</a>.</p>
<h2 id="src">Sources</h2>
<ul>
<li>Vast public offers API, read ${D} 10:23 CET: <a href="${VAST}">console.vast.ai/api/v0/bundles</a>.</li>
<li>Vast, "How Much Money Can You Earn Renting Out Your GPU on Vast.ai?", May 18, 2026: <a href="${VASTA}">vast.ai article</a>. No host fee: <a href="${VASTJ}">Vast June 2024 product update</a>.</li>
<li>Clore marketplace API, read ${D} 10:23 CET: <a href="${CLM}">api.clore.ai/v1/marketplace</a>; field meanings: <a href="${CLD}">Clore API docs</a>; fees: <a href="${CLF}">Clore fee structure</a>.</li>
<li>Salad earning rates, window Nov 10 to 16, 2026, updated ${D} 09:08 CET: <a href="${SER}">salad.com/earning-rates</a>, <a href="${SERJ}">earning-rates.json</a>.</li>
<li>RunPod hosting docs, last version before removal: <a href="${RPD}">github.com/runpod/docs</a>.</li>
<li>US average residential electricity, August 2026: <a href="${EIA}">EIA Electric Power Monthly Table 5.6.A</a>.</li>
</ul>
<p class="note">Rates move by the hour; this page is updated by hand, last on ${DL}. Raw reads are in our public repo under data/snapshots/2026-11-17.md.</p>
<!--signup--></article>`;
  const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"datePublished":'2026-11-17',"dateModified":'2026-11-17',"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"GPUs","item":SITE+'/gpu/'},{"@type":"ListItem","position":2,"name":"GPU host earnings","item":SITE+url}]}};
  fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',a.page({title:`${title} | joulemath`,desc,url,ld,body}));
  return url;
}
