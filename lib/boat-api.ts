import {env} from 'cloudflare:workers';
import {boatPosition,boatSeatPosition,type BoatRoute,type BoatSnapshot} from '../components/boat-space';
export type BoatRow={id:number;x:number;z:number;heading:number;target_x:number|null;target_z:number|null;departed:number;captain:string|null};
export const boatTimeout=15000;
export function asRoute(b:BoatRow):BoatRoute{return{x:b.x,z:b.z,heading:b.heading,targetX:b.target_x,targetZ:b.target_z,departed:b.departed}}
export async function boatPublicId(value:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,24)}
export async function boatSnapshot(self='',visitor='',now=Date.now()):Promise<BoatSnapshot>{
 if(!env.DB)throw Error('Database unavailable');
 await env.DB.prepare('DELETE FROM boat_passengers WHERE seen <= ?').bind(now-boatTimeout).run();
 let row=await env.DB.prepare('SELECT * FROM sea_boat WHERE id=1').first<BoatRow>();if(!row){await env.DB.prepare('INSERT OR IGNORE INTO sea_boat(id) VALUES(1)').run();row=await env.DB.prepare('SELECT * FROM sea_boat WHERE id=1').first<BoatRow>()}if(!row)throw Error('Boat unavailable');
 const members=await env.DB.prepare('SELECT seat,visitor,session FROM boat_passengers ORDER BY seat').all<{seat:number;visitor:string;session:string}>();
 if(!members.results.some(m=>m.visitor===row!.captain)){const pose=boatPosition(asRoute(row),now),captain=members.results[0]?.visitor??null;await env.DB.prepare('UPDATE sea_boat SET x=?,z=?,heading=?,target_x=NULL,target_z=NULL,departed=?,captain=? WHERE id=1 AND captain IS ?').bind(pose.x,pose.z,pose.heading,now,captain,row.captain).run();row=(await env.DB.prepare('SELECT * FROM sea_boat WHERE id=1').first<BoatRow>())!}
 const owned=members.results.find(m=>m.visitor===visitor&&m.session===self);
 return{...asRoute(row),serverNow:now,passengers:await Promise.all(members.results.map(async m=>({id:await boatPublicId(m.visitor),seat:m.seat}))),captain:row.captain?await boatPublicId(row.captain):null,selfSeat:owned?.seat??null,selfCaptain:!!owned&&row.captain===visitor};
}
export function boatMemberPosition(snapshot:BoatSnapshot,publicId:string){const seat=snapshot.passengers.find(m=>m.id===publicId)?.seat;if(seat===undefined)return null;const pose=boatPosition(snapshot,snapshot.serverNow);return{...boatSeatPosition(pose,seat),heading:pose.heading,seat,moving:pose.moving}}
