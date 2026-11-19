import {isSeaOriginAllowed} from '../../../lib/sea-origin';
import {loadWeather} from '../../../lib/sea-weather-service';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!isSeaOriginAllowed(request))return Response.json({error:'origin'},{status:403});if(new URL(request.url).search)return Response.json({error:'query'},{status:400,headers:{'Cache-Control':'no-store'}});try{const cache=(globalThis.caches as CacheStorage&{default?:Cache})?.default;const value=await loadWeather(cache);return Response.json(value,{headers:{'Cache-Control':'public,max-age=300','X-Content-Type-Options':'nosniff'}})}catch{return Response.json({error:'weather_unavailable'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}})}}
