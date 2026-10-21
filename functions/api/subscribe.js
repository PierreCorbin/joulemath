// POST /api/subscribe  {email, website(honeypot)} -> stores in KV binding SUBSCRIBERS.
const RE=/^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,24}$/i;
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequestPost({request,env}){
  const kv=env.SUBSCRIBERS; if(!kv) return json({ok:false,error:'unavailable'},503);
  let d={};const ct=request.headers.get('content-type')||'';
  try{d=ct.includes('json')?await request.json():Object.fromEntries(await request.formData());}catch{return json({ok:false,error:'bad request'},400);}
  if(d.website) return json({ok:true}); // honeypot: pretend success
  const email=String(d.email||'').trim().toLowerCase();
  if(email.length>254||!RE.test(email)) return json({ok:false,error:'invalid email'},400);
  const ip=request.headers.get('cf-connecting-ip')||'0', hr=Math.floor(Date.now()/3.6e6), rk=`rl:${ip}:${hr}`;
  const n=parseInt(await kv.get(rk)||'0',10); if(n>=5) return json({ok:false,error:'too many requests'},429);
  await kv.put(rk,String(n+1),{expirationTtl:3700});
  const key='sub:'+email; if(!(await kv.get(key))) await kv.put(key,JSON.stringify({email,ts:new Date().toISOString(),src:String(d.src||'').slice(0,40)}));
  return json({ok:true});
}
export const onRequest=()=>json({ok:false,error:'method not allowed'},405);
