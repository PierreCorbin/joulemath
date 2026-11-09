// Build-time numbers for /guides/is-bitcoin-mining-profitable-2026/. The page also refreshes them live in the browser (js/live.js),
// but crawlers and no-JS readers get real values instead of "...". Everything comes from the same mempool.space fetch as the ASIC pages.
import fs from 'fs';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=(n,dp)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});
export function buildGuide(a){
  const f='dist/guides/is-bitcoin-mining-profitable-2026/index.html';let h=fs.readFileSync(f,'utf8');
  const put=(k,v)=>{h=h.split(k).join(v);};
  const POOL=0.02, be=jth=>a.hp*(1-POOL)/(jth*0.024);
  const ms=[...a.models].sort((x,y)=>x.m.jth-y.m.jth), best=ms[0], worst=ms[ms.length-1];
  const live={rewardPerBlock:fmt(a.reward,4),difficulty:fmt(a.D,0),hashpriceUSD:fmt(a.hp,4),btcUSD:fmt(a.btc,0),breakevenS21:fmt(be(13.5),3)};
  h=h.replace(/<b data-k="(\w+)">\.\.\.<\/b>/g,(m,k)=>live[k]?`<b data-k="${k}">${live[k]}</b>`:m);
  h=h.replace('<!--guide-updated-->',a.updated);
  h=h.replace('<!--guide-answer-->',`<p><b>At today's numbers:</b> hashprice is about <b>$${fmt(a.hp,4)}</b> per TH/s per day, so the most efficient machine we track, the ${best.m.name} (${best.m.jth} J/TH), breaks even at about <b>$${fmt(be(best.m.jth),3)}/kWh</b> with a 2% pool fee, and the least efficient, the ${worst.m.name} (${worst.m.jth} J/TH), at about <b>$${fmt(be(worst.m.jth),3)}/kWh</b>. If your all-in power costs less than that, mining pays on paper today. Hashprice computed ${esc(a.when)} from the <a href="https://mempool.space/docs/api">mempool.space API</a>; specs from each manufacturer.</p>`);
  h=h.replace('<!--guide-table-->',`<table><thead><tr><th>Machine</th><th>J/TH</th><th>Break-even $/kWh (2% pool fee)</th></tr></thead><tbody>${ms.map(r=>`<tr><td><a href="${r.url}">${r.m.name}</a></td><td>${r.m.jth}</td><td>$${fmt(be(r.m.jth),3)}</td></tr>`).join('')}</tbody></table>
<p class="note">Break-even = hashprice × 0.98 ÷ (J/TH × 0.024), at the hashprice above. Specs are linked on each machine's page.</p>`);
  // Cost to mine 1 BTC (our arithmetic, same formula as the ASIC pages): kWh a day x power price / (BTC a day), BTC a day = revenue x 0.98 / BTC price.
  const mod=slug=>a.models.find(o=>o.m.slug===slug), xp=mod('antminer-s21-xp'), s19=mod('antminer-s19-xp');
  const k0=n=>'$'+Math.round(n).toLocaleString('en-US'), btcTxt='$'+fmt(a.btc,0);
  const cx=a.costBtc(xp,0.05), cs=a.costBtc(s19,0.05), PW=[0.03,0.05,0.07,0.10];
  const costAns=`At $0.05/kWh, electricity alone costs about ${k0(cx.usd)} to mine 1 BTC with an ${xp.m.name} (about ${k0(cx.kwh).slice(1)} kWh) and about ${k0(cs.usd)} with an ${s19.m.name}, against a BTC price of ${btcTxt} on ${a.day}. That leaves roughly ${k0(a.btc-cx.usd)} of each coin's value after power on the ${xp.m.name} and ${k0(a.btc-cs.usd)} on the ${s19.m.name}, before hardware, hosting and downtime.`;
  put('<!--guide-cost-->',`<h2 id="cost-per-btc">6. How much does it cost to mine 1 Bitcoin?</h2>
<p><b>${esc(costAns)}</b></p>
<p>The formula is <b>cost per BTC = kWh a day × power price ÷ BTC mined a day</b>, where BTC mined a day = TH/s × BTC per TH/s per day × (1 − pool fee). It moves with every input: a higher difficulty or a lower BTC price raises the cost per coin, cheaper power lowers it. The table uses today's numbers.</p>
<table><thead><tr><th>Machine</th><th>kWh per BTC</th>${PW.map(p=>`<th>At $${p.toFixed(2)}/kWh</th>`).join('')}</tr></thead><tbody>${[xp,s19].map(o=>`<tr><td><a href="${o.url}">${o.m.name}</a></td><td>${k0(a.costBtc(o,0.05).kwh).slice(1)}</td>${PW.map(p=>{const c=a.costBtc(o,p);return `<td>${k0(c.usd)} (${(c.share*100).toFixed(0)}%)</td>`;}).join('')}</tr>`).join('')}</tbody></table>
<p class="note">Our arithmetic from the manufacturer spec (<a href="${xp.m.url}">S21 XP: 270 TH/s, 3,645 W</a>; <a href="${s19.m.url}">S19 XP: 141 TH/s, 21.5 J/TH, 3,031.5 W</a>), a 2% pool fee, and the hashprice and BTC price from the <a href="https://mempool.space/docs/api">mempool.space API</a> on ${a.day}. Percent is the share of the ${btcTxt} BTC price. Electricity only, no hardware, hosting or downtime. A single machine takes years to mine one whole coin (about ${Math.round(cx.days/365)} years for an ${xp.m.name}), so "cost per BTC" here means the power cost of one coin's worth of hashing, not a coin you will hold soon. Same math per model on the <a href="/asic/">ASIC profitability pages</a>, with the formulas in the <a href="/methodology/#cost-per-btc">methodology</a>.</p>`);
  const adj=a.adj, be2=jth=>be(jth)*adj.hpAfter/a.hp;
  put('<!--guide-retarget-->',adj?`<h2 id="retarget">7. What will the next difficulty adjustment do to mining profit?</h2>
<p><b>${esc(a.retargetTxt)}</b></p>
<p>Break-even power prices would move from about $${fmt(be(13.5),3)} to about $${fmt(be2(13.5),3)}/kWh for the ${xp.m.name} and from about $${fmt(be(s19.m.jth),3)} to about $${fmt(be2(s19.m.jth),3)}/kWh for the ${s19.m.name} (2% pool fee, our math, same BTC price and fees). At $0.05/kWh the electricity cost per BTC on the ${xp.m.name} would go from about ${k0(cx.usd)} to about ${k0(cx.usd*(1+adj.pct/100))}, because cost per coin moves with difficulty. Difficulty adjusts every 2,016 blocks, about every two weeks, so a drop now can be followed by a rise at the next one.</p>`:'');
  put('<!--guide-verdict-->',`On ${esc(a.day)}, hashprice was $${fmt(a.hp,4)} per TH/s per day (<a href="https://mempool.space/docs/api">mempool.space</a> data, our math), which puts the ${xp.m.name} at about $${fmt(be(13.5),3)}/kWh and the ${s19.m.name} at about $${fmt(be(s19.m.jth),3)}/kWh. Mining with a good machine is worth it on cheap power and not worth it on dear power: at $0.05/kWh the ${xp.m.name} spends about ${k0(cx.usd)} of electricity per BTC and the ${s19.m.name} about ${k0(cs.usd)}, vs a ${btcTxt} coin.`);
  put('<!--guide-lead-->',`<b>Short answer:</b> yes, if your power costs less than your machine's break-even price. On ${esc(a.day)} hashprice was <b>$${fmt(a.hp,4)} per TH/s per day</b> (<a href="https://mempool.space/docs/api">mempool.space</a> data, our math), so an ${xp.m.name} breaks even at about <b>$${fmt(be(13.5),3)}/kWh</b> and an ${s19.m.name} at about <b>$${fmt(be(s19.m.jth),3)}/kWh</b>, both with a 2% pool fee. At $0.05/kWh, electricity alone costs about <b>${k0(cx.usd)}</b> to mine 1 BTC with an ${xp.m.name}, against a BTC price of ${btcTxt}.`);
  const title='Is Bitcoin mining worth it in 2026? Cost per BTC | joulemath';
  const desc=`Is mining profitable? On ${a.day} an S21 XP breaks even at $${fmt(be(13.5),3)}/kWh and 1 BTC costs about ${k0(cx.usd)} in power at $0.05/kWh. Hashprice, retarget, sources.`;
  for(const [k,v] of [['<!--guide-title-->',esc(title)],['<!--guide-desc-->',esc(desc)],['<!--guide-modified-->',a.iso.slice(0,10)]])h=h.split(k).join(v);
  const faq=[
   ['faq-profitable','Is Bitcoin mining profitable in 2026?',`It is if your power costs less than your machine's break-even price. At today's hashprice of $${fmt(a.hp,4)} per TH/s per day, the ${best.m.name} breaks even at about $${fmt(be(best.m.jth),3)}/kWh and the ${worst.m.name} at about $${fmt(be(worst.m.jth),3)}/kWh, both with a 2% pool fee. Hardware cost, downtime and hosting fees come on top.`],
   ['faq-worth','Is it worth mining Bitcoin in 2026?',`It depends on your power price. On ${a.day}, an ${xp.m.name} stays profitable on electricity up to about $${fmt(be(13.5),3)}/kWh and an ${s19.m.name} up to about $${fmt(be(s19.m.jth),3)}/kWh (2% pool fee, our math from mempool.space data). Above that, the power bill is bigger than the coins mined. Hardware, hosting and downtime come on top, so work out payback before you buy.`],
   ['faq-cost-btc','How much does it cost to mine 1 Bitcoin?',`${costAns} Our arithmetic: kWh a day × power price ÷ BTC mined a day, with a 2% pool fee.`],
   ['faq-hashprice','What is hashprice?',`Hashprice is what 1 TH/s of mining earns per day, in dollars. It comes from difficulty, the block reward and the BTC price. Right now it's about $${fmt(a.hp,4)} per TH/s per day, from mempool.space data.`],
   ['faq-breakeven','How do you work out the break-even electricity price?','Take hashprice, subtract the pool fee, and divide by the energy one TH/s uses in a day, which is J/TH × 0.024 kWh. Pay less than that for power and the machine earns more than its power bill.'],
   ...(adj?[['faq-retarget','What happens to mining profit at the next difficulty adjustment?',a.retargetTxt]]:[]),
   ['faq-halving','When is the next Bitcoin halving?','At block 1,050,000. The subsidy is 3.125 BTC per block until then, and it halves every 210,000 blocks (Bitcoin Core, GetBlockSubsidy).']];
  h=h.replace('<!--guide-faq-->',`<h2 id="faq">FAQ</h2>\n${faq.map(([id,q,ans])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(ans)}</p>`).join('\n')}`);
  const ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":faq.map(([,q,ans])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":ans}}))};
  h=h.replace('</head>',`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script></head>`);
  if(h.includes('<!--guide-'))throw new Error('guide: unfilled marker');
  fs.writeFileSync(f,h);
}
