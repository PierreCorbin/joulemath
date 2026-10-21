let L;document.getElementById('calc').addEventListener('input',calc);
function bar(label,val,max,c,s){const w=max>0?Math.max(0,val)/max*100:0;return `<div class="bar-row"><div class="bl"><span>${label}</span><b class="${val<0?'neg':''}">${money(s,val)}</b></div><div class="track"><div class="fill ${c}" style="width:${w.toFixed(1)}%"></div></div></div>`;}
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=L.btcEUR/L.btcUSD;
 const p=v('price')||0,pue=v('pue')||1,jth=v('jth'),fee=(v('poolfee')||0)/100,kw=v('kw')||1;
 const itKW=kw/pue;
 // Mining: all facility kW
 const th=jth?itKW*1000/jth:0,mRev=th*L.btcPerTHDay*(1-fee)*btc,mCost=kw*24*p,mProf=mRev-mCost;
 // GPU: same facility kW, whole GPUs only
 const gw=v('gpuw')||1000,rate=v('rate')||0,util=(v('util')||0)/100,ovh=(v('ovh')||0)/100,rateC=cur==='EUR'?rate*fx:rate;
 const n=Math.floor(itKW*1000/gw+1e-9),gKW=n*gw*pue/1000,gCost=gKW*24*p,gRev=n*rateC*24*util*(1-ovh),gProf=gRev-gCost;
 const max=Math.max(mRev,gRev,mCost,gCost),d=gProf-mProf;
 const row=(k,a,b)=>`<tr><td>${k}</td><td>${a}</td><td>${b}</td></tr>`;
 o.innerHTML=`<div class="stat-grid">
 <div class="stat"><div class="k"><i style="background:var(--accent)"></i>Mining net / day</div><div class="v ${cls(mProf)}">${money(s,mProf)}</div><div class="s">${money(s,mRev)} rev · ${money(s,mCost)} power</div></div>
 <div class="stat"><div class="k"><i style="background:var(--gpu)"></i>GPU rental net / day</div><div class="v ${cls(gProf)}">${money(s,gProf)}</div><div class="s">${money(s,gRev)} rev · ${money(s,gCost)} power</div></div></div>
 <div class="verdict">${d>=0?'<span class="pos">GPU rental</span> nets':'<span class="pos">Mining</span> nets'} ${money(s,Math.abs(d))} more per day on ${fmt(kw,0)} kW at these inputs.</div>
 <div class="bars">${bar('Mining revenue',mRev,max,'m',s)}${bar('GPU rental revenue',gRev,max,'g',s)}${bar('Mining power cost',mCost,max,'c',s)}${bar('GPU power cost',gCost,max,'c',s)}</div>
 <table><tr><th>${fmt(kw,0)} kW operation, per day</th><th>Bitcoin mining</th><th>GPU rental</th></tr>
 ${row('Hardware',`${fmt(th,0)} TH/s at ${fmt(jth,1)} J/TH`,`${n} GPUs × ${fmt(gw,0)} W`)}
 ${row('Power draw at the meter',`${fmt(kw,1)} kW`,`${fmt(gKW,1)} kW`)}
 ${row('Power cost',money(s,mCost),money(s,gCost))}
 ${row('Gross revenue',money(s,mRev),money(s,gRev))}
 ${row('Net',`<span class="${cls(mProf)}">${money(s,mProf)}</span>`,`<span class="${cls(gProf)}">${money(s,gProf)}</span>`)}
 ${row('Net per kW',money(s,mProf/kw),money(s,n?gProf/gKW:0))}
 ${row('Net per 30 days',money(s,mProf*30,0),money(s,gProf*30,0))}</table>
 <p class="note" style="margin:0">GPU count = ${fmt(itKW,1)} IT kW ÷ ${fmt(gw,0)} W, rounded down to ${n}. GPU revenue = ${n} × ${money(s,rateC)}/hr × 24 × ${fmt(util*100,0)}% utilization${ovh?` × (1 − ${fmt(ovh*100,0)}% overhead)`:''}. Power per GPU and utilization are our assumptions. Rental rates are renter prices, not host net. GPU capex, far higher per kW than ASICs, is not included. EUR conversion of the USD rate uses the BTC USD/EUR price ratio.</p>`;}
getLive().then(d=>{L=d;calc();});
