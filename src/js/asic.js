let L;const F=document.getElementById('calc');
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD;
 const th=v('th')||0,w=v('w')||0,p=v('price')||0,fee=(v('poolfee')||0)/100,hw=v('hw');
 const btcDay=th*L.btcPerTHDay*(1-fee),rev=btcDay*btc,cost=w/1000*24*p,prof=rev-cost;
 const be=th? rev/(w/1000*24):0,max=Math.max(rev,cost),pct=x=>max>0?(Math.max(0,x)/max*100).toFixed(1):0;
 const pay=hw?(prof>0?`<b>${fmt(hw/prof,0)} days</b>`:'<span class="neg">No payback</span>'):'<span class="muted">Add hardware cost</span>';
 o.innerHTML=`<div class="stat-grid">
 <div class="stat hero-stat"><div class="k">Profit per day</div><div class="v ${cls(prof)}">${money(s,prof)}</div><div class="s">${money(s,prof*30)} per month (30d) · ${fmt(btcDay,6)} BTC/day</div></div>
 <div class="stat"><div class="k">Breakeven power price</div><div class="v">${s}${fmt(be,4)}</div><div class="s">per kWh</div></div>
 <div class="stat"><div class="k">Hardware payback</div><div class="v" style="font-size:1.05rem;margin-top:.45rem">${pay}</div><div class="s">at today's numbers</div></div></div>
 <div class="bars"><div class="bar-row"><div class="bl"><span>Revenue / day</span><b>${money(s,rev)}</b></div><div class="track"><div class="fill m" style="width:${pct(rev)}%"></div></div></div>
 <div class="bar-row"><div class="bl"><span>Power cost / day</span><b>${money(s,cost)}</b></div><div class="track"><div class="fill c" style="width:${pct(cost)}%"></div></div></div></div>
 <table><tr><th></th><th>Daily</th><th>Monthly (30d)</th></tr>
 <tr><td>BTC mined</td><td>${fmt(btcDay,6)}</td><td>${fmt(btcDay*30,5)}</td></tr>
 <tr><td>Revenue</td><td>${money(s,rev)}</td><td>${money(s,rev*30)}</td></tr>
 <tr><td>Power cost</td><td>${money(s,cost)}</td><td>${money(s,cost*30)}</td></tr>
 <tr><td><b>Profit</b></td><td class="${cls(prof)}"><b>${money(s,prof)}</b></td><td class="${cls(prof)}"><b>${money(s,prof*30)}</b></td></tr></table>`;}
F.addEventListener('input',e=>{if(e.target.name==='preset'){if(e.target.value){const[a,b]=e.target.value.split(',');th.value=a;w.value=b;}}
 else if(e.target.id==='th'||e.target.id==='w'){document.getElementById('preset').checked=true;}calc();});
getLive().then(d=>{L=d;calc();});
