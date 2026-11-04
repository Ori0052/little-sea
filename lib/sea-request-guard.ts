import {env} from 'cloudflare:workers';
import {networkKey} from './sea-session';
// One shared, pre-auth network budget across all seven mutation endpoints.
// D1 grants small leases atomically; an isolate spends its lease in memory.
export const ingressLimit=1800,ingressPeriod=60000,ingressLease=20;
const maxNetworks=4096;
type Budget={window:number;remaining:number;blocked:boolean;unavailableUntil:number;pending?:Promise<void>};
const budgets=new Map<string,Budget>();
let nextSweep=0;
function limited(now:number){return Response.json({error:'rate_limit'},{status:429,headers:{'Cache-Control':'no-store','Retry-After':String(Math.max(1,Math.ceil((ingressPeriod-now%ingressPeriod)/1000)))}})}
function unavailable(){return Response.json({error:'unavailable'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'5'}})}
export async function guardSeaRequest(request:Request):Promise<Response|null>{
 if(!env.DB)return unavailable();
 const key='ingress:v1:'+await networkKey(request);
 for(;;){
  const now=Date.now(),window=Math.floor(now/ingressPeriod)*ingressPeriod;
  let budget=budgets.get(key);
  if(!budget||budget.window!==window){
   if(!budget&&budgets.size>=maxNetworks){
    if(now>=nextSweep){nextSweep=now+5000;for(const [k,v] of budgets)if(v.window<window)budgets.delete(k)}
    // Do not evict active limits: rotating inputs must not bypass a blocked key.
    if(budgets.size>=maxNetworks)return limited(now);
   }
   budget={window,remaining:0,blocked:false,unavailableUntil:0};budgets.set(key,budget);
  }
  if(budget.blocked)return limited(now);
  if(now<budget.unavailableUntil)return unavailable();
  if(budget.remaining>0){budget.remaining--;return null}
  if(budget.pending){await budget.pending;continue}
  const current=budget;
  current.pending=Promise.resolve().then(async()=>{try{
   const granted=await env.DB!.prepare(`INSERT INTO sea_rate_limits(key,window_start,count) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+excluded.count ELSE excluded.count END,window_start=excluded.window_start WHERE window_start<excluded.window_start OR (window_start=excluded.window_start AND count<=?) RETURNING count`).bind(key,window,ingressLease,ingressLimit-ingressLease).first<{count:number}>();
   if(granted)current.remaining=ingressLease;else current.blocked=true;
  }catch{current.unavailableUntil=Date.now()+5000;}}).finally(()=>{current.pending=undefined});
  await current.pending;
 }
}
