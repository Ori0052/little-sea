import {env} from 'cloudflare:workers';
import {validAvatar} from '../../../components/avatar-state';
import {json,presenceSnapshot,ttl,uuid} from '../../../lib/sea-api';
export const dynamic='force-dynamic';
export async function GET(){try{return await presenceSnapshot()}catch{return json({error:'unavailable'},503)}}
export async function POST(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'origin'},403);if(Number(request.headers.get('content-length')||0)>1200)return json({error:'size'},413);
 try{const text=await request.text();if(text.length>1200)return json({error:'size'},413);let body;try{body=JSON.parse(text)}catch{return json({error:'body'},400)}const {id,visitor,leave,state}=body??{};
 if(!uuid(id)||(visitor!==undefined&&!uuid(visitor)))return json({error:'id'},400);if(state!==undefined&&!validAvatar(state))return json({error:'state'},400);if(!env.DB)return json({error:'unavailable'},503);
 const now=Date.now(),who=visitor||id;let stored=state;
 if(state?.seat!==undefined&&state.seat!==null){const owned=await env.DB.prepare('SELECT seat FROM beach_seats WHERE session = ? AND visitor = ? AND seen > ?').bind(id,who,now-ttl).first<{seat:number}>();if(owned?.seat!==state.seat)stored={...state,seat:null}}
 await env.DB.batch([env.DB.prepare('DELETE FROM island_fire_seats WHERE seen <= ?').bind(now-ttl),leave===true?env.DB.prepare('DELETE FROM island_fire_seats WHERE session = ? AND visitor = ?').bind(id,who):env.DB.prepare('UPDATE island_fire_seats SET seen = ? WHERE session = ? AND visitor = ?').bind(now,id,who),env.DB.prepare('DELETE FROM presence WHERE seen <= ?').bind(now-ttl),env.DB.prepare('DELETE FROM beach_seats WHERE seen <= ?').bind(now-ttl),leave===true?env.DB.prepare('DELETE FROM presence WHERE id = ?').bind(id):env.DB.prepare('INSERT INTO presence (id,visitor_id,seen,state) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET visitor_id=excluded.visitor_id,seen=excluded.seen,state=COALESCE(excluded.state,presence.state)').bind(id,who,now,stored?JSON.stringify(stored):null),leave===true?env.DB.prepare('DELETE FROM beach_seats WHERE session = ?').bind(id):env.DB.prepare('UPDATE beach_seats SET seen = ? WHERE session = ? AND visitor = ?').bind(now,id,who)]);
 return await presenceSnapshot(id,who);
 }catch{return json({error:'unavailable'},503)}}
