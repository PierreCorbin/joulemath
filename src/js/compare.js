let L;
function run(pp,fx,btc,rent,byUsd){
 const p=pp,pue=v('pue')||1,jth=v('jth')||1,fee=(v('poolfee')||0)/100,kw=v('kw')||1,host=(v('host')||0)*fx,bud=(v('budget')||0)*fx;
 const thP=(v('thprice')||0)*fx,aLife=v('alife')||1,prem=(v('prem')||0)/100,hpTH=L.btcPerTHDay*btc;
 const hosted=chk('op')!=='self',mh=(v('mhost')||0)*fx,colo=(v('colo')||0)*fx;
 const gw=v('gpuw')||1000,rate=(v('rate')||0)*fx,util=(v('util')||0)/100,ovh=(v('ovh')||0)/100,gP=(v('gprice')||0)*fx,gLife=v('glife')||1,lease=(v('lease')||0)*fx;
 // Size each side: same facility kW, or same budget (capex when buying, monthly rent spend when renting)
 let th,n;
 if(!byUsd){const it=kw/pue;th=(hosted&&!rent?kw:it)*1000/jth;n=Math.floor(it*1000/gw+1e-9);}
 else if(!rent){th=thP?bud/thP:0;n=gP?Math.floor(bud/gP+1e-9):0;}
 else{const mc=hpTH*(1+prem)*30.4,gc=lease*24*30.4;th=mc?bud/mc:0;n=gc?Math.floor(bud/gc+1e-9):0;}
 const mIT=th*jth/1000,gIT=n*gw/1000,mKW=mIT*(hosted&&!rent?1:pue),gKW=n*gw*pue/1000,up=rent?1:Math.min(100,Math.max(0,v('mup')??100))/100,mRev=th*hpTH*(1-fee)*up,gRev=n*rate*24*util*(1-ovh);
 let m,g;
 if(!rent){const mp=hosted?mh:p;m={rev:mRev,pow:mKW*24*mp*up,hw:th*thP/(aLife*365),host:hosted?0:mKW*host*12/365,cap:th*thP,life:aLife,bk:mKW*24*up,mp};g={rev:gRev,pow:gKW*24*p,hw:n*gP/(gLife*365),host:hosted?gIT*colo*12/365:gKW*host*12/365,cap:n*gP,life:gLife,ru:n*rate*24*(1-ovh),util};}
 else{m={rev:mRev,pow:0,hw:th*hpTH*(1+prem),host:0,cap:0};g={rev:gRev,pow:0,hw:n*lease*24,host:0,cap:0};}
 const tax=(v('tax')||0)/100,acc=chk('dep')==='acc';
 for(const x of [m,g]){x.kw=x===m?mKW:gKW;x.net=x.rev-x.pow-x.hw-x.host;x.op=x.rev-x.pow-x.host;
  x.tax=Math.max(0,x.cap?x.op-x.hw:x.net)*tax;x.atNet=x.net-x.tax;
  const opAT=x.cap?(acc?x.op*(1-tax):x.op-x.tax):0,capAT=acc?x.cap*(1-tax):x.cap;
  x.pb=x.cap&&opAT>0?capAT/(opAT*30.4):null;
  x.base=x.cap||x.hw*30.4; // $ invested, or $ rent paid per month
  x.k=x.base?x.atNet*30.4/x.base*1000:null;x.mg=x.rev?x.atNet/x.rev*100:null;x.pkw=x.kw?x.atNet/x.kw:null;x.opkw=x.kw?x.op/x.kw:null;x.roi=x.cap?x.atNet*x.life*365/x.cap:null;}
 return {m,g,th,n,mKW,gKW,kw,bud,lease,gP,hosted};}
// Power price where mining's net per $1k invested equals GPUs'. Bisection on $0 to $1/kWh.
function brk(fx,btc,byUsd){const d=p=>{const r=run(p,fx,btc,false,byUsd);return r.m.k==null||r.g.k==null?NaN:r.m.k-r.g.k;};let a=0,b=1,fa=d(a),fb=d(b);if(isNaN(fa)||isNaN(fb)||fa*fb>0)return {none:true,hi:fa>0};for(let i=0;i<60;i++){const c=(a+b)/2,fc=d(c);if(fa*fc<=0){b=c;fb=fc;}else{a=c;fa=fc;}}return {p:(a+b)/2};}
document.getElementById('calc').addEventListener('input',e=>{if(e.target.type==='number'&&['budget','mhost','colo','ovh'].includes(e.target.id)){pfLive=false;document.querySelectorAll('#pf button').forEach(b=>b.setAttribute('aria-pressed','false'));}if(e.target.type==='number')document.querySelectorAll('#sc button').forEach(b=>b.setAttribute('aria-pressed','false'));calc();});
const chk=n=>{const e=document.querySelector(`input[name=${n}]:checked`);return e?e.value:null;};
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=cur==='EUR'?L.btcEUR/L.btcUSD:1;
 const rent=chk('hw')==='rent',byUsd=chk('basis')==='usd';
 const R=run(v('price')||0,fx,btc,rent,byUsd),{m,g,th,n,mKW,gKW,kw,bud,lease,gP,hosted}=R,tax=(v('tax')||0)/100;
 const be=rent||hosted?null:brk(fx,btc,byUsd);
 const N=x=>`<span class="${cls(x)}">${money(s,x)}</span>`,P=x=>x==null?'n/a':`<span class="${cls(x)}">${x<0?"−":""}${fmt(Math.abs(x),1)}%</span>`;
 const row=(k,a,b,h)=>`<tr><td>${k}${h?` <a class="how" href="/methodology/#${h}">how</a>`:''}</td><td>${a}</td><td>${b}</td></tr>`;
 const at=tax?', after tax':'',W=m.k!=null&&g.k!=null?(g.k>=m.k?'GPU rental':'Mining'):null;
 const K=x=>x==null?'n/a':`<b class="${cls(x)}">${money(s,x,Math.abs(x)<10?2:0)}</b>${Math.abs(x)<0.5?' (about break-even after hardware)':''}`;
 const cash=rent?'':`<b>Cash profit before hardware cost:</b> mining <b class="${cls(m.op)}">${money(s,m.op,0)}</b>/day vs GPUs <b class="${cls(g.op)}">${money(s,g.op,0)}</b>/day (${byUsd?s+fmt(bud,0)+' budget':fmt(kw,0)+' kW'} each side).<br>`;
 const head=W?`${cash}After hardware cost${at}, per ${s}1,000 ${rent?'of rent':'invested'}: GPUs ${K(g.k)}/mo vs mining ${K(m.k)}/mo. <b>${W}</b> nets more.`:'Enter prices to compare.';
 const hU=byUsd&&(m.cap||g.cap||rent),Wu=g.atNet>=m.atNet?'GPU rental':'Mining';
 const head2=`With ${s}${fmt(bud,0)}${rent?' of rent a month':''}, <b>${Wu}</b> nets more: ${K(g.atNet*30.4)}/mo for GPUs vs ${K(m.atNet*30.4)}/mo for mining, after hardware cost${at}.`;
 const left=byUsd?bud-(rent?n*lease*24*30.4:n*gP):0;
 const pb=x=>x.cap?(x.pb==null?'never':fmt(x.pb,1)+' mo'):'n/a';
 const sz=byUsd?`${s}${fmt(bud,0)} ${rent?'rent per month':'budget'} each side`:`${fmt(kw,0)} kW each side`;
 const mo=x=>x==null?'n/a':`<span class="${cls(x)}">${money(s,x,Math.abs(x)<10?2:0)}</span>`;
 const card=(nm,dot,x,eq,need)=>`<div><h3><i class="${dot}"></i>${nm}</h3><p class="need" style="margin:0 0 .35rem">${eq}</p><dl>
 <dt>${rent?'Rent per month':'Capital needed'}</dt><dd>${money(s,rent?x.hw*30.4:x.cap,0)}</dd>
 ${rent?'':`<dt>Cash profit / mo (before hardware cost)</dt><dd>${mo(x.op*30.4)}</dd>`}
 <dt>Net / mo (after ${rent?'rent':'hardware cost'}${at})</dt><dd>${mo(x.atNet*30.4)}${Math.abs(x.atNet*30.4)<15?' <small>about break-even</small>':''}</dd>
 ${rent?'':`<dt>Payback</dt><dd>${pb(x)}</dd>`}</dl><p class="need">${need}</p></div>`;
 const mEq=`${fmt(th,0)} TH/s${v('jth')===13.5?`, about ${fmt(th/270,0)} S21 XP`:''}, ${fmt(mKW,1)} kW`,gEq=`${n} GPU${n===1?'':'s'}${v('gpuw')===1000?' (H100 class)':''}, ${fmt(gKW,1)} kW`;
 const st=x=>{const k=x.k;return k==null?'n/a':k>5?'making money':k<-5?'losing money':'roughly break-even';};
 const mode=rent?'Renting machines':hosted?'Hosted':'Self-run';
 let ver=m.k==null||g.k==null?'Enter prices to compare.':st(m)===st(g)?`${mode}, both are ${st(m)} after hardware cost today.`:`${mode}, mining is ${st(m)} and GPUs are ${st(g)} after hardware cost today.`;
 if(m.k!=null&&g.k!=null&&Math.abs(g.k-m.k)>5)ver+=` ${g.k>m.k?'GPUs return more per '+s+', but they are the harder setup (colo, fiber, renters)':'Mining returns more per '+s+', and it is the simpler setup'}.`;
 const tips=[];
 if(!rent&&m.cap){const bp=(m.rev-m.hw-m.host)/m.bk;if(m.bk)tips.push(`Mining's break-even ${hosted?'hosting rate':'power price'} after hardware is ${s}${fmt(Math.max(0,bp),3)}/kWh (you pay ${s}${fmt(m.mp,3)}).`);
  if(m.pb)tips.push(`Mining pays back its hardware in ${fmt(m.pb/12,1)} years, so ASICs need to last longer than that (you assume ${fmt(m.life,1)}).`);}
 if(!rent&&g.cap&&g.ru){const bu=(g.pow+g.host+g.hw)/g.ru*100;tips.push(bu>100?`GPUs lose money after hardware even at 100% utilization with these rates.`:`GPUs' break-even utilization after hardware is ${fmt(bu,0)}% (you assume ${fmt(g.util*100,0)}%${(v('ovh')||0)?`, after a ${fmt(v('ovh'),0)}% marketplace cut`:''}).`);}
 const tipH=tips.length?`<ul class="tips"><li>${tips.join('</li><li>')}</li></ul>`:'';
 const pf=PF[cur_pf()],pfN=pf&&pfOn()?`<p class="note pfn" style="margin:.2rem 0 0">${pf.look}</p>`:'';
 o.innerHTML=`<p class="headline"><b>${ver}</b></p>${tipH}${pfN}<p class="note" style="margin:.2rem 0 0">${sz}, ${rent?'rented machines':'bought machines'+(hosted?', hosted':', self-run')}${left>1?`. GPUs come in whole units, so ${money(s,left,0)} of the GPU budget is left unspent`:''}.</p>
 <div class="sum">${card('Bitcoin mining','dot-m',m,mEq,hosted?'What you need: a hosting contract. The host covers power, cooling and repairs.':'What you need: cheap power, ventilation and racks.')}${card('GPU rental','dot-g',g,gEq,hosted?'What you need: colo space for dense racks, plus renters (a marketplace like Vast.ai or direct contracts).':'What you need: a data-center-grade site, fiber, and renters.')}</div>
 <p class="note" style="margin:0">${hU?head2:head}</p>
 ${hosted&&!rent?'':`<p class="note be" style="margin:.3rem 0 0">`}${hosted&&!rent?'':be?(be.none?(be.hi?'Mining nets more per $1k at any power price up to $1/kWh.':'GPUs net more per $1k at any power price, even free power.'):`Break-even power price: <b>${s}${fmt(be.p,3)}/kWh</b>. Below that, mining nets more per ${s}1k invested.`):'Break-even power price: n/a when renting (you pay no power).'}${hosted&&!rent?'':' <a class="how" href="/methodology/#break-even">how</a></p>'}
 <details class="full-num"><summary>More ratios</summary><div class="tbl"><table class="kt"><tr><th></th><th><i class="dot-m"></i>Mining</th><th><i class="dot-g"></i>GPU</th></tr>
 ${row('Net / mo per '+s+'1k '+(rent?'rent':'invested')+(rent?'':' (after hardware cost)'),N(m.k),N(g.k),'scale-free')}
 ${row('Payback',pb(m),pb(g),'payback')}
 ${row('Net margin'+(rent?'':' (after hardware cost)'),P(m.mg),P(g.mg),'scale-free')}
 ${row('Net per kW / day'+(rent?'':' (after hardware cost)'),N(m.pkw),N(g.pkw),'scale-free')}
 ${rent?'':row('Cash profit per kW / day (before hardware cost)',N(m.opkw),N(g.opkw),'payback')}
 ${row('Lifetime return per '+s+'1',m.cap?N(m.roi):'n/a',g.cap?N(g.roi):'n/a','payback')}
 ${byUsd?row('Buys',`${fmt(th,0)} TH/s${v('jth')===13.5?` (${fmt(th/270,1)} S21 XP)`:''}`,`${n} GPUs`,'same-budget')+row('Power used',fmt(mKW,1)+' kW',fmt(gKW,1)+' kW','same-budget')+row('Net / month',N(m.atNet*30.4),N(g.atNet*30.4),'same-budget'):''}
 </table></div></details>
 <details class="full-num"><summary>Full numbers</summary><div class="tbl"><table><tr><th>Per day</th><th>Mining</th><th>GPU</th></tr>
 ${row('Hardware',`${fmt(th,0)} TH/s`,`${n} GPUs`)}${row('Facility power',fmt(mKW,1)+' kW',fmt(gKW,1)+' kW')}
 ${row('Revenue',money(s,m.rev),money(s,g.rev))}${row('Power',money(s,-m.pow),money(s,-g.pow))}
 ${row(rent?'Machine rent':'Hardware (amortized)',money(s,-m.hw),money(s,-g.hw))}${row('Hosting',money(s,-m.host),money(s,-g.host))}
 ${tax?row('Tax ('+fmt(tax*100,1)+'%)',money(s,-m.tax),money(s,-g.tax)):''}
 ${row('<b>Net / day</b>',N(m.atNet),N(g.atNet))}${row('Net / 30 days',N(m.atNet*30),N(g.atNet*30))}
 ${row('Capex',m.cap?money(s,m.cap,0):'0',g.cap?money(s,g.cap,0):'0')}</table></div></details>
 ${rent?'':`<p class="note" style="margin:0">Net rows subtract hardware cost spread evenly over its life (ASIC ${fmt(v('alife'),1)} yr, GPU ${fmt(v('glife'),1)} yr). Cash profit is revenue minus power and hosting, before hardware. Payback uses cash profit, so a net near zero means payback is close to the hardware life.</p>`}
 <p class="note" style="margin:0"><a href="/methodology/#full-cost">How we calculate this</a> · <a href="/methodology/#risks">Risks</a></p>`;}
document.querySelectorAll('input[name=dep]').forEach(r=>r.addEventListener('change',calc));
function vis(){const rent=chk('hw')==='rent',usd=chk('basis')==='usd';
 document.querySelectorAll('.own-only').forEach(e=>e.hidden=rent);document.querySelectorAll('.rent-only').forEach(e=>e.hidden=!rent);
 document.querySelectorAll('.host-only').forEach(e=>e.hidden=rent||chk('op')==='self');document.querySelectorAll('.self-only').forEach(e=>e.hidden=rent||chk('op')!=='self');
 document.querySelectorAll('.kw-only').forEach(e=>e.hidden=usd);document.querySelectorAll('.usd-only').forEach(e=>e.hidden=!usd);
 const bl=document.getElementById('budl');if(bl)bl.textContent=rent?'Rent budget per month':'Budget to invest';calc();}
document.querySelectorAll('input[name=hw],input[name=basis],input[name=op]').forEach(r=>r.addEventListener('change',vis));
{const q=new URLSearchParams(location.search);for(const k of ['basis','hw']){const e=q.get(k)&&document.querySelector(`input[name=${k}][value=${q.get(k)}]`);if(e)e.checked=true;}vis();}
// Investor profiles. Sources on /methodology/#profiles.
const PF={small:{budget:40000,mhost:0.08,colo:196.25,ovh:20,look:'Small: about 9 S21 XP vs 1 H100. Mining at Simple Mining\'s 0 to 499 kW rate ($0.08/kWh). Nobody publishes colo for a single GPU, so we use the CBRE wholesale rate; expect to pay more. GPU renters via a marketplace (about 20% cut).'},
 mid:{budget:300000,mhost:0.07,colo:196.25,ovh:20,look:'Growing: about 70 S21 XP vs one 8x H100 server. Mining at Compass\'s $0.07/kWh S21 XP rate (a promo; Simple Mining\'s tier for about 280 kW is $0.08). GPU colo at the CBRE average, renters via a marketplace.'},
 big:{budget:5000000,mhost:0.065,colo:196.25,ovh:0,look:'Institutional: MW-scale mining at Simple Mining\'s Enterprise+ rate ($0.065/kWh). GPU colo at the CBRE wholesale average, renters on direct contracts (no marketplace cut assumed, so utilization is the risk you negotiate).'}};
const cur_pf=()=>{const b=document.querySelector('#pf button[aria-pressed=true]');return b?b.dataset.pf:null;};let pfLive=true;const pfOn=()=>pfLive;
function setPf(k,push){if(!PF[k])k='mid';const o=PF[k];for(const id in o)if(id!=='look')document.getElementById(id).value=o[id];pfLive=true;
 document.querySelectorAll('#pf button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pf===k));
 if(push){const q=new URLSearchParams(location.search);k==='mid'?q.delete('profile'):q.set('profile',k);history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));}calc();}
document.querySelectorAll('#pf button').forEach(b=>b.addEventListener('click',()=>setPf(b.dataset.pf,true)));
// Scenario presets. Sources on /methodology/#scenarios.
const BASE={price:0.06,jth:13.5,thprice:15.81,mup:100,util:70};
const SC={default:{},'cheap-power':{price:0.028},'used-asics':{jth:21.5,thprice:2.11},curtailment:{price:0.028,mup:85},'low-gpu-util':{util:50}};
function setSc(k,push){if(!SC[k])k='default';const o={...BASE,...SC[k]};for(const id in o)document.getElementById(id).value=o[id];
 document.querySelectorAll('#sc button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sc===k));
 if(push){const q=new URLSearchParams(location.search);k==='default'?q.delete('scenario'):q.set('scenario',k);history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));}calc();}
document.querySelectorAll('#sc button').forEach(b=>b.addEventListener('click',()=>setSc(b.dataset.sc,true)));
setSc(new URLSearchParams(location.search).get('scenario')||'default',false);
setPf(new URLSearchParams(location.search).get('profile')||'mid',false);
// Prefill numeric inputs from the URL, e.g. /?price=0.0707&kw=100 (used by /power-prices/ pages). Applied after the scenario.
{const q=new URLSearchParams(location.search);let n=0;q.forEach((val,k)=>{const e=document.getElementById(k);const x=parseFloat(val);if(e&&e.type==='number'&&e.closest('#calc')&&!isNaN(x)){e.value=x;n++;}});if(n){document.querySelectorAll('#sc button').forEach(b=>b.setAttribute('aria-pressed','false'));calc();}}
getLive().then(d=>{L=d;calc();});
