// Live data, all client-side. Sources: mempool.space API, CoinGecko fallback.
const SUBSIDY_NOTE='3.125 BTC subsidy since block 840,000';
async function j(u){const r=await fetch(u);if(!r.ok)throw new Error(u+' '+r.status);return r.json();}
async function getLive(){
  const d={errors:[]};
  try{const h=await j('https://mempool.space/api/v1/mining/hashrate/3d');d.difficulty=h.currentDifficulty;d.hashrateEH=h.currentHashrate/1e18;}catch(e){d.errors.push('mempool.space difficulty');}
  try{const s=await j('https://mempool.space/api/v1/mining/reward-stats/144');const n=s.endBlock-s.startBlock+1;d.rewardPerBlock=Number(s.totalReward)/1e8/n;d.feePerBlock=Number(s.totalFee)/1e8/n;}catch(e){d.errors.push('mempool.space rewards');d.rewardPerBlock=3.125;d.rewardFallback=true;}
  try{const p=await j('https://mempool.space/api/v1/prices');d.btcUSD=p.USD;d.btcEUR=p.EUR;d.priceSrc='mempool.space';}catch(e){
    try{const c=await j('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');d.btcUSD=c.bitcoin.usd;d.btcEUR=c.bitcoin.eur;d.priceSrc='CoinGecko';}catch(e2){d.errors.push('BTC price (mempool.space and CoinGecko)');}}
  if(d.difficulty){d.btcPerTHDay=1e12*86400/(d.difficulty*2**32)*d.rewardPerBlock;
    if(d.btcUSD){d.hashpriceUSD=d.btcPerTHDay*d.btcUSD;d.hashpriceEUR=d.btcPerTHDay*d.btcEUR;d.breakevenS21=d.hashpriceUSD*0.98/(13.5*0.024);}}
  const el=document.getElementById('live');
  if(el){el.innerHTML=d.errors.length&&!d.hashpriceUSD?'Could not load live data ('+d.errors.join(', ')+'). Try refreshing.':
   `<b>Live:</b> BTC $${fmt(d.btcUSD,0)} / €${fmt(d.btcEUR,0)} (${d.priceSrc}) · difficulty ${fmt(d.difficulty/1e12,2)} T · network ${fmt(d.hashrateEH,0)} EH/s · reward ${fmt(d.rewardPerBlock,4)} BTC/block (avg last 144 blocks${d.rewardFallback?', fallback: subsidy only':''}) · hashprice $${fmt(d.hashpriceUSD,4)}/TH/day. Source: <a href="https://mempool.space/docs/api">mempool.space</a>${d.errors.length?' · failed: '+d.errors.join(', '):''}`;}
  document.querySelectorAll('[data-k]').forEach(b=>{const v=d[b.dataset.k];if(v!=null)b.textContent=b.dataset.k==='difficulty'?fmt(v,0):fmt(v,v<1?4:v<100?3:0);});
  return d;}
function fmt(n,dp=2){return n==null||isNaN(n)?'n/a':Number(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function v(id){const x=parseFloat(document.getElementById(id).value);return isNaN(x)?null:x;}
