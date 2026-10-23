const v2=id=>(document.getElementById(id)||{}).value;
let L,hodl='hold',DG=null;
// Average share of today's daily BTC output over the machine life: difficulty setting plus the next halving. Same for sell and hold.
function outF(life){const days=Math.max(1,Math.round(life*365)),gr=DG&&v2('dmode')==='trend'?DG.g:0,hd=DG&&DG.toH!=null?DG.toH:Infinity,R=L.rewardPerBlock||3.125;let a=0;for(let t=0;t<days;t++)a+=Math.pow(1+gr,-t/365)*(t>=hd?Math.max(0,R-1.5625)/R:1);return a/days;}
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
 const mIT=th*jth/1000,gIT=n*gw/1000,mKW=mIT*(hosted&&!rent?1:pue),gKW=n*gw*pue/1000,up=rent?1:Math.min(100,Math.max(0,v('mup')??100))/100,mF=rent?1:outF(aLife),mRev=th*hpTH*(1-fee)*up*mF,gRev=n*rate*24*util*(1-ovh);
 let m,g;
 const hold=!rent&&hodl==='hold',endB=(v('endbtc')||L.btcUSD)*fx,btcDay=th*L.btcPerTHDay*(1-fee)*up;
 if(!rent){const mp=hosted?mh:p;m={rev:mRev,sellRev:mRev,btcDay,mF,endB,pow:mKW*24*mp*up,hw:th*thP/(aLife*365),host:hosted?0:mKW*host*12/365,cap:th*thP,life:aLife,bk:mKW*24*up,mp};g={rev:gRev,pow:gKW*24*p,hw:n*gP/(gLife*365),host:hosted?gIT*colo*12/365:gKW*host*12/365,cap:n*gP,life:gLife,ru:n*rate*24*(1-ovh),util};}
 else{m={rev:mRev,pow:0,hw:th*hpTH*(1+prem),host:0,cap:0};g={rev:gRev,pow:0,hw:n*lease*24,host:0,cap:0};}
 const tax=(v('tax')||0)/100,acc=chk('dep')==='acc';
 for(const x of [m,g]){x.kw=x===m?mKW:gKW;x.net=x.rev-x.pow-x.hw-x.host;x.op=x.rev-x.pow-x.host;
  x.tax=Math.max(0,x.cap?x.op-x.hw:x.net)*tax;x.atNet=x.net-x.tax;
  const opAT=x.cap?(acc?x.op*(1-tax):x.op-x.tax):0,capAT=acc?x.cap*(1-tax):x.cap;
  x.pb=x.cap&&opAT>0?capAT/(opAT*30.4):null;
  x.base=x.cap||x.hw*30.4; // $ invested, or $ rent paid per month
  x.k=x.base?x.atNet*30.4/x.base*1000:null;x.mg=x.rev?x.atNet/x.rev*100:null;x.pkw=x.kw?x.atNet/x.kw:null;x.opkw=x.kw?x.op/x.kw:null;x.roi=x.cap?x.atNet*x.life*365/x.cap:null;}
 return {m,g,th,n,mKW,gKW,kw,bud,lease,gP,hosted,hold};}
// Power price where mining's net per $1k invested equals GPUs'. Bisection on $0 to $1/kWh.
function brk(fx,btc,byUsd){const d=p=>{const r=run(p,fx,btc,false,byUsd);return r.m.k==null||r.g.k==null?NaN:r.m.k-r.g.k;};let a=0,b=1,fa=d(a),fb=d(b);if(isNaN(fa)||isNaN(fb)||fa*fb>0)return {none:true,hi:fa>0};for(let i=0;i<60;i++){const c=(a+b)/2,fc=d(c);if(fa*fc<=0){b=c;fb=fc;}else{a=c;fa=fc;}}return {p:(a+b)/2};}
document.getElementById('calc').addEventListener('input',e=>{if(e.target.type==='number'&&['budget','mhost','colo','ovh'].includes(e.target.id)){pfLive=false;document.querySelectorAll('#pf button').forEach(b=>b.setAttribute('aria-pressed','false'));}if(e.target.type==='number')document.querySelectorAll('#sc button').forEach(b=>b.setAttribute('aria-pressed','false'));calc();});
const chk=n=>{const e=document.querySelector(`input[name=${n}]:checked`);return e?e.value:null;};
function calc(){const o=document.getElementById('out');if(!L||!L.btcPerTHDay||!L.btcUSD){o.innerHTML='<div class="empty">Waiting for live data.</div>';return;}
 const cur=curVal(),s=cur==='EUR'?'€':'$',btc=cur==='EUR'?L.btcEUR:L.btcUSD,fx=cur==='EUR'?L.btcEUR/L.btcUSD:1;
 const rent=chk('hw')==='rent',byUsd=chk('basis')==='usd';
 const R=run(v('price')||0,fx,btc,rent,byUsd),{m,g,th,n,mKW,gKW,kw,bud,lease,gP,hosted,hold}=R,tax=(v('tax')||0)/100;
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

 const life=x=>x.life||1,lp=x=>x.atNet*365*life(x),K0=x=>`<b class="${cls(x)}">${x>0?'+':''}${money(s,x,0)}</b>`;
 // Hold: simulate day by day with difficulty trend and the next halving.
 let H=null;if(hold&&m.cap){const days=Math.round(m.life*365),st=m.btcDay*m.mF*days;
  const fiat=(m.pow+m.host)*days,val=st*m.endB,pre=val-fiat-m.cap,p=pre>0?pre*(1-tax):pre;H={st,val,fiat,p};}
 const mP=H?H.p:lp(m),gP2=lp(g);
 const ver=rent?`Renting for a month: mining ${K0(m.atNet*30.4)}, GPUs ${K0(g.atNet*30.4)}.`:H?`If you hold and BTC hits ${money(s,m.endB,0)}, mining makes ${K0(mP)} over ${fmt(m.life,0)} years. GPUs: ${K0(gP2)} over ${fmt(g.life,0)} years.`:`If you sell as you mine, mining makes ${K0(mP)} over ${fmt(m.life,0)} years. GPUs: ${K0(gP2)} over ${fmt(g.life,0)} years.`;
 const tips=[];
 if(H&&m.bk){const days=Math.round(m.life*365);tips.push(`Holding breaks even if BTC is worth ${money(s,(H.fiat+m.cap)/H.st,0)} when you sell (today ${money(s,btc,0)}).`);tips.push(`At ${money(s,m.endB,0)}, mining breaks even at ${s}${fmt(Math.max(0,(H.val-m.cap-m.host*days)/(m.bk*days)),3)}/kWh ${hosted?'hosting':'power'} (you pay ${s}${fmt(m.mp,3)}).`);}
 else if(!rent&&m.cap&&m.bk){tips.push(`Mining breaks even at ${s}${fmt(Math.max(0,(m.sellRev-m.hw-m.host)/m.bk),3)}/kWh ${hosted?'hosting':'power'} (you pay ${s}${fmt(m.mp,3)}).`);if(m.pb)tips.push(`Machines must last ${fmt(m.pb/12,1)} yrs to pay back (assumed ${fmt(m.life,0)}).`);}
 if(!rent&&g.cap&&g.ru){const bu=(g.pow+g.host+g.hw)/g.ru*100;tips.push(bu>100?'GPUs lose money even if rented 100% of the time.':`GPUs must be rented ${fmt(bu,0)}% of the time (assumed ${fmt(g.util*100,0)}%).`);}
 if(!rent&&m.bk&&chk('hw')==='own'){const e=document.getElementById('i-be');if(e)e.textContent=s+fmt((m.sellRev-m.hw-m.host)/m.bk,3)+'/kWh';}
 const hp=document.getElementById('i-hp');if(hp)hp.textContent=s+fmt(L.btcPerTHDay*btc,4);
 const bp=document.getElementById('bigp');if(bp)bp.textContent=money(s,m&&m.endB||btc,0);
 const pf=PF[cur_pf()];
 const card=(nm,dot,x,eq,P,hd)=>{const yrs=fmt(x.life||1,0);return `<div><h3><i class="${dot}"></i>${nm}</h3><p class="need">${eq}</p><dl>
 <dt>${rent?'You pay per month':'You put in'}</dt><dd>${money(s,rent?x.hw*30.4:x.cap,0)}</dd>
 ${rent?`<dt>Profit per month</dt><dd>${K0(x.atNet*30.4)}</dd>`:`<dt>You get back (${yrs} yrs)</dt><dd>${money(s,P+x.cap,0)}</dd><dt>Profit (${yrs} yrs)</dt><dd>${K0(P)}</dd>
 <dt>Pays back in</dt><dd>${hd?(P>0?`year ${yrs}, when you sell`:'never at this price'):x.pb==null?'never':fmt(x.pb,0)+' months'}</dd>`}</dl></div>`;};
 const mEq=`${v('jth')===13.5?`${fmt(th/270,0)} mining machines`:fmt(th,0)+' TH/s'}${rent?'':hosted?', hosted':', your site'}`,gEq=`${n} AI GPU${n===1?'':'s'}${rent?'':hosted?', in a data center':', your site'}`;
 const hv=DG&&DG.toH!=null?` The reward halves in about ${fmt(DG.toH/365,1)} years (block 1,050,000).`:'',dTxt=v2('dmode')==='trend'&&DG?`Difficulty: last-12-month trend, ${DG.g>=0?'+':''}${fmt(DG.g*100,1)}% a year (mempool.space), assumed to continue.${hv}`:`Difficulty: held flat at today's level (default, more conservative); switch to the last-12-month trend in Change assumptions${DG?`, which is ${DG.g>=0?'+':''}${fmt(DG.g*100,1)}% a year`:''}.${hv}`;
 {const w=document.getElementById('where'),a=rent?m.atNet:mP,b=rent?g.atNet:gP2;if(w&&isFinite(a)&&isFinite(b)){const top=a>=b?'m':'g',g2=w.querySelector('.where-g'),pm=w.querySelector('[data-side=m]'),pg=w.querySelector('[data-side=g]');if(top==='m')g2.prepend(pm);else g2.prepend(pg);w.querySelectorAll('.wpan').forEach(e=>{const on=e.dataset.side===top;e.classList.toggle('on',on);e.querySelector('.fit').hidden=!on;});const l=document.getElementById('where-lead');if(l)l.textContent=`With these assumptions ${top==='m'?'mining comes':'AI GPUs come'} out ahead, so that side is first. Change the inputs and it can flip. Not a ranking; prices are cited.`;}}
 o.innerHTML=`<p class="headline">${ver}</p>
 <div class="sum">${card('Bitcoin mining','dot-m',m,mEq,mP,!!H)}${card('AI GPU rental','dot-g',g,gEq,gP2,false)}</div>
 ${H?`<p class="note" style="margin:0">${fmt(H.st,2)} BTC mined, worth ${money(s,H.val,0)}. <a class="how" href="/methodology/#hodl">how</a> Past performance is not a guarantee.</p>`:''}
 <details class="full-num"><summary>What changes the answer</summary><ul class="tips"><li>${tips.join('</li><li>')}</li></ul></details>
 <details class="full-num"><summary>How this is calculated</summary><div class="note">
 <p>${sz}${left>1?`. GPUs come in whole units, so ${money(s,left,0)} is left unspent`:''}. Profit = income minus power, hosting${tax?', tax':''} and the machines, over their life (mining ${fmt(v('alife'),1)} yrs, GPUs ${fmt(v('glife'),1)} yrs). Selling values each day's BTC at today's price. Both modes use the same BTC output: ${dTxt}</p>
 ${H?`<p>Holding: costs are paid monthly in cash and all the BTC is sold at the end.</p>`:''}
 ${pf&&pfOn()?`<p>${pf.look}</p>`:''}
 <p>Mining needs ${hosted?'a hosting contract (the host covers power, cooling and repairs)':'cheap power, ventilation and racks'}. GPUs need ${hosted?'data center space for dense racks plus renters (a marketplace like Vast.ai or direct contracts)':'a data center grade site, fiber and renters'}.</p>
 ${hosted||rent?'':be?`<p>${be.none?(be.hi?'Mining nets more per $1k at any power price up to $1/kWh.':'GPUs net more per $1k at any power price.'):`Mining nets more per ${s}1k below ${s}${fmt(be.p,3)}/kWh.`}</p>`:''}
 <p><a href="/methodology/#full-cost">Method</a> · <a href="/methodology/#risks">Risks</a></p></div></details>
 <details class="full-num"><summary>More ratios</summary><div class="tbl"><table class="kt"><tr><th></th><th><i class="dot-m"></i>Mining</th><th><i class="dot-g"></i>GPU</th></tr>
 ${row('Net / mo per '+s+'1k '+(rent?'rent':'invested')+(rent?'':' (after hardware cost)'),N(m.k),N(g.k),'scale-free')}
 ${row('Payback (selling)',pb(m),pb(g),'payback')}
 ${row('Net margin'+(rent?'':' (after hardware cost)'),P(m.mg),P(g.mg),'scale-free')}
 ${row('Net per kW / day'+(rent?'':' (after hardware cost)'),N(m.pkw),N(g.pkw),'scale-free')}
 ${rent?'':row('Cash profit per kW / day (before hardware cost)',N(m.opkw),N(g.opkw),'payback')}
 ${row('Lifetime return per '+s+'1',m.cap?N(m.roi):'n/a',g.cap?N(g.roi):'n/a','payback')}
 ${row('Buys',`${fmt(th,0)} TH/s`,`${n} GPUs`,'same-budget')+row('Power used',fmt(mKW,1)+' kW',fmt(gKW,1)+' kW','same-budget')}
 </table></div></details>
 <details class="full-num"><summary>Full numbers (per day, life average, selling)</summary><div class="tbl"><table><tr><th>Per day</th><th>Mining</th><th>GPU</th></tr>
 ${row('Revenue',money(s,m.sellRev??m.rev),money(s,g.rev))}${row('Power',money(s,-m.pow),money(s,-g.pow))}
 ${row(rent?'Machine rent':'Hardware (spread over its life)',money(s,-m.hw),money(s,-g.hw))}${row('Hosting',money(s,-m.host),money(s,-g.host))}
 ${tax?row('Tax ('+fmt(tax*100,1)+'%)',money(s,-m.tax),money(s,-g.tax)):''}
 ${row('Cash profit / mo (before hardware)',N(m.op*30.4),N(g.op*30.4))}${row('<b>Net / day</b>',N(m.atNet),N(g.atNet))}${row('Net / 30 days',N(m.atNet*30),N(g.atNet*30))}
 ${row('Capex',m.cap?money(s,m.cap,0):'0',g.cap?money(s,g.cap,0):'0')}</table></div></details>`;}
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
document.querySelectorAll('#hodl button').forEach(b=>b.addEventListener('click',()=>{hodl=b.dataset.h;b.parentNode.querySelector('[data-h=hold]').textContent='Hold until year '+fmt(v('alife')||3,0);document.querySelectorAll('#hodl button').forEach(x=>x.setAttribute('aria-pressed',x===b));document.querySelectorAll('.hold-only').forEach(e=>e.hidden=hodl!=='hold');calc();}));
document.querySelectorAll('#endc button').forEach(b=>b.addEventListener('click',()=>{if(L&&L.btcUSD){document.getElementById('endbtc').value=Math.round(L.btcUSD*b.dataset.m);document.getElementById('endx').value=b.dataset.m;}document.querySelectorAll('#endc button').forEach(x=>x.setAttribute('aria-pressed',x===b));calc();}));
document.getElementById('endx').addEventListener('input',e=>{if(L&&L.btcUSD)document.getElementById('endbtc').value=Math.round(L.btcUSD*e.target.value);document.querySelectorAll('#endc button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.m===e.target.value));calc();});
document.getElementById('endbtc').addEventListener('input',()=>{if(L&&L.btcUSD)document.getElementById('endx').value=v('endbtc')/L.btcUSD;document.querySelectorAll('#endc button').forEach(x=>x.setAttribute('aria-pressed','false'));calc();});
{const q=new URLSearchParams(location.search);if(q.get('hold')==='0')setTimeout(()=>document.querySelector('#hodl [data-h=sell]').click(),0);else if(q.get('x')){setTimeout(()=>{document.querySelector('#hodl [data-h=hold]').click();const x=q.get('x');if(x){const go=()=>{if(!L)return setTimeout(go,300);const b=document.querySelector(`#endc [data-m="${x}"]`);if(b)b.click();};go();}},0);}}
setPf(new URLSearchParams(location.search).get('profile')||'mid',false);
// Prefill numeric inputs from the URL, e.g. /?price=0.0707&kw=100 (used by /power-prices/ pages). Applied after the scenario.
{const q=new URLSearchParams(location.search);let n=0;q.forEach((val,k)=>{const e=document.getElementById(k);const x=parseFloat(val);if(e&&e.type==='number'&&e.closest('#calc')&&!isNaN(x)){e.value=x;n++;}});if(n){document.querySelectorAll('#sc button').forEach(b=>b.setAttribute('aria-pressed','false'));calc();}}
Promise.all([fetch('https://mempool.space/api/v1/mining/hashrate/1y').then(r=>r.json()),fetch('https://mempool.space/api/blocks/tip/height').then(r=>r.text())]).then(([h,tip])=>{const a=h.difficulty[0],b=h.difficulty[h.difficulty.length-1],yr=(b.time-a.time)/86400/365;DG={g:Math.pow(b.difficulty/a.difficulty,1/yr)-1,toH:Math.max(0,(1050000-parseInt(tip))/144)};calc();}).catch(()=>{});
getLive().then(d=>{L=d;const e=document.getElementById('endbtc');if(e&&!e.value&&d.btcUSD)e.value=Math.round(d.btcUSD);calc();});

document.getElementById('dmode').addEventListener('change',()=>calc());
{const p=new URLSearchParams(location.search).get('pf');if(p){const go=()=>{if(!L)return setTimeout(go,300);const b=document.querySelector('#pf [data-pf="'+p+'"]');if(b)b.click();};go();}}
