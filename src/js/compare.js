let L;document.getElementById('calc').addEventListener('input',calc);
function bar(label,val,max,c,s){const w=max>0?Math.max(0,val)/max*100:0;return `<div class="bar-row"><div class="bl"><span>${label}</span><b class="${val<0?'neg':''}">${money(s,val)}</b></div><div class="track"><div class="fill ${c}" style="width:${w.toFixed(1)}%"></div></div></div>`;}
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=cur==='EUR'?L.btcEUR/L.btcUSD:1;
 const modeEl=document.querySelector('input[name=hw]:checked'),rent=modeEl&&modeEl.value==='rent';
 const p=v('price')||0,pue=v('pue')||1,jth=v('jth'),fee=(v('poolfee')||0)/100,kw=v('kw')||1,host=(v('host')||0)*fx;
 const itKW=kw/pue;
 // Mining side: hashrate that fits in the facility kW
 const th=jth?itKW*1000/jth:0,hpDay=th*L.btcPerTHDay*btc,mRev=hpDay*(1-fee);
 const thP=(v('thprice')||0)*fx,aLife=v('alife')||1,prem=(v('prem')||0)/100;
 // GPU side: whole GPUs that fit in the same facility kW
 const gw=v('gpuw')||1000,rate=(v('rate')||0)*fx,util=(v('util')||0)/100,ovh=(v('ovh')||0)/100,gP=(v('gprice')||0)*fx,gLife=v('glife')||1,lease=(v('lease')||0)*fx;
 const n=Math.floor(itKW*1000/gw+1e-9),gKW=n*gw*pue/1000,gRev=n*rate*24*util*(1-ovh);
 let m,g;
 if(!rent){
  const mCap=th*thP,gCap=n*gP;
  m={rev:mRev,pow:kw*24*p,hw:mCap/(aLife*365),host:kw*host*12/365,cap:mCap,life:aLife};
  g={rev:gRev,pow:gKW*24*p,hw:gCap/(gLife*365),host:gKW*host*12/365,cap:gCap,life:gLife};
 }else{
  // Renting the machines: you pay the market price for the compute; the seller covers power and hosting
  m={rev:mRev,pow:0,hw:hpDay*(1+prem),host:0,cap:0};
  g={rev:gRev,pow:0,hw:n*lease*24,host:0,cap:0};
 }
 for(const x of [m,g]){x.net=x.rev-x.pow-x.hw-x.host;x.op=x.rev-x.pow-x.host;x.pb=x.cap&&x.op>0?x.cap/(x.op*30.4):null;x.roi=x.cap?x.net*x.life*365/x.cap:null;}
 const tax=(v('tax')||0)/100,accEl=document.querySelector('input[name=dep]:checked'),acc=accEl&&accEl.value==='acc';
 for(const x of [m,g]){
  // Total tax over the useful life is the same either way; accelerated moves the deduction to year 1, so it changes payback, not lifetime net.
  if(x.cap){x.tax=Math.max(0,x.op-x.hw)*tax;x.atNet=x.net-x.tax;const opAT=acc?x.op*(1-tax):x.op-x.tax,capAT=acc?x.cap*(1-tax):x.cap;x.atPb=opAT>0?capAT/(opAT*30.4):null;}
  else{x.tax=Math.max(0,x.net)*tax;x.atNet=x.net-x.tax;x.atPb=null;}}
 const max=Math.max(m.rev,g.rev,1),d=g.net-m.net;
 const row=(k,a,b)=>`<tr><td>${k}</td><td>${a}</td><td>${b}</td></tr>`,N=x=>`<span class="${cls(x)}">${money(s,x)}</span>`;
 const pb=x=>x.cap?(x.pb==null?'never at these inputs':fmt(x.pb,1)+' months'):'n/a, no purchase';
 const roi=x=>x.cap?money(s,x.roi)+' net per '+s+'1 over '+fmt(x.life,0)+' yrs':'n/a, no purchase';
 o.innerHTML=`<p class="lead-s"><b>GPUs earn more per kW, but they cost far more to buy. Here's the full picture.</b> Both sides use the same ${fmt(kw,0)} kW of facility power. ${rent?'This view assumes you rent the machines instead of buying them: you pay the market price for hashrate or GPU time, and the seller covers power and hosting. If you rent the machines instead of buying, here is what is left.':'This view assumes you buy the machines and spread their price over their useful life, then subtract power and hosting.'}</p>
 <div class="stat-grid">
 <div class="stat"><div class="k"><i style="background:var(--accent)"></i>Mining net / day</div><div class="v ${cls(m.net)}">${money(s,m.net)}</div><div class="s">${money(s,m.rev)} rev · ${money(s,m.pow+m.hw+m.host)} all costs</div></div>
 <div class="stat"><div class="k"><i style="background:var(--gpu)"></i>GPU rental net / day</div><div class="v ${cls(g.net)}">${money(s,g.net)}</div><div class="s">${money(s,g.rev)} rev · ${money(s,g.pow+g.hw+g.host)} all costs</div></div></div>
 <div class="verdict">${d>=0?'<span class="pos">GPU rental</span> nets':'<span class="pos">Mining</span> nets'} ${money(s,Math.abs(d))} more per day on ${fmt(kw,0)} kW after ${rent?'rental':'hardware, power and hosting'} costs.</div>
 <div class="bars">${bar('Mining revenue',m.rev,max,'m',s)}${bar('Mining all costs',m.pow+m.hw+m.host,max,'c',s)}${bar('GPU rental revenue',g.rev,max,'g',s)}${bar('GPU all costs',g.pow+g.hw+g.host,max,'c',s)}</div>
 <div class="tbl"><table><tr><th>${fmt(kw,0)} kW, ${rent?'rent the machines':'own the machines'}</th><th>Bitcoin mining</th><th>GPU rental</th></tr>
 ${row('Hardware',`${fmt(th,0)} TH/s at ${fmt(jth,1)} J/TH`,`${n} GPUs × ${fmt(gw,0)} W`)}
 ${row('Gross revenue / day',money(s,m.rev),money(s,g.rev))}
 ${row('Power / day',money(s,-m.pow),money(s,-g.pow))}
 ${row(rent?'Machine rental / day':'Hardware (amortized) / day',money(s,-m.hw),money(s,-g.hw))}
 ${row('Hosting / colo / day',money(s,-m.host),money(s,-g.host))}
 ${row('<b>Net / day</b>',N(m.net),N(g.net))}
 ${row('Net per kW / day',N(m.net/kw),N(gKW?g.net/gKW:0))}
 ${row('Net per 30 days',N(m.net*30),N(g.net*30))}
 ${tax?row('Tax / day ('+fmt(tax*100,1)+'%, '+(acc?'year-1 expensing':'straight-line')+')',money(s,-m.tax),money(s,-g.tax))+row('<b>After-tax net / day</b>',N(m.atNet),N(g.atNet)):''}
 ${row('Capex total',m.cap?money(s,m.cap,0):'0',g.cap?money(s,g.cap,0):'0')}
 ${row('Payback',pb(m),pb(g))}
 ${tax?row('After-tax payback',m.cap?(m.atPb==null?'never at these inputs':fmt(m.atPb,1)+' months'):'n/a, no purchase',g.cap?(g.atPb==null?'never at these inputs':fmt(g.atPb,1)+' months'):'n/a, no purchase'):''}
 ${row('Return per '+s+'1 invested',roi(m),roi(g))}</table></div>
 <p class="note" style="margin:0"><b>Risks.</b> GPU rental prices have been falling as supply grows, and a drop in rate or utilization hits a big fixed hardware bill. Utilization is our assumption; mining runs every hour you have power, rentals only pay when booked. Mining revenue falls as network difficulty rises and moves with the BTC price. Hardware resale value, downtime and taxes are not included.</p>
 <p class="note" style="margin:0">Payback = capex ÷ ((revenue − power − hosting) × 30.4 days). Return per ${s}1 = net per day × 365 × useful life ÷ capex, after hardware is fully paid off. GPU count = ${fmt(itKW,1)} IT kW ÷ ${fmt(gw,0)} W, rounded down. ${rent?'Mining rental cost = live hashprice × (1 + market premium). GPU lease cost = lease rate × 24 hrs, paid whether or not the GPUs are booked.':'Hardware per day = price ÷ (useful life × 365).'} ${tax?'Tax is your rate × (revenue − power − hosting − depreciation), floored at 0. Year-1 expensing assumes you have enough other income to use the deduction; it lowers the effective price by your tax rate. Not tax advice. ':''}EUR uses the BTC USD/EUR price ratio. Full formulas on the <a href="/methodology/">methodology</a> page.</p>`;}
document.querySelectorAll('input[name=dep]').forEach(r=>r.addEventListener('change',calc));
document.querySelectorAll('input[name=hw]').forEach(r=>r.addEventListener('change',()=>{const rent=document.querySelector('input[name=hw]:checked').value==='rent';document.querySelectorAll('.own-only').forEach(e=>e.hidden=rent);document.querySelectorAll('.rent-only').forEach(e=>e.hidden=!rent);calc();}));
getLive().then(d=>{L=d;calc();});
