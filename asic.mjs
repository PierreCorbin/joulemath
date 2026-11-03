// ASIC long-tail pages: dist/asic/<slug>/index.html + dist/asic/index.html.
// Hashprice is computed at build time from mempool.space; the build fails if the fetch fails (no stale or invented numbers).
import fs from 'fs';
import {PLACES} from './power.mjs';
const SITE='https://joulemath.com';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const BM='Bitmain spec sheet', WM='MicroBT WhatsMiner shop listing';
const WMURL='https://shop.whatsminer.com/products';
// Used prices: ING Mining used ASIC sold price index (eBay sales, CSV ing-used-asic-price-index-latest.csv), 90-day medians and middle half to October 30, 2026, read November 3, 2026.
const ING={src:'ING Mining used ASIC miner sold prices',url:'https://ingmining.com/used-asic-miner-sold-prices',window:'90 days of eBay sales to October 30, 2026'};
const UP={'antminer-s19j-pro':{price:175,n:11,mid:'$147 to $192'},'antminer-s19-xp':{price:288,n:50,mid:'$250 to $350'},'antminer-s19k-pro':{price:325,n:11,mid:'$220 to $349'},
 'antminer-s21':{price:985,n:11,mid:'$822 to $995'},'antminer-s21-pro':{price:1600,n:9,mid:'$1,570 to $1,697'},'antminer-s21-xp':{price:2288,n:16,mid:'$2,178 to $2,649'}};
const used=(...sl)=>({...ING,rows:sl.map(slug=>({slug,...UP[slug]}))});
// New list prices on the MicroBT shop (shop.whatsminer.com/products and product pages), read November 3, 2026.
const WMP={'whatsminer-m60s':{price:1674,url:'https://shop.whatsminer.com/products'},'whatsminer-m66s':{price:2610,url:'https://shop.whatsminer.com/products/details/69?skuId=136'},
 'whatsminer-m63s':{price:3672,url:'https://shop.whatsminer.com/products/details/67?skuId=132'},'whatsminer-m70s':{price:3472,url:'https://shop.whatsminer.com/products'}};
// Specs as published by the manufacturer, accessed Oct 21, 2026. For WhatsMiner the shop lists hashrate and J/TH; watts = TH x J/TH (our arithmetic).
export const MODELS=[
 {slug:'antminer-s21-xp',name:'Antminer S21 XP',maker:'Bitmain',th:270,w:3645,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications',
  intro:'The S21 XP is the most efficient air-cooled Antminer on this list at 13.5 J/TH, pushing 270 TH/s from 3,645 W. That efficiency is why it keeps a margin at power prices where older machines are underwater.',
  used:used('antminer-s21-xp','antminer-s21-pro','antminer-s21','antminer-s19-xp')},
 {slug:'antminer-s21-pro',name:'Antminer S21 Pro',maker:'Bitmain',th:234,w:3510,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification',
  intro:'The S21 Pro sits between the S21 and the S21 XP: 234 TH/s at 3,510 W, or 15 J/TH. It draws almost the same power as a plain S21 but hashes 17% more.',
  used:used('antminer-s21-pro','antminer-s21','antminer-s21-xp'),up:'antminer-s21-xp'},
 {slug:'antminer-s21',name:'Antminer S21',maker:'Bitmain',th:200,w:3500,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification',
  intro:'The original S21 does 200 TH/s at 3,500 W, which is 17.5 J/TH. It is the baseline for the S21 family, and a useful yardstick for how much the Pro and XP versions improved.',
  used:used('antminer-s21','antminer-s21-pro','antminer-s21-xp'),up:'antminer-s21-xp'},
 {slug:'antminer-s19-xp',name:'Antminer S19 XP',maker:'Bitmain',th:141,w:3031.5,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/8906244096409-S19-XP-Specifications',
  title:'Antminer S19 XP profitability today: profit, break-even, payback',h1:'Antminer S19 XP profitability: is it still worth running?',accessed:'November 3, 2026',
  intro:'The S19 XP was the top S19 when it launched: 141 TH/s at 3,031.5 W, or 21.5 J/TH. Today it uses about 60% more energy per terahash than an S21 XP, so power price decides almost everything. It is also one of the most traded used miners: 50 eBay sales in the 90 days to October 30, 2026, more than any other model in the ING Mining index.',
  used:used('antminer-s19-xp','antminer-s19j-pro','antminer-s19k-pro','antminer-s21','antminer-s21-pro','antminer-s21-xp'),up:'antminer-s21-xp',
  specs:[['Model','240-Ca'],['Hashrate','141 TH/s ±3%'],['Power on wall at 25 °C','3,031.5 W ±5%'],['Efficiency','21.5 J/TH ±5%'],['Input power','200 to 240 V AC, 20 A max over two 10 A cords'],['Size without box','400 × 195.5 × 290 mm'],['Net weight','14.2 kg'],['Operating temperature','0 to 40 °C'],['Altitude','Up to 2,000 m (max temperature drops 1 °C per 300 m above 900 m)']],
  site:'It is a standard air-cooled box on single-phase 200 to 240 V, so it fits most hosting sites. The catch is heat and noise, plus the 20 A draw.'},
 {slug:'antminer-s19j-pro',name:'Antminer S19j Pro',maker:'Bitmain',th:104,w:3068,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/900006762746-S19j-Pro-Specifications',
  title:'Is the Antminer S19j Pro still profitable in 2026?',h1:'Is the Antminer S19j Pro still profitable in 2026?',accessed:'November 3, 2026',up:'antminer-s21-xp',
  intro:'The S19j Pro shipped in 2021 and is still one of the most common used miners out there. The top version does 104 TH/s at 3,068 W, or 29.5 J/TH, which is more than twice the energy per terahash of an S21 XP. So whether it still pays comes down to one thing: your power price.',
  // Bitmain lists six bins of the same 240-Cb machine, all at 29.5 J/TH (same spec page, accessed November 3, 2026).
  variants:[[104,3068],[100,2950],[96,2832],[92,2714],[88,2596],[84,2478]],
  // Used prices: ING Mining used ASIC sold price index (eBay sales), 90-day medians to October 30, 2026, read November 3, 2026.
  used:used('antminer-s19j-pro','antminer-s19-xp','antminer-s21-xp')},
 {slug:'antminer-s19k-pro',name:'Antminer S19k Pro',maker:'Bitmain',th:120,w:2760,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/23833956049049-S19K-Pro-Specifications',
  title:'Antminer S19k Pro profitability: is it still worth it in 2026?',h1:'Antminer S19k Pro profitability in 2026',accessed:'November 3, 2026',
  intro:'The S19k Pro came out in late 2023 (Bitmain posted its spec sheet on October 9, 2023) as a cheaper, lighter S19: 120 TH/s at 2,760 W, or 23 J/TH. It draws less power per box than an S19 XP, but it burns more energy per terahash, so it needs slightly cheaper power to break even. Used ones sold for a bit more than S19 XPs on eBay over the last 90 days.',
  used:used('antminer-s19k-pro','antminer-s19-xp','antminer-s19j-pro','antminer-s21-xp'),up:'antminer-s21-xp',
  specs:[['Hashrate','120 TH/s'],['Power on wall at 25 °C','2,760 W ±5%'],['Efficiency','23 J/TH ±5%'],['Input power','200 to 240 V AC, 20 A max over two 10 A cords'],['Size without box','400 × 195 × 290 mm'],['Net weight','12.85 kg, about 1.35 kg lighter than an S19 XP'],['Operating temperature','0 to 40 °C'],['Altitude','Up to 2,000 m']],
  site:'Like the S19 XP it is air-cooled on single-phase 200 to 240 V. At 2,760 W it is about 270 W lighter on the circuit than an S19 XP, which matters if you are tight on breaker capacity.'},
 {slug:'whatsminer-m60s',name:'WhatsMiner M60S',maker:'MicroBT',th:186,jth:18.5,src:WM,url:WMURL,
  intro:'The M60S is MicroBT\'s air-cooled workhorse, listed at 186 TH/s and 18.5 J/TH, which works out to about 3,441 W. On paper it lands between the S21 and the S19 XP on efficiency.',new:WMP['whatsminer-m60s']},
 {slug:'whatsminer-m66s',name:'WhatsMiner M66S',maker:'MicroBT',th:290,jth:18.5,src:WM,url:WMURL,
  title:'WhatsMiner M66S profitability: immersion miner profit and payback',h1:'WhatsMiner M66S profitability (immersion)',accessed:'November 3, 2026',
  intro:'The M66S is an immersion-cooled MicroBT unit, listed at 290 TH/s and 18.5 J/TH, with 5,365 W power on wall on its shop page. Same efficiency as the air-cooled M60S, just 56% more hashrate per box. The price of that is the tank: it only runs submerged in dielectric fluid, on 380 to 480 V power.',
  new:WMP['whatsminer-m66s'],
  specs:[['Cooling','Immersion'],['Hashrate','290 TH/s (a 286 TH/s bin is also listed)'],['Power on wall','5,365 W'],['Efficiency','18.5 J/TH'],['Input power','380 to 480 V AC'],['Power cable','Custom made, 16 A or more'],['Size','267.5 × 147 × 401 mm'],['Net weight','16 kg'],['List price','$2,610 for 290 TH/s ($9 per TH), $2,574 for 286 TH/s']],
  site:'You need an immersion tank, a fluid loop with a dry cooler or heat exchanger, and 380 to 480 V supply. None of that is in the box price, so the payback above is the machine only.'},
 {slug:'whatsminer-m63s',name:'WhatsMiner M63S',maker:'MicroBT',th:408,jth:18,src:WM,url:WMURL,
  title:'WhatsMiner M63S profitability: hydro miner profit and payback',h1:'WhatsMiner M63S profitability (hydro)',accessed:'November 3, 2026',
  intro:'The M63S is a hydro-cooled MicroBT machine, listed at 408 TH/s and 18 J/TH, with 7,344 W power on wall on its shop page. Per box it is the biggest earner here, but per kilowatt it is about the same as an S21. It is a 19-inch rack unit fed by a water loop, not a fan box, so it only makes sense at a site built for hydro.',
  new:WMP['whatsminer-m63s'],
  specs:[['Cooling','Hydro (water loop)'],['Hashrate','408 TH/s'],['Power on wall','7,344 W'],['Efficiency','18 J/TH'],['Input power','380 to 480 V AC, three wires plus ground, 10 kW input'],['Coolant per machine','About 1 L'],['Power cable','Custom made, 16 A or more'],['Size','86 × 483 × 663 mm with handle'],['Net weight','27.5 kg'],['List price','$3,672 ($9 per TH)']],
  site:'You need rack space, a closed water loop with a dry cooler or cooling tower, and three-phase 380 to 480 V power at about 10 kW per machine. The loop and electrical work are not in the box price, so the payback above is the machine only.'},
 {slug:'whatsminer-m70s',name:'WhatsMiner M70S',maker:'MicroBT',th:248,jth:13.5,src:WM,url:WMURL,
  intro:'The M70S is MicroBT\'s newer air-cooled model, listed at 248 TH/s and 13.5 J/TH, so about 3,348 W. It matches the S21 XP on efficiency with a bit less hashrate per box.',new:WMP['whatsminer-m70s']},
];
for(const m of MODELS){if(!m.w)m.w=Math.round(m.th*m.jth);m.jth=m.jth||+(m.w/m.th).toFixed(1);}
const PRICES=[0.03,0.04,0.05,0.06,0.07,0.08,0.09,0.10];
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
async function j(u){const r=await fetch(u);if(!r.ok)throw new Error(u+' '+r.status);return r.json();}
export async function buildAsic(){
  const [pr,hr,rs,tip]=await Promise.all([j('https://mempool.space/api/v1/prices'),j('https://mempool.space/api/v1/mining/hashrate/3d'),j('https://mempool.space/api/v1/mining/reward-stats/144'),j('https://mempool.space/api/blocks/tip/height')]);
  const D=hr.currentDifficulty, btc=pr.USD, reward=Number(rs.totalReward)/144/1e8;
  const hp=86400e12/(D*2**32)*reward*btc; // USD per TH/s per day
  const now=new Date(), when=now.toLocaleString('en-US',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';
  const iso=now.toISOString();
  const shell=fs.readFileSync('dist/about/index.html','utf8');
  const header=shell.match(/<header[\s\S]*?<\/header>/)[0].replace(/ aria-current="page"/g,'');
  const footer=shell.match(/<footer[\s\S]*?<\/footer>/)[0];
  const headBits=shell.match(/<meta name="theme-color"[\s\S]*?crossorigin>/)[0];
  const page=({title,desc,url,ld,body})=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta property="og:image" content="https://joulemath.com/og-image.png"><meta name="viewport" content="width=device-width,initial-scale=1">
${headBits}
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="joulemath"><meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
${header}<main><div class="wrap">
${body}
</div></main>${footer}
<script src="/js/theme.js" defer></script>
</body></html>
`;
  const dataLine=`Hashprice ${$(hp,4)} per TH/s per day, computed ${when} from the <a href="https://mempool.space/docs/api">mempool.space API</a>: BTC $${btc.toLocaleString("en-US")}, difficulty ${(D/1e12).toFixed(2)} T, average reward ${reward.toFixed(4)} BTC per block over the last 144 blocks.`;
  // Affiliate slots: empty on purpose, render nothing until filled (see .aff-slot:empty in style.css).
  const slots=`<!-- affiliate slots: fill with a disclosed link to activate --><div class="aff-slot" data-slot="asic-seller"></div><div class="aff-slot" data-slot="hosting"></div>`;
  fs.mkdirSync('dist/asic',{recursive:true});
  const rows=[];
  const day=now.toLocaleDateString('en-US',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'});
  const updated=`Last updated <time datetime="${iso}">${day}</time>`;
  // Every model's revenue and break-even at the same live hashprice, so each page can show where it ranks.
  const all=MODELS.map(m=>{const rev=m.th*hp,kwh=m.w/1000*24;return {m,url:`/asic/${m.slug}/`,rev,kwh,be:rev/kwh,p05:rev-kwh*0.05};});
  const byEff=[...all].sort((a,b)=>a.m.jth-b.m.jth);
  // Optional "is it still profitable" sections for models that carry variants/used-price data. Every number here comes from
  // the manufacturer spec, the sourced power prices in power.mjs, the dated used-price index on the model, or the live hashprice.
  const SUBSIDY=3.125, HALVING=1050000, blocksLeft=HALVING-Number(tip);
  const halvingEst=new Date(now.getTime()+blocksLeft*600e3).toLocaleDateString('en-US',{timeZone:'UTC',year:'numeric',month:'long'});
  const hpAfter=hp*Math.max(0,reward-SUBSIDY/2)/reward;
  const days=(price,profit)=>profit>0?Math.round(price/profit).toLocaleString('en-US')+' days':'never';
  function extra(r0){
    const {m,rev,kwh,be}=r0;const html=[],faq=[];
    const n=m.name;
    // 1. Today's verdict against real, sourced power prices.
    const pl=[];for(const c of PLACES)for(const x of c.prices){const usd=x.usd??(x.cur==='AED'?x.amt/3.6725:null);if(usd==null)continue;pl.push({c,x,usd,tag:`${c.short} at $${usd.toFixed(3)}`});}
    const winners=pl.filter(o=>o.usd<be).map(o=>o.tag), losers=pl.filter(o=>o.usd>=be).map(o=>o.tag);
    const verdict=`${be>=0.08?'Yes, at most industrial power prices.':be>=0.06?'Yes on cheap to average industrial power, no on expensive power.':'Only on cheap power.'} At the hashprice on ${day}, one ${n} grosses about ${$(rev)} a day and breaks even at about $${be.toFixed(3)}/kWh before pool fees. Pay less than that and it still makes money; pay more and the power bill is bigger than the revenue.`;
    html.push(`<h2 id="still-profitable">Is the ${esc(n)} still profitable today?</h2>
<p><b>${esc(verdict)}</b></p>
<p>Here is how that line compares with real industrial power prices from our <a href="/power-prices/">power price pages</a>, each with its own source and date.</p>
<table><thead><tr><th>Place</th><th>Price</th><th>$/kWh</th><th>${esc(n)} profit / day</th><th>Pays its power bill?</th></tr></thead><tbody>${pl.map(o=>{const pr=rev-kwh*o.usd;return `<tr><td><a href="/power-prices/${o.c.slug}/">${esc(o.c.short)}</a></td><td>${esc(o.x.label)}</td><td>$${o.usd.toFixed(3)}</td><td>${$(pr)}</td><td>${pr>0?'Yes':'No'}</td></tr>`;}).join('')}</tbody></table>
<p class="note">Prices and their sources: Texas from the <a href="https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a">EIA Electric Power Monthly</a> (July 2026), Paraguay from <a href="https://hashrateindex.com/blog/the-state-of-bitcoin-mining-in-latin-america-2026/">Hashrate Index</a> (October 2026), Ethiopia from <a href="https://addisstandard.com/industry-insiders-say-ethiopias-new-power-tariff-a-crucial-test-for-its-crypto-mining-boom/">Addis Standard</a>, UAE from <a href="https://www.dewa.gov.ae/en/consumer/billing/slab-tariff">DEWA</a> converted at the 3.6725 AED/USD peg. Full notes on each power price page. Profit is gross of pool fees and hardware cost, at spec, 24 hours a day.</p>`);
    faq.push(['faq-still',`Is the ${n} still profitable?`,verdict+(winners.length?` Of the industrial prices we track, it covers its power bill in ${winners.join(', ')}${losers.length?` but not in ${losers.join(', ')}`:''}.`:'')]);
    // 2. Used price and payback, against newer machines at the same hashprice.
    if(m.used){const U=m.used,P=[0.03,0.04,0.05];
     const rows=U.rows.map(u=>{const o=all.find(a=>a.m.slug===u.slug);return {...u,o,pr:P.map(p=>o.rev-o.kwh*p)};});
     const me=rows.find(r=>r.slug===m.slug), p04=me.pr[1];
     const ans=`A used ${n} sold for a median of $${me.price} on eBay (${me.n} sales, ${U.window}, ${U.src}). At $0.04/kWh and the hashprice on ${day}, it nets about ${$(p04)} a day, so it pays back in about ${days(me.price,p04)}${p04>0?'':' (it does not cover its power bill)'}. At $0.03/kWh that drops to ${days(me.price,me.pr[0])}.`;
     html.push(`<h2 id="used-payback">How long does a used ${esc(n)} take to pay back?</h2>
<p><b>${esc(ans)}</b> Cheap to buy, expensive to run: newer machines cost far more up front but burn less power per terahash. Same live hashprice for every machine below.</p>
<table><thead><tr><th>Machine</th><th>Used median (sales)</th><th>Middle half</th><th>Payback at $0.03</th><th>Payback at $0.04</th><th>Payback at $0.05</th></tr></thead><tbody>${rows.map(r=>`<tr${r.slug===m.slug?' class="hl"':''}><td>${r.slug===m.slug?`<b>${esc(r.o.m.name)}</b>`:`<a href="${r.o.url}">${esc(r.o.m.name)}</a>`}</td><td>$${r.price.toLocaleString('en-US')} (${r.n})</td><td>${r.mid}</td>${r.pr.map(x=>`<td>${days(r.price,x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="note">Used prices: <a href="${U.url}">${U.src}</a>, 90-day medians of eBay sales to October 30, 2026, read November 3, 2026. Payback = used price ÷ daily profit at that power price (our arithmetic), holding today's hashprice flat. No pool fee, shipping, hosting or repairs. "Never" means the machine doesn't cover its power bill at that price.</p>`);
     faq.push(['faq-used-price',`How much is a used ${n}?`,`About $${me.price}. That's the median of ${me.n} eBay sales over the 90 days to October 30, 2026, with the middle half from ${me.mid} (${U.src}).`]);
     faq.push(['faq-payback',`How long does a used ${n} take to pay back?`,ans]);}
    // 2b. Upgrade: sell this one used, buy the target used, payback on the extra daily profit.
    if(m.up&&UP[m.slug]&&UP[m.up]){const t=all.find(a=>a.m.slug===m.up),mine=UP[m.slug],theirs=UP[m.up],net=theirs.price-mine.price,P=[0.03,0.04,0.05,0.06];
     const g=P.map(p=>({p,a:rev-kwh*p,b:t.rev-t.kwh*p}));const g5=g[2],gain5=g5.b-g5.a;
     const ans=`Selling a used ${n} (median $${mine.price.toLocaleString('en-US')}) and buying a used ${t.m.name} (median $${theirs.price.toLocaleString('en-US')}) costs about $${net.toLocaleString('en-US')} net. At $0.05/kWh the ${t.m.name} nets about ${$(gain5)} a day more than the ${n}, so the swap pays for itself in about ${days(net,gain5)} at today's hashprice. The cheaper your power, the less the swap is worth.`;
     html.push(`<h2 id="upgrade">Should you swap your ${esc(n)} for ${/^[AEIOU]/.test(t.m.name)?'an':'a'} ${esc(t.m.name)}?</h2>
<p><b>${esc(ans)}</b> The ${esc(t.m.name)} also draws ${(t.m.w-m.w>=0?(t.m.w-m.w).toLocaleString('en-US')+' W more':(m.w-t.m.w).toLocaleString('en-US')+' W less')} per box (${t.m.w.toLocaleString('en-US')} W vs ${m.w.toLocaleString('en-US')} W), so check your circuit first.</p>
<table><thead><tr><th>Power price</th><th>${esc(n)} profit / day</th><th>${esc(t.m.name)} profit / day</th><th>Extra per day</th><th>Swap payback</th></tr></thead><tbody>${g.map(x=>`<tr${x.p===0.05?' class="hl"':''}><td>$${x.p.toFixed(2)}</td><td>${$(x.a)}</td><td>${$(x.b)}</td><td>${$(x.b-x.a)}</td><td>${days(net,x.b-x.a)}</td></tr>`).join('')}</tbody></table>
<p class="note">Used medians from <a href="${ING.url}">${ING.src}</a> (${ING.window}, read November 3, 2026). Net cost = ${esc(t.m.name)} median minus ${esc(n)} median. Payback = net cost ÷ extra daily profit (our arithmetic), holding today's hashprice flat. No pool fee, shipping, eBay fees or hosting.</p>`);
     faq.push(['faq-upgrade',`Should I upgrade my ${n} to ${/^[AEIOU]/.test(t.m.name)?'an':'a'} ${t.m.name}?`,ans]);}
    // 2c. New list price payback (MicroBT shop), compared across the MicroBT models we price.
    if(m.new){const P=[0.03,0.04,0.05,0.06],wm=all.filter(a=>a.m.new);
     const me=P.map(p=>rev-kwh*p);
     const ans=`MicroBT lists the ${n} at $${m.new.price.toLocaleString('en-US')} new on its shop. At $0.04/kWh and the hashprice on ${day} it nets about ${$(me[1])} a day, so the machine alone pays back in about ${days(m.new.price,me[1])}. At $0.03/kWh it's about ${days(m.new.price,me[0])}. That leaves out shipping, import duty, hosting${m.slug==='whatsminer-m63s'||m.slug==='whatsminer-m66s'?' and the cooling setup':''}.`;
     html.push(`<h2 id="new-payback">How long does a new ${esc(n)} take to pay back?</h2>
<p><b>${esc(ans)}</b> Here it is next to the other MicroBT models we price, all at the same live hashprice.</p>
<table><thead><tr><th>Machine</th><th>List price</th><th>$ per TH</th><th>Payback at $0.03</th><th>Payback at $0.04</th><th>Payback at $0.05</th><th>Payback at $0.06</th></tr></thead><tbody>${wm.map(o=>`<tr${o===r0?' class="hl"':''}><td>${o===r0?`<b>${esc(o.m.name)}</b>`:`<a href="${o.url}">${esc(o.m.name)}</a>`}</td><td><a href="${o.m.new.url}">$${o.m.new.price.toLocaleString('en-US')}</a></td><td>$${(o.m.new.price/o.m.th).toFixed(2)}</td>${P.map(p=>`<td>${days(o.m.new.price,o.rev-o.kwh*p)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="note">List prices from the <a href="https://shop.whatsminer.com/products">MicroBT shop</a>, read November 3, 2026, for the hashrate bin shown on each page. Payback = list price ÷ daily profit (our arithmetic), holding today's hashprice flat. Shop prices change often; check before you buy.</p>`);
     faq.push(['faq-new-price',`How much does a new ${n} cost?`,`$${m.new.price.toLocaleString('en-US')} on the MicroBT shop on November 3, 2026, which is $${(m.new.price/m.th).toFixed(2)} per TH/s.`]);
     faq.push(['faq-new-payback',`How long does a new ${n} take to pay back?`,ans]);}
    // 2d. Spec sheet and site needs, straight from the manufacturer page.
    if(m.specs){html.push(`<h2 id="specs">What does the ${esc(n)} need to run?</h2>
<p>${esc(m.site)}</p>
<table><thead><tr><th>Spec</th><th>${esc(n)}</th></tr></thead><tbody>${m.specs.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
<p class="note">From the <a href="${m.new?m.new.url:m.url}">${esc(m.new?'MicroBT shop product page':m.src)}</a>, accessed November 3, 2026.</p>`);
     faq.push(['faq-specs',`What power and cooling does the ${n} need?`,m.site+' '+m.specs.filter(([k])=>/Cooling|Input power|Power on wall/.test(k)).map(([k,v])=>`${k}: ${v}.`).join(' ')]);}
    // 3. Halving: same price, difficulty and fees, half the subsidy.
    {const beAfter=hpAfter*m.th/kwh;const ans=`If BTC price, difficulty and fees stayed where they are, its break-even would fall from about $${be.toFixed(3)} to about $${beAfter.toFixed(3)}/kWh. The subsidy halves from ${SUBSIDY} to ${SUBSIDY/2} BTC at block ${HALVING.toLocaleString('en-US')}, ${blocksLeft.toLocaleString('en-US')} blocks from now, which at 10 minutes a block is around ${halvingEst}.`;
     html.push(`<h2 id="halving">Will the ${esc(n)} be profitable after the 2028 halving?</h2>
<p><b>${esc(ans)}</b> Fees make up the rest of the block reward: ${reward.toFixed(4)} BTC per block on average over the last 144 blocks, of which ${SUBSIDY} is subsidy (<a href="https://mempool.space/docs/api">mempool.space</a>). Price and difficulty will move before then, so treat this as a stress test, not a forecast.</p>`);
     faq.push(['faq-halving',`Will the ${n} be profitable after the 2028 halving?`,ans]);}
    // 4. Bins of the same machine.
    if(m.variants){html.push(`<h2 id="versions">Which ${esc(n)} version do you have, and does it matter?</h2>
<p><b>For break-even, no.</b> ${esc(m.maker)} sells the ${esc(n)} in ${m.variants.length} hashrate bins from ${m.variants[m.variants.length-1][0]} to ${m.variants[0][0]} TH/s, all rated ${m.jth} J/TH, so every bin breaks even at the same power price. Bigger bins just earn, or lose, more per box.</p>
<table><thead><tr><th>Version</th><th>W</th><th>Revenue / day</th><th>Profit / day at $0.04</th><th>Profit / day at $0.05</th></tr></thead><tbody>${m.variants.map(([t,w])=>{const rv=t*hp,k=w/1000*24;return `<tr${t===m.th?' class="hl"':''}><td>${t} TH/s</td><td>${w.toLocaleString('en-US')}</td><td>${$(rv)}</td><td>${$(rv-k*0.04)}</td><td>${$(rv-k*0.05)}</td></tr>`;}).join('')}</tbody></table>
<p class="note">Bins and wattage from the <a href="${m.url}">${m.src}</a> (accessed November 3, 2026), which allows ±3% on hashrate and ±5% on power. Revenue at the hashprice below.</p>`);
     faq.push(['faq-versions',`What is the difference between the ${n} versions?`,`Only the hashrate bin. ${m.maker} lists ${m.variants.map(v=>v[0]+'T').join(', ')} versions, all at ${m.jth} J/TH, from ${m.variants[m.variants.length-1][1].toLocaleString('en-US')} W to ${m.variants[0][1].toLocaleString('en-US')} W. They all break even at the same power price.`]);}
    return {html:html.join('\n'),faq};
  }
  for(const r0 of all){
    const {m,url,rev,kwh,be,p05}=r0;
    const tbl=PRICES.map(p=>{const c=kwh*p,pr=rev-c;return `<tr${p===0.05?' class="hl"':''}><td>$${p.toFixed(2)}</td><td>${$(rev)}</td><td>${$(c)}</td><td><b>${$(pr)}</b></td><td>${$(pr*30,0)}</td></tr>`;}).join('');
    rows.push({m,url,rev,be,p05});
    const rank=byEff.indexOf(r0)+1, n=MODELS.length;
    const cmp=byEff.map(o=>`<tr${o===r0?' class="hl"':''}><td>${o===r0?`<b>${o.m.name}</b>`:`<a href="${o.url}">${o.m.name}</a>`}</td><td>${o.m.th}</td><td>${o.m.w.toLocaleString('en-US')}</td><td>${o.m.jth}</td><td>${$(o.rev)}</td><td>$${o.be.toFixed(3)}</td></tr>`).join('');
    const title=m.title||`${m.name} profitability: profit per day and break-even`;
    const ex=extra(r0);
    const desc=m.used?`${m.name} (${m.th} TH/s, ${m.jth} J/TH) breaks even at about $${be.toFixed(3)}/kWh today. Profit per day, used price and payback${m.up?', upgrade math':''} and the 2028 halving.`:m.new?`${m.name} (${m.th} TH/s, ${m.jth} J/TH): profit per day, break-even about $${be.toFixed(3)}/kWh, new price $${m.new.price.toLocaleString('en-US')} and payback${m.specs?', plus cooling and power specs':''}.`:`${m.name} (${m.th} TH/s, ${m.w.toLocaleString('en-US')} W, ${m.jth} J/TH): daily revenue, power cost and profit at $0.03 to $0.10/kWh from live hashprice. Break-even about $${be.toFixed(3)}/kWh.`;
    // FAQ answers: plain text built only from the manufacturer spec above and the live hashprice. Same text goes on the page and into FAQPage JSON-LD.
    const faq=[...ex.faq,
     ['faq-day',`How much does the ${m.name} make per day?`,`At a hashprice of ${$(hp,4)} per TH/s per day, one ${m.name} (${m.th} TH/s) grosses about ${$(rev)} a day before power. At $0.05/kWh it ${p05<0?`loses about ${$(-p05)} a day after the power bill, or about ${$(-p05*30,0)} over 30 days`:`keeps about ${$(p05)} a day after the power bill, or about ${$(p05*30,0)} over 30 days`}.`],
     ['faq-power',`How much electricity does the ${m.name} use?`,`${m.maker} lists it at ${m.w.toLocaleString('en-US')} W, so it uses about ${kwh.toFixed(1)} kWh a day running 24 hours. At $0.05/kWh that's about ${$(kwh*0.05)} a day of power.`],
     ['faq-breakeven',`What power price does the ${m.name} need to be profitable?`,`Below about $${be.toFixed(3)}/kWh at today's hashprice. That's its daily revenue (${$(rev)}) divided by its daily energy use (${kwh.toFixed(1)} kWh). Pool fees aren't included, so if your pool charges one the real line is a bit lower.`],
     ['faq-rank',`Is the ${m.name} efficient compared with other ASICs?`,`At ${m.jth} J/TH it ranks ${rank} of ${n} on efficiency among the Antminer and WhatsMiner models we track (lower J/TH is better). The most efficient here is the ${byEff[0].m.name} at ${byEff[0].m.jth} J/TH.`],
     ['faq-left-out','What do these numbers leave out?','Pool fees, downtime, hosting markups and the price of the machine itself. They also hold difficulty and the BTC price where they are today, and both move. Use the ASIC calculator for your own pool fee and power price.']];
    const body=`<article class="prose post"><p class="eyebrow"><a href="/asic/">ASIC profitability</a> · ${updated}</p><h1>${esc(m.h1||m.name+' profitability')}</h1>
<p class="lead"><b>Short answer:</b> ${be<0.08?`only if your power costs less than about <b>$${be.toFixed(3)}/kWh</b>. One `:'one '}${esc(m.name)} grosses about <b>${$(rev)}</b> a day at the hashprice on ${day}, ${p05<0?`loses about <b>${$(-p05)}</b>`:`keeps about <b>${$(p05)}</b>`} a day at $0.05/kWh, and stops making money above about <b>$${be.toFixed(3)}/kWh</b>. Specs from the <a href="${m.url}">${m.src}</a>, hashprice from the <a href="https://mempool.space/docs/api">mempool.space API</a>.</p>
<p>Want your own power price and pool fee? Open the <a href="/mining-calculator/#m-${m.slug}">ASIC miner profitability calculator</a> with the ${esc(m.name)} preloaded.</p>
<p>${esc(m.intro)}</p>
<ul><li><b>Hashrate:</b> ${m.th} TH/s</li><li><b>Power:</b> ${m.w.toLocaleString('en-US')} W</li><li><b>Efficiency:</b> ${m.jth} J/TH</li><li><b>Source:</b> <a href="${m.url}">${m.src}</a>, accessed ${m.accessed||'October 21, 2026'}.${m.maker==='MicroBT'&&!m.specs?' The shop lists hashrate and J/TH; the wattage is our arithmetic (TH/s × J/TH).':''}</li></ul>
<h2 id="daily-profit">How much does the ${esc(m.name)} make a day at different power prices?</h2>
<p>At the hashprice below, one ${esc(m.name)} grosses about <b>${$(rev)}</b> a day. At $0.05/kWh it ${p05<0?`loses about <b>${$(-p05)}</b>`:`nets about <b>${$(p05)}</b>`} a day, and it breaks even at about <b>$${be.toFixed(3)}/kWh</b>.</p>
<table><thead><tr><th>Power price</th><th>Revenue / day</th><th>Power / day</th><th>Profit / day</th><th>Profit / 30 days</th></tr></thead><tbody>${tbl}</tbody></table>
<p class="note">${dataLine} Revenue is gross: no pool fee, downtime, hosting markup or hardware cost. Assumes the machine runs at spec 24 hours a day (our assumption). Figures update when the site is rebuilt.</p>
<h2 id="break-even">What is the ${esc(m.name)} break-even power price?</h2>
<p>Break-even is daily revenue divided by daily energy use. The ${esc(m.name)} burns ${m.w.toLocaleString('en-US')} W × 24 h = about ${kwh.toFixed(1)} kWh a day, and grosses about ${$(rev)}, so it breaks even at about <b>$${be.toFixed(3)}/kWh</b>. Pay more than that for power and the bill is bigger than the revenue.</p>
${ex.html}
<h2 id="compare">How does the ${esc(m.name)} compare with other ASICs?</h2>
<p>Same live hashprice for every machine, sorted by efficiency (lowest J/TH first). The ${esc(m.name)} ranks <b>${rank} of ${n}</b>.</p>
<table><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Break-even $/kWh</th></tr></thead><tbody>${cmp}</tbody></table>
<p class="note">Specs from each manufacturer, linked on each model page. Gross revenue, no pool fee or hardware cost.</p>
${slots}
<h2 id="faq">FAQ</h2>
${faq.map(([id,q,a])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
<div class="callout"><b>Use your own numbers or paste your payout address.</b> Pool fee, live price and your exact power cost are all inputs in the ASIC calculator, or paste your Bitcoin mining payout address in <a href="/fleet/">Fleet Check</a> to reconcile your actual 90-day on-chain payouts.<br><a class="btn" href="/mining-calculator/#m-${m.slug}">Open the ASIC calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark your payout address <span aria-hidden="true">→</span></a></div>
<p>Wondering whether the same kilowatts would earn more renting GPUs? Try the <a href="/">mine vs AI per-kW calculator</a>, or see what an <a href="/gpu/h100/">H100</a> or <a href="/gpu/rtx-4090/">RTX 4090</a> earns per kW. What power costs in big mining places: <a href="/power-prices/">industrial power prices</a>. Learn the math: <a href="/guides/is-bitcoin-mining-profitable-2026/">is Bitcoin mining profitable in 2026?</a> Or see <a href="/asic/">all ASICs</a>.</p>
<!--signup--></article>
<section class="cta"><div><h2>Already mining?</h2><p>Track your real per-site numbers (uptime, power cost, curtailment, payouts) instead of estimates.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=asic-model&amp;p=cta">See Flash for miners <span aria-hidden="true">→</span></a></section>`;
    const ld={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":iso,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"ASIC profitability","item":SITE+'/asic/'},{"@type":"ListItem","position":2,"name":m.name,"item":SITE+url}]}},
     {"@type":"FAQPage","mainEntity":faq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
    fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',page({title:`${title} | joulemath`,desc,url,ld,body}));
  }
  rows.sort((a,b)=>b.be-a.be);
  const top=rows[0],low=rows[rows.length-1],pos=rows.filter(r=>r.p05>0);
  const hubFaq=[['faq-most-profitable','What is the most profitable Bitcoin ASIC miner right now?',`On break-even power price, the ${top.m.name} (${top.m.jth} J/TH): it keeps making money up to about $${top.be.toFixed(3)}/kWh at the hashprice on ${day}. The ${low.m.name} (${low.m.jth} J/TH) is the first to go underwater, at about $${low.be.toFixed(3)}/kWh.`],
   ['faq-how-many',`Which ASIC miners are profitable at $0.05/kWh?`,pos.length?`${pos.length} of the ${rows.length} models we track: ${pos.map(r=>r.m.name).join(', ')}. That's gross of pool fees and the machine price.`:`None of the ${rows.length} models we track cover a $0.05/kWh power bill at today's hashprice.`],
   ['faq-calc','How do you calculate ASIC miner profitability?',`Daily profit = TH/s × hashprice − (watts ÷ 1000 × 24 × power price). Hashprice is what one TH/s earns per day, ${$(hp,4)} on ${day} from mempool.space data. Break-even power price = TH/s × hashprice ÷ daily kWh.`]];
  const body=`<div class="prose post"><p class="eyebrow">ASIC profitability · ${updated}</p><h1>ASIC miner profitability by model (live)</h1>
<p class="lead"><b>Short answer:</b> at the hashprice on ${day} (${$(hp,4)} per TH/s per day), ${pos.length} of ${rows.length} popular Antminer and WhatsMiner models still make money at $0.05/kWh. The ${esc(top.m.name)} has the most room, breaking even at about <b>$${top.be.toFixed(3)}/kWh</b>; the ${esc(low.m.name)} needs power under about <b>$${low.be.toFixed(3)}/kWh</b>. For your own numbers use the <a href="/mining-calculator/">ASIC miner profitability calculator</a>.</p>
<p>Daily revenue, profit at $0.05/kWh and break-even power price for each model, using one live hashprice for all of them so they compare fairly.</p>
<table class="sortable"><caption class="note">Tap a column header to sort.</caption><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Profit / day at $0.05</th><th aria-sort="descending">Break-even $/kWh</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="${r.url}">${r.m.name}</a></td><td data-v="${r.m.th}">${r.m.th}</td><td data-v="${r.m.w}">${r.m.w.toLocaleString('en-US')}</td><td data-v="${r.m.jth}">${r.m.jth}</td><td data-v="${r.rev}">${$(r.rev)}</td><td data-v="${r.p05}">${$(r.p05)}</td><td data-v="${r.be}">$${r.be.toFixed(3)}</td></tr>`).join('')}</tbody></table><script src="/js/sort.js" defer></script>
<p class="note">${dataLine} Specs from each manufacturer, linked on each model page. Gross revenue, no pool fee or hardware cost.</p>
<p>For your own power price and pool fee, use the <a href="/mining-calculator/">ASIC calculator</a>, or paste your Bitcoin payout address into <a href="/fleet/">Fleet Check</a> to benchmark your last 90 days of on-chain payouts against AI GPU rigs. To see what the same kilowatts earn renting GPUs, try the <a href="/gpu/">GPU rental prices</a> page. Power costs by country are on the <a href="/power-prices/">industrial power prices</a> page, and the formulas are on the <a href="/methodology/">methodology</a> page.</p>
<h2 id="faq">FAQ</h2>
${hubFaq.map(([id,q,a])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}<!--signup--></div>`;
  const hubLd={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","name":"ASIC miner profitability by model","url":SITE+'/asic/',"dateModified":iso,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+'/'},{"@type":"ListItem","position":2,"name":"ASIC profitability","item":SITE+'/asic/'}]}},
   {"@type":"FAQPage","mainEntity":hubFaq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
  fs.writeFileSync('dist/asic/index.html',page({title:'ASIC miner profitability by model (live hashprice) | joulemath',desc:'Antminer S21 XP, S21 Pro, S21, S19 XP, S19k Pro, S19j Pro and WhatsMiner M60S, M66S, M63S, M70S: profit per day and break-even power price from live hashprice.',url:'/asic/',ld:hubLd,body}));
  // /mining-calculator/: fill the build-time markers (snapshot, model presets, compare table, worked example, FAQ, JSON-LD).
  {const f='dist/mining-calculator/index.html';let h=fs.readFileSync(f,'utf8');
   const xp=all.find(a=>a.m.slug==='antminer-s21-xp'),ex=all.find(a=>a.m.slug==='antminer-s19-xp'),exC=ex.kwh*0.05,exP=ex.rev-exC,fee=ex.rev*0.02;
   const btcTh=86400e12/(D*2**32)*reward;
   const cq=[['faq-hashprice','What is hashprice?',`Hashprice is what one TH/s of hashrate earns in a day. It comes from network difficulty, the average block reward (subsidy plus fees) and the BTC price. On ${day} it was ${$(hp,4)} per TH/s per day: difficulty ${(D/1e12).toFixed(2)} T, ${reward.toFixed(4)} BTC per block over the last 144 blocks and BTC at $${btc.toLocaleString('en-US')}.`],
    ['faq-best','What is the most profitable ASIC miner right now?',`Of the models we track, the ${byEff[0].m.name} at ${byEff[0].m.jth} J/TH has the highest break-even power price, about $${byEff[0].be.toFixed(3)}/kWh at today's hashprice. Efficiency (J/TH) decides who survives cheap hashprice; raw TH/s only decides how big the numbers are.`],
    ['faq-power-price','What electricity price do you need to mine Bitcoin profitably?',`It depends on the machine. At today's hashprice an ${xp.m.name} breaks even at about $${xp.be.toFixed(3)}/kWh and an ${ex.m.name} at about $${ex.be.toFixed(3)}/kWh, before pool fees. Formula: break-even = TH/s × hashprice ÷ (watts ÷ 1000 × 24).`],
    ['faq-pool-fee','Does the calculator include pool fees?','Yes. The pool fee box comes off revenue before power is subtracted, and it starts at 2%. The model table on this page is gross of pool fees so every machine compares on the same basis.'],
    ['faq-payback','How do you work out ASIC payback?',`Divide what you paid for the machine by its daily profit. A used ${ex.m.name} sold for a median of $${UP[ex.m.slug].price} on eBay over the 90 days to October 30, 2026 (ING Mining). At $0.04/kWh it nets about ${$(ex.rev-ex.kwh*0.04)} a day today, so about ${days(UP[ex.m.slug].price,ex.rev-ex.kwh*0.04)} to pay back if nothing changes.`],
    ['faq-change','How often do the numbers change?','Difficulty adjusts every 2,016 blocks, about every two weeks, and the BTC price and fees move all the time. The calculator reads them live every time you load it; the table on this page is rebuilt daily.']];
   const opts=byEff.map(o=>`<option value="${o.m.th},${o.m.w}" data-slug="${o.m.slug}">${esc(o.m.name)} (${o.m.th} TH/s, ${o.m.w.toLocaleString('en-US')} W)</option>`).join('');
   const tb=byEff.map(o=>`<tr id="m-${o.m.slug}"><td><a href="${o.url}">${esc(o.m.name)}</a></td><td>${o.m.th}</td><td>${o.m.w.toLocaleString('en-US')}</td><td>${o.m.jth}</td><td>${$(o.rev)}</td><td>${$(o.p05)}</td><td>$${o.be.toFixed(3)}</td><td><a href="#m-${o.m.slug}">Load</a></td></tr>`).join('');
   const body=`<article class="prose post" style="margin-top:2rem">
<h2 id="by-model">Which ASIC miners are profitable today?</h2>
<p>Every model at the same live hashprice (${$(hp,4)} per TH/s per day on ${day}), most efficient first. Tap Load to put a model into the calculator.</p>
<table><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Profit / day at $0.05</th><th>Break-even $/kWh</th><th></th></tr></thead><tbody>${tb}</tbody></table>
<p class="note">${dataLine} Specs from each manufacturer, linked on each <a href="/asic/">model page</a>. Gross of pool fee and hardware cost, 24 hours a day at spec.</p>
<h2 id="how-to">How do you calculate ASIC miner profitability?</h2>
<p>Four steps. Worked example: an ${esc(ex.m.name)} (${ex.m.th} TH/s, ${ex.m.w.toLocaleString('en-US')} W) at $0.05/kWh with a 2% pool fee, at the network numbers on ${day}.</p>
<ol><li><b>Hashprice.</b> BTC earned per TH/s per day = 86,400 × 10<sup>12</sup> ÷ (difficulty × 2<sup>32</sup>) × average block reward = ${(btcTh*1e8).toFixed(1)} sats (${btcTh.toFixed(10)} BTC). Times the BTC price = <b>${$(hp,4)}</b> per TH/s per day.</li>
<li><b>Revenue.</b> ${ex.m.th} TH/s × ${$(hp,4)} = <b>${$(ex.rev)}</b> a day. Less a 2% pool fee (${$(fee)}) = ${$(ex.rev-fee)}.</li>
<li><b>Power cost.</b> ${ex.m.w.toLocaleString('en-US')} W ÷ 1000 × 24 h = ${ex.kwh.toFixed(1)} kWh a day × $0.05 = <b>${$(exC)}</b>.</li>
<li><b>Profit and break-even.</b> ${$(ex.rev-fee)} − ${$(exC)} = <b>${$(exP-fee)}</b> a day. Break-even power price = revenue ÷ kWh = ${$(ex.rev-fee)} ÷ ${ex.kwh.toFixed(1)} = <b>$${((ex.rev-fee)/ex.kwh).toFixed(3)}/kWh</b>.</li></ol>
<p>Full formulas and data sources are on the <a href="/methodology/">methodology page</a>. To see what power actually costs in mining regions, check <a href="/power-prices/">industrial power prices by country</a>, like <a href="/power-prices/canada-quebec/">Quebec</a> or <a href="/power-prices/united-states-texas/">Texas</a>.</p>
<h2 id="faq">FAQ</h2>
${cq.map(([id,q,a])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
<p class="note">Used prices: <a href="${ING.url}">${ING.src}</a>, ${ING.window}. Network data: <a href="https://mempool.space/docs/api">mempool.space API</a>. Specs: each manufacturer, linked on the <a href="/asic/">ASIC model pages</a>.</p>
</article>`;
   const ld={"@context":"https://schema.org","@graph":[{"@type":"WebApplication","name":"ASIC miner profitability calculator","url":SITE+'/mining-calculator/',"description":"Bitcoin ASIC miner profitability calculator: profit per day, break-even power price and payback from live hashprice.","applicationCategory":"FinanceApplication","operatingSystem":"Any","browserRequirements":"Requires JavaScript","isAccessibleForFree":true,"dateModified":iso,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"featureList":["Live hashprice from mempool.space","Live BTC price","Pool fee","Break-even power price","Hardware payback","USD and EUR",`${MODELS.length} preset ASIC models`]},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+'/'},{"@type":"ListItem","position":2,"name":"ASIC miner profitability calculator","item":SITE+'/mining-calculator/'}]},
    {"@type":"FAQPage","mainEntity":cq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
   const snap=`<b>Today:</b> hashprice is ${$(hp,4)} per TH/s per day. An ${esc(xp.m.name)} grosses about ${$(xp.rev)} a day, keeps about ${$(xp.p05)} at $0.05/kWh and breaks even at about $${xp.be.toFixed(3)}/kWh. An ${esc(ex.m.name)} breaks even at about $${ex.be.toFixed(3)}/kWh.`;
   for(const [k,v] of [['<!--calc-ld-->',`<script type="application/ld+json">${JSON.stringify(ld)}</script>`],['<!--calc-date-->',updated],['<!--calc-snap-->',snap],['<!--calc-models-->',opts],['<!--calc-body-->',body]]){if(!h.includes(k))throw new Error('calc marker '+k);h=h.replace(k,v);}
   fs.writeFileSync(f,h);}
  console.log('asic: hashprice',hp.toFixed(4),'pages',MODELS.length);
  return {hp,btc,D,reward,eurPerUsd:pr.EUR/pr.USD,when,iso,day,updated,dataLine,page,models:all};
}
