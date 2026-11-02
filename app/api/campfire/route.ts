import {env} from 'cloudflare:workers';
import {json,ttl,uuid} from '../../../lib/sea-api';
import {validAvatar} from '../../../components/avatar-state';
import {onIsland,fireCenter} from '../../../components/island-space';
import {toWorld} from '../../../components/sea-space';
import {potatoRoastMs} from '../../../components/campfire-state';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'origin'},403);
 if(Number(request.headers.get('content-length')||0)>512)return json({error:'size'},413);
 try{const text=await request.text();if(text.length>512)return json({error:'size'},413);let body;try{body=JSON.parse(text)}catch{return json({error:'body'},400)}
 const {id,visitor,lit,action}=body??{};if(!uuid(id)||!uuid(visitor)||(action===undefined?typeof lit!=='boolean':!['watch','wood','aurora','roast','collect'].includes(action)))return json({error:'body'},400);if(!env.DB)return json({error:'unavailable'},503);
 const row=await env.DB.prepare('SELECT state FROM presence WHERE id = ? AND visitor_id = ? AND seen > ?').bind(id,visitor,Date.now()-ttl).first<{state:string}>();let state;try{state=JSON.parse(row?.state||'null')}catch{}
 if(!validAvatar(state)||!onIsland(state.x,state.z,state.view))return json({error:'island'},403);
 const p=toWorld(state.x,state.z,state.view);if(Math.hypot(p.x-fireCenter.x,p.z-fireCenter.z)>4.5)return json({error:'distance'},403);
 const now=Date.now();let collected=false;
 const write=env.DB.prepare('INSERT INTO island_campfire (id,lit,updated,wood_until,aurora_until) VALUES (1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET lit=excluded.lit,updated=excluded.updated,wood_until=MAX(island_campfire.wood_until,excluded.wood_until),aurora_until=MAX(island_campfire.aurora_until,excluded.aurora_until)').bind(action===undefined?(lit?1:0):1,now,action==='wood'?now+90000:0,action==='aurora'?now+60000:0);
 if(action==='collect'){const result=await env.DB.batch([env.DB.prepare('DELETE FROM island_potatoes WHERE visitor = ? AND ready_at <= ? RETURNING ready_at').bind(visitor,now),write]);if(!result[0].results.length)return json({error:'not_ready'},409);collected=true}else if(action==='roast')await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO island_potatoes (visitor,ready_at) VALUES (?,?)').bind(visitor,now+potatoRoastMs),write]);else await write.run();
 const fire=await env.DB.prepare('SELECT lit,updated,wood_until,aurora_until FROM island_campfire WHERE id = 1').first<{lit:number;updated:number;wood_until:number;aurora_until:number}>();const potato=await env.DB.prepare('SELECT ready_at FROM island_potatoes WHERE visitor = ?').bind(visitor).first<{ready_at:number}>();
 return json({lit:!!fire?.lit,updated:fire?.updated??now,woodUntil:fire?.wood_until??0,auroraUntil:fire?.aurora_until??0,potatoReadyAt:potato?.ready_at??null,serverNow:now,collected});
 }catch{return json({error:'unavailable'},503)}
}
