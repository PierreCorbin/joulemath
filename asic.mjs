// ASIC long-tail pages: dist/asic/<slug>/index.html + dist/asic/index.html.
// Hashprice is computed at build time from mempool.space; the build fails if the fetch fails (no stale or invented numbers).
import fs from 'fs';
import {PLACES} from './power.mjs';
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
 {slug:'antminer-s19j-pro',name:'Antminer S19j Pro',maker:'Bitmain',th:104,w:3068,src:BM,url:'https://support.bitmain.com/hc/en-us/articles/900006762746-S19j-Pro-Specifications',
  title:'Is the Antminer S19j Pro still profitable in 2026?',h1:'Is the Antminer S19j Pro still profitable in 2026?',accessed:'November 3, 2026',
  intro:'The S19j Pro shipped in 2021 and is still one of the most common used miners out there. The top version does 104 TH/s at 3,068 W, or 29.5 J/TH, which is more than twice the energy per terahash of an S21 XP. So whether it still pays comes down to one thing: your power price.',
  // Bitmain lists six bins of the same 240-Cb machine, all at 29.5 J/TH (same spec page, accessed November 3, 2026).
  variants:[[104,3068],[100,2950],[96,2832],[92,2714],[88,2596],[84,2478]],
  // Used prices: ING Mining used ASIC sold price index (eBay sales), 90-day medians to October 30, 2026, read November 3, 2026.
  used:{src:'ING Mining used ASIC miner sold prices',url:'https://ingmining.com/used-asic-miner-sold-prices',window:'90 days of eBay sales to October 30, 2026',
   rows:[{slug:'antminer-s19j-pro',price:175,n:11,mid:'$147 to $192'},{slug:'antminer-s19-xp',price:288,n:50,mid:'$250 to $350'},{slug:'antminer-s21-xp',price:2288,n:16,mid:'$2,178 to $2,649'}]}},
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
    if(!m.variants&&!m.used)return {html:'',faq};
    const n=m.name;
    // 1. Today's verdict against real, sourced power prices.
    const pl=[];for(const c of PLACES)for(const x of c.prices){const usd=x.usd??(x.cur==='AED'?x.amt/3.6725:null);if(usd==null)continue;pl.push({c,x,usd,tag:`${c.short} at $${usd.toFixed(3)}`});}
    const winners=pl.filter(o=>o.usd<be).map(o=>o.tag), losers=pl.filter(o=>o.usd>=be).map(o=>o.tag);
    const verdict=`Only on cheap power. At the hashprice on ${day}, one ${n} grosses about ${$(rev)} a day and breaks even at about $${be.toFixed(3)}/kWh before pool fees. Pay less than that and it still makes money; pay more and the power bill is bigger than the revenue.`;
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
<p><b>${esc(ans)}</b> Cheap to buy, expensive to run: newer machines cost far more up front but burn less power per terahash. Same live hashprice for all three below.</p>
<table><thead><tr><th>Machine</th><th>Used median (sales)</th><th>Middle half</th><th>Payback at $0.03</th><th>Payback at $0.04</th><th>Payback at $0.05</th></tr></thead><tbody>${rows.map(r=>`<tr${r.slug===m.slug?' class="hl"':''}><td>${r.slug===m.slug?`<b>${esc(r.o.m.name)}</b>`:`<a href="${r.o.url}">${esc(r.o.m.name)}</a>`}</td><td>$${r.price.toLocaleString('en-US')} (${r.n})</td><td>${r.mid}</td>${r.pr.map(x=>`<td>${days(r.price,x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="note">Used prices: <a href="${U.url}">${U.src}</a>, 90-day medians of eBay sales to October 30, 2026, read November 3, 2026. Payback = used price ÷ daily profit at that power price (our arithmetic), holding today's hashprice flat. No pool fee, shipping, hosting or repairs. "Never" means the machine doesn't cover its power bill at that price.</p>`);
     faq.push(['faq-used-price',`How much is a used ${n}?`,`About $${me.price}. That's the median of ${me.n} eBay sales over the 90 days to October 30, 2026, with the middle half from ${me.mid} (${U.src}).`]);
     faq.push(['faq-payback',`How long does a used ${n} take to pay back?`,ans]);}
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
    const title=m.title||`${m.name} profitability at $0.05/kWh`;
    const ex=extra(r0);
    const desc=m.used?`${m.name} (${m.th} TH/s, ${m.jth} J/TH) only pays below about $${be.toFixed(3)}/kWh today. Used price, payback vs S19 XP and S21 XP, and 2028 halving math.`:`${m.name} (${m.th} TH/s, ${m.w.toLocaleString('en-US')} W, ${m.jth} J/TH): daily revenue, power cost and profit at $0.03 to $0.10/kWh from live hashprice. Break-even about $${be.toFixed(3)}/kWh.`;
    // FAQ answers: plain text built only from the manufacturer spec above and the live hashprice. Same text goes on the page and into FAQPage JSON-LD.
    const faq=[...ex.faq,
     ['faq-day',`How much does the ${m.name} make per day?`,`At a hashprice of ${$(hp,4)} per TH/s per day, one ${m.name} (${m.th} TH/s) grosses about ${$(rev)} a day before power. At $0.05/kWh it ${p05<0?`loses about ${$(-p05)} a day after the power bill, or about ${$(-p05*30,0)} over 30 days`:`keeps about ${$(p05)} a day after the power bill, or about ${$(p05*30,0)} over 30 days`}.`],
     ['faq-power',`How much electricity does the ${m.name} use?`,`${m.maker} lists it at ${m.w.toLocaleString('en-US')} W, so it uses about ${kwh.toFixed(1)} kWh a day running 24 hours. At $0.05/kWh that's about ${$(kwh*0.05)} a day of power.`],
     ['faq-breakeven',`What power price does the ${m.name} need to be profitable?`,`Below about $${be.toFixed(3)}/kWh at today's hashprice. That's its daily revenue (${$(rev)}) divided by its daily energy use (${kwh.toFixed(1)} kWh). Pool fees aren't included, so if your pool charges one the real line is a bit lower.`],
     ['faq-rank',`Is the ${m.name} efficient compared with other ASICs?`,`At ${m.jth} J/TH it ranks ${rank} of ${n} on efficiency among the Antminer and WhatsMiner models we track (lower J/TH is better). The most efficient here is the ${byEff[0].m.name} at ${byEff[0].m.jth} J/TH.`],
     ['faq-left-out','What do these numbers leave out?','Pool fees, downtime, hosting markups and the price of the machine itself. They also hold difficulty and the BTC price where they are today, and both move. Use the ASIC calculator for your own pool fee and power price.']];
    const body=`<article class="prose post"><p class="eyebrow"><a href="/asic/">ASIC profitability</a> · ${updated}</p><h1>${esc(m.h1||m.name+' profitability')}</h1>
<p class="lead"><b>Short answer:</b> ${m.used?`only if your power costs less than about <b>$${be.toFixed(3)}/kWh</b>. One `:'one '}${esc(m.name)} grosses about <b>${$(rev)}</b> a day at the hashprice on ${day}, ${p05<0?`loses about <b>${$(-p05)}</b>`:`keeps about <b>${$(p05)}</b>`} a day at $0.05/kWh, and stops making money above about <b>$${be.toFixed(3)}/kWh</b>. Specs from the <a href="${m.url}">${m.src}</a>, hashprice from the <a href="https://mempool.space/docs/api">mempool.space API</a>.</p>
<p>${esc(m.intro)}</p>
<ul><li><b>Hashrate:</b> ${m.th} TH/s</li><li><b>Power:</b> ${m.w.toLocaleString('en-US')} W</li><li><b>Efficiency:</b> ${m.jth} J/TH</li><li><b>Source:</b> <a href="${m.url}">${m.src}</a>, accessed ${m.accessed||'October 21, 2026'}.${m.maker==='MicroBT'?' The shop lists hashrate and J/TH; the wattage is our arithmetic (TH/s × J/TH).':''}</li></ul>
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
<div class="callout"><b>Use your own numbers or paste your payout address.</b> Pool fee, live price and your exact power cost are all inputs in the ASIC calculator, or paste your Bitcoin mining payout address in <a href="/fleet/">Fleet Check</a> to reconcile your actual 90-day on-chain payouts.<br><a class="btn" href="/mining-calculator/">Open the ASIC calculator <span aria-hidden="true">→</span></a> <a class="btn ghost" href="/fleet/" style="margin-left:.4rem">Benchmark your payout address <span aria-hidden="true">→</span></a></div>
<p>Wondering whether the same kilowatts would earn more renting GPUs? Try the <a href="/">mine vs AI per-kW calculator</a>, or see what an <a href="/gpu/h100/">H100</a> or <a href="/gpu/rtx-4090/">RTX 4090</a> earns per kW. What power costs in big mining places: <a href="/power-prices/">industrial power prices</a>. Learn the math: <a href="/guides/is-bitcoin-mining-profitable-2026/">is Bitcoin mining profitable in 2026?</a> Or see <a href="/asic/">all ASICs</a>.</p>
<!--signup--></article>
<section class="cta"><div><h2>Already mining?</h2><p>Track your real per-site numbers (uptime, power cost, curtailment, payouts) instead of estimates.</p></div><a class="btn" rel="nofollow" href="/go/flash?c=asic-model&amp;p=cta">See Flash for miners <span aria-hidden="true">→</span></a></section>`;
    const ld={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":title,"description":desc,"url":SITE+url,"dateModified":iso,"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"ASIC profitability","item":SITE+'/asic/'},{"@type":"ListItem","position":2,"name":m.name,"item":SITE+url}]}},
     {"@type":"FAQPage","mainEntity":faq.map(([,q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]};
    fs.mkdirSync('dist'+url,{recursive:true});fs.writeFileSync('dist'+url+'index.html',page({title:`${title} | joulemath`,desc,url,ld,body}));
  }
  rows.sort((a,b)=>b.be-a.be);
  const body=`<div class="prose post"><p class="eyebrow">ASIC profitability · ${updated}</p><h1>Bitcoin ASIC profitability by model</h1>
<p class="lead">Daily revenue, profit at $0.05/kWh and break-even power price for popular Antminer and WhatsMiner models, using one live hashprice for all of them so they compare fairly.</p>
<table class="sortable"><caption class="note">Tap a column header to sort.</caption><thead><tr><th>Model</th><th>TH/s</th><th>W</th><th>J/TH</th><th>Revenue / day</th><th>Profit / day at $0.05</th><th aria-sort="descending">Break-even $/kWh</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="${r.url}">${r.m.name}</a></td><td data-v="${r.m.th}">${r.m.th}</td><td data-v="${r.m.w}">${r.m.w.toLocaleString('en-US')}</td><td data-v="${r.m.jth}">${r.m.jth}</td><td data-v="${r.rev}">${$(r.rev)}</td><td data-v="${r.p05}">${$(r.p05)}</td><td data-v="${r.be}">$${r.be.toFixed(3)}</td></tr>`).join('')}</tbody></table><script src="/js/sort.js" defer></script>
<p class="note">${dataLine} Specs from each manufacturer, linked on each model page. Gross revenue, no pool fee or hardware cost.</p>
<p>For your own power price and pool fee, use the <a href="/mining-calculator/">ASIC calculator</a>, or paste your Bitcoin payout address into <a href="/fleet/">Fleet Check</a> to benchmark your last 90 days of on-chain payouts against AI GPU rigs. To see what the same kilowatts earn renting GPUs, try the <a href="/gpu/">GPU pages</a>. Power costs by country are on the <a href="/power-prices/">power prices</a> page.</p><!--signup--></div>`;
  fs.writeFileSync('dist/asic/index.html',page({title:'Bitcoin ASIC profitability by model, live | joulemath',desc:'Antminer S21 XP, S21 Pro, S21, S19 XP, S19k Pro and WhatsMiner M60S, M66S, M63S, M70S: daily profit and break-even power price from live hashprice.',url:'/asic/',ld:{"@context":"https://schema.org","@type":"CollectionPage","name":"Bitcoin ASIC profitability by model","url":SITE+'/asic/'},body}));
  console.log('asic: hashprice',hp.toFixed(4),'pages',MODELS.length);
  return {hp,btc,D,reward,eurPerUsd:pr.EUR/pr.USD,when,iso,day,updated,dataLine,page,models:all};
}
