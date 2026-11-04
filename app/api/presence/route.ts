import {cleanupSeaPresence} from '../../../lib/sea-maintenance';
import {authorizeSea} from '../../../lib/sea-session';
import {isSeaOriginAllowed} from '../../../lib/sea-origin';
import {env} from 'cloudflare:workers';
import {validAvatar} from '../../../components/avatar-state';
import {json,presenceSnapshot,ttl,uuid} from '../../../lib/sea-api';
export const dynamic='force-dynamic';
export async function GET(){try{return await presenceSnapshot()}catch{return json({error:'unavailable'},503)}}
export async function POST(request:Request){if(!isSeaOriginAllowed(request))return json({error:'origin'},403);if(Number(request.headers.get('content-length')||0)>1200)return json({error:'size'},413);
 try{const text=await request.text();if(text.length>1200)return json({error:'size'},413);let body;try{body=JSON.parse(text)}catch{return json({error:'body'},400)}const {id,visitor,leave,state}=body??{};
 if(!uuid(id)||(visitor!==undefined&&!uuid(visitor)))return json({error:'id'},400);if(state!==undefined&&!validAvatar(state))return json({error:'state'},400);if(!env.DB)return json({error:'unavailable'},503);
 const auth=await authorizeSea(body,'presence');if(auth)return auth;const now=Date.now(),who=visitor||id;await env.DB.prepare(leave===true?'DELETE FROM boat_passengers WHERE session=? AND visitor=?':'UPDATE boat_passengers SET seen=? WHERE session=? AND visitor=? AND seen>?' ).bind(...(leave===true?[id,who]:[now,id,who,now-15000])).run();let stored=state;
 if(state?.seat!==undefined&&state.seat!==null){const owned=await env.DB.prepare('SELECT seat FROM beach_seats WHERE session = ? AND visitor = ? AND seen > ?').bind(id,who,now-ttl).first<{seat:number}>();if(owned?.seat!==state.seat)stored={...state,seat:null}}
 await cleanupSeaPresence(now);
 if(leave===true){await env.DB.batch([
  env.DB.prepare('DELETE FROM island_fire_seats WHERE session=? AND visitor=?').bind(id,who),
  env.DB.prepare('DELETE FROM beach_seats WHERE session=? AND visitor=?').bind(id,who),
  env.DB.prepare('DELETE FROM presence WHERE id=? AND visitor_id=?').bind(id,who),
  env.DB.prepare('DELETE FROM sea_sessions WHERE id=? AND visitor=?').bind(id,who),
 ]);return json({left:true})}
 const writes=await env.DB.batch([
  env.DB.prepare('UPDATE island_fire_seats SET seen=? WHERE session=? AND visitor=? AND seen>?').bind(now,id,who,now-ttl),
  env.DB.prepare('UPDATE beach_seats SET seen=? WHERE session=? AND visitor=? AND seen>?').bind(now,id,who,now-ttl),
  env.DB.prepare('INSERT INTO presence (id,visitor_id,seen,state) SELECT ?,?,?,? WHERE (SELECT COUNT(DISTINCT p.visitor_id) FROM presence p JOIN sea_sessions s ON s.id=p.id WHERE s.network=(SELECT network FROM sea_sessions WHERE id=?) AND p.visitor_id<>? AND p.seen>?)<8 ON CONFLICT(id) DO UPDATE SET seen=excluded.seen,state=COALESCE(excluded.state,presence.state) WHERE presence.visitor_id=excluded.visitor_id').bind(id,who,now,stored?JSON.stringify(stored):null,id,who,now-ttl),
 ]);
 if(writes[2].meta.changes===0)return json({error:'network_limit'},429);return await presenceSnapshot(id,who);
 }catch{return json({error:'unavailable'},503)}}
