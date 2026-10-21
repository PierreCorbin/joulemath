let L;['price','cur','pue','jth','poolfee','gpus','gpuw','rate','util','ovh'].forEach(i=>document.getElementById(i).addEventListener('input',calc));
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.textContent='Waiting for live data.';return;}
 const cur=document.getElementById('cur').value,s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=L.btcEUR/L.btcUSD;
 const p=v('price')||0,pue=v('pue')||1,jth=v('jth'),fee=(v('poolfee')||0)/100;
 const kwhDay=24; // per 1 kW of facility power
 const itKW=1/pue,costKW=kwhDay*p;
 const mRev=jth?itKW*1000/jth*L.btcPerTHDay*(1-fee)*btc:0,mProf=mRev-costKW;
 const g=v('gpus'),gw=v('gpuw'),rate=v('rate'),util=(v('util')||0)/100,ovh=(v('ovh')||0)/100;
 let gRow='<td colspan="3">Enter GPU power and rental rate to compare.</td>',gProf=null;
 if(g&&gw&&rate){const gpusPerKW=itKW*1000/gw;const rateC=cur==='EUR'?rate*fx:rate;
  const gRev=gpusPerKW*rateC*24*util*(1-ovh);gProf=gRev-costKW;
  gRow=`<td>${s}${fmt(gRev)}</td><td>${s}${fmt(costKW)}</td><td><b>${s}${fmt(gProf)}</b></td>`;
  gRow+=`</tr><tr><td colspan="4"><small>${fmt(gpusPerKW,2)} GPUs fit per facility kW. Your ${g} GPUs draw ${fmt(g*gw*pue/1000,1)} kW at the meter: ${s}${fmt(gProf*g*gw*pue/1000)}/day vs mining that same power: ${s}${fmt(mProf*g*gw*pue/1000)}/day.</small></td>`;}
 o.innerHTML=`<table><tr><th>Per 1 kW of facility power, per day</th><th>Revenue</th><th>Power cost</th><th>Profit</th></tr>
 <tr><td>Bitcoin mining</td><td>${s}${fmt(mRev)}</td><td>${s}${fmt(costKW)}</td><td><b>${s}${fmt(mProf)}</b></td></tr>
 <tr><td>GPU rental</td>${gRow}</tr></table>
 <p>Per MW per month (30d): mining ${s}${fmt(mProf*1000*30,0)}${gProf!=null?`, GPU rental ${s}${fmt(gProf*1000*30,0)}`:''}.</p>
 <p class="note">GPU rental side leaves out GPU capex, which is far higher per kW than ASICs. EUR conversion of the USD rental rate uses the BTC USD/EUR price ratio.</p>`;}
getLive().then(d=>{L=d;calc();});
