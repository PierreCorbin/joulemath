// POST /api/e  {event, props:{v}} -> anonymous daily counters in the plane's EVENTS KV.
// No cookies, no IPs or personal data stored. Keys: ev:YYYY-MM-DD:event:value (kept ~400 days).
// signup accepts only "attempt". Saved and confirmed subscribers are counted by the subscribe handler
// under metric: keys, which this endpoint cannot write. Fleet values are whitelisted action names.
import {bindingsFor} from '../lib/plane.mjs';

const PRESETS=['default','cheap-power','used-asics','curtailment','low-gpu-util'];
const GO=['flash','vast'];
const OUT=['simplemining','compass','bitmainshop','endless','runpod','lambda'];
const FLEET=['btc-lookup','vast-lookup','slider-btc','scrubber','btc-add','vast-add','benchmark-toggle','preset','sample','clear'];
const V={
  preset:v=>PRESETS.includes(v)?v:null,
  hw:v=>v==='own'||v==='buy'?'buy':v==='rent'?'rent':null,
  basis:v=>['kw','usd'].includes(v)?v:null,
  price:v=>{const n=Number(v);if(!Number.isFinite(n)||n<0)return null;const c=Math.round(n);return c>100?'100plus':String(c);}, // cents/kWh bucket
  go:v=>GO.includes(v)?v:(/^[a-z0-9-]{1,20}$/.test(v)?'other':null),
  out:v=>OUT.includes(v)?v:null,
  fleet:v=>FLEET.includes(v)?v:null,
  signup:v=>v==='attempt'?'attempt':null,
};
const r=(s)=>new Response(null,{status:s,headers:{'Cache-Control':'no-store'}});
// Best-effort per-isolate rate limit, kept in memory only (never persisted). Keyed by plane so preview traffic cannot fill the production window.
const hits=new Map();let win=0;
function limited(plane,ip){const w=Math.floor(Date.now()/60000);if(w!==win){hits.clear();win=w;}const k=plane+':'+ip;const n=(hits.get(k)||0)+1;hits.set(k,n);return n>30;}
export function resetEventsForTests(){hits.clear();win=0;}
// Bot filter (Nov 11, 2026): the Nov 4 counter spike lined up with a scanner burst. Real browsers send Origin on
// sendBeacon/fetch POSTs from our pages, so count only same-host Origin (or Referer) and skip headless or bot user agents.
// Skipped requests get a silent 204 so scanners learn nothing. Nothing about the request is stored.
const BOT_UA=/headless|bot\b|bot\/|crawl|spider|slurp|curl|wget|python|httpx|go-http|java\/|okhttp|axios|node-fetch|undici|phantom|selenium|puppeteer|playwright|lighthouse|scan/i;
function looksHuman(request){
  const ua=request.headers.get('user-agent')||'';
  if(!ua||BOT_UA.test(ua))return false;
  const host=new URL(request.url).host;
  const src=request.headers.get('origin')||request.headers.get('referer')||'';
  try{return new URL(src).host===host;}catch{return false;}
}
export async function onRequestPost({request,env}){
  const bound=bindingsFor(request,env||{});
  const kv=bound.events;
  if(!kv)return r(bound.plane==='production'?503:204);
  if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return r(204);
  if(!looksHuman(request))return r(204);
  if(Number(request.headers.get('content-length')||0)>512)return r(413);
  if(limited(bound.plane,request.headers.get('cf-connecting-ip')||'0'))return r(429);
  let d;try{const t=await request.text();if(t.length>512)return r(413);d=JSON.parse(t);}catch{return r(400);}
  const ev=String(d&&d.event||''),f=V[ev];if(!f)return r(400);
  const val=f(String((d.props&&d.props.v)??'').toLowerCase().slice(0,24));if(val==null)return r(400);
  const key=`ev:${new Date().toISOString().slice(0,10)}:${ev}:${val}`;
  const n=parseInt(await kv.get(key)||'0',10)+1;
  await kv.put(key,String(n),{expirationTtl:400*86400});
  return r(204);
}
export const onRequest=()=>r(405);
