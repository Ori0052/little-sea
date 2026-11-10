'use client';
import {boatAction} from './journey-state';
import type {RefObject} from 'react';
import {projectSea,projectMap,fromWorld,toWorld,type SeaCamera} from './sea-space';
import {type BoatSnapshot,boatPosition} from './boat-space';
import type {SeaPeer} from './avatar-state';
import {terrainHeight} from './island-terrain';
import {RowingBoatArt,type BoatVertex} from './rowing-boat-art';
import type {AvatarLook} from './avatar-state';
import type {CrownId} from './deepsea-catalog';
import {LittlePerson} from './beach-player';
export function PartyBoat({boat,pose,view,camera,world,point,peers,selfId,selfLook,selfCrown,selfName,onApproach,onBoard,busy,approaching=false}:{boat:BoatSnapshot|null;pose:ReturnType<typeof boatPosition>|null;view:'dream'|'shore';camera:RefObject<SeaCamera>;world:RefObject<HTMLDivElement|null>;point:{x:number;y:number};peers:SeaPeer[];selfId:string;selfLook:AvatarLook;selfCrown:CrownId|null;selfName:string;onApproach:(p:{x:number;y:number})=>void;onBoard:()=>void;busy:boolean;approaching?:boolean}){
 if(!boat||!pose||camera.current.depth>.7)return null;const aspect=world.current?world.current.clientWidth/world.current.clientHeight:1,project=(x:number,z:number)=>{if(view==='dream')return projectSea(x,z,camera.current,aspect);const p=fromWorld(x,z,view);return projectMap(p.x,p.y,camera.current,aspect)},center=project(pose.x,pose.z);if(!center||center.x<-.3||center.x>1.3||center.y<.2||center.y>1.3)return null;const local=toWorld(point.x,point.y,view),near=Math.hypot(local.x-pose.x,local.z-pose.z)<3,aboard=boat.selfSeat!==null;
 const action=boatAction({aboard,near,moving:pose.moving,full:boat.passengers.length>=6,busy,approaching});
 const width=world.current?.clientWidth||1000,height=world.current?.clientHeight||1000;
 const projectVertex=(v:BoatVertex)=>{const x=pose.x+Math.cos(pose.heading)*v.r+Math.sin(pose.heading)*v.f,z=pose.z-Math.sin(pose.heading)*v.r+Math.cos(pose.heading)*v.f,q=project(x,z);if(!q)return null;const c=camera.current,dy=view==='dream'?(.5-c.pitch*.55)*1.5*(terrainHeight(x,z)-v.h)/(c.spread??1)/(q.depth+6*c.eye): -v.h*.035;return{x:q.x*width,y:(q.y+dy)*height,depth:view==='dream'?q.depth:q.y*100};};
 const riders=boat.passengers.flatMap(m=>{const self=m.id===selfId,peer=peers.find(p=>p.id===m.id);return[{seat:m.seat,r:m.seat%2===0?-.55:.55,f:1.1-Math.floor(m.seat/2)*1.1,self,name:self?selfName:peer?.name||'바다 친구',art:<LittlePerson crown={self?selfCrown:peer?.crown} sitting back={Math.cos(pose.heading-camera.current.yaw)>.25} look={self?selfLook:(peer?.look||{color:'#b7b0db',hat:true,tube:'#f2b8c8'})} showTube={false}/>}];});
 return <div className="party-boat-layer" aria-label="함께 타는 6인승 나무배" data-boat-x={pose.x.toFixed(3)} data-boat-z={pose.z.toFixed(3)} data-boat-moving={pose.moving} data-oar-count={Math.max(1,boat.passengers.length)}><svg className="party-boat-hull" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><RowingBoatArt project={projectVertex} moving={pose.moving} phase={(pose.time-boat.departed)/1000*2.7} seats={boat.passengers.map(p=>p.seat)} riders={riders}/></svg>
 {['approach','board'].includes(action)&&<button className="party-boat-board" style={{left:`${Math.max(.15,Math.min(.85,center.x))*100}%`,top:`${Math.max(.2,Math.min(.72,center.y))*100}%`}} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(action==='board')onBoard();else onApproach(fromWorld(pose.x,pose.z,view))}}>{action==='board'?`함께 타기 · ${boat.passengers.length}/6`:'배로 다가가기'}</button>}
 {['boarding','sailing','full'].includes(action)&&<span className="boat-state-label" role="status" style={{left:`${Math.max(.15,Math.min(.85,center.x))*100}%`,top:`${Math.max(.2,Math.min(.72,center.y))*100}%`}}>{action==='boarding'?'탑승 확인 중…':action==='sailing'?'항해 중':'만석 · 6/6'}</span>}
 </div>
}
