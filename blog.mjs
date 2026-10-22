// Blog generator: src/blog/<slug>/post.html with a leading <!--meta {json} --> block.
// Produces dist/blog/<slug>/index.html, dist/blog/index.html and dist/blog/rss.xml.
import fs from 'fs';
const SITE='https://joulemath.com';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
export function buildBlog(){
  const shell=fs.readFileSync('dist/about/index.html','utf8');
  const header=shell.match(/<header[\s\S]*?<\/header>/)[0].replace(/ aria-current="page"/g,'').replace('<a href="/blog/">','<a href="/blog/" aria-current="page">');
  const footer=shell.match(/<footer[\s\S]*?<\/footer>/)[0];
  const headBits=shell.match(/<meta name="theme-color"[\s\S]*?crossorigin>/)[0];
  const page=({title,desc,url,type,ld,body,scripts=''})=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta property="og:image" content="https://joulemath.com/og-image.png"><meta name="viewport" content="width=device-width,initial-scale=1">
${headBits}
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${url}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="joulemath"><meta name="twitter:card" content="summary">
<link rel="alternate" type="application/rss+xml" title="joulemath blog" href="/blog/rss.xml">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
${header}<main><div class="wrap">
${body}
</div></main>${footer}
${scripts}<script src="/js/theme.js" defer></script>
</body></html>
`;
  const dir='dist/blog';if(!fs.existsSync(dir))return;
  const posts=[];
  for(const slug of fs.readdirSync(dir)){const f=`${dir}/${slug}/post.html`;if(!fs.existsSync(f))continue;
    const raw=fs.readFileSync(f,'utf8');const m=raw.match(/^<!--meta\s*([\s\S]*?)-->/);if(!m)throw new Error('no meta in '+f);
    const meta=JSON.parse(m[1]);const html=raw.slice(m[0].length).trim();const url=`/blog/${slug}/`;posts.push({...meta,slug,url});
    const ld={"@context":"https://schema.org","@type":"Article","headline":meta.title,"description":meta.description,"datePublished":meta.date,"dateModified":meta.updated||meta.date,"author":{"@type":"Organization","name":"joulemath","url":SITE+'/'},"publisher":{"@type":"Organization","name":"joulemath","url":SITE+'/'},"mainEntityOfPage":SITE+url};
    const body=`<article class="prose post"><p class="eyebrow"><a href="/blog/">Blog</a> · <time datetime="${meta.date}">${fmtDate(meta.date)}</time></p><h1>${esc(meta.title)}</h1>
${html}</article>`;
    fs.writeFileSync(`${dir}/${slug}/index.html`,page({title:`${meta.title} | joulemath`,desc:meta.description,url,type:'article',ld,body}).replace('<meta property="og:type" content="article">',`<meta property="og:type" content="article"><meta property="article:published_time" content="${meta.date}">`));
    fs.rmSync(f);}
  posts.sort((a,b)=>b.date.localeCompare(a.date));
  const list=posts.map(p=>`<li class="post-item"><time datetime="${p.date}">${fmtDate(p.date)}</time><h2><a href="${p.url}">${esc(p.title)}</a></h2><p>${esc(p.description)}</p></li>`).join('\n');
  fs.writeFileSync(`${dir}/index.html`,page({title:'Blog | joulemath',desc:'Notes on what a kilowatt earns: Bitcoin mining, GPU rental and the numbers behind them.',url:'/blog/',type:'website',
    ld:{"@context":"https://schema.org","@type":"Blog","name":"joulemath blog","url":SITE+'/blog/'},
    body:`<div class="hero"><div class="eyebrow">Blog</div><h1>Notes on what a kilowatt earns</h1><p class="lead">Short write-ups using live data and public pricing pages, with every figure linked to its source. <a href="/blog/rss.xml">RSS feed</a>.</p></div><ul class="post-list">${list}</ul>`}));
  const rss=`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>joulemath blog</title><link>${SITE}/blog/</link><description>Notes on what a kilowatt earns.</description><language>en</language><atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${posts.map(p=>`<item><title>${esc(p.title)}</title><link>${SITE}${p.url}</link><guid>${SITE}${p.url}</guid><pubDate>${new Date(p.date+'T12:00:00Z').toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}
</channel></rss>
`;
  fs.writeFileSync(`${dir}/rss.xml`,rss);
}
