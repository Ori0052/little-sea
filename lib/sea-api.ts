import {env} from 'cloudflare:workers';
import {validAvatar} from '../components/avatar-state';
import {fireSeatPositions} from '../components/island-terrain';
import {fromWorld} from '../components/sea-space';
import {campPosition} from '../components/camp-space';
export const ttl=90000;
export const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function publicId(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,24)}
export async function presenceSnapshot(self='',visitor=''){
 if(!env.DB)return json({error:'unavailable'},503);const now=Date.now();
 const count=await env.DB.prepare('SELECT COUNT(DISTINCT COALESCE(visitor_id,id)) AS count FROM presence WHERE seen > ?').bind(now-ttl).first<{count:number}>();
 const rows=await env.DB.prepare('SELECT id,visitor_id,state,seen FROM presence WHERE seen > ? AND state IS NOT NULL AND COALESCE(visitor_id,id) != ? ORDER BY seen DESC LIMIT 360').bind(now-15000,visitor||self).all<{id:string;visitor_id:string|null;state:string;seen:number}>();
 const occupied=await env.DB.prepare('SELECT seat,session FROM beach_seats WHERE seen > ?').bind(now-ttl).all<{seat:number;session:string}>();
 const fireSeats=await env.DB.prepare('SELECT seat,session FROM island_fire_seats WHERE seen > ?').bind(now-ttl).all<{seat:number;session:string}>();const fireOwners=new Map(fireSeats.results.map(r=>[r.session,r.seat]));
 const owners=new Map(occupied.results.map(r=>[r.session,r.seat]));rows.results.sort((a,b)=>Number(owners.has(b.id))-Number(owners.has(a.id))||b.seen-a.seen);
 const unique=new Set<string>();const candidates=rows.results.filter(r=>{const key=r.visitor_id||r.id;if(unique.has(key))return false;unique.add(key);return true}).slice(0,100);
 const peers=(await Promise.all(candidates.map(async r=>{try{const state=JSON.parse(r.state);if(!validAvatar(state))return null;const id=await publicId(r.visitor_id||r.id);const seat=owners.get(r.id)??null;const position=seat!==null?campPosition(seat):null;const fireSeat=fireOwners.get(r.id)??null;const firePosition=fireSeat!==null&&state.rest?fromWorld(fireSeatPositions[fireSeat].x,fireSeatPositions[fireSeat].z,state.view):null;return {id,...state,rest:fireSeat!==null&&!!state.rest,...(firePosition?{x:firePosition.x,z:firePosition.y,depth:0}:{}),...(position?{x:position.x,z:position.z,view:'dream',depth:0}:{}),seat,seen:r.seen}}catch{return null}}))).filter(Boolean);
 const campfire=await env.DB.prepare('SELECT lit,updated,wood_until,aurora_until FROM island_campfire WHERE id = 1').first<{lit:number;updated:number;wood_until:number;aurora_until:number}>();
 const potato=visitor?await env.DB.prepare('SELECT ready_at FROM island_potatoes WHERE visitor = ?').bind(visitor).first<{ready_at:number}>():null;
 return json({serverNow:now,potatoReadyAt:potato?.ready_at??null,fireSeats:fireSeats.results.map(r=>r.seat),selfFireSeat:fireSeats.results.find(r=>r.session===self)?.seat??null,campfire:{lit:!!campfire?.lit,updated:campfire?.updated??0,woodUntil:campfire?.wood_until??0,auroraUntil:campfire?.aurora_until??0},count:count?.count??0,windowSeconds:90,selfId:visitor?await publicId(visitor):null,peers,seats:occupied.results.map(r=>r.seat),selfSeat:occupied.results.find(r=>r.session===self)?.seat??null});
}
