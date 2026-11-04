import {seatLimitSQL,seatLimitArgs,visitorFreeSQL,visitorFreeArgs,boatNetworkSQL,authorizeSea} from '../../../lib/sea-session';
import {env} from 'cloudflare:workers';
import {json,uuid,ttl} from '../../../lib/sea-api';
import {isSeaOriginAllowed} from '../../../lib/sea-origin';
import {boatSnapshot,boatTimeout,asRoute,type BoatRow} from '../../../lib/boat-api';
import {boatPosition,clearBoatRoute} from '../../../components/boat-space';
import {validAvatar} from '../../../components/avatar-state';
import {toWorld} from '../../../components/sea-space';
export const dynamic='force-dynamic';
export async function POST(request:Request){if(!isSeaOriginAllowed(request))return json({error:'origin'},403);try{const raw=await request.text();if(raw.length>512)return json({error:'size'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'body'},400)}const{id,visitor,action}=b??{};if(!uuid(id)||!uuid(visitor)||!['board','leave','sail','stop'].includes(action))return json({error:'body'},400);if(!env.DB)return json({error:'unavailable'},503);const auth=await authorizeSea(b,'action');if(auth)return auth;const now=Date.now();await boatSnapshot(id,visitor,now);const row=(await env.DB.prepare('SELECT * FROM sea_boat WHERE id=1').first<BoatRow>())!,pose=boatPosition(asRoute(row),now),member=await env.DB.prepare('SELECT seat,session FROM boat_passengers WHERE visitor=?').bind(visitor).first<{seat:number;session:string}>();
 if(action==='board'){
  if(member?.session===id)return json({boat:await boatSnapshot(id,visitor,now)});
  const presence=await env.DB.prepare('SELECT state FROM presence WHERE id=? AND visitor_id=? AND seen>?').bind(id,visitor,now-ttl).first<{state:string}>();let state;try{state=JSON.parse(presence?.state||'null')}catch{}if(!validAvatar(state))return json({error:'presence'},403);const p=toWorld(state.x,state.z,state.view);if(Math.hypot(p.x-pose.x,p.z-pose.z)>3||pose.moving||(state.depth??0)>.7||state.seat!=null||state.rest||state.fishing)return json({error:'near_boat'},403);
  if(member){await env.DB.prepare(`UPDATE boat_passengers SET session=?,seen=? WHERE visitor=? AND session=? AND ${seatLimitSQL} AND ${boatNetworkSQL}`).bind(id,now,visitor,member.session,...seatLimitArgs(id,visitor,now),id,now-15000,visitor).run();if((await boatSnapshot(id,visitor,now)).selfSeat===null)return json({error:'seat_limit'},429);return json({boat:await boatSnapshot(id,visitor,now)})}
  const inserted=await env.DB.prepare(`INSERT OR IGNORE INTO boat_passengers(seat,visitor,session,seen) SELECT column1,?,?,? FROM (VALUES(0),(1),(2),(3),(4),(5)) WHERE column1 NOT IN (SELECT seat FROM boat_passengers) AND ${seatLimitSQL} AND ${visitorFreeSQL} AND ${boatNetworkSQL} LIMIT 1 RETURNING seat`).bind(visitor,id,now,...seatLimitArgs(id,visitor,now),...visitorFreeArgs(visitor,now),id,now-15000,visitor).first();if(!inserted){const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM boat_passengers').first<{n:number}>();return json({error:count?.n===6?'full':'seat_limit'},count?.n===6?409:429)}
 }else{
  if(!member||member.session!==id)return json({error:'not_aboard'},403);
  if(action==='leave'){if(pose.moving)return json({error:'moving'},409);await env.DB.prepare('DELETE FROM boat_passengers WHERE visitor=? AND session=?').bind(visitor,id).run()}
  else{if(row.captain!==visitor)return json({error:'captain'},403);if(action==='stop')await env.DB.prepare('UPDATE sea_boat SET x=?,z=?,heading=?,target_x=NULL,target_z=NULL,departed=? WHERE id=1 AND captain=?').bind(pose.x,pose.z,pose.heading,now,visitor).run();else{const target=b.target;if(!target||!clearBoatRoute(pose,target))return json({error:'route'},409);await env.DB.prepare('UPDATE sea_boat SET x=?,z=?,heading=?,target_x=?,target_z=?,departed=? WHERE id=1 AND captain=?').bind(pose.x,pose.z,pose.heading,target.x,target.z,now,visitor).run()}}
 }
 return json({boat:await boatSnapshot(id,visitor,now)});
 }catch(e){console.warn('Boat operation failed',e instanceof Error?e.message:String(e));return json({error:'unavailable'},503)}}
