let L;const ids=['th','w','price','cur','poolfee','hw'];
function calc(){if(!L||!L.btcPerTHDay||!L.btcUSD){document.getElementById('out').textContent='Waiting for live data.';return;}
 const cur=document.getElementById('cur').value,s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD;
 const th=v('th')||0,w=v('w')||0,p=v('price')||0,fee=(v('poolfee')||0)/100,hw=v('hw');
 const btcDay=th*L.btcPerTHDay*(1-fee),rev=btcDay*btc,cost=w/1000*24*p,prof=rev-cost;
 const be=th? rev/(w/1000*24):0;
 document.getElementById('out').innerHTML=`<table><tr><th></th><th>Daily</th><th>Monthly (30d)</th></tr>
 <tr><td>BTC mined</td><td>${fmt(btcDay,6)}</td><td>${fmt(btcDay*30,5)}</td></tr>
 <tr><td>Revenue</td><td>${s}${fmt(rev)}</td><td>${s}${fmt(rev*30)}</td></tr>
 <tr><td>Power cost</td><td>${s}${fmt(cost)}</td><td>${s}${fmt(cost*30)}</td></tr>
 <tr><td><b>Profit</b></td><td><b>${s}${fmt(prof)}</b></td><td><b>${s}${fmt(prof*30)}</b></td></tr></table>
 <p>Breakeven power price: <b>${s}${fmt(be,4)}/kWh</b>. ${hw?(prof>0?`Hardware payback: <b>${fmt(hw/prof,0)} days</b> at today's numbers.`:'No payback at this power price.'):'Add hardware cost to see payback.'}</p>`;}
document.getElementById('preset').onchange=e=>{if(e.target.value){const[a,b]=e.target.value.split(',');th.value=a;w.value=b;}calc();};
ids.forEach(i=>document.getElementById(i).addEventListener('input',calc));
getLive().then(d=>{L=d;calc();});
