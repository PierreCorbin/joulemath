// Anonymous event counts. No cookies, nothing personal. Skipped when Do Not Track or GPC is on.
(()=>{const n=navigator;if(n.doNotTrack==='1'||window.doNotTrack==='1'||n.globalPrivacyControl)return;
const s=(event,v)=>{try{const b=JSON.stringify({event,props:{v:String(v)}});n.sendBeacon?n.sendBeacon('/api/e',new Blob([b],{type:'application/json'})):fetch('/api/e',{method:'POST',body:b,keepalive:true});}catch{}};
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-sc],a[href^="/go/"]');if(!t)return;
 if(t.dataset.sc)s('preset',t.dataset.sc);else s('go',t.getAttribute('href').slice(4).split(/[?#/]/)[0]);},true);
document.addEventListener('change',e=>{const t=e.target;if(t.name==='hw'||t.name==='basis')s(t.name,t.value);},true);
let sent=0,tm;document.addEventListener('input',e=>{if(sent||e.target.id!=='price'||!document.getElementById('sc'))return;clearTimeout(tm);
 tm=setTimeout(()=>{const p=parseFloat(e.target.value);if(!sent&&Number.isFinite(p)){sent=1;s('price',Math.round(p*100));}},2000);},true);
document.addEventListener('submit',e=>{if(e.target.matches&&e.target.matches('form.signup'))s('signup','submit');},true);})();
