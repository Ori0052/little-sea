import {guardSeaRequest} from '../../../lib/sea-request-guard';
import {seatLimitSQL,seatLimitArgs,visitorFreeSQL,visitorFreeArgs,authorizeSea} from '../../../lib/sea-session';
import {isSeaOriginAllowed} from '../../../lib/sea-origin';
import {env} from 'cloudflare:workers';
import {json,ttl,uuid} from '../../../lib/sea-api';
export const dynamic='force-dynamic';
export async function POST(request:Request){if(!isSeaOriginAllowed(request))return json({error:'origin'},403);const gate=await guardSeaRequest(request);if(gate)return gate;if(Number(request.headers.get('content-length')||0)>512)return json({error:'size'},413);
 try{const text=await request.text();if(text.length>512)return json({error:'size'},413);let body;try{body=JSON.parse(text)}catch{return json({error:'body'},400)}const {id,visitor,seat,action}=body??{};if(!uuid(id)||!uuid(visitor))return json({error:'id'},400);if(!env.DB)return json({error:'unavailable'},503);const auth=await authorizeSea(body,'action');if(auth)return auth;if(await env.DB.prepare('SELECT seat FROM boat_passengers WHERE visitor=? AND session=? AND seen>?').bind(visitor,id,Date.now()-15000).first())return json({error:'aboard'},409);
 if(action==='release'){await env.DB.prepare('DELETE FROM beach_seats WHERE session = ? AND visitor = ?').bind(id,visitor).run();return json({seat:null})}
 if(action!=='claim'||!Number.isInteger(seat)||seat<0||seat>=80)return json({error:'seat'},400);
 const now=Date.now();const present=await env.DB.prepare('SELECT id FROM presence WHERE id=? AND visitor_id=? AND seen>?').bind(id,visitor,now-ttl).first();if(!present)return json({error:'presence'},403);await env.DB.batch([env.DB.prepare('DELETE FROM beach_seats WHERE seat >= 80 OR seen <= ?').bind(now-ttl),env.DB.prepare(`INSERT OR IGNORE INTO beach_seats (seat,visitor,session,seen) SELECT ?,?,?,? WHERE ${seatLimitSQL} AND ${visitorFreeSQL}`).bind(seat,visitor,id,now,...seatLimitArgs(id,visitor,now),...visitorFreeArgs(visitor,now))]);
 const own=await env.DB.prepare('SELECT seat FROM beach_seats WHERE session = ? AND visitor = ?').bind(id,visitor).first<{seat:number}>();if(own?.seat!==seat)return json({error:'occupied'},409);return json({seat});
 }catch{return json({error:'unavailable'},503)}}
