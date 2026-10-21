import fs from 'fs';import path from 'path';
fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('src','dist',{recursive:true});
const pages=[];(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(f==='index.html')pages.push('/'+path.relative('dist',path.dirname(p)).replace(/^$/,'')+(d==='dist'?'':'/'));}})('dist');
const urls=pages.map(u=>u.replace('//','/'));
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>https://joulemath.com${u}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
let bad=0;for(const u of urls){const h=fs.readFileSync('dist'+u+'index.html','utf8');if(h.includes('\u2014')){console.error('em dash in',u);bad++;}
 for(const m of h.matchAll(/href="(\/[^"]*)"/g)){const t=m[1];if(!fs.existsSync('dist'+t)&&!fs.existsSync('dist'+t+'index.html')){console.error('broken link',t,'in',u);bad++;}}}
console.log('pages:',urls.join(' '));process.exit(bad?1:0);
