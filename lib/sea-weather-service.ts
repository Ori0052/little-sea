import {parseObservations,weatherRegions,weatherCacheSeconds,type WeatherSnapshot} from './sea-live-weather';
// All regions are one fixed request and one cache entry; query strings cannot amplify upstream calls.
const source='https://aviationweather.gov/api/data/metar?ids='+weatherRegions.map(r=>r.station).join(',')+'&format=json&hours=2';
const cacheKey='https://little-sea.rhfenrdltkfk.chatgpt.site/__weather-cache/v1';
type EdgeCache={match:(key:string)=>Promise<Response|undefined>;put:(key:string,value:Response)=>Promise<unknown>};
let memory:{until:number;value:WeatherSnapshot}|null=null,pending:Promise<WeatherSnapshot>|null=null,failedUntil=0;
export async function loadWeather(cache?:EdgeCache,fetcher:typeof fetch=fetch,now=Date.now()):Promise<WeatherSnapshot>{
 if(memory&&now<memory.until)return memory.value;if(now<failedUntil)throw Error('weather_unavailable');if(pending)return pending;
 pending=(async()=>{try{const cached=await cache?.match(cacheKey).catch(()=>undefined);if(cached){const value=await cached.json() as WeatherSnapshot;if(value&&Array.isArray(value.observations)&&now-value.fetchedAt<weatherCacheSeconds*1000){memory={until:value.fetchedAt+weatherCacheSeconds*1000,value};return value}}
 const res=await fetcher(source,{headers:{'User-Agent':'LittleSea/1.0 (https://little-sea.rhfenrdltkfk.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'});
 if(!res.ok||res.status===204)throw Error('weather_unavailable');if(Number(res.headers.get('content-length'))>200000)throw Error('weather_size');const text=await res.text();if(text.length>200000)throw Error('weather_size');const observations=parseObservations(JSON.parse(text),now);if(!observations.length)throw Error('weather_unavailable');const value:WeatherSnapshot={fetchedAt:now,observations};memory={until:now+weatherCacheSeconds*1000,value};if(cache)await cache.put(cacheKey,Response.json(value,{headers:{'Cache-Control':`public,max-age=${weatherCacheSeconds}`}})).catch(()=>undefined);return value;
 }catch{failedUntil=now+5*60000;throw Error('weather_unavailable')}finally{pending=null}})();return pending;
}
