// ASIC long-tail pages: dist/asic/<slug>/index.html + dist/asic/index.html.
// Hashprice is computed at build time from mempool.space; the build fails if the fetch fails (no stale or invented numbers).
import fs from 'fs';
import {PLACES} from './power.mjs';
const SITE='https://joulemath.com';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const BM='Bitmain spec sheet', WM='MicroBT WhatsMiner shop listing';
const WMURL='https://shop.whatsminer.com/products';
// Used prices: ING Mining used ASIC sold price index (eBay sales, CSV ing-used-asic-price-index-latest.csv), 90-day medians and middle half to November 11, 2026 (as_of in the CSV), read November 13, 2026. Medians rounded to the dollar.
const ING={src:'ING Mining used ASIC miner sold prices',url:'https://ingmining.com/used-asic-miner-sold-prices',window:'90 days of eBay sales to November 11, 2026',read:'November 13, 2026'};
const UP={'antminer-s19j-pro':{price:170,n:12,mid:'$140 to $189'},'antminer-s19-xp':{price:289,n:52,mid:'$250 to $350'},'antminer-s19k-pro':{price:330,n:10,mid:'$257 to $351'},
 'antminer-s21':{price:988,n:12,mid:'$938 to $1,012'},'antminer-s21-pro':{price:1600,n:13,mid:'$1,500 to $1,600'},'antminer-s21-xp':{price:2349,n:18,mid:'$2,178 to $2,574'}};
const used=(...sl)=>({...ING,rows:sl.map(slug=>({slug,...UP[slug]}))});
// New list prices on the MicroBT shop (shop.whatsminer.com/products and product pages), read November 3, 2026, rechecked November 13, 2026 (same prices; the M63S 408T bin shows SOLD).
const WMP={'whatsminer-m60s':{price:1674,url:'https://shop.whatsminer.com/products'},'whatsminer-m66s':{price:2610,url:'https://shop.whatsminer.com/products/details/69?skuId=136'},
 'whatsminer-m63s':{price:3672,sold:'November 13, 2026',url:'https://shop.whatsminer.com/products/details/67?skuId=132'},'whatsminer-m70s':{price:3472,url:'https://shop.whatsminer.com/products'}};
// Specs as published by the manufacturer, accessed Oct 21, 2026. For WhatsMiner the shop lists hashrate and J/TH; watts = TH x J/TH (our arithmetic).
export const MODELS=[
 {slug:'antminer-s21-xp',name:'Antminer S21 XP',maker:'Bitmain',th:270,w:3645,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications',
  intro:'The S21 XP is the most efficient air-cooled Antminer on this list at 13.5 J/TH, pushing 270 TH/s from 3,645 W. That efficiency is why it keeps a margin at power prices where older machines are underwater. It is the benchmark the other machines on this site are measured against. Below: what it earns today, what the electricity costs per bitcoin mined, whether new or used pays back sooner, and what one megawatt of them looks like.',
  accessed:'November 9, 2026',specsAccessed:'November 9, 2026',
  used:used('antminer-s21-xp','antminer-s21-pro','antminer-s21','antminer-s19-xp'),
  newBM:{date:'November 13, 2026',n:7,window:'365 days of eBay sales to November 11, 2026',rows:[{who:'lowest new eBay sale',price:3050,url:'https://ingmining.com/used-asic-miner-sold-prices'},{who:'median new eBay sale',price:4000,url:'https://ingmining.com/used-asic-miner-sold-prices'}]},
  mw:{peers:['antminer-s21-xp','antminer-s21-pro','antminer-s21','antminer-s19-xp'],basis:'used',label:'Antminer'},
  specs:[['Hashrate','270 TH/s typical (±3%)'],['Power on wall at 25 °C','3,645 W (±5%)'],['Efficiency','13.5 J/TH (±5%)'],['Input power','220 to 277 V AC, 50 to 60 Hz, 20 A single-phase'],['Adapted AC output power requirement','4,000 W'],['Network','RJ45 Ethernet 10/100M'],['Size without box','449 × 219 × 293 mm'],['Net weight','18.7 kg'],['Noise','76 dBA with fans at maximum speed'],['Operating temperature','-20 to 45 °C'],['Operating humidity','10 to 90% RH, non-condensing'],['Altitude','Up to 2,000 m (max temperature drops 1 °C per 300 m above 900 m)']],
  site:'Bitmain lists 220 to 277 V AC input on a single 20 A feed, a narrower range than the 200 to 240 V on the S19 XP spec sheet, so check your supply voltage before you buy. Bitmain quotes 76 dBA with fans at maximum speed, so it needs a hosting hall or a separated building, not a spare room. It is also 4.5 kg heavier than the S19 XP.'},
 {slug:'antminer-s21-pro',name:'Antminer S21 Pro',maker:'Bitmain',th:234,w:3510,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification',
  intro:'The S21 Pro sits between the S21 and the S21 XP: 234 TH/s at 3,510 W, or 15 J/TH. It draws almost the same power as a plain S21 but hashes 17% more.',
  used:used('antminer-s21-pro','antminer-s21','antminer-s21-xp'),up:'antminer-s21-xp'},
 {slug:'antminer-s21',name:'Antminer S21',maker:'Bitmain',th:200,w:3500,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification',
  intro:'The original S21 does 200 TH/s at 3,500 W, which is 17.5 J/TH. It is the baseline for the S21 family, and a useful yardstick for how much the Pro and XP versions improved. It draws almost exactly what the S21 Pro does (3,500 W vs 3,510 W) while hashing about 15% less, and 15% more than an S19 XP (3,031.5 W) for 42% more hashrate. Whether a used one beats a newer machine is what the payback, upgrade and megawatt sections below work out.',
  accessed:'November 9, 2026',specsAccessed:'November 9, 2026',
  used:used('antminer-s21','antminer-s21-pro','antminer-s21-xp'),up:'antminer-s21-xp',
  mw:{peers:['antminer-s21','antminer-s21-pro','antminer-s21-xp','antminer-s19-xp'],basis:'used',label:'Antminer'},
  specs:[['Hashrate','200 TH/s'],['Power on wall at 25 °C','3,500 W'],['Efficiency','17.5 J/TH'],['Input power','220 to 277 V AC, 47 to 63 Hz, 20 A on one AC input wire'],['Network','RJ45 Ethernet 10/100M'],['Size without box, including PSU','400 × 195 × 290 mm'],['Net weight, including PSU','15.4 kg'],['Operating temperature','0 to 45 °C'],['Operating humidity','10 to 90% RH, non-condensing'],['Altitude','Up to 2,000 m (max temperature drops 1 °C per 300 m above 900 m)']],
  specNote:'Bitmain\'s spec sheet also says Secure Boot is switched on and root access is disabled, to stop firmware viruses. If you plan to run third-party firmware for underclocking or autotuning, check that it supports your unit before you buy.',
  site:'Like the S21 XP it is air-cooled and wants 220 to 277 V AC on a 20 A feed. At 15.4 kg including its power supply it is 3.3 kg lighter than the S21 XP,, and its 400 × 195 × 290 mm footprint matches the S19k Pro.'},
 {slug:'antminer-s19-xp',name:'Antminer S19 XP',maker:'Bitmain',th:141,w:3031.5,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/8906244096409-S19-XP-Specifications',
  title:'Antminer S19 XP profitability today: profit, break-even, payback',h1:'Antminer S19 XP profitability: is it still worth running?',accessed:'November 3, 2026',
  intro:'The S19 XP was the top S19 when it launched: 141 TH/s at 3,031.5 W, or 21.5 J/TH. Today it uses about 60% more energy per terahash than an S21 XP, so power price decides almost everything. It is also one of the most traded used miners: 52 eBay sales in the 90 days to November 11, 2026, more than any other model in the ING Mining index.',
  used:used('antminer-s19-xp','antminer-s19j-pro','antminer-s19k-pro','antminer-s21','antminer-s21-pro','antminer-s21-xp'),up:'antminer-s21-xp',
  specs:[['Model','240-Ca'],['Hashrate','141 TH/s ±3%'],['Power on wall at 25 °C','3,031.5 W ±5%'],['Efficiency','21.5 J/TH ±5%'],['Input power','200 to 240 V AC, 20 A max over two 10 A cords'],['Size without box','400 × 195.5 × 290 mm'],['Net weight','14.2 kg'],['Operating temperature','0 to 40 °C'],['Altitude','Up to 2,000 m (max temperature drops 1 °C per 300 m above 900 m)']],
  site:'It is a standard air-cooled box on single-phase 200 to 240 V, so it fits most hosting sites. The catch is heat and noise, plus the 20 A draw.'},
 {slug:'antminer-s19j-pro',name:'Antminer S19j Pro',maker:'Bitmain',th:104,w:3068,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/900006762746-S19j-Pro-Specifications',
  title:'Is the Antminer S19j Pro still profitable in 2026?',h1:'Is the Antminer S19j Pro still profitable in 2026?',accessed:'November 3, 2026',up:'antminer-s21-xp',
  intro:'The S19j Pro shipped in 2021 and is still one of the most common used miners out there. The top version does 104 TH/s at 3,068 W, or 29.5 J/TH, which is more than twice the energy per terahash of an S21 XP. So whether it still pays comes down to one thing: your power price.',
  // Bitmain lists six bins of the same 240-Cb machine, all at 29.5 J/TH (same spec page, accessed November 3, 2026).
  variants:[[104,3068],[100,2950],[96,2832],[92,2714],[88,2596],[84,2478]],
  // Used prices: ING Mining used ASIC sold price index (eBay sales), 90-day medians to November 11, 2026, read November 13, 2026.
  used:used('antminer-s19j-pro','antminer-s19-xp','antminer-s21-xp')},
 {slug:'antminer-s19k-pro',name:'Antminer S19k Pro',maker:'Bitmain',th:120,w:2760,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/23833956049049-S19K-Pro-Specifications',
  title:'Antminer S19k Pro profitability: is it still worth it in 2026?',h1:'Antminer S19k Pro profitability in 2026',accessed:'November 3, 2026',
  intro:'The S19k Pro came out in late 2023 (Bitmain posted its spec sheet on October 9, 2023) as a cheaper, lighter S19: 120 TH/s at 2,760 W, or 23 J/TH. It draws less power per box than an S19 XP, but it burns more energy per terahash, so it needs slightly cheaper power to break even. Used ones sold for a bit more than S19 XPs on eBay over the last 90 days.',
  used:used('antminer-s19k-pro','antminer-s19-xp','antminer-s19j-pro','antminer-s21-xp'),up:'antminer-s21-xp',
  specs:[['Hashrate','120 TH/s'],['Power on wall at 25 °C','2,760 W ±5%'],['Efficiency','23 J/TH ±5%'],['Input power','200 to 240 V AC, 20 A max over two 10 A cords'],['Size without box','400 × 195 × 290 mm'],['Net weight','12.85 kg, about 1.35 kg lighter than an S19 XP'],['Operating temperature','0 to 40 °C'],['Operating humidity','10 to 90% RH, non-condensing'],['AC frequency','47 to 63 Hz'],['Network','RJ45 Ethernet 10/100M'],['Altitude','Up to 2,000 m (max temperature drops 1 °C per 300 m above 900 m)']],
  specNote:'Bitmain\'s spec sheet also says Secure Boot is switched on and root access is disabled on S19 series firmware, to stop firmware viruses. If you plan to run third-party firmware for underclocking or autotuning, check that it supports your unit before you buy.',
  mw:{peers:['antminer-s19k-pro','antminer-s19-xp','antminer-s19j-pro','antminer-s21-xp'],basis:'used'},
  site:'Like the S19 XP it is air-cooled on single-phase 200 to 240 V. At 2,760 W it is about 270 W lighter on the circuit than an S19 XP, which matters if you are tight on breaker capacity.'},
 {slug:'whatsminer-m60s',name:'WhatsMiner M60S',maker:'MicroBT',th:186,jth:18.5,src:WM,url:WMURL,
  intro:'The M60S is MicroBT\'s air-cooled workhorse, listed at 186 TH/s and 18.5 J/TH, which works out to about 3,441 W. On paper it lands between the S21 and the S19 XP on efficiency.',new:WMP['whatsminer-m60s']},
 {slug:'whatsminer-m66s',name:'WhatsMiner M66S',maker:'MicroBT',th:290,jth:18.5,src:WM,url:WMURL,
  title:'WhatsMiner M66S profitability: immersion miner profit and payback',h1:'WhatsMiner M66S profitability (immersion)',accessed:'November 3, 2026',
  intro:'The M66S is an immersion-cooled MicroBT unit, listed at 290 TH/s and 18.5 J/TH, with 5,365 W power on wall on its shop page. Same efficiency as the air-cooled M60S, just 56% more hashrate per box. The price of that is the tank: it only runs submerged in dielectric fluid, on 380 to 480 V power.',
  new:WMP['whatsminer-m66s'],cool:'immersion',mw:{peers:['whatsminer-m66s','whatsminer-m60s','whatsminer-m70s','whatsminer-m63s'],basis:'new'},warranty:true,
  specs:[['Cooling','Immersion'],['Hashrate','290 TH/s (a 286 TH/s bin is also listed)'],['Power on wall','5,365 W'],['Efficiency','18.5 J/TH'],['Input power','380 to 480 V AC'],['Power cable','Custom made, 16 A or more'],['Size','267.5 × 147 × 401 mm'],['Net weight','16 kg'],['List price','$2,610 for 290 TH/s ($9 per TH), $2,574 for 286 TH/s']],
  site:'You need an immersion tank, a fluid loop with a dry cooler or heat exchanger, and 380 to 480 V supply. None of that is in the box price, so the payback above is the machine only.'},
 {slug:'whatsminer-m63s',name:'WhatsMiner M63S',maker:'MicroBT',th:408,jth:18,src:WM,url:WMURL,
  title:'WhatsMiner M63S profitability: hydro miner profit and payback',h1:'WhatsMiner M63S profitability (hydro)',accessed:'November 3, 2026',
  intro:'The M63S is a hydro-cooled MicroBT machine, listed at 408 TH/s and 18 J/TH, with 7,344 W power on wall on its shop page. Per box it is the biggest earner here, but per kilowatt it is about the same as an S21. It is a 19-inch rack unit fed by a water loop, not a fan box, so it only makes sense at a site built for hydro.',
  new:WMP['whatsminer-m63s'],cool:'hydro',mw:{peers:['whatsminer-m63s','whatsminer-m60s','whatsminer-m70s','whatsminer-m66s'],basis:'new'},warranty:true,
  specs:[['Cooling','Hydro (water loop)'],['Hashrate','408 TH/s'],['Power on wall','7,344 W'],['Efficiency','18 J/TH'],['Input power','380 to 480 V AC, three wires plus ground, 10 kW input'],['Coolant per machine','About 1 L'],['Power cable','Custom made, 16 A or more'],['Size','86 × 483 × 663 mm with handle'],['Net weight','27.5 kg'],['List price','$3,672 ($9 per TH)']],
  site:'You need rack space, a closed water loop with a dry cooler or cooling tower, and three-phase 380 to 480 V power at about 10 kW per machine. The loop and electrical work are not in the box price, so the payback above is the machine only.'},
 {slug:'whatsminer-m70s',name:'WhatsMiner M70S',maker:'MicroBT',th:248,jth:13.5,src:WM,url:WMURL,
  intro:'The M70S is MicroBT\'s newer air-cooled model, listed at 248 TH/s and 13.5 J/TH, so about 3,348 W. It matches the S21 XP on efficiency with a bit less hashrate per box.',new:WMP['whatsminer-m70s']},
];
// Same-family groups, used for sibling links on each model page.
const FAM=[['antminer-s19-xp','antminer-s19k-pro','antminer-s19j-pro'],['antminer-s21-xp','antminer-s21-pro','antminer-s21'],['whatsminer-m63s','whatsminer-m66s','whatsminer-m60s','whatsminer-m70s']];
for(const m of MODELS){if(!m.w)m.w=Math.round(m.th*m.jth);m.jth=m.jth||+(m.w/m.th).toFixed(1);}
const PRICES=[0.03,0.04,0.05,0.06,0.07,0.08,0.09,0.10];
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
async function j(u){const r=await fetch(u);if(!r.ok)throw new Error(u+' '+r.status);return r.json();}
export async function buildAsic(){
  const [pr,hr,rs,tip]=await Promise.all([j('https://mempool.space/api/v1/prices'),j('https://mempool.space/api/v1/mining/hashrate/3d'),j('https://mempool.space/api/v1/mining/reward-stats/144'),j('https://mempool.space/api/blocks/tip/height')]);
  const D=hr.currentDifficulty, btc=pr.USD, reward=Number(rs.totalReward)/144/1e8;
  const hp=86400e12/(D*2**32)*reward*btc; // USD per TH/s per day
  // Next difficulty retarget estimate (mempool.space). Optional: if the call fails the pages simply leave the retarget text out.
  const adjR=await fetch('https://mempool.space/api/v1/difficulty-adjustment').then(r=>r.ok?r.json():null).catch(()=>null);
  const adj=adjR&&Number.isFinite(adjR.difficultyChange)&&adjR.estimatedRetargetDate?(()=>{const pct=adjR.difficultyChange,d=new Date(adjR.estimatedRetargetDate);
   return {pct,blocks:adjR.remainingBlocks,height:adjR.nextRetargetHeight,hpAfter:hp/(1+pct/100),
    dateTxt:d.toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric'}),timeTxt:d.toLocaleTimeString('en-US',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC'};})():null;
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
  // Electricity cost to mine 1 BTC (our arithmetic): BTC per day = revenue per day x (1 - 2% pool fee) / BTC price; cost = kWh per day x $/kWh / BTC per day.
  const costBtc=(o,p)=>{const perDay=o.rev*0.98/btc;return {days:1/perDay,kwh:o.kwh/perDay,usd:o.kwh*p/perDay,share:o.kwh*p/perDay/btc,btc30:perDay*30};};
  const sgn=(x,d=2)=>(x>0?'+':x<0?'-':'')+Math.abs(x).toFixed(d)+'%', usd0=x=>(x<0?'-$':'$')+Math.abs(Math.round(x)).toLocaleString('en-US');
  const retargetTxt=adj?`The next difficulty adjustment, at block ${adj.height.toLocaleString('en-US')} (${adj.blocks.toLocaleString('en-US')} blocks away), is estimated at ${sgn(adj.pct)} around ${adj.dateTxt} (mempool.space difficulty-adjustment API, read ${day}). If the BTC price and fees hold, hashprice would move from ${$(hp,4)} to about ${$(adj.hpAfter,4)} per TH/s per day (our math: hashprice ÷ (1 ${adj.pct<0?'−':'+'} ${(Math.abs(adj.pct)/100).toFixed(4)})). The estimate shifts with network hashrate until the block is mined.`:'';
  function costSection(r0){
    const {m,be}=r0,n=m.name,P=[0.03,0.05,0.08],c5=costBtc(r0,0.05),faq=[];
    const ans=`At $0.05/kWh, electricity alone costs about ${usd0(c5.usd)} to mine 1 BTC with ${/^[AEIOU]/.test(n)?'an':'a'} ${n}, about ${(c5.share*100).toFixed(0)}% of the $${btc.toLocaleString('en-US')} BTC price on ${day}. That is about ${Math.round(c5.kwh).toLocaleString('en-US')} kWh per BTC, and one machine on its own would need about ${Math.round(c5.days/365)} years to mine 1 BTC.`;
    faq.push(['faq-cost-btc',`How much does it cost to mine 1 BTC with ${/^[AEIOU]/.test(n)?'an':'a'} ${n}?`,ans+' Hardware, pool fee beyond 2%, hosting and downtime come on top.']);
    let rt='';
    if(adj){const be2=be*adj.hpAfter/hp;rt=`<p>${esc(retargetTxt)} For a ${esc(n)} that would move the break-even power price from about $${be.toFixed(3)} to about $${be2.toFixed(3)}/kWh (before pool fee).</p>`;
     faq.push(['faq-retarget',`What will the next difficulty adjustment do to the ${n}?`,`${retargetTxt} For a ${n} that would move the break-even power price from about $${be.toFixed(3)} to about $${be2.toFixed(3)}/kWh, before pool fee.`]);}
    const html=`<h2 id="cost-per-btc">How much does it cost to mine 1 Bitcoin with ${/^[AEIOU]/.test(n)?'an':'a'} ${esc(n)}?</h2>
<p><b>${esc(ans)}</b></p>
<table><thead><tr><th>Power price</th><th>Electricity per BTC</th><th>Share of BTC price</th><th>Left per BTC after power</th></tr></thead><tbody>${P.map(p=>{const c=costBtc(r0,p);return `<tr${p===0.05?' class="hl"':''}><td>$${p.toFixed(2)}/kWh</td><td>${usd0(c.usd)}</td><td>${(c.share*100).toFixed(0)}%</td><td>${usd0(btc-c.usd)}</td></tr>`;}).join('')}</tbody></table>
<p class="note">Our arithmetic: BTC per day = ${n} revenue per day × 0.98 (2% pool fee) ÷ BTC price; cost per BTC = ${r0.kwh.toFixed(1)} kWh a day × power price ÷ BTC per day. Hashprice and BTC price from the <a href="https://mempool.space/docs/api">mempool.space API</a> on ${day}. Electricity only: no hardware, hosting or downtime. The same math for the whole market is in <a href="/guides/is-bitcoin-mining-profitable-2026/#cost-per-btc">how much it costs to mine 1 Bitcoin</a>.</p>
${rt}`;
    return {html,faq};
  }
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
     const ans=`A used ${n} sold for a median of $${me.price.toLocaleString("en-US")} on eBay (${me.n} sales, ${U.window}, ${U.src}). At $0.04/kWh and the hashprice on ${day}, it nets about ${$(p04)} a day, so it pays back in about ${days(me.price,p04)}${p04>0?'':' (it does not cover its power bill)'}. At $0.03/kWh that drops to ${days(me.price,me.pr[0])}.`;
     html.push(`<h2 id="used-payback">How long does a used ${esc(n)} take to pay back?</h2>
<p><b>${esc(ans)}</b> Cheap to buy, expensive to run: newer machines cost far more up front but burn less power per terahash. Same live hashprice for every machine below.</p>
<table><thead><tr><th>Machine</th><th>Used median (sales)</th><th>Middle half</th><th>Payback at $0.03</th><th>Payback at $0.04</th><th>Payback at $0.05</th></tr></thead><tbody>${rows.map(r=>`<tr${r.slug===m.slug?' class="hl"':''}><td>${r.slug===m.slug?`<b>${esc(r.o.m.name)}</b>`:`<a href="${r.o.url}">${esc(r.o.m.name)}</a>`}</td><td>$${r.price.toLocaleString('en-US')} (${r.n})</td><td>${r.mid}</td>${r.pr.map(x=>`<td>${days(r.price,x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="note">Used prices: <a href="${U.url}">${U.src}</a>, 90-day medians of eBay sales to November 11, 2026, read November 13, 2026. Payback = used price ÷ daily profit at that power price (our arithmetic), holding today's hashprice flat. No pool fee, shipping, hosting or repairs. "Never" means the machine doesn't cover its power bill at that price.</p>`);
     faq.push(['faq-used-price',`How much is a used ${n}?`,`About $${me.price.toLocaleString("en-US")}. That's the median of ${me.n} eBay sales over the 90 days to November 11, 2026, with the middle half from ${me.mid} (${U.src}).`]);
     faq.push(['faq-payback',`How long does a used ${n} take to pay back?`,ans]);}
    // 2b. Upgrade: sell this one used, buy the target used, payback on the extra daily profit.
    if(m.up&&UP[m.slug]&&UP[m.up]){const t=all.find(a=>a.m.slug===m.up),mine=UP[m.slug],theirs=UP[m.up],net=theirs.price-mine.price,P=[0.03,0.04,0.05,0.06];
     const g=P.map(p=>({p,a:rev-kwh*p,b:t.rev-t.kwh*p}));const g5=g[2],gain5=g5.b-g5.a;
     const ans=`Selling a used ${n} (median $${mine.price.toLocaleString('en-US')}) and buying a used ${t.m.name} (median $${theirs.price.toLocaleString('en-US')}) costs about $${net.toLocaleString('en-US')} net. At $0.05/kWh the ${t.m.name} nets about ${$(gain5)} a day more than the ${n}, so the swap pays for itself in about ${days(net,gain5)} at today's hashprice. The cheaper your power, the less the swap is worth.`;
     html.push(`<h2 id="upgrade">Should you swap your ${esc(n)} for ${/^[AEIOU]/.test(t.m.name)?'an':'a'} ${esc(t.m.name)}?</h2>
<p><b>${esc(ans)}</b> The ${esc(t.m.name)} also draws ${(t.m.w-m.w>=0?(t.m.w-m.w).toLocaleString('en-US')+' W more':(m.w-t.m.w).toLocaleString('en-US')+' W less')} per box (${t.m.w.toLocaleString('en-US')} W vs ${m.w.toLocaleString('en-US')} W), so check your circuit first.</p>
<table><thead><tr><th>Power price</th><th>${esc(n)} profit / day</th><th>${esc(t.m.name)} profit / day</th><th>Extra per day</th><th>Swap payback</th></tr></thead><tbody>${g.map(x=>`<tr${x.p===0.05?' class="hl"':''}><td>$${x.p.toFixed(2)}</td><td>${$(x.a)}</td><td>${$(x.b)}</td><td>${$(x.b-x.a)}</td><td>${days(net,x.b-x.a)}</td></tr>`).join('')}</tbody></table>
<p class="note">Used medians from <a href="${ING.url}">${ING.src}</a> (${ING.window}, read ${ING.read}). Net cost = ${esc(t.m.name)} median minus ${esc(n)} median. Payback = net cost ÷ extra daily profit (our arithmetic), holding today's hashprice flat. No pool fee, shipping, eBay fees or hosting.</p>`);
     faq.push(['faq-upgrade',`Should I upgrade my ${n} to ${/^[AEIOU]/.test(t.m.name)?'an':'a'} ${t.m.name}?`,ans]);}
    // 2c. New list price payback (MicroBT shop), compared across the MicroBT models we price.
    if(m.new){const P=[0.03,0.04,0.05,0.06],wm=all.filter(a=>a.m.new);
     const me=P.map(p=>rev-kwh*p);
     const ans=`MicroBT lists the ${n} at $${m.new.price.toLocaleString('en-US')} new on its shop${m.new.sold?` (last list price; sold out on ${m.new.sold})`:''}. At $0.04/kWh and the hashprice on ${day} it nets about ${$(me[1])} a day, so the machine alone pays back in about ${days(m.new.price,me[1])}. At $0.03/kWh it's about ${days(m.new.price,me[0])}. That leaves out shipping, import duty, hosting${m.slug==='whatsminer-m63s'||m.slug==='whatsminer-m66s'?' and the cooling setup':''}.`;
     html.push(`<h2 id="new-payback">How long does a new ${esc(n)} take to pay back?</h2>
<p><b>${esc(ans)}</b> Here it is next to the other MicroBT models we price, all at the same live hashprice.</p>
<table><thead><tr><th>Machine</th><th>List price</th><th>$ per TH</th><th>Payback at $0.03</th><th>Payback at $0.04</th><th>Payback at $0.05</th><th>Payback at $0.06</th></tr></thead><tbody>${wm.map(o=>`<tr${o===r0?' class="hl"':''}><td>${o===r0?`<b>${esc(o.m.name)}</b>`:`<a href="${o.url}">${esc(o.m.name)}</a>`}</td><td><a href="${o.m.new.url}">$${o.m.new.price.toLocaleString('en-US')}</a></td><td>$${(o.m.new.price/o.m.th).toFixed(2)}</td>${P.map(p=>`<td>${days(o.m.new.price,o.rev-o.kwh*p)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="note">List prices from the <a href="https://shop.whatsminer.com/products">MicroBT shop</a>, read November 3, 2026 and rechecked November 13, 2026 (unchanged), for the hashrate bin shown on each page.${wm.some(o=>o.m.new.sold)?` The ${wm.filter(o=>o.m.new.sold).map(o=>esc(o.m.name)).join(' and ')} bin we price showed as sold out on the shop on November 13, 2026, so its last list price is shown.`:''} Payback = list price ÷ daily profit (our arithmetic), holding today's hashprice flat. Shop prices change often; check before you buy.</p>`);
     faq.push(['faq-new-price',`How much does a new ${n} cost?`,`$${m.new.price.toLocaleString('en-US')} on the MicroBT shop (read November 3, 2026, same on November 13), which is $${(m.new.price/m.th).toFixed(2)} per TH/s.${m.new.sold?` That bin showed as sold out on the shop on ${m.new.sold}, so check stock and current price before you plan around it.`:''}`]);
     faq.push(['faq-new-payback',`How long does a new ${n} take to pay back?`,ans]);}
    // 2c-bis. New price from new-condition eBay sales (ING Mining CSV, read November 13, 2026), against the used median, for models carrying m.newBM.
    if(m.newBM&&m.used){const N=m.newBM,u=UP[m.slug],P=[0.03,0.04,0.05,0.06],pr=p=>rev-kwh*p;
     const lo=N.rows[0],hi=N.rows[N.rows.length-1],p05d=pr(0.05);
     const ans=`New ${n} units sold on eBay for a median of $${hi.price.toLocaleString('en-US')}, and as little as $${lo.price.toLocaleString('en-US')} (${N.n} sales, ${N.window}, ${ING.src}). At $0.05/kWh and the hashprice on ${day} it nets about ${$(p05d)} a day, so a new one pays back in about ${days(hi.price,p05d)} at the median and ${days(lo.price,p05d)} at the lowest sale. A used ${n} (median $${u.price.toLocaleString('en-US')}) pays back in about ${days(u.price,p05d)} at the same power price.`;
     html.push(`<h2 id="new-payback">Is a new ${esc(n)} worth it, or should you buy used?</h2>
<p><b>${esc(ans)}</b> The used one costs about ${Math.round((1-u.price/hi.price)*100)}% less than the new median. It is the same machine at the same J/TH, so the break-even power price is identical; what you give up buying used is any remaining warranty and knowledge of how it was run.</p>
<table><thead><tr><th>Option</th><th>Price</th>${P.map(p=>`<th>Payback at $${p.toFixed(2)}</th>`).join('')}</tr></thead><tbody>${[...N.rows.map(r=>[`New, ${r.who}`,r.price,r.url]),[`Used median (${u.n} eBay sales)`,u.price,ING.url]].map(([l,price,url])=>`<tr><td><a href="${url}">${esc(l)}</a></td><td>$${price.toLocaleString('en-US')}</td>${P.map(p=>`<td>${days(price,pr(p))}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="note">New prices: new-condition eBay sales in the <a href="${ING.url}">${ING.src}</a> CSV, ${N.window} (median $3,999.99, rounded), read ${N.date}. Sold prices exclude shipping, import duty and hosting, so check current listings before you buy. Used median: <a href="${ING.url}">${ING.src}</a>, ${ING.window}. Payback = price ÷ daily profit (our arithmetic), holding today's hashprice flat, no pool fee.</p>`);
     faq.push(['faq-new-price',`How much does a new ${n} cost?`,`New ones sold on eBay for a median of $${hi.price.toLocaleString('en-US')} and as little as $${lo.price.toLocaleString('en-US')} (${N.n} sales, ${N.window}, ${ING.src}). A used one sold for a median of $${u.price.toLocaleString('en-US')} on eBay (${ING.src}).`]);
     faq.push(['faq-new-vs-used',`Should I buy a new or used ${n}?`,ans]);}
    // 2e. One megawatt of this machine vs its peers: machines per MW, hashrate, profit at $0.04 and machine cost (used medians or MicroBT list prices).
    if(m.mw){const B=m.mw.basis,P=0.04;
     const R=m.mw.peers.map(s=>{const o=all.find(a=>a.m.slug===s),price=B==='used'?UP[s].price:o.m.new.price,cnt=Math.floor(1e6/o.m.w),prof=cnt*(o.rev-o.kwh*P);return {o,price,cnt,ph:cnt*o.m.th/1000,rev:cnt*o.rev,bill:cnt*o.kwh*P,prof,capex:cnt*price};});
     const me=R[0],k=v=>Math.round(v).toLocaleString('en-US'),bestProf=[...R].sort((a,b)=>b.prof-a.prof)[0],bestPay=[...R].filter(r=>r.prof>0).sort((a,b)=>a.capex/a.prof-b.capex/b.prof)[0];
     let ans,h2,more;
     if(B==='new'){const air=R.find(r=>r.o.m.slug==='whatsminer-m60s'),pct=(me.prof/air.prof-1)*100;
      h2=`What does a megawatt of ${n} cost and earn?`;
      ans=`About ${me.cnt} ${n} units fit in 1 MW at ${m.w.toLocaleString('en-US')} W each, ${me.ph.toFixed(1)} PH/s in total. At the hashprice on ${day} that grosses about $${k(me.rev)} a day. At $0.04/kWh the power bill is about $${k(me.bill)} and profit about $${k(me.prof)} a day. The machines alone cost about $${k(me.capex)} at MicroBT list price, so they pay back in about ${days(me.capex,me.prof)}, before the ${m.cool==='hydro'?'water loop, dry coolers':'tanks, fluid, dry coolers'} and three-phase electrical work.`;
      more=`Per megawatt, revenue comes down to J/TH, not box size or cooling. So the ${esc(n)} (${m.jth} J/TH) makes ${Math.abs(pct)<0.5?'about the same profit per MW as':`about ${Math.abs(pct).toFixed(1)}% ${pct>0?'more':'less'} profit per MW than`} an air-cooled <a href="${air.o.url}">M60S</a> (${air.o.m.jth} J/TH). What changes is how much you pay for the machines and the site around them.`;}
     else{h2=`Which used ${m.mw.label||'S19'} gets the most out of a megawatt?`;
      ans=`At $0.04/kWh and the hashprice on ${day}, 1 MW holds ${me.cnt} ${n}s (${me.ph.toFixed(1)} PH/s) netting about $${k(me.prof)} a day. At used eBay medians those machines cost about $${k(me.capex)}, so they pay back in about ${days(me.capex,me.prof)}. Of the machines below, the ${bestProf.o.m.name} earns the most per megawatt and the ${bestPay.o.m.name} pays back its purchase price fastest.`;
      const lo=[...R].sort((a,b)=>a.o.m.w-b.o.m.w)[0],hi=[...R].sort((a,b)=>b.o.m.w-a.o.m.w)[0];
      more=`If power capacity is your limit, pick on J/TH: the more efficient box squeezes more hashrate out of every kilowatt. If cash is your limit, pick on payback. Draw per box runs from ${lo.o.m.w.toLocaleString('en-US')} W (${esc(lo.o.m.name)}) to ${hi.o.m.w.toLocaleString('en-US')} W (${esc(hi.o.m.name)}), which only matters when a single circuit is the limit.`;}
     html.push(`<h2 id="per-mw">${esc(h2)}</h2>
<p><b>${esc(ans)}</b></p>
<p>${more}</p>
<table><thead><tr><th>Machine (1 MW)</th><th>${B==='used'?'Used median':'List price'}</th><th>Machines</th><th>PH/s</th><th>Profit / day at $0.04</th><th>Machine cost</th><th>Payback</th></tr></thead><tbody>${R.map(r=>`<tr${r===me?' class="hl"':''}><td>${r===me?`<b>${esc(r.o.m.name)}</b>`:`<a href="${r.o.url}">${esc(r.o.m.name)}</a>`}${r.o.m.cool?` (${r.o.m.cool})`:''}</td><td>$${r.price.toLocaleString('en-US')}</td><td>${r.cnt}</td><td>${r.ph.toFixed(1)}</td><td>$${k(r.prof)}</td><td>$${k(r.capex)}</td><td>${days(r.capex,r.prof)}</td></tr>`).join('')}</tbody></table>
<p class="note">Machines = 1,000,000 W ÷ watts per box, rounded down (our arithmetic). ${B==='used'?`Prices are 90-day eBay medians from <a href="${ING.url}">${ING.src}</a> (${ING.window}, read ${ING.read}).`:`Prices are list prices on the <a href="https://shop.whatsminer.com/products">MicroBT shop</a> (read November 3, 2026, rechecked for the M63S and M66S on November 4, 2026).`} Machines only: no cooling, transformers, building, pool fee or downtime, and hashprice held flat.</p>`);
     faq.push(['faq-per-mw',`How many ${n} miners fit in 1 MW?`,ans]);}
    // 2f. Payback vs the one-year MicroBT warranty (shop after-sales policy).
    if(m.warranty&&m.new){const pp=[0.03,0.04,0.05].map(p=>rev-kwh*p),d=pp.map(x=>x>0?m.new.price/x:Infinity);
     const ans=`MicroBT's shop gives a one-year warranty. At the hashprice on ${day}, a new ${n} at list price ($${m.new.price.toLocaleString('en-US')}) pays back in about ${days(m.new.price,pp[0])} at $0.03/kWh, ${days(m.new.price,pp[1])} at $0.04 and ${days(m.new.price,pp[2])} at $0.05. ${d[1]<=365?'So at $0.04/kWh it earns back its list price inside the warranty year.':d[0]<=365?'So it only earns back its list price inside the warranty year on power around $0.03/kWh.':'So even at $0.03/kWh it needs longer than the warranty year to earn back its list price.'}`;
     html.push(`<h2 id="warranty">Does the ${esc(n)} pay for itself inside its warranty?</h2>
<p><b>${esc(ans)}</b></p>
<p>The warranty does not cover damage from running outside spec (wrong voltage, humidity, heat or dust), overclocking, unofficial firmware or unofficial parts like power supplies and fans, or shipping without vacuum-sealed packaging. The shop also says payment can't be refunded once made, and international bank transfers take about a week to confirm.</p>
<p class="note">Warranty and payment terms from the <a href="${m.new.url}">MicroBT shop product page</a>, read November 4, 2026. Payback = list price ÷ daily profit (our arithmetic), machine only, hashprice held flat.</p>`);
     faq.push(['faq-warranty',`What warranty does the ${n} have?`,`One year from MicroBT, per its shop's after-sales policy (read November 4, 2026). Running outside spec, overclocking and unofficial firmware or parts are not covered.`]);}
    // 2d. Spec sheet and site needs, straight from the manufacturer page.
    if(m.specs){html.push(`<h2 id="specs">What does the ${esc(n)} need to run?</h2>
<p>${esc(m.site)}</p>
<table><thead><tr><th>Spec</th><th>${esc(n)}</th></tr></thead><tbody>${m.specs.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>${m.specNote?`\n<p>${esc(m.specNote)}</p>`:''}
<p class="note">From the <a href="${m.new?m.new.url:m.url}">${esc(m.new?'MicroBT shop product page':m.src)}</a>, accessed ${m.specsAccessed||'November 3, 2026'}.</p>`);
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
    const ex=extra(r0), cb=costSection(r0);
    const fam=(FAM.find(f=>f.includes(m.slug))||[]).filter(s=>s!==m.slug).map(s=>all.find(a=>a.m.slug===s));
    const famLinks=fam.length?`<p><b>Same family:</b> ${fam.map(o=>`<a href="${o.url}">${esc(o.m.name)}</a> (${o.m.th} TH/s, ${o.m.jth} J/TH${o.m.cool?', '+o.m.cool:''}, break-even $${o.be.toFixed(3)}/kWh)`).join(', ')}. Every model side by side: <a href="/asic/">ASIC profitability by model</a>.</p>`:'';
    const desc=m.used?`${m.name} (${m.th} TH/s, ${m.jth} J/TH) breaks even at about $${be.toFixed(3)}/kWh today. Profit per day, used price and payback${m.up?', upgrade math':''} and the 2028 halving.`:m.new?`${m.name} (${m.th} TH/s, ${m.jth} J/TH): profit per day, break-even about $${be.toFixed(3)}/kWh, new price $${m.new.price.toLocaleString('en-US')} and payback${m.specs?', plus cooling and power specs':''}.`:`${m.name} (${m.th} TH/s, ${m.w.toLocaleString('en-US')} W, ${m.jth} J/TH): daily revenue, power cost and profit at $0.03 to $0.10/kWh from live hashprice. Break-even about $${be.toFixed(3)}/kWh.`;
    // FAQ answers: plain text built only from the manufacturer spec above and the live hashprice. Same text goes on the page and into FAQPage JSON-LD.
    const faq=[...ex.faq,...cb.faq,
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
${cb.html}
<h2 id="compare">How does the ${esc(m.name)} compare with other ASICs?</h2>
<p>Same live hashprice for every machine, sorted by efficiency (lowest J/TH first). The ${esc(m.name)} ranks <b>${rank} of ${n}</b>.</p>
<table><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Break-even $/kWh</th></tr></thead><tbody>${cmp}</tbody></table>
<p class="note">Specs from each manufacturer, linked on each model page. Gross revenue, no pool fee or hardware cost.</p>
${famLinks}
${slots}
<h2 id="faq">FAQ</h2>
${faq.map(([id,q,a])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
<div class="callout"><b>Use your own numbers or paste your payout address.</b> Pool fee, live price and your exact power cost are all inputs in the ASIC calculator, or paste your Bitcoin mining payout address in <a href="/fleet/">Fleet Check</a> to reconcile your actual 90-day on-chain payouts.<br><a class="btn" href="/mining-calculator/#m-${m.slug}">Open the ASIC calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark your payout address <span aria-hidden="true">→</span></a></div>
<p>Wondering whether the same kilowatts would earn more renting GPUs? Try the <a href="/">mine vs AI per-kW calculator</a>, or see what an <a href="/gpu/h100/">H100</a> or <a href="/gpu/rtx-4090/">RTX 4090</a> earns per kW. What power costs in big mining places: <a href="/power-prices/">industrial power prices</a>. Learn the math: <a href="/guides/is-bitcoin-mining-profitable-2026/">is Bitcoin mining profitable in 2026?</a> and the <a href="/methodology/">ASIC profitability formulas and sources</a>. Or see <a href="/asic/">all ASICs</a>.</p>
<!--signup--></article>
<section class="cta"><div><h2>Already mining?</h2><p>Track your real per-site numbers (uptime, power cost, curtailment, payouts) instead of estimates.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=asic-model&amp;p=cta">See Flash for miners <span aria-hidden="true">→</span></a></section>`;
    const ld={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":iso,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"ASIC profitability","item":SITE+'/asic/'},{"@type":"ListItem","position":2,"name":m.name,"item":SITE+url}]}},
     {"@type":"FAQPage","mainEntity":faq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
    fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',page({title:`${title} | joulemath`,desc,url,ld,body}));
  }
  rows.sort((a,b)=>b.be-a.be);
  const top=rows[0],low=rows[rows.length-1],pos=rows.filter(r=>r.p05>0);
  // Hydro and immersion: one megawatt of M63S / M66S vs the air-cooled M60S, at MicroBT list prices.
  const g=s=>all.find(a=>a.m.slug===s),mwOf=o=>{const cnt=Math.floor(1e6/o.m.w),prof=cnt*(o.rev-o.kwh*0.04);return {cnt,prof,capex:cnt*o.m.new.price};},kk=v=>Math.round(v).toLocaleString('en-US');
  const m63=g('whatsminer-m63s'),m66=g('whatsminer-m66s'),m60=g('whatsminer-m60s'),w63=mwOf(m63),w66=mwOf(m66),w60=mwOf(m60);
  const hydroAns=`MicroBT's WhatsMiner M63S (hydro, ${m63.m.th} TH/s at ${m63.m.w.toLocaleString('en-US')} W) and M66S (immersion, ${m66.m.th} TH/s at ${m66.m.w.toLocaleString('en-US')} W) pack the most hashrate per box of the models we track. Per megawatt they earn close to what an air-cooled M60S does (the M63S a little more), because revenue per MW comes down to J/TH (${m63.m.jth} and ${m66.m.jth} vs ${m60.m.jth}). At $0.04/kWh and the hashprice on ${day}, 1 MW of M63S nets about $${kk(w63.prof)} a day and the ${w63.cnt} machines cost about $${kk(w63.capex)} at MicroBT list price; 1 MW of M66S nets about $${kk(w66.prof)} for $${kk(w66.capex)} of machines. Cooling and electrical work come on top.`;
  // Used value: ING Mining eBay medians, payback at $0.04/kWh.
  const uv=Object.keys(UP).map(s=>{const o=g(s),pr=o.rev-o.kwh*0.04;return {o,u:UP[s],pr,pb:pr>0?UP[s].price/pr:Infinity};}).sort((a,b)=>a.pb-b.pb);
  const uvHead=[...uv].sort((a,b)=>b.o.be-a.o.be)[0];
  const usedAns=`At $0.04/kWh and the hashprice on ${day}, a used ${uv[0].o.m.name} pays back fastest: about ${days(uv[0].u.price,uv[0].pr)} at its $${uv[0].u.price.toLocaleString('en-US')} eBay median. The ${uvHead.o.m.name} costs the most used ($${uvHead.u.price.toLocaleString('en-US')}) but has the most headroom if power gets dearer, breaking even at about $${uvHead.o.be.toFixed(3)}/kWh. Prices are 90-day eBay medians to November 11, 2026 (${ING.src}).`;
  const hubFaq=[['faq-most-profitable','What is the most profitable Bitcoin ASIC miner right now?',`On break-even power price, the ${top.m.name} (${top.m.jth} J/TH): it keeps making money up to about $${top.be.toFixed(3)}/kWh at the hashprice on ${day}. The ${low.m.name} (${low.m.jth} J/TH) is the first to go underwater, at about $${low.be.toFixed(3)}/kWh.`],
   ['faq-how-many',`Which ASIC miners are profitable at $0.05/kWh?`,pos.length?`${pos.length} of the ${rows.length} models we track: ${pos.map(r=>r.m.name).join(', ')}. That's gross of pool fees and the machine price.`:`None of the ${rows.length} models we track cover a $0.05/kWh power bill at today's hashprice.`],
   ['faq-hydro','Which ASIC miner is best for a hydro or immersion site?',hydroAns],
   ['faq-used-value','Which used ASIC miner is the best value right now?',usedAns],
   ['faq-calc','How do you calculate ASIC miner profitability?',`Daily profit = TH/s × hashprice − (watts ÷ 1000 × 24 × power price). Hashprice is what one TH/s earns per day, ${$(hp,4)} on ${day} from mempool.space data. Break-even power price = TH/s × hashprice ÷ daily kWh.`]];
  const body=`<div class="prose post"><p class="eyebrow">ASIC profitability · ${updated}</p><h1>ASIC miner profitability by model (live)</h1>
<p class="lead"><b>Short answer:</b> at the hashprice on ${day} (${$(hp,4)} per TH/s per day), ${pos.length} of ${rows.length} popular Antminer and WhatsMiner models still make money at $0.05/kWh. The ${esc(top.m.name)} has the most room, breaking even at about <b>$${top.be.toFixed(3)}/kWh</b>; the ${esc(low.m.name)} needs power under about <b>$${low.be.toFixed(3)}/kWh</b>. Specs from Bitmain and MicroBT, hashprice from the <a href="https://mempool.space/docs/api">mempool.space API</a>, used prices from <a href="${ING.url}">ING Mining</a>. For your own numbers use the <a href="/mining-calculator/">ASIC miner profitability calculator</a>.</p>
<h2 id="profitable-now">Which Bitcoin ASIC miners are profitable right now?</h2>
<p>Daily revenue, profit at $0.05/kWh and break-even power price for each model, using one live hashprice for all of them so they compare fairly.</p>
<table class="sortable"><caption class="note">Sorted by break-even power price, highest first.<span class="sort-hint" hidden> Tap a column header to re-sort.</span></caption><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Profit / day at $0.05</th><th aria-sort="descending">Break-even $/kWh</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="${r.url}">${r.m.name}</a></td><td data-v="${r.m.th}">${r.m.th}</td><td data-v="${r.m.w}">${r.m.w.toLocaleString('en-US')}</td><td data-v="${r.m.jth}">${r.m.jth}</td><td data-v="${r.rev}">${$(r.rev)}</td><td data-v="${r.p05}">${$(r.p05)}</td><td data-v="${r.be}">$${r.be.toFixed(3)}</td></tr>`).join('')}</tbody></table><script src="/js/sort.js" defer></script>
<p class="note">${dataLine} Specs from each manufacturer, linked on each model page. Gross revenue, no pool fee or hardware cost.</p>
<p>For your own power price and pool fee, use the <a href="/mining-calculator/">ASIC calculator</a>, or paste your Bitcoin payout address into <a href="/fleet/">Fleet Check</a> to benchmark your last 90 days of on-chain payouts against AI GPU rigs. To see what the same kilowatts earn renting GPUs, try the <a href="/gpu/">GPU rental prices</a> page. Power costs by country are on the <a href="/power-prices/">industrial power prices</a> page, and the formulas are on the <a href="/methodology/">methodology</a> page. Is mining worth it at all? <a href="/guides/is-bitcoin-mining-profitable-2026/">Is Bitcoin mining profitable in 2026?</a> has the break-even power price and the cost to mine 1 BTC.</p>
<h2 id="hydro-immersion">Which miner suits a hydro or immersion site?</h2>
<p><b>${esc(hydroAns)}</b></p>
<p>See the megawatt math and whether each pays back inside MicroBT's one-year warranty on the <a href="${m63.url}">WhatsMiner M63S</a> (hydro) and <a href="${m66.url}">WhatsMiner M66S</a> (immersion) pages, or compare with the air-cooled <a href="${m60.url}">M60S</a> and <a href="${g('whatsminer-m70s').url}">M70S</a>.</p>
<h2 id="used-value">Which used ASIC miner is the best value right now?</h2>
<p><b>${esc(usedAns)}</b></p>
<table class="sortable"><thead><tr><th>Machine</th><th>Used median (sales)</th><th>$ per TH</th><th>Break-even $/kWh</th><th>Profit / day at $0.04</th><th aria-sort="ascending">Payback at $0.04</th></tr></thead><tbody>${uv.map(r=>`<tr><td><a href="${r.o.url}">${esc(r.o.m.name)}</a></td><td data-v="${r.u.price}">$${r.u.price.toLocaleString('en-US')} (${r.u.n})</td><td data-v="${r.u.price/r.o.m.th}">$${(r.u.price/r.o.m.th).toFixed(2)}</td><td data-v="${r.o.be}">$${r.o.be.toFixed(3)}</td><td data-v="${r.pr}">${$(r.pr)}</td><td data-v="${Number.isFinite(r.pb)?r.pb:1e9}">${days(r.u.price,r.pr)}</td></tr>`).join('')}</tbody></table>
<p class="note">Used prices: <a href="${ING.url}">${ING.src}</a>, 90-day medians of eBay sales to November 11, 2026, read November 13, 2026. Payback = used price ÷ daily profit at $0.04/kWh (our arithmetic), hashprice held flat, no pool fee, shipping or repairs. The <a href="${g('antminer-s19k-pro').url}">S19k Pro</a>, <a href="${g('antminer-s19-xp').url}">S19 XP</a> and <a href="${g('antminer-s19j-pro').url}">S19j Pro</a> pages compare what a megawatt of each earns and whether to upgrade.</p>
<h2 id="faq">FAQ</h2>
${hubFaq.map(([id,q,a])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}<!--signup--></div>
<section class="cta"><div><h2>Already mining?</h2><p>Track your real per-site numbers (uptime, power cost, curtailment, payouts) instead of estimates.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=asic-hub&amp;p=cta">See Flash for miners <span aria-hidden="true">→</span></a></section>`;
  const hubLd={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","name":"ASIC miner profitability by model","url":SITE+'/asic/',"dateModified":iso,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+'/'},{"@type":"ListItem","position":2,"name":"ASIC profitability","item":SITE+'/asic/'}]}},
   {"@type":"FAQPage","mainEntity":hubFaq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
  fs.writeFileSync('dist/asic/index.html',page({title:'ASIC miner profitability by model (live hashprice) | joulemath',desc:'Antminer S21 XP, S21 Pro, S21, S19 XP, S19k Pro, S19j Pro and WhatsMiner M60S, M66S, M63S, M70S: profit per day, break-even power price and used payback, live.',url:'/asic/',ld:hubLd,body}));
  // /mining-calculator/: fill the build-time markers (snapshot, model presets, compare table, worked example, FAQ, JSON-LD).
  {const f='dist/mining-calculator/index.html';let h=fs.readFileSync(f,'utf8');
   const xp=all.find(a=>a.m.slug==='antminer-s21-xp'),ex=all.find(a=>a.m.slug==='antminer-s19-xp'),exC=ex.kwh*0.05,exP=ex.rev-exC,fee=ex.rev*0.02;
   const btcTh=86400e12/(D*2**32)*reward;
   const cq=[['faq-hashprice','What is hashprice?',`Hashprice is what one TH/s of hashrate earns in a day. It comes from network difficulty, the average block reward (subsidy plus fees) and the BTC price. On ${day} it was ${$(hp,4)} per TH/s per day: difficulty ${(D/1e12).toFixed(2)} T, ${reward.toFixed(4)} BTC per block over the last 144 blocks and BTC at $${btc.toLocaleString('en-US')}.`],
    ['faq-best','What is the most profitable ASIC miner right now?',`Of the models we track, the ${byEff[0].m.name} at ${byEff[0].m.jth} J/TH has the highest break-even power price, about $${byEff[0].be.toFixed(3)}/kWh at today's hashprice. Efficiency (J/TH) decides who survives cheap hashprice; raw TH/s only decides how big the numbers are.`],
    ['faq-power-price','What electricity price do you need to mine Bitcoin profitably?',`It depends on the machine. At today's hashprice an ${xp.m.name} breaks even at about $${xp.be.toFixed(3)}/kWh and an ${ex.m.name} at about $${ex.be.toFixed(3)}/kWh, before pool fees. Formula: break-even = TH/s × hashprice ÷ (watts ÷ 1000 × 24).`],
    ['faq-pool-fee','Does the calculator include pool fees?','Yes. The pool fee box comes off revenue before power is subtracted, and it starts at 2%. The model table on this page is gross of pool fees so every machine compares on the same basis.'],
    ['faq-payback','How do you work out ASIC payback?',`Divide what you paid for the machine by its daily profit. A used ${ex.m.name} sold for a median of $${UP[ex.m.slug].price.toLocaleString("en-US")} on eBay over the 90 days to November 11, 2026 (ING Mining). At $0.04/kWh it nets about ${$(ex.rev-ex.kwh*0.04)} a day today, so about ${days(UP[ex.m.slug].price,ex.rev-ex.kwh*0.04)} to pay back if nothing changes.`],
    ['faq-change','How often do the numbers change?','Difficulty adjusts every 2,016 blocks, about every two weeks, and the BTC price and fees move all the time. The calculator reads them live every time you load it; the table on this page is rebuilt daily.']];
   const opts=byEff.map(o=>`<option value="${o.m.th},${o.m.w}" data-slug="${o.m.slug}">${esc(o.m.name)} (${o.m.th} TH/s, ${o.m.w.toLocaleString('en-US')} W)</option>`).join('');
   const tb=byEff.map(o=>`<tr id="m-${o.m.slug}"><td><a href="${o.url}">${esc(o.m.name)}</a></td><td>${o.m.th}</td><td>${o.m.w.toLocaleString('en-US')}</td><td>${o.m.jth}</td><td>${$(o.rev)}</td><td>${$(o.p05)}</td><td>$${o.be.toFixed(3)}</td><td><a href="#m-${o.m.slug}">Load</a></td></tr>`).join('');
   const body=`<article class="prose post" style="margin-top:2rem">
<h2 id="by-model">Which ASIC miners are profitable today?</h2>
<p>Every model at the same live hashprice (${$(hp,4)} per TH/s per day on ${day}), most efficient first. Tap Load to put a model into the calculator.</p>
<table><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Profit / day at $0.05</th><th>Break-even $/kWh</th><th></th></tr></thead><tbody>${tb}</tbody></table>
<p class="note">${dataLine} Specs from each manufacturer, linked on each <a href="/asic/">model page</a>. Gross of pool fee and hardware cost, 24 hours a day at spec.</p>
<p>Buying used? The <a href="/asic/antminer-s19k-pro/">S19k Pro</a>, <a href="/asic/antminer-s19-xp/">S19 XP</a> and <a href="/asic/antminer-s19j-pro/">S19j Pro</a> pages compare eBay sold prices, payback and what a megawatt of each earns. Building a hydro or immersion site? The <a href="/asic/whatsminer-m63s/">WhatsMiner M63S</a> (hydro) and <a href="/asic/whatsminer-m66s/">M66S</a> (immersion) pages work out the cost of a megawatt and whether it pays back inside the warranty.</p>
<h2 id="how-to">How do you calculate ASIC miner profitability?</h2>
<p>Four steps. Worked example: an ${esc(ex.m.name)} (${ex.m.th} TH/s, ${ex.m.w.toLocaleString('en-US')} W) at $0.05/kWh with a 2% pool fee, at the network numbers on ${day}.</p>
<ol><li><b>Hashprice.</b> BTC earned per TH/s per day = 86,400 × 10<sup>12</sup> ÷ (difficulty × 2<sup>32</sup>) × average block reward = ${(btcTh*1e8).toFixed(1)} sats (${btcTh.toFixed(10)} BTC). Times the BTC price = <b>${$(hp,4)}</b> per TH/s per day.</li>
<li><b>Revenue.</b> ${ex.m.th} TH/s × ${$(hp,4)} = <b>${$(ex.rev)}</b> a day. Less a 2% pool fee (${$(fee)}) = ${$(ex.rev-fee)}.</li>
<li><b>Power cost.</b> ${ex.m.w.toLocaleString('en-US')} W ÷ 1000 × 24 h = ${ex.kwh.toFixed(1)} kWh a day × $0.05 = <b>${$(exC)}</b>.</li>
<li><b>Profit and break-even.</b> ${$(ex.rev-fee)} − ${$(exC)} = <b>${$(exP-fee)}</b> a day. Break-even power price = revenue ÷ kWh = ${$(ex.rev-fee)} ÷ ${ex.kwh.toFixed(1)} = <b>$${((ex.rev-fee)/ex.kwh).toFixed(3)}/kWh</b>.</li></ol>
<p>Full formulas and data sources are on the <a href="/methodology/">methodology page</a>, and the verdict, with the cost to mine 1 BTC, is in <a href="/guides/is-bitcoin-mining-profitable-2026/">is Bitcoin mining profitable in 2026?</a> To see what power actually costs in mining regions, check <a href="/power-prices/">industrial power prices by country</a>, like <a href="/power-prices/canada-quebec/">Quebec</a> or <a href="/power-prices/united-states-texas/">Texas</a>.</p>
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
  // /methodology/: short answer, live worked example and TechArticle JSON-LD.
  {const f='dist/methodology/index.html';let h=fs.readFileSync(f,'utf8');
   const ex=all.find(a=>a.m.slug==='antminer-s21-xp'),btcTh=86400e12/(D*2**32)*reward,P=0.06,fee=ex.rev*0.02,cost=ex.kwh*P,net=ex.rev-fee-cost;
   const s19=all.find(a=>a.m.slug==='antminer-s19-xp');
   const ans=`<b>Short answer:</b> hashprice = 86,400 × 10<sup>12</sup> ÷ (difficulty × 2<sup>32</sup>) × block reward × BTC price, which gave <b>${$(hp,4)} per TH/s per day</b> on ${day} (<a href="https://mempool.space/docs/api">mempool.space</a> data, our math). A miner's daily profit is its TH/s × hashprice, less the pool fee, less watts ÷ 1000 × 24 × your power price. Break-even power price is revenue ÷ kWh a day: about <b>$${ex.be.toFixed(3)}/kWh</b> for an ${esc(ex.m.name)} and <b>$${s19.be.toFixed(3)}/kWh</b> for an ${esc(s19.m.name)} before pool fee.`;
   const cx=costBtc(ex,0.05),cs=costBtc(s19,0.05);
   const today=`<h2 id="today">What are the inputs today, ${esc(day)}?</h2>
<ul><li><b>BTC price:</b> $${btc.toLocaleString('en-US')}. <b>Difficulty:</b> ${(D/1e12).toFixed(2)} T. <b>Average reward:</b> ${reward.toFixed(4)} BTC per block over the last 144 blocks (<a href="https://mempool.space/docs/api">mempool.space API</a>).</li>
<li><b>Hashprice:</b> ${$(hp,4)} per TH/s per day (our math, formula above).</li>
<li><b>${esc(ex.m.name)}</b> (${ex.m.th} TH/s, ${ex.m.w.toLocaleString('en-US')} W, <a href="${ex.url}">Bitmain spec</a>): grosses ${$(ex.rev)} a day, breaks even at about $${ex.be.toFixed(3)}/kWh before pool fee.</li>
<li><b>${esc(s19.m.name)}</b> (${s19.m.th} TH/s, ${s19.m.w.toLocaleString('en-US')} W, <a href="${s19.url}">Bitmain spec</a>): grosses ${$(s19.rev)} a day, breaks even at about $${s19.be.toFixed(3)}/kWh before pool fee.</li></ul>
${adj?`<p>${esc(retargetTxt)}</p>`:''}
<p>Every other machine at this hashprice is on the <a href="/asic/">ASIC profitability page</a>, and the <a href="/guides/is-bitcoin-mining-profitable-2026/">Bitcoin mining profitability guide</a> turns these numbers into a verdict.</p>`;
   const costH=`<h2 id="cost-per-btc">How do you work out the cost to mine 1 BTC?</h2>
<p><b>Cost per BTC = kWh a day × power price ÷ BTC mined a day.</b> BTC mined a day = TH/s × BTC per TH/s per day × (1 − pool fee). At $0.05/kWh and the numbers above, electricity alone costs about <b>${usd0(cx.usd)}</b> to mine 1 BTC with an ${esc(ex.m.name)} and about <b>${usd0(cs.usd)}</b> with an ${esc(s19.m.name)}, against a BTC price of $${btc.toLocaleString('en-US')} (our arithmetic, 2% pool fee, no hardware or hosting). The full table, other power prices and what it means for profit are in the guide: <a href="/guides/is-bitcoin-mining-profitable-2026/#cost-per-btc">how much does it cost to mine 1 Bitcoin?</a></p>`;
   const exH=`<h2 id="worked-example">Worked example: what does an ${esc(ex.m.name)} make at $0.06/kWh?</h2>
<p>Live network numbers from ${day}: difficulty ${(D/1e12).toFixed(2)} T, ${reward.toFixed(4)} BTC average reward over the last 144 blocks, BTC at $${btc.toLocaleString('en-US')} (<a href="https://mempool.space/docs/api">mempool.space API</a>). Machine: ${esc(ex.m.name)}, ${ex.m.th} TH/s at ${ex.m.w.toLocaleString('en-US')} W (<a href="${ex.url}">specs and source</a>).</p>
<table><thead><tr><th>Step</th><th>Math</th><th>Result</th></tr></thead><tbody>
<tr><td>BTC per TH/s per day</td><td>86,400 × 10<sup>12</sup> ÷ (${(D/1e12).toFixed(2)} T × 2<sup>32</sup>) × ${reward.toFixed(4)}</td><td>${(btcTh*1e8).toFixed(1)} sats</td></tr>
<tr><td>Hashprice</td><td>${(btcTh*1e8).toFixed(1)} sats × $${btc.toLocaleString('en-US')}</td><td>${$(hp,4)} / TH/s / day</td></tr>
<tr><td>Revenue</td><td>${ex.m.th} TH/s × ${$(hp,4)}</td><td>${$(ex.rev)} / day</td></tr>
<tr><td>Pool fee (2%)</td><td>${$(ex.rev)} × 0.02</td><td>−${$(fee)}</td></tr>
<tr><td>Power</td><td>${ex.m.w.toLocaleString('en-US')} W ÷ 1000 × 24 h × $0.06</td><td>−${$(cost)}</td></tr>
<tr><td><b>Profit</b></td><td></td><td><b>${$(net)} / day</b></td></tr>
<tr><td>Break-even power price</td><td>${$(ex.rev-fee)} ÷ ${ex.kwh.toFixed(1)} kWh</td><td>$${((ex.rev-fee)/ex.kwh).toFixed(3)} / kWh</td></tr></tbody></table>
<p>That is before the cost of the machine. Try other models and prices in the <a href="/mining-calculator/">ASIC miner profitability calculator</a>, see every model side by side on the <a href="/asic/">ASIC profitability page</a>, or check what power costs in mining countries on the <a href="/power-prices/">industrial power prices</a> page. This example is rebuilt daily.</p>`;
   const methTitle='ASIC miner profitability formula and hashprice | joulemath';
   const methDesc=`ASIC miner profitability math on ${day} numbers: hashprice ${$(hp,4)} per TH/s per day, S21 XP breaks even near $${ex.be.toFixed(3)}/kWh. Formulas, worked example, sources.`;
   const ld={"@context":"https://schema.org","@graph":[{"@type":"TechArticle","headline":"How to calculate ASIC miner profitability, hashprice and GPU rent per kW","url":SITE+'/methodology/',"dateModified":iso,"datePublished":"2026-10-21","author":{"@type":"Organization","name":"joulemath","url":SITE+'/'},"publisher":{"@type":"Organization","name":"joulemath","url":SITE+'/'},"about":["Hashprice","Bitcoin mining profitability","GPU rental"]},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+'/'},{"@type":"ListItem","position":2,"name":"Methodology","item":SITE+'/methodology/'}]}]};
   for(const [k,v] of [['<!--meth-ld-->',`<script type="application/ld+json">${JSON.stringify(ld)}</script>`],['<!--meth-date-->',updated],['<!--meth-answer-->',ans],['<!--meth-example-->',exH+'\n'+today+'\n'+costH],['<!--meth-desc-->',esc(methDesc)],['<!--meth-title-->',esc(methTitle)]]){if(!h.includes(k))throw new Error('meth marker '+k);h=h.split(k).join(v);}
   fs.writeFileSync(f,h);}
  console.log('asic: hashprice',hp.toFixed(4),'pages',MODELS.length);
  return {hp,btc,D,reward,eurPerUsd:pr.EUR/pr.USD,when,iso,day,updated,dataLine,page,models:all,adj,retargetTxt,costBtc};
}
