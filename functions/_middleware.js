// 301 www.joulemath.com and the production joulemath.pages.dev alias to https://joulemath.com with the same path and query,
// and mark preview deployments (<hash>.joulemath.pages.dev) noindex so Google does not treat them as alternate copies.
// Lives in the repo so no dashboard change is needed. Static assets are excluded in _routes.json to keep Function calls low.
const APEX='joulemath.com';
export async function onRequest({request,next}){
  const url=new URL(request.url);
  if(url.hostname==='www.'+APEX||url.hostname==='joulemath.pages.dev'){url.hostname=APEX;url.protocol='https:';url.port='';return new Response(null,{status:301,headers:{Location:url.toString(),'Cache-Control':'public, max-age=86400'}});}
  const res=await next();
  if(url.hostname.endsWith('.joulemath.pages.dev')){const r=new Response(res.body,res);r.headers.set('X-Robots-Tag','noindex');return r;}
  return res;
}
