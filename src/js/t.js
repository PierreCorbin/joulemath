// Anonymous event counts. No cookies, nothing personal. Skipped when Do Not Track or GPC is on.
(()=>{const n=navigator;if(n.doNotTrack==='1'||window.doNotTrack==='1'||n.globalPrivacyControl)return;
const s=(event,v)=>{try{const b=JSON.stringify({event,props:{v:String(v)}});n.sendBeacon?n.sendBeacon('/api/e',new Blob([b],{type:'application/json'})):fetch('/api/e',{method:'POST',body:b,keepalive:true});}catch{}};
window.jmEvent=s;
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-sc],a[href^="/go/"],a[data-out]');if(!t)return;
 if(t.dataset.sc)s('preset',t.dataset.sc);else if(t.dataset.out)s('out',t.dataset.out);else s('go',t.getAttribute('href').slice(4).split(/[?#/]/)[0]);},true);
document.addEventListener('change',e=>{const t=e.target;if(t.name==='hw'||t.name==='basis')s(t.name,t.value);},true);
let sent=0,tm;document.addEventListener('input',e=>{if(sent||e.target.id!=='price'||!document.getElementById('sc'))return;clearTimeout(tm);
 tm=setTimeout(()=>{const p=parseFloat(e.target.value);if(!sent&&Number.isFinite(p)){sent=1;s('price',Math.round(p*100));}},2000);},true);
// signup:attempt is a browser submit, fired before the API answers. It is not a saved or confirmed subscriber.
document.addEventListener('submit',e=>{if(!(e.target.matches&&e.target.matches('form.signup')))return;const hp=e.target.elements&&e.target.elements.website;if(hp&&String(hp.value||'').trim())return;s('signup','attempt');},true);})();
