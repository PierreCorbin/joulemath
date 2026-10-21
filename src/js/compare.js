let L;document.getElementById('calc').addEventListener('input',calc);
function bar(label,val,max,c,s){const w=max>0?Math.max(0,val)/max*100:0;return `<div class="bar-row"><div class="bl"><span>${label}</span><b class="${val<0?'neg':''}">${money(s,val)}</b></div><div class="track"><div class="fill ${c}" style="width:${w.toFixed(1)}%"></div></div></div>`;}
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=L.btcEUR/L.btcUSD;
 const p=v('price')||0,pue=v('pue')||1,jth=v('jth'),fee=(v('poolfee')||0)/100;
 const kwhDay=24; // per 1 kW of facility power
 const itKW=1/pue,costKW=kwhDay*p;
 const mRev=jth?itKW*1000/jth*L.btcPerTHDay*(1-fee)*btc:0,mProf=mRev-costKW;
 const g=v('gpus'),gw=v('gpuw'),rate=v('rate'),util=(v('util')||0)/100,ovh=(v('ovh')||0)/100;
 let gRev=null,gProf=null,extra='';
 if(g&&gw&&rate){const gpusPerKW=itKW*1000/gw;const rateC=cur==='EUR'?rate*fx:rate;
  gRev=gpusPerKW*rateC*24*util*(1-ovh);gProf=gRev-costKW;
  extra=`<p class="note" style="margin:0">${fmt(gpusPerKW,2)} GPUs fit per facility kW. Your ${g} GPUs draw ${fmt(g*gw*pue/1000,1)} kW at the meter: ${money(s,gProf*g*gw*pue/1000)}/day vs mining that same power: ${money(s,mProf*g*gw*pue/1000)}/day.</p>`;}
 const max=Math.max(mRev,gRev||0,costKW);
 let verdict='';if(gProf!=null){const d=gProf-mProf;verdict=`<div class="verdict">${d>=0?'<span class="pos">GPU rental</span> earns':'<span class="pos">Mining</span> earns'} ${money(s,Math.abs(d))} more per kW per day at these inputs.</div>`;}
 o.innerHTML=`<div class="stat-grid">
 <div class="stat"><div class="k"><i style="background:var(--accent)"></i>Mining profit</div><div class="v ${cls(mProf)}">${money(s,mProf)}</div><div class="s">${money(s,mRev)} rev · ${money(s,costKW)} power</div></div>
 <div class="stat"><div class="k"><i style="background:var(--gpu)"></i>GPU rental profit</div>${gProf!=null?`<div class="v ${cls(gProf)}">${money(s,gProf)}</div><div class="s">${money(s,gRev)} rev · ${money(s,costKW)} power</div>`:`<div class="v muted">n/a</div><div class="s">Enter GPU power and rental rate to compare.</div>`}</div></div>
 ${verdict}
 <div class="bars">${bar('Mining revenue',mRev,max,'m',s)}${gRev!=null?bar('GPU rental revenue',gRev,max,'g',s):''}${bar('Power cost',costKW,max,'c',s)}</div>
 <table><tr><th>Per MW per month (30d)</th><th>Profit</th></tr><tr><td>Bitcoin mining</td><td class="${cls(mProf)}">${money(s,mProf*1000*30,0)}</td></tr><tr><td>GPU rental</td><td class="${cls(gProf)}">${gProf!=null?money(s,gProf*1000*30,0):'n/a'}</td></tr></table>
 ${extra}
 <p class="note" style="margin:0">GPU rental side leaves out GPU capex, which is far higher per kW than ASICs. EUR conversion of the USD rental rate uses the BTC USD/EUR price ratio.</p>`;}
getLive().then(d=>{L=d;calc();});
