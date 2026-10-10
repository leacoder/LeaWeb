// Cloudflare Worker, attached to the existing proxied hostname.
// Secrets: BASIC_AUTH_USER and BASIC_AUTH_PASSWORD. Missing secrets fail closed.
const prefix = '/demo/alvarezinmobiliaria';
const headers = { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Cache-Control': 'private, no-store' };
async function same(a, b) {
  const encode = new TextEncoder();
  const [one, two] = await Promise.all([a,b].map(s=>crypto.subtle.digest('SHA-256',encode.encode(s))));
  const left = new Uint8Array(one), right = new Uint8Array(two);
  let different = 0;
  for(let i=0;i<left.length;i++) different |= left[i]^right[i];
  return different === 0;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname !== prefix && !url.pathname.startsWith(prefix+'/')) return fetch(request);
    if(!env.BASIC_AUTH_USER || !env.BASIC_AUTH_PASSWORD) return new Response('Demo temporalmente no disponible.', { status:503, headers });
    let user='', password='';
    const auth=request.headers.get('Authorization')||'';
    if(auth.startsWith('Basic ')) {
      try {
        const decoded = new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(auth.slice(6)),c=>c.charCodeAt(0)));
        const colon=decoded.indexOf(':');
        if(colon>=0){user=decoded.slice(0,colon);password=decoded.slice(colon+1)}
      } catch { /* Malformed headers receive the same challenge. */ }
    }
    const [userMatches,passwordMatches] = await Promise.all([same(user,env.BASIC_AUTH_USER),same(password,env.BASIC_AUTH_PASSWORD)]);
    if(!userMatches||!passwordMatches) return new Response('Acceso privado a la demo.', {status:401,headers:{...headers,'WWW-Authenticate':'Basic realm="Demo Alvarez", charset="UTF-8"'}});
    const upstreamHeaders=new Headers(request.headers);
    upstreamHeaders.delete('Authorization');
    const upstream=await fetch(new Request(request,{headers:upstreamHeaders}));
    const response=new Response(upstream.body,upstream);
    for(const [key,value] of Object.entries(headers))response.headers.set(key,value);
    return response;
  }
};
