// SDK 3.1+ release and QR-test origins. No wildcards or credentials.
export const tossOrigins=new Set(['https://little-sea.apps.tossmini.com','https://little-sea.private-apps.tossmini.com']);
export const seaApiPaths=new Set(['/api/session','/api/presence','/api/seats','/api/fire-seats','/api/campfire','/api/fishing','/api/boat']);
export function isSeaOriginAllowed(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin||tossOrigins.has(origin)}
export function seaCorsPreflight(request:Request):Response|null {
 if(!seaApiPaths.has(new URL(request.url).pathname))return null;
 if(!isSeaOriginAllowed(request))return Response.json({error:'origin'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='OPTIONS')return null;
 const method=request.headers.get('access-control-request-method');
 const headers=(request.headers.get('access-control-request-headers')||'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
 if((method&&!['GET','POST'].includes(method))||headers.some(h=>h!=='content-type'))return new Response(null,{status:403});
 return withSeaCors(request,new Response(null,{status:204}));
}
export function withSeaCors(request:Request,response:Response){const origin=request.headers.get('origin');if(!seaApiPaths.has(new URL(request.url).pathname)||!origin||!tossOrigins.has(origin))return response;const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Access-Control-Max-Age','600');headers.append('Vary','Origin');return new Response(response.body,{status:response.status,statusText:response.statusText,headers})}
