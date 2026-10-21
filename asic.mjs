// ASIC long-tail pages: dist/asic/<slug>/index.html + dist/asic/index.html.
// Hashprice is computed at build time from mempool.space; the build fails if the fetch fails (no stale or invented numbers).
import fs from 'fs';
const SITE='https://joulemath.com';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const BM='Bitmain spec sheet', WM='MicroBT WhatsMiner shop listing';
const WMURL='https://shop.whatsminer.com/products';
// Specs as published by the manufacturer, accessed Oct 21, 2026. For WhatsMiner the shop lists hashrate and J/TH; watts = TH x J/TH (our arithmetic).
export const MODELS=[
 {slug:'antminer-s21-xp',name:'Antminer S21 XP',maker:'Bitmain',th:270,w:3645,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications',
  intro:'The S21 XP is the most efficient air-cooled Antminer on this list at 13.5 J/TH, pushing 270 TH/s from 3,645 W. That efficiency is why it keeps a margin at power prices where older machines are underwater.'},
 {slug:'antminer-s21-pro',name:'Antminer S21 Pro',maker:'Bitmain',th:234,w:3510,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification',
  intro:'The S21 Pro sits between the S21 and the S21 XP: 234 TH/s at 3,510 W, or 15 J/TH. It draws almost the same power as a plain S21 but hashes 17% more.'},
 {slug:'antminer-s21',name:'Antminer S21',maker:'Bitmain',th:200,w:3500,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification',
  intro:'The original S21 does 200 TH/s at 3,500 W, which is 17.5 J/TH. It is the baseline for the S21 family, and a useful yardstick for how much the Pro and XP versions improved.'},
 {slug:'antminer-s19-xp',name:'Antminer S19 XP',maker:'Bitmain',th:141,w:3031.5,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/8906244096409-S19-XP-Specifications',
  intro:'The S19 XP was the top S19 when it launched: 141 TH/s at 3,031.5 W, or 21.5 J/TH. Today it uses about 60% more energy per terahash than an S21 XP, so power price decides almost everything.'},
 {slug:'antminer-s19k-pro',name:'Antminer S19k Pro',maker:'Bitmain',th:120,w:2760,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/23833956049049-S19K-Pro-Specifications',
  intro:'The S19k Pro is the smallest machine here: 120 TH/s at 2,760 W, or 23 J/TH. It is the least efficient model on this list, so it is the first to stop paying for its power when hashprice drops.'},
 {slug:'whatsminer-m60s',name:'WhatsMiner M60S',maker:'MicroBT',th:186,jth:18.5,src:WM,url:WMURL,
  intro:'The M60S is MicroBT\'s air-cooled workhorse, listed at 186 TH/s and 18.5 J/TH, which works out to about 3,441 W. On paper it lands between the S21 and the S19 XP on efficiency.'},
 {slug:'whatsminer-m66s',name:'WhatsMiner M66S',maker:'MicroBT',th:290,jth:18.5,src:WM,url:WMURL,
  intro:'The M66S is an immersion-cooled MicroBT unit, listed at 290 TH/s and 18.5 J/TH, so about 5,365 W per machine. Same efficiency as the M60S, just more hashrate per box, which needs an immersion setup.'},
 {slug:'whatsminer-m63s',name:'WhatsMiner M63S',maker:'MicroBT',th:408,jth:18,src:WM,url:WMURL,
  intro:'The M63S is a hydro-cooled MicroBT machine, listed at 408 TH/s and 18 J/TH, so roughly 7,344 W. Per box it is the biggest earner here, but per kilowatt it is about the same as an S21.'},
 {slug:'whatsminer-m70s',name:'WhatsMiner M70S',maker:'MicroBT',th:248,jth:13.5,src:WM,url:WMURL,
  intro:'The M70S is MicroBT\'s newer air-cooled model, listed at 248 TH/s and 13.5 J/TH, so about 3,348 W. It matches the S21 XP on efficiency with a bit less hashrate per box.'},
];
for(const m of MODELS){if(!m.w)m.w=Math.round(m.th*m.jth);m.jth=m.jth||+(m.w/m.th).toFixed(1);}
const PRICES=[0.03,0.04,0.05,0.06,0.07,0.08,0.09,0.10];
const $=(n,d=2)=>(n<0?'-$':'$')+Math.abs(n).toFixed(d);
async function j(u){const r=await fetch(u);if(!r.ok)throw new Error(u+' '+r.status);return r.json();}
export async function buildAsic(){
  const [pr,hr,rs]=await Promise.all([j('https://mempool.space/api/v1/prices'),j('https://mempool.space/api/v1/mining/hashrate/3d'),j('https://mempool.space/api/v1/mining/reward-stats/144')]);
  const D=hr.currentDifficulty, btc=pr.USD, reward=Number(rs.totalReward)/144/1e8;
  const hp=86400e12/(D*2**32)*reward*btc; // USD per TH/s per day
  const now=new Date(), when=now.toLocaleString('en-US',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';
  const iso=now.toISOString();
  const shell=fs.readFileSync('dist/about/index.html','utf8');
  const header=shell.match(/<header[\s\S]*?<\/header>/)[0].replace(/ aria-current="page"/g,'');
  const footer=shell.match(/<footer[\s\S]*?<\/footer>/)[0];
  const headBits=shell.match(/<meta name="theme-color"[\s\S]*?crossorigin>/)[0];
  const page=({title,desc,url,ld,body})=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="viewport" content="width=device-width,initial-scale=1">
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
  for(const m of MODELS){
    const url=`/asic/${m.slug}/`, rev=m.th*hp, kwh=m.w/1000*24, be=rev/kwh;
    const tbl=PRICES.map(p=>{const c=kwh*p,pr=rev-c;return `<tr${p===0.05?' class="hl"':''}><td>$${p.toFixed(2)}</td><td>${$(rev)}</td><td>${$(c)}</td><td><b>${$(pr)}</b></td><td>${$(pr*30,0)}</td></tr>`;}).join('');
    const p05=rev-kwh*0.05;
    rows.push({m,url,rev,be,p05});
    const others=MODELS.filter(o=>o!==m).slice(0,4).map(o=>`<a href="/asic/${o.slug}/">${o.name}</a>`).join(' · ');
    const title=`${m.name} profitability at $0.05/kWh`;
    const desc=`${m.name} (${m.th} TH/s, ${m.w.toLocaleString('en-US')} W, ${m.jth} J/TH): daily revenue, power cost and profit at $0.03 to $0.10/kWh from live hashprice. Break-even about $${be.toFixed(3)}/kWh.`;
    const body=`<article class="prose post"><p class="eyebrow"><a href="/asic/">ASIC profitability</a></p><h1>${esc(m.name)} profitability</h1>
<p class="lead">${esc(m.intro)}</p>
<ul><li><b>Hashrate:</b> ${m.th} TH/s</li><li><b>Power:</b> ${m.w.toLocaleString('en-US')} W</li><li><b>Efficiency:</b> ${m.jth} J/TH</li><li><b>Source:</b> <a href="${m.url}">${m.src}</a>, accessed October 21, 2026.${m.maker==='MicroBT'?' The shop lists hashrate and J/TH; the wattage is our arithmetic (TH/s × J/TH).':''}</li></ul>
<h2>Daily profit by power price</h2>
<p>At the hashprice below, one ${esc(m.name)} grosses about <b>${$(rev)}</b> a day. At $0.05/kWh it nets about <b>${$(p05)}</b> a day, and it breaks even at about <b>$${be.toFixed(3)}/kWh</b>.</p>
<table><thead><tr><th>Power price</th><th>Revenue / day</th><th>Power / day</th><th>Profit / day</th><th>Profit / 30 days</th></tr></thead><tbody>${tbl}</tbody></table>
<p class="note">${dataLine} Revenue is gross: no pool fee, downtime, hosting markup or hardware cost. Assumes the machine runs at spec 24 hours a day (our assumption). Figures update when the site is rebuilt.</p>
${slots}
<div class="callout"><b>Use your own numbers.</b> Pool fee, live price and your exact power cost are all inputs in the ASIC calculator, which pulls fresh data every time you load it.<br><a class="btn" href="/mining-calculator/">Open the ASIC calculator <span aria-hidden="true">→</span></a></div>
<p>Wondering whether the same kilowatts would earn more renting GPUs? Try the <a href="/">mine vs AI per-kW calculator</a>. Other models: ${others}, or see <a href="/asic/">all ASICs</a>.</p>
<!--signup--></article>
<section class="cta"><div><h2>Already mining?</h2><p>Track your real per-site numbers (uptime, power cost, curtailment, payouts) instead of estimates. Flash does that for miners.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=asic-model&amp;p=cta">See Flash for miners <span aria-hidden="true">→</span></a></section>`;
    const ld={"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":iso,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"ASIC profitability","item":SITE+'/asic/'},{"@type":"ListItem","position":2,"name":m.name,"item":SITE+url}]}};
    fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',page({title:`${title} | joulemath`,desc,url,ld,body}));
  }
  rows.sort((a,b)=>b.be-a.be);
  const body=`<div class="prose post"><p class="eyebrow">ASIC profitability</p><h1>Bitcoin ASIC profitability by model</h1>
<p class="lead">Daily revenue, profit at $0.05/kWh and break-even power price for popular Antminer and WhatsMiner models, using one live hashprice for all of them so they compare fairly.</p>
<table><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Profit / day at $0.05</th><th>Break-even $/kWh</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="${r.url}">${r.m.name}</a></td><td>${r.m.th}</td><td>${r.m.w.toLocaleString('en-US')}</td><td>${r.m.jth}</td><td>${$(r.rev)}</td><td>${$(r.p05)}</td><td>$${r.be.toFixed(3)}</td></tr>`).join('')}</tbody></table>
<p class="note">${dataLine} Specs from each manufacturer, linked on each model page. Gross revenue, no pool fee or hardware cost.</p>
<p>For your own power price and pool fee, use the <a href="/mining-calculator/">ASIC calculator</a>.</p><!--signup--></div>`;
  fs.writeFileSync('dist/asic/index.html',page({title:'Bitcoin ASIC profitability by model (live hashprice) | joulemath',desc:'Antminer S21 XP, S21 Pro, S21, S19 XP, S19k Pro and WhatsMiner M60S, M66S, M63S, M70S: daily profit and break-even power price from live hashprice.',url:'/asic/',ld:{"@context":"https://schema.org","@type":"CollectionPage","name":"Bitcoin ASIC profitability by model","url":SITE+'/asic/'},body}));
  console.log('asic: hashprice',hp.toFixed(4),'pages',MODELS.length);
}
