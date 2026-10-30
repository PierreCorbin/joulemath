// Country power price pages: dist/power-prices/<slug>/index.html + dist/power-prices/index.html.
// Prices are industrial electricity prices from public sources, each with source and date. Never fill a gap with a guess:
// if a place has no citable industrial price, leave it out.
// Mining vs GPU per kW reuses the home calculator's formulas (src/js/compare.js run(), Same power, Buy mode) with the
// home calculator's default inputs, read from src/index.html so the two never drift apart.
import fs from 'fs';
const SITE='https://joulemath.com';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const EIA={name:'EIA Electric Power Monthly, Table 5.6.A',url:'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a'};
export const PLACES=[
 {slug:'united-states-texas',name:'Texas (ERCOT), United States',short:'Texas (ERCOT)',
  prices:[{label:'Average industrial price, July 2026',usd:0.0707}],
  src:[{...EIA,note:'Texas, industrial sector, July 2026: 7.07 cents/kWh (July 2025: 6.61). Accessed October 21, 2026.'}],
  intro:'Texas is the biggest Bitcoin mining state in the US. The EIA publishes the average price industrial customers actually paid, state by state, every month.',
  caveat:'This is a statewide average across all industrial users. Large miners often sign their own contracts and sell flexibility back to ERCOT, so their all-in cost can be lower (see the Riot example in the <a href="/methodology/#scenarios">methodology</a>).'},
 {slug:'paraguay',name:'Paraguay',short:'Paraguay',
  prices:[{label:'All-in industrial, low end',usd:0.040},{label:'All-in industrial, high end',usd:0.050}],
  src:[{name:'Hashrate Index, The State of Bitcoin Mining in Latin America 2026',url:'https://hashrateindex.com/blog/the-state-of-bitcoin-mining-in-latin-america-2026/',note:'ANDE\'s intensive industrial tariff (GCIE, 220 kV) is $5.27/kW-month demand plus $0.03725/kWh energy, which Hashrate Index puts at roughly $0.040 to $0.050/kWh all-in at high utilization. Published October 2026, accessed October 21, 2026.'}],
  intro:'Paraguay sells surplus hydro from the Itaipu dam to heavy industrial users, Bitcoin miners included, through the state utility ANDE.',
  caveat:'The range depends on how fully you use the contracted demand. Running flat out puts you near the low end.'},
 {slug:'ethiopia',name:'Ethiopia',short:'Ethiopia',
  prices:[{label:'Data mining tariff, daily average (July 2026 to July 2027)',usd:0.050}],
  src:[{name:'Addis Standard',url:'https://addisstandard.com/industry-insiders-say-ethiopias-new-power-tariff-a-crucial-test-for-its-crypto-mining-boom/',note:'Reports Ethiopian Electric Power\'s letter of October 27, 2025: a time-of-use tariff for data mining starting December 1, 2025, with a daily average of 4 US cents/kWh until July 2026, 5 cents the following year and 6.5 cents from July 2027 to July 2028, including 15% VAT and a 0.5% regulatory fee. Accessed October 21, 2026.'},
   {name:'FSX Business',url:'https://www.fsxbusiness.com/ethiopia-sets-3-year-tariff-for-miners',note:'Same tariff, period by period: from July 8, 2026 to July 7, 2027 peak 6.3, shoulder 5.55 and off-peak 4.65 US cents/kWh. Accessed October 21, 2026.'}],
  intro:'Ethiopia has a special electricity tariff just for data mining, set by the state power company. It went from a flat rate to time-of-use pricing in December 2025.',
  caveat:'This figure includes VAT. Rates are a bit lower off-peak and higher from 6 PM to 10 PM, and an availability-based adjustment changes the bill when the utility curtails. The average steps up again to 6.5 cents in July 2027.'},
 {slug:'uae',name:'United Arab Emirates (Dubai)',short:'UAE',
  prices:[{label:'DEWA industrial tariff above 10,000 kWh a month, plus fuel surcharge (October 2026, excl. VAT)',cur:'AED',amt:0.44}],
  src:[{name:'Dubai Electricity and Water Authority (DEWA), slab tariff',url:'https://www.dewa.gov.ae/en/consumer/billing/slab-tariff',note:'Industrial slab tariff AED 0.230/kWh for the first 10,000 kWh a month and AED 0.380/kWh above that, plus a fuel surcharge of AED 0.060/kWh for October 2026; 5% VAT on top. We use 0.380 + 0.060 = AED 0.44/kWh, since any mining-size load is almost all above 10,000 kWh. Accessed October 21, 2026.'},
   {name:'Central Bank of the UAE',url:'https://www.centralbank.ae/en/',note:'The dirham is pegged at AED 3.6725 per US dollar, which we use to convert.'}],
  intro:'The UAE is one of the bigger mining countries by hashrate, much of it in Abu Dhabi. Dubai\'s utility DEWA is the one that publishes a full industrial tariff, so that is the price used here.',
  caveat:'This is Dubai\'s published tariff for regular industrial accounts. Large mining sites in the UAE, especially in Abu Dhabi, usually run on privately negotiated power deals that are not public, so treat this as the walk-in grid price, not what big miners pay.'},
 {slug:'canada-quebec',name:'Canada (Quebec)',short:'Canada (Quebec)',
  prices:[{label:'Hydro-Quebec Rate CB (crypto mining), large power, all-in at full load',cur:'CAD',amt:0.06594}],
  src:[{name:'Hydro-Quebec, Electricity Rates effective April 1, 2026, Chapter 7 (Rate CB)',url:'https://www.hydroquebec.com/data/documents-donnees/pdf/electricity-rates.pdf?v=20260224',note:'Rate CB applies to cryptographic use applied to blockchains. Large power (5,000 kW or more): $16.571 CAD per kW of billing demand per month plus 4.324 cents/kWh for authorized consumption. At full load over an average 730-hour month, the demand charge adds 2.270 cents/kWh, so about 6.594 cents CAD/kWh all-in (our arithmetic). Accessed October 21, 2026.'},
   {name:'Bank of Canada, USD/CAD daily exchange rate',url:'https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/',note:'Latest daily rate fetched at build time, used to convert CAD to USD.'}],
  intro:'Quebec has cheap hydro and a cold climate, and Hydro-Quebec has a rate written specifically for crypto mining, called Rate CB.',
  caveat:'Rate CB only covers power Hydro-Quebec has authorized for mining; anything above that is billed at 18.767 cents CAD/kWh. New capacity for mining is limited, so this is the price for existing allocations. Smaller sites under 5,000 kW pay the medium-power version, which is higher.'},
];
const DEF=(()=>{const h=fs.readFileSync('src/index.html','utf8');const o={};for(const id of ['kw','pue','host','jth','poolfee','thprice','mup','alife','gpuw','rate','gprice','glife','util','ovh']){const m=h.match(new RegExp(`id="${id}"[^>]*value="([^"]+)"`));if(!m)throw new Error('power: no default for '+id);o[id]=parseFloat(m[1]);}return o;})();
// Same formulas as compare.js run(), Same power, Buy mode, USD. Returned per 1 kW of facility power per day.
function perKw(p,hp,d=DEF){
  const it=d.kw/d.pue,th=it*1000/d.jth,n=Math.floor(it*1000/d.gpuw+1e-9),up=Math.min(100,Math.max(0,d.mup))/100;
  const mKW=th*d.jth/1000*d.pue,gKW=n*d.gpuw*d.pue/1000;
  const m={rev:th*hp*(1-d.poolfee/100)*up,pow:mKW*24*p*up,hw:th*d.thprice/(d.alife*365),host:mKW*d.host*12/365};
  const g={rev:n*d.rate*24*(d.util/100)*(1-d.ovh/100),pow:gKW*24*p,hw:n*d.gprice/(d.glife*365),host:gKW*d.host*12/365};
  for(const x of [m,g]){x.net=x.rev-x.pow-x.hw-x.host;for(const k in x)x[k]/=d.kw;}
  return {m,g};}
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
const cls=n=>n>=0?'pos':'neg';
async function boc(){const r=await fetch('https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1');if(!r.ok)throw new Error('Bank of Canada '+r.status);const o=(await r.json()).observations[0];return {rate:+o.FXUSDCAD.v,date:o.d};}
export async function buildPower({hp,eurPerUsd,when,dataLine,page}){
  const usdcad=await boc();
  const calcUrl=p=>`/?price=${p.toFixed(4).replace(/0+$/,'').replace(/\.$/,'')}&amp;kw=${DEF.kw}`;
  const FX={EUR:1/eurPerUsd,AED:1/3.6725,CAD:1/usdcad.rate};const usdOf=x=>x.usd??x.amt*FX[x.cur];
  const fxNote=`Currency conversion: AED at the official peg of 3.6725 per USD; CAD at ${usdcad.rate} per USD, the <a href="https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/">Bank of Canada</a> daily rate for ${usdcad.date}.`;
  const assume=`Per 1 kW of facility power, using the <a href="/">mine vs AI calculator</a>'s default inputs: Antminer S21 XP efficiency (${DEF.jth} J/TH) at $${DEF.thprice}/TH, ${DEF.poolfee}% pool fee, ${DEF.alife}-year ASIC life; H100 GPUs at ${DEF.gpuw} W, $${DEF.rate}/GPU-hour, ${DEF.util}% utilization, $${DEF.gprice.toLocaleString('en-US')} per GPU over ${DEF.glife} years; PUE ${DEF.pue}. Hardware and rental figures are sourced in the <a href="/methodology/#sources-mining">methodology</a>. Worked out at ${DEF.kw} kW and divided by ${DEF.kw}, because GPUs come in whole units. No taxes or hosting fees.`;
  fs.mkdirSync('dist/power-prices',{recursive:true});
  const rows=[];
  for(const c of PLACES){
    const url=`/power-prices/${c.slug}/`;
    const res=c.prices.map(x=>{const p=usdOf(x);return {...x,p,...perKw(p,hp)};});
    rows.push({c,url,res});
    const priceTxt=x=>x.cur?`${x.cur} ${x.amt.toFixed(4)}/kWh (about $${x.p.toFixed(4)})`:`$${x.p.toFixed(4)}/kWh`;
    const blocks=res.map(r=>`<h3>At ${priceTxt(r)}${res.length>1?': '+esc(r.label.split(', ').pop()):''}</h3>
<table><thead><tr><th>Per kW per day</th><th>Mining (S21 XP)</th><th>GPU rent (H100)</th></tr></thead><tbody>
<tr><td>Revenue</td><td>${$(r.m.rev)}</td><td>${$(r.g.rev)}</td></tr>
<tr><td>Power</td><td>${$(-r.m.pow)}</td><td>${$(-r.g.pow)}</td></tr>
<tr><td>Hardware (amortized)</td><td>${$(-r.m.hw)}</td><td>${$(-r.g.hw)}</td></tr>
<tr class="hl"><td><b>Net</b></td><td><b class="${cls(r.m.net)}">${$(r.m.net)}</b></td><td><b class="${cls(r.g.net)}">${$(r.g.net)}</b></td></tr></tbody></table>
<p><a class="btn" href="${calcUrl(r.p)}">Open the calculator at $${r.p.toFixed(4)}/kWh <span aria-hidden="true">→</span></a></p>`).join('\n');
    const r0=res[0],w=r0.g.net>=r0.m.net?'GPU rental':'mining';
    const title=`${c.name} industrial electricity price and what 1 kW earns`;
    const seoTitle=`${c.short} industrial power price and what 1 kW earns`;
    const desc=`${c.name}: industrial power at ${res.map(r=>'$'+r.p.toFixed(3)).join(' to ')}/kWh (${c.src[0].name.split(',')[0]}). What 1 kW nets mining with an S21 XP at live hashprice vs renting out H100 GPUs.`;
    const body=`<article class="prose post"><p class="eyebrow"><a href="/power-prices/">Power prices</a></p><h1>${esc(c.name)}: industrial power price and what 1 kW earns</h1>
<p class="lead">${esc(c.intro)}</p>
<h2>The price</h2><ul>${res.map(r=>`<li><b>${esc(r.label)}:</b> ${priceTxt(r)}</li>`).join('')}</ul>
<p>${c.caveat}</p>
<h2>What 1 kW earns at this price</h2>
<p>At the first price above, ${w} nets more per kW: <b>${$(r0.m.net)}</b> a day mining vs <b>${$(r0.g.net)}</b> renting GPUs, after power and hardware.</p>
${blocks}
<p class="note">${assume} ${dataLine}${res.some(r=>r.cur)?' '+fxNote:''}</p>
<h2>Sources</h2><ul>${c.src.map(s=>`<li><a href="${s.url}">${esc(s.name)}</a>: ${esc(s.note)}</li>`).join('')}</ul>
<p>Other places: ${PLACES.filter(o=>o!==c).map(o=>`<a href="/power-prices/${o.slug}/">${o.short}</a>`).join(' · ')}, or see <a href="/power-prices/">all power prices</a>. Per-model numbers are on the <a href="/asic/">ASIC pages</a>.</p>
<!--signup--></article>`;
    const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Power prices","item":SITE+'/power-prices/'},{"@type":"ListItem","position":2,"name":c.name,"item":SITE+url}]}};
    fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',page({title:`${seoTitle} | joulemath`,desc,url,ld,body}));
  }
  const body=`<div class="prose post"><p class="eyebrow">Power prices</p><h1>Industrial power prices for Bitcoin mining, by country</h1>
<p class="lead">Industrial electricity prices from public sources for well-known mining places, and what 1 kW nets mining vs renting GPUs at each one.</p>
<table><thead><tr><th>Place</th><th>Industrial $/kWh</th><th>Mining net / kW / day</th><th>GPU net / kW / day</th><th>Source</th></tr></thead><tbody>${rows.flatMap(({c,url,res})=>res.map((r,i)=>`<tr><td>${i?'':`<a href="${url}">${c.name}</a>`}</td><td>$${r.p.toFixed(4)}${res.length>1?` (${i?'high':'low'})`:''}</td><td class="${cls(r.m.net)}">${$(r.m.net)}</td><td class="${cls(r.g.net)}">${$(r.g.net)}</td><td>${i?'':`<a href="${c.src[0].url}">${esc(c.src[0].name.split(',')[0])}</a>`}</td></tr>`)).join('')}</tbody></table>
<p class="note">${assume} ${dataLine} ${fxNote} Price dates and full sources are on each page.</p>
<p>Got your own power price? Put it in the <a href="/">mine vs AI calculator</a> or the <a href="/mining-calculator/">ASIC calculator</a><a href="/gpu/">GPUs</a>.</p><!--signup--></div>`;
  fs.writeFileSync('dist/power-prices/index.html',page({title:'Industrial power prices for Bitcoin mining by country | joulemath',desc:'Sourced industrial electricity prices for Texas, Paraguay, Ethiopia, the UAE and Quebec, and what 1 kW nets mining vs renting GPUs at each.',url:'/power-prices/',ld:{"@context":"https://schema.org","@type":"CollectionPage","name":"Industrial power prices for Bitcoin mining by country","url":SITE+'/power-prices/'},body}));
  console.log('power: pages',PLACES.length);
}
