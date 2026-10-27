import fs from 'fs';import path from 'path';import {buildBlog} from './blog.mjs';import {buildAsic} from './asic.mjs';import {buildPower} from './power.mjs';import {buildGpu} from './gpu.mjs';
fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('src','dist',{recursive:true});buildBlog();{const a=await buildAsic();buildGpu(a);await buildPower(a);}
const pages=[];(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(f==='index.html')pages.push('/'+path.relative('dist',path.dirname(p)).replace(/^$/,'')+(d==='dist'?'':'/'));}})('dist');
const urls=pages.map(u=>u.replace('//','/'));
// Newsletter box. Hidden until the SUBSCRIBERS KV binding exists on the Pages project; flip NEWSLETTER to true then.
const NEWSLETTER=true;
const signup=c=>`<form class="signup" method="post" action="/api/subscribe"${NEWSLETTER?'':' hidden'}><b>Weekly energy-to-compute data, free</b><p class="note" style="margin:.2rem 0 0">Hashprice, GPU rent per kW and the deals behind them, once a week. Unsubscribe any time.</p><div class="row"><input type="email" name="email" required placeholder="you@example.com" aria-label="Email"><input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="src" value="${c}"><button class="btn" type="submit">Subscribe</button></div><p class="signup-msg" aria-live="polite"></p></form>`;
for(const u of urls){const f='dist'+u+'index.html';let h=fs.readFileSync(f,'utf8');const c=u==='/'?'home':u.startsWith('/blog/')&&u!=='/blog/'?'blog':u.startsWith('/asic/')?'asic':u.startsWith('/power-prices/')?'power':u.startsWith('/gpu/')?'gpu':null;if(!c)continue;
 if(h.includes('<!--signup-->'))h=h.replace('<!--signup-->',signup(c));else if(c==='blog')h=h.replace('</article>',signup(c)+'</article>');else h=h.replace('<section class="cta">',signup(c)+'<section class="cta">');
 if(NEWSLETTER)h=h.replace('</body>','<script src="/js/signup.js" defer></script></body>');fs.writeFileSync(f,h);}
// Sitemap lastmod = last git commit touching the page's source (its src dir or file, plus the generator that renders it), not the build date.
import {execFileSync} from 'child_process';
const gitDate=fs2=>{try{return execFileSync('git',['log','-1','--format=%cs','--',...fs2],{encoding:'utf8'}).trim();}catch(e){return '';}};
const srcFor=u=>{const f=[u==='/'?'src/index.html':'src'+u];if(u.startsWith('/blog/'))f.push('blog.mjs');if(u.startsWith('/asic/'))f.push('asic.mjs');if(u.startsWith('/power-prices/'))f.push('power.mjs');if(u.startsWith('/gpu/'))f.push('gpu.mjs');return f.filter(x=>fs.existsSync(x));};
const lastmod=u=>{const f=srcFor(u);return (f.length&&gitDate(f))||new Date().toISOString().slice(0,10);};
// FAQPage JSON-LD built only from answers already on the page (text copied from the rendered HTML, never written here).
const txt=h=>h.replace(/<\/(li|p|h[1-6])>/g,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
const after=(h,re)=>{const m=h.match(re);if(!m)return null;const rest=h.slice(m.index+m[0].length);const end=rest.search(/<h[1-3][ >]|<\/section>|<\/article>/);return txt(rest.slice(0,end<0?undefined:end));};
const FAQ={'/methodology/':h=>[['What is the break-even power price?',/<h3 id="break-even">[^<]*<\/h3>/],['How does mining uptime change the result?',/<h3 id="mining-uptime">[^<]*<\/h3>/],['What does it take to rent GPUs to AI or mine Bitcoin?',/<h3 id="who-can">[^<]*<\/h3>/],['How are mining and GPU rental income taxed?',/<h3 id="taxes">[^<]*<\/h3>/],['What are the risks?',/<h3 id="risks">[^<]*<\/h3>/]].map(([q,re])=>[q,after(h,re)]),
 '/gpu/h100/':h=>[['How much does it cost to rent an H100?','faq-rent'],['How much power does an H100 use?','faq-power'],['What does one kW of H100 earn per day?','faq-kw'],['How much does it cost to buy an H100?','faq-buy'],['What is the difference between H100 SXM and PCIe?','faq-sxm'],['Does H100 rental beat Bitcoin mining per kW?','faq-vs-btc']].map(([q,id])=>[q,after(h,new RegExp(`<h3 id="${id}">[^<]*</h3>`))]),
 '/guides/rent-out-your-gpu/':h=>[['What does renting out your GPU mean?','faq-what'],['How much can you make renting out an RTX 4090?','faq-earn'],['Is renting out an RTX 3090 worth it?','faq-3090'],['Which platform is best for a home GPU?','faq-platform'],['Can I game while my GPU is rented?','faq-gaming'],['Does a GPU earn more per kW than Bitcoin mining?','faq-vs-btc']].map(([q,id])=>[q,after(h,new RegExp(`<h3 id="${id}">[^<]*</h3>`))]),
 '/':h=>[['What does it take to rent GPUs to AI or mine Bitcoin?',after(h,/<h2>Who can actually do this<\/h2>/)?.replace(/ More on what each takes$/,'')]]};
for(const u of urls){const f='dist'+u+'index.html';let h=fs.readFileSync(f,'utf8');let qa=null;
 if(FAQ[u])qa=FAQ[u](h);else if(/^\/asic\/[^/]+\/$/.test(u)){const m=h.match(/<h1>([^<]+) profitability<\/h1>/),a=h.match(/<p>(At the hashprice below, one [\s\S]*?)<\/p>/);if(m&&a)qa=[[`How much does the ${txt(m[1])} make a day, and what is its break-even power price?`,txt(a[1])]];}
 if(!qa)continue;qa=qa.filter(([q,a])=>a);if(!qa.length)continue;
 const ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":qa.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))};
 fs.writeFileSync(f,h.replace('</head>',`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script></head>`));}
const indexable=urls.filter(u=>!fs.readFileSync('dist'+u+'index.html','utf8').includes('name="robots" content="noindex'));
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(u=>`<url><loc>https://joulemath.com${u}</loc><lastmod>${lastmod(u)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
let bad=0;for(const u of urls){const h=fs.readFileSync('dist'+u+'index.html','utf8');if(h.includes('\u2014')){console.error('em dash in',u);bad++;}
 for(const m of h.matchAll(/href="(\/[^"]*)"/g)){const [t0,frag]=m[1].split('#'),t=t0.split('?')[0];if(t.startsWith('/go/'))continue;const tf=fs.existsSync('dist'+t+'index.html')?'dist'+t+'index.html':'dist'+t;if(!fs.existsSync(tf)){console.error('broken link',t,'in',u);bad++;}else if(frag&&!fs.readFileSync(tf,'utf8').includes(`id="${frag}"`)){console.error('broken anchor',m[1],'in',u);bad++;}}}
for(const u of urls){const f='dist'+u+'index.html';const h=fs.readFileSync(f,'utf8');if(!h.includes('/js/t.js'))fs.writeFileSync(f,h.replace('</body>','<script src="/js/t.js" defer></script></body>'));}
console.log('pages:',urls.join(' '));if(bad)process.exit(1);
// Fingerprint CSS/JS: copy to /assets/<name>.<hash>.<ext>, rewrite HTML refs, keep originals at old paths.
import crypto from 'crypto';
const assets={};for(const rel of ['style.css',...fs.readdirSync('dist/js').map(f=>'js/'+f)]){const buf=fs.readFileSync('dist/'+rel);const h=crypto.createHash('sha256').update(buf).digest('hex').slice(0,10);const b=path.basename(rel).replace(/\.(css|js)$/,`.${h}.$1`);fs.mkdirSync('dist/assets',{recursive:true});fs.writeFileSync('dist/assets/'+b,buf);assets['/'+rel]='/assets/'+b;}
for(const u of urls){const f='dist'+u+'index.html';let h=fs.readFileSync(f,'utf8');h=h.replace(/(href|src)="(\/(?:style\.css|js\/[^"]+\.js))"/g,(m,a,p)=>assets[p]?`${a}="${assets[p]}"`:m);fs.writeFileSync(f,h);}
fs.writeFileSync('dist/_headers',[...urls.flatMap(u=>[u,u+'index.html']).map(u=>`${u}\n  Cache-Control: public, max-age=0, must-revalidate`),
'/assets/*\n  Cache-Control: public, max-age=31536000, immutable','/style.css\n  Cache-Control: public, max-age=300','/js/*\n  Cache-Control: public, max-age=300','/fonts/*\n  Cache-Control: public, max-age=604800','/sitemap.xml\n  Content-Type: application/xml; charset=utf-8','/blog/rss.xml\n  Content-Type: application/rss+xml; charset=utf-8'].join('\n')+'\n');
console.log('assets:',Object.values(assets).join(' '));
