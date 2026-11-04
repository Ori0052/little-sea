import {env} from 'cloudflare:workers';
// Per-isolate housekeeping, not a gameplay lease. Reads and claims still check expiry.
let nextCleanup=0;
let pending:Promise<void>|null=null;
export async function cleanupSeaPresence(now:number){
 if(!env.DB||now<nextCleanup)return;
 if(pending)return pending;
 nextCleanup=now+60000;
 pending=(async()=>{try{await env.DB!.batch([
  env.DB!.prepare('DELETE FROM presence WHERE seen <= ?').bind(now-90000),
  env.DB!.prepare('DELETE FROM beach_seats WHERE seen <= ?').bind(now-90000),
  env.DB!.prepare('DELETE FROM island_fire_seats WHERE seen <= ?').bind(now-90000),
 ]);}catch{nextCleanup=0;}finally{pending=null;}})();
 await pending;
}
