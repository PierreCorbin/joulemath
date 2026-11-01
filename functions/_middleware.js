// 301 www.joulemath.com (and any other non-apex host alias) to https://joulemath.com with the same path and query.
// Lives in the repo so no dashboard change is needed. Static assets are excluded in _routes.json to keep Function calls low.
const APEX='joulemath.com';
export async function onRequest({request,next}){
  const url=new URL(request.url);
  if(url.hostname==='www.'+APEX){url.hostname=APEX;url.protocol='https:';url.port='';return new Response(null,{status:301,headers:{Location:url.toString(),'Cache-Control':'public, max-age=86400'}});}
  return next();
}
