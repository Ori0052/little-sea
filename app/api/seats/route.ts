import {env} from 'cloudflare:workers';
import {json,ttl,uuid} from '../../../lib/sea-api';
export const dynamic='force-dynamic';
export async function POST(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'origin'},403);if(Number(request.headers.get('content-length')||0)>512)return json({error:'size'},413);
 try{const text=await request.text();if(text.length>512)return json({error:'size'},413);let body;try{body=JSON.parse(text)}catch{return json({error:'body'},400)}const {id,visitor,seat,action}=body??{};if(!uuid(id)||!uuid(visitor))return json({error:'id'},400);if(!env.DB)return json({error:'unavailable'},503);
 if(action==='release'){await env.DB.prepare('DELETE FROM beach_seats WHERE session = ? AND visitor = ?').bind(id,visitor).run();return json({seat:null})}
 if(action!=='claim'||!Number.isInteger(seat)||seat<0||seat>=100)return json({error:'seat'},400);
 const now=Date.now();await env.DB.batch([env.DB.prepare('DELETE FROM beach_seats WHERE seen <= ?').bind(now-ttl),env.DB.prepare('INSERT OR IGNORE INTO beach_seats (seat,visitor,session,seen) VALUES (?,?,?,?)').bind(seat,visitor,id,now)]);
 const own=await env.DB.prepare('SELECT seat FROM beach_seats WHERE session = ? AND visitor = ?').bind(id,visitor).first<{seat:number}>();if(own?.seat!==seat)return json({error:'occupied'},409);return json({seat});
 }catch{return json({error:'unavailable'},503)}}
