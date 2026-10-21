import fs from 'fs';import path from 'path';import {buildBlog} from './blog.mjs';import {buildAsic} from './asic.mjs';
fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('src','dist',{recursive:true});buildBlog();await buildAsic();
const pages=[];(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(f==='index.html')pages.push('/'+path.relative('dist',path.dirname(p)).replace(/^$/,'')+(d==='dist'?'':'/'));}})('dist');
const urls=pages.map(u=>u.replace('//','/'));
// Newsletter box. Hidden until the SUBSCRIBERS KV binding exists on the Pages project; flip NEWSLETTER to true then.
const NEWSLETTER=true;
const signup=c=>`<form class="signup" method="post" action="/api/subscribe"${NEWSLETTER?'':' hidden'}><b>Weekly energy-to-compute data, free</b><p class="note" style="margin:.2rem 0 0">Hashprice, GPU rent per kW and the deals behind them, once a week. Unsubscribe any time.</p><div class="row"><input type="email" name="email" required placeholder="you@example.com" aria-label="Email"><input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="src" value="${c}"><button class="btn" type="submit">Subscribe</button></div><p class="signup-msg" aria-live="polite"></p></form>`;
for(const u of urls){const f='dist'+u+'index.html';let h=fs.readFileSync(f,'utf8');const c=u==='/'?'home':u.startsWith('/blog/')&&u!=='/blog/'?'blog':u.startsWith('/asic/')?'asic':null;if(!c)continue;
 if(h.includes('<!--signup-->'))h=h.replace('<!--signup-->',signup(c));else if(c==='blog')h=h.replace('</article>',signup(c)+'</article>');else h=h.replace('<section class="cta">',signup(c)+'<section class="cta">');
 if(NEWSLETTER)h=h.replace('</body>','<script src="/js/signup.js" defer></script></body>');fs.writeFileSync(f,h);}
// Sitemap lastmod = last git commit touching the page's source (its src dir or file, plus the generator that renders it), not the build date.
import {execFileSync} from 'child_process';
const gitDate=fs2=>{try{return execFileSync('git',['log','-1','--format=%cs','--',...fs2],{encoding:'utf8'}).trim();}catch(e){return '';}};
const srcFor=u=>{const f=[u==='/'?'src/index.html':'src'+u];if(u.startsWith('/blog/'))f.push('blog.mjs');if(u.startsWith('/asic/'))f.push('asic.mjs');if(u.startsWith('/power-prices/'))f.push('power.mjs');return f.filter(x=>fs.existsSync(x));};
const lastmod=u=>{const f=srcFor(u);return (f.length&&gitDate(f))||new Date().toISOString().slice(0,10);};
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>https://joulemath.com${u}</loc><lastmod>${lastmod(u)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
let bad=0;for(const u of urls){const h=fs.readFileSync('dist'+u+'index.html','utf8');if(h.includes('\u2014')){console.error('em dash in',u);bad++;}
 for(const m of h.matchAll(/href="(\/[^"]*)"/g)){const [t,frag]=m[1].split('#');if(t.startsWith('/go/'))continue;const tf=fs.existsSync('dist'+t+'index.html')?'dist'+t+'index.html':'dist'+t;if(!fs.existsSync(tf)){console.error('broken link',t,'in',u);bad++;}else if(frag&&!fs.readFileSync(tf,'utf8').includes(`id="${frag}"`)){console.error('broken anchor',m[1],'in',u);bad++;}}}
for(const u of urls){const f='dist'+u+'index.html';const h=fs.readFileSync(f,'utf8');if(!h.includes('/js/t.js'))fs.writeFileSync(f,h.replace('</body>','<script src="/js/t.js" defer></script></body>'));}
console.log('pages:',urls.join(' '));if(bad)process.exit(1);
// Fingerprint CSS/JS: copy to /assets/<name>.<hash>.<ext>, rewrite HTML refs, keep originals at old paths.
import crypto from 'crypto';
const assets={};for(const rel of ['style.css',...fs.readdirSync('dist/js').map(f=>'js/'+f)]){const buf=fs.readFileSync('dist/'+rel);const h=crypto.createHash('sha256').update(buf).digest('hex').slice(0,10);const b=path.basename(rel).replace(/\.(css|js)$/,`.${h}.$1`);fs.mkdirSync('dist/assets',{recursive:true});fs.writeFileSync('dist/assets/'+b,buf);assets['/'+rel]='/assets/'+b;}
for(const u of urls){const f='dist'+u+'index.html';let h=fs.readFileSync(f,'utf8');h=h.replace(/(href|src)="(\/(?:style\.css|js\/[^"]+\.js))"/g,(m,a,p)=>assets[p]?`${a}="${assets[p]}"`:m);fs.writeFileSync(f,h);}
fs.writeFileSync('dist/_headers',[...urls.flatMap(u=>[u,u+'index.html']).map(u=>`${u}\n  Cache-Control: public, max-age=0, must-revalidate`),
'/assets/*\n  Cache-Control: public, max-age=31536000, immutable','/style.css\n  Cache-Control: public, max-age=300','/js/*\n  Cache-Control: public, max-age=300','/fonts/*\n  Cache-Control: public, max-age=604800','/sitemap.xml\n  Content-Type: application/xml; charset=utf-8','/blog/rss.xml\n  Content-Type: application/rss+xml; charset=utf-8'].join('\n')+'\n');
console.log('assets:',Object.values(assets).join(' '));
