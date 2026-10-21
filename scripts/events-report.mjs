// Prints a 7-day summary of anonymous event counters from the joulemath-events KV namespace.
// Usage: CLOUDFLARE_API_TOKEN_KV=... node scripts/events-report.mjs [days]
const T=process.env.CLOUDFLARE_API_TOKEN_KV||process.env.CLOUDFLARE_API_TOKEN;
const A=process.env.CLOUDFLARE_ACCOUNT_ID||'21e7ed7a2d48ea209f6a35250684c64e';
const NS='25910d4d5f5e4dee8dd20e3336a1e227'; // joulemath-events (also in wrangler.toml)
if(!T){console.error('Set CLOUDFLARE_API_TOKEN_KV');process.exit(1);}
const days=Number(process.argv[2]||7),base=`https://api.cloudflare.com/client/v4/accounts/${A}/storage/kv/namespaces/${NS}`;
const H={Authorization:'Bearer '+T};
const dates=[...Array(days)].map((_,i)=>new Date(Date.now()-i*864e5).toISOString().slice(0,10));
const tot={};let rows=0;
for(const d of dates){let cursor='';do{const u=new URL(base+'/keys');u.searchParams.set('prefix',`ev:${d}:`);u.searchParams.set('limit','1000');if(cursor)u.searchParams.set('cursor',cursor);
 const j=await (await fetch(u,{headers:H})).json();if(!j.success){console.error(j.errors);process.exit(1);}
 for(const k of j.result){const n=parseInt(await (await fetch(`${base}/values/${encodeURIComponent(k.name)}`,{headers:H})).text(),10)||0;
  const [,,ev,val]=k.name.split(':');(tot[ev]??={})[val]=(tot[ev][val]||0)+n;rows++;}
 cursor=j.result_info?.cursor||'';}while(cursor);}
console.log(`joulemath events, ${dates.at(-1)} to ${dates[0]} (UTC), ${rows} counters`);
if(!rows)console.log('  (no events)');
for(const ev of Object.keys(tot).sort()){const vals=Object.entries(tot[ev]).sort((a,b)=>b[1]-a[1]);
 console.log(`\n${ev}  total ${vals.reduce((s,[,n])=>s+n,0)}`);for(const [v,n] of vals)console.log(`  ${v.padEnd(16)} ${n}`);}
