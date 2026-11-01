// Build-time numbers for /guides/is-bitcoin-mining-profitable-2026/. The page also refreshes them live in the browser (js/live.js),
// but crawlers and no-JS readers get real values instead of "...". Everything comes from the same mempool.space fetch as the ASIC pages.
import fs from 'fs';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=(n,dp)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});
export function buildGuide(a){
  const f='dist/guides/is-bitcoin-mining-profitable-2026/index.html';let h=fs.readFileSync(f,'utf8');
  const POOL=0.02, be=jth=>a.hp*(1-POOL)/(jth*0.024);
  const ms=[...a.models].sort((x,y)=>x.m.jth-y.m.jth), best=ms[0], worst=ms[ms.length-1];
  const live={rewardPerBlock:fmt(a.reward,4),difficulty:fmt(a.D,0),hashpriceUSD:fmt(a.hp,4),btcUSD:fmt(a.btc,0),breakevenS21:fmt(be(13.5),3)};
  h=h.replace(/<b data-k="(\w+)">\.\.\.<\/b>/g,(m,k)=>live[k]?`<b data-k="${k}">${live[k]}</b>`:m);
  h=h.replace('<!--guide-updated-->',a.updated);
  h=h.replace('<!--guide-answer-->',`<p><b>At today's numbers:</b> hashprice is about <b>$${fmt(a.hp,4)}</b> per TH/s per day, so the most efficient machine we track, the ${best.m.name} (${best.m.jth} J/TH), breaks even at about <b>$${fmt(be(best.m.jth),3)}/kWh</b> with a 2% pool fee, and the least efficient, the ${worst.m.name} (${worst.m.jth} J/TH), at about <b>$${fmt(be(worst.m.jth),3)}/kWh</b>. If your all-in power costs less than that, mining pays on paper today. Hashprice computed ${esc(a.when)} from the <a href="https://mempool.space/docs/api">mempool.space API</a>; specs from each manufacturer.</p>`);
  h=h.replace('<!--guide-table-->',`<table><thead><tr><th>Machine</th><th>J/TH</th><th>Break-even $/kWh (2% pool fee)</th></tr></thead><tbody>${ms.map(r=>`<tr><td><a href="${r.url}">${r.m.name}</a></td><td>${r.m.jth}</td><td>$${fmt(be(r.m.jth),3)}</td></tr>`).join('')}</tbody></table>
<p class="note">Break-even = hashprice × 0.98 ÷ (J/TH × 0.024), at the hashprice above. Specs are linked on each machine's page.</p>`);
  const faq=[
   ['faq-profitable','Is Bitcoin mining profitable in 2026?',`It is if your power costs less than your machine's break-even price. At today's hashprice of $${fmt(a.hp,4)} per TH/s per day, the ${best.m.name} breaks even at about $${fmt(be(best.m.jth),3)}/kWh and the ${worst.m.name} at about $${fmt(be(worst.m.jth),3)}/kWh, both with a 2% pool fee. Hardware cost, downtime and hosting fees come on top.`],
   ['faq-hashprice','What is hashprice?',`Hashprice is what 1 TH/s of mining earns per day, in dollars. It comes from difficulty, the block reward and the BTC price. Right now it's about $${fmt(a.hp,4)} per TH/s per day, from mempool.space data.`],
   ['faq-breakeven','How do you work out the break-even electricity price?','Take hashprice, subtract the pool fee, and divide by the energy one TH/s uses in a day, which is J/TH × 0.024 kWh. Pay less than that for power and the machine earns more than its power bill.'],
   ['faq-halving','When is the next Bitcoin halving?','At block 1,050,000. The subsidy is 3.125 BTC per block until then, and it halves every 210,000 blocks (Bitcoin Core, GetBlockSubsidy).']];
  h=h.replace('<!--guide-faq-->',`<h2 id="faq">FAQ</h2>\n${faq.map(([id,q,ans])=>`<h3 id="${id}">${esc(q)}</h3>\n<p>${esc(ans)}</p>`).join('\n')}`);
  const ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":faq.map(([,q,ans])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":ans}}))};
  h=h.replace('</head>',`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script></head>`);
  if(h.includes('<!--guide-'))throw new Error('guide: unfilled marker');
  fs.writeFileSync(f,h);
}
