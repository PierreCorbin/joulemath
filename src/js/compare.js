let L;document.getElementById('calc').addEventListener('input',calc);
const chk=n=>{const e=document.querySelector(`input[name=${n}]:checked`);return e?e.value:null;};
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=cur==='EUR'?L.btcEUR/L.btcUSD:1;
 const rent=chk('hw')==='rent',byUsd=chk('basis')==='usd';
 const p=v('price')||0,pue=v('pue')||1,jth=v('jth')||1,fee=(v('poolfee')||0)/100,kw=v('kw')||1,host=(v('host')||0)*fx,bud=(v('budget')||0)*fx;
 const thP=(v('thprice')||0)*fx,aLife=v('alife')||1,prem=(v('prem')||0)/100,hpTH=L.btcPerTHDay*btc;
 const gw=v('gpuw')||1000,rate=(v('rate')||0)*fx,util=(v('util')||0)/100,ovh=(v('ovh')||0)/100,gP=(v('gprice')||0)*fx,gLife=v('glife')||1,lease=(v('lease')||0)*fx;
 // Size each side: same facility kW, or same budget (capex when buying, monthly rent spend when renting)
 let th,n;
 if(!byUsd){const it=kw/pue;th=it*1000/jth;n=Math.floor(it*1000/gw+1e-9);}
 else if(!rent){th=thP?bud/thP:0;n=gP?Math.floor(bud/gP+1e-9):0;}
 else{const mc=hpTH*(1+prem)*30.4,gc=lease*24*30.4;th=mc?bud/mc:0;n=gc?Math.floor(bud/gc+1e-9):0;}
 const mKW=th*jth/1000*pue,gKW=n*gw*pue/1000,mRev=th*hpTH*(1-fee),gRev=n*rate*24*util*(1-ovh);
 let m,g;
 if(!rent){m={rev:mRev,pow:mKW*24*p,hw:th*thP/(aLife*365),host:mKW*host*12/365,cap:th*thP,life:aLife};g={rev:gRev,pow:gKW*24*p,hw:n*gP/(gLife*365),host:gKW*host*12/365,cap:n*gP,life:gLife};}
 else{m={rev:mRev,pow:0,hw:th*hpTH*(1+prem),host:0,cap:0};g={rev:gRev,pow:0,hw:n*lease*24,host:0,cap:0};}
 const tax=(v('tax')||0)/100,acc=chk('dep')==='acc';
 for(const x of [m,g]){x.kw=x===m?mKW:gKW;x.net=x.rev-x.pow-x.hw-x.host;x.op=x.rev-x.pow-x.host;
  x.tax=Math.max(0,x.cap?x.op-x.hw:x.net)*tax;x.atNet=x.net-x.tax;
  const opAT=x.cap?(acc?x.op*(1-tax):x.op-x.tax):0,capAT=acc?x.cap*(1-tax):x.cap;
  x.pb=x.cap&&opAT>0?capAT/(opAT*30.4):null;
  x.base=x.cap||x.hw*30.4; // $ invested, or $ rent paid per month
  x.k=x.base?x.atNet*30.4/x.base*1000:null;x.mg=x.rev?x.atNet/x.rev*100:null;x.pkw=x.kw?x.atNet/x.kw:null;x.roi=x.cap?x.atNet*x.life*365/x.cap:null;}
 const N=x=>`<span class="${cls(x)}">${money(s,x)}</span>`,P=x=>x==null?'n/a':`<span class="${cls(x)}">${x<0?"−":""}${fmt(Math.abs(x),1)}%</span>`;
 const row=(k,a,b,h)=>`<tr><td>${k}${h?` <a class="how" href="/methodology/#${h}">how</a>`:''}</td><td>${a}</td><td>${b}</td></tr>`;
 const at=tax?', after tax':'',W=m.k!=null&&g.k!=null?(g.k>=m.k?'GPU rental':'Mining'):null;
 const head=W?`<b>${W}</b> nets more per ${s}1,000 ${rent?'of rent':'invested'}: <b class="${cls(g.k)}">${money(s,g.k,0)}</b>/mo for GPUs vs <b class="${cls(m.k)}">${money(s,m.k,0)}</b> for mining${at}.`:'Enter prices to compare.';
 const hU=byUsd&&(m.cap||g.cap||rent),Wu=g.atNet>=m.atNet?'GPU rental':'Mining';
 const head2=`With ${s}${fmt(bud,0)}${rent?' of rent a month':''}, <b>${Wu}</b> nets more: <b class="${cls(g.atNet)}">${money(s,g.atNet*30.4,0)}</b>/mo for GPUs vs <b class="${cls(m.atNet)}">${money(s,m.atNet*30.4,0)}</b> for mining${at}.`;
 const left=byUsd?bud-(rent?n*lease*24*30.4:n*gP):0;
 const pb=x=>x.cap?(x.pb==null?'never':fmt(x.pb,1)+' mo'):'n/a';
 const sz=byUsd?`${s}${fmt(bud,0)} ${rent?'rent per month':'budget'} each side`:`${fmt(kw,0)} kW each side`;
 o.innerHTML=`<p class="headline">${hU?head2:head}</p><p class="note" style="margin:0">${sz}, ${rent?'rented machines':'bought machines'}${left>1?`. GPUs come in whole units, so ${money(s,left,0)} of the GPU budget is left unspent`:''}.</p>
 <div class="tbl"><table class="kt"><tr><th></th><th><i class="dot-m"></i>Mining</th><th><i class="dot-g"></i>GPU</th></tr>
 ${row('Net / mo per '+s+'1k '+(rent?'rent':'invested'),N(m.k),N(g.k),'scale-free')}
 ${row('Payback',pb(m),pb(g),'payback')}
 ${row('Net margin',P(m.mg),P(g.mg),'scale-free')}
 ${row('Net per kW / day',N(m.pkw),N(g.pkw),'scale-free')}
 ${row('Lifetime return per '+s+'1',m.cap?N(m.roi):'n/a',g.cap?N(g.roi):'n/a','payback')}
 ${byUsd?row('Buys',`${fmt(th,0)} TH/s (${fmt(th/270,1)} S21 XP)`,`${n} GPUs`,'same-budget')+row('Power used',fmt(mKW,1)+' kW',fmt(gKW,1)+' kW','same-budget')+row('Net / month',N(m.atNet*30.4),N(g.atNet*30.4),'same-budget'):''}
 </table></div>
 <details class="full-num"><summary>Full numbers</summary><div class="tbl"><table><tr><th>Per day</th><th>Mining</th><th>GPU</th></tr>
 ${row('Hardware',`${fmt(th,0)} TH/s`,`${n} GPUs`)}${row('Facility power',fmt(mKW,1)+' kW',fmt(gKW,1)+' kW')}
 ${row('Revenue',money(s,m.rev),money(s,g.rev))}${row('Power',money(s,-m.pow),money(s,-g.pow))}
 ${row(rent?'Machine rent':'Hardware (amortized)',money(s,-m.hw),money(s,-g.hw))}${row('Hosting',money(s,-m.host),money(s,-g.host))}
 ${tax?row('Tax ('+fmt(tax*100,1)+'%)',money(s,-m.tax),money(s,-g.tax)):''}
 ${row('<b>Net / day</b>',N(m.atNet),N(g.atNet))}${row('Net / 30 days',N(m.atNet*30),N(g.atNet*30))}
 ${row('Capex',m.cap?money(s,m.cap,0):'0',g.cap?money(s,g.cap,0):'0')}</table></div></details>
 <p class="note" style="margin:0"><a href="/methodology/#full-cost">How we calculate this</a> · <a href="/methodology/#risks">Risks</a></p>`;}
document.querySelectorAll('input[name=dep]').forEach(r=>r.addEventListener('change',calc));
function vis(){const rent=chk('hw')==='rent',usd=chk('basis')==='usd';
 document.querySelectorAll('.own-only').forEach(e=>e.hidden=rent);document.querySelectorAll('.rent-only').forEach(e=>e.hidden=!rent);
 document.querySelectorAll('.kw-only').forEach(e=>e.hidden=usd);document.querySelectorAll('.usd-only').forEach(e=>e.hidden=!usd);
 const bl=document.getElementById('budl');if(bl)bl.textContent=rent?'Rent budget per month':'Budget to invest';calc();}
document.querySelectorAll('input[name=hw],input[name=basis]').forEach(r=>r.addEventListener('change',vis));
{const q=new URLSearchParams(location.search);for(const k of ['basis','hw']){const e=q.get(k)&&document.querySelector(`input[name=${k}][value=${q.get(k)}]`);if(e)e.checked=true;}vis();}
getLive().then(d=>{L=d;calc();});
