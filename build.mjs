import fs from 'fs';import path from 'path';
fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('src','dist',{recursive:true});
const pages=[];(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(f==='index.html')pages.push('/'+path.relative('dist',path.dirname(p)).replace(/^$/,'')+(d==='dist'?'':'/'));}})('dist');
const urls=pages.map(u=>u.replace('//','/'));
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>https://joulemath.com${u}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
let bad=0;for(const u of urls){const h=fs.readFileSync('dist'+u+'index.html','utf8');if(h.includes('\u2014')){console.error('em dash in',u);bad++;}
 for(const m of h.matchAll(/href="(\/[^"]*)"/g)){const t=m[1];if(t.startsWith('/go/'))continue;if(!fs.existsSync('dist'+t)&&!fs.existsSync('dist'+t+'index.html')){console.error('broken link',t,'in',u);bad++;}}}
console.log('pages:',urls.join(' '));if(bad)process.exit(1);
// Fingerprint CSS/JS: copy to /assets/<name>.<hash>.<ext>, rewrite HTML refs, keep originals at old paths.
import crypto from 'crypto';
const assets={};for(const rel of ['style.css',...fs.readdirSync('dist/js').map(f=>'js/'+f)]){const buf=fs.readFileSync('dist/'+rel);const h=crypto.createHash('sha256').update(buf).digest('hex').slice(0,10);const b=path.basename(rel).replace(/\.(css|js)$/,`.${h}.$1`);fs.mkdirSync('dist/assets',{recursive:true});fs.writeFileSync('dist/assets/'+b,buf);assets['/'+rel]='/assets/'+b;}
for(const u of urls){const f='dist'+u+'index.html';let h=fs.readFileSync(f,'utf8');h=h.replace(/(href|src)="(\/(?:style\.css|js\/[^"]+\.js))"/g,(m,a,p)=>assets[p]?`${a}="${assets[p]}"`:m);fs.writeFileSync(f,h);}
fs.writeFileSync('dist/_headers',[...urls.flatMap(u=>[u,u+'index.html']).map(u=>`${u}\n  Cache-Control: public, max-age=0, must-revalidate`),
'/assets/*\n  Cache-Control: public, max-age=31536000, immutable','/style.css\n  Cache-Control: public, max-age=300','/js/*\n  Cache-Control: public, max-age=300','/fonts/*\n  Cache-Control: public, max-age=604800'].join('\n')+'\n');
console.log('assets:',Object.values(assets).join(' '));
