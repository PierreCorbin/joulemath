// POST /api/e  {event, props:{v}} -> anonymous daily counters in KV binding EVENTS.
// No cookies, no IPs or personal data stored. Keys: ev:YYYY-MM-DD:event:value (kept ~400 days).
const PRESETS=['default','cheap-power','used-asics','curtailment','low-gpu-util'];
const GO=['flash','vast'];
const OUT=['simplemining','compass','bitmainshop','endless','runpod','lambda'];
const V={
  preset:v=>PRESETS.includes(v)?v:null,
  hw:v=>v==='own'||v==='buy'?'buy':v==='rent'?'rent':null,
  basis:v=>['kw','usd'].includes(v)?v:null,
  price:v=>{const n=Number(v);if(!Number.isFinite(n)||n<0)return null;const c=Math.round(n);return c>100?'100plus':String(c);}, // cents/kWh bucket
  go:v=>GO.includes(v)?v:(/^[a-z0-9-]{1,20}$/.test(v)?'other':null),
  out:v=>OUT.includes(v)?v:null,
  signup:()=>'submit',
};
const r=(s)=>new Response(null,{status:s,headers:{'Cache-Control':'no-store'}});
// Best-effort per-isolate rate limit, kept in memory only (never persisted).
const hits=new Map();let win=0;
function limited(ip){const w=Math.floor(Date.now()/60000);if(w!==win){hits.clear();win=w;}const n=(hits.get(ip)||0)+1;hits.set(ip,n);return n>30;}
export async function onRequestPost({request,env}){
  const kv=env.EVENTS;if(!kv)return r(503);
  if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return r(204);
  if(Number(request.headers.get('content-length')||0)>512)return r(413);
  if(limited(request.headers.get('cf-connecting-ip')||'0'))return r(429);
  let d;try{const t=await request.text();if(t.length>512)return r(413);d=JSON.parse(t);}catch{return r(400);}
  const ev=String(d&&d.event||''),f=V[ev];if(!f)return r(400);
  const val=f(String((d.props&&d.props.v)??'').toLowerCase().slice(0,24));if(val==null)return r(400);
  const key=`ev:${new Date().toISOString().slice(0,10)}:${ev}:${val}`;
  const n=parseInt(await kv.get(key)||'0',10)+1;
  await kv.put(key,String(n),{expirationTtl:400*86400});
  return r(204);
}
export const onRequest=()=>r(405);
