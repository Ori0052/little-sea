'use client';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {projectSea,fromWorld,toWorld,projectMap,terrainVisible,type SeaCamera} from './sea-space';
import {onIsland,fireCenter,fireSeatPositions,type SeaView} from './island-space';
import type {CampfireAction,FireEffects} from './campfire-state';
import {DetailedCampfire} from './detailed-campfire';
import {useCampfireAudio} from '../hooks/use-campfire-audio';
export function SeaIsland({view,camera,world,point,onNavigate,fireLit,fireBusy,fireError,onFire,sound,volume,onEnableSound,onRest,resting,occupiedSeats,ownSeat,seatBusy,seatError,onSelectSeat,effects,onEat}:{view:SeaView;camera:RefObject<SeaCamera>;world:RefObject<HTMLDivElement|null>;point:{x:number;y:number};onNavigate:(p:{x:number;y:number})=>void;fireLit:boolean;fireBusy:boolean;fireError:string;onFire:(action:boolean|CampfireAction)=>Promise<boolean>;sound:boolean;volume:number;onEnableSound:()=>void;onRest:()=>void;resting:boolean;occupiedSeats:number[];ownSeat:number|null;seatBusy:boolean;seatError:string;onSelectSeat:(id:number)=>void;effects:FireEffects;onEat:()=>void}){
 const [now,setNow]=useState(Date.now()),[wrapping,setWrapping]=useState(false),[notice,setNotice]=useState('');const wrapTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),250);return()=>{clearInterval(timer);if(wrapTimer.current)clearTimeout(wrapTimer.current)}},[]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer)},[notice]);
 const clock=now+effects.clockOffset,aurora=effects.auroraUntil>clock,boosted=effects.woodUntil>clock;
 const remaining=effects.potatoReadyAt===null?0:Math.max(0,Math.ceil((effects.potatoReadyAt-clock)/1000));
 const aspect=world.current?world.current.clientWidth/world.current.clientHeight:1;
 const project=(x:number,z:number)=>view==='dream'?projectSea(x,z,camera.current,aspect):projectMap(x,z,camera.current,aspect);
 const canonical=toWorld(point.x,point.y,view),distance=Math.hypot(canonical.x-fireCenter.x,canonical.z-fireCenter.z),sight=view==='shore'||terrainVisible(fireCenter.x,fireCenter.z,camera.current,1.4);
 const audio=useCampfireAudio({lit:fireLit,enabled:sound,distance:camera.current.depth>.7||!sight?100:distance,volume:Math.min(1,volume*(boosted?1.08:1))});
 const fireWorld=fromWorld(fireCenter.x,fireCenter.z,view),fire=project(fireWorld.x,fireWorld.y),fireVisible=sight&&fire&&fire.x>-.2&&fire.x<1.2&&fire.y>0&&fire.y<1.2;
 const fireScale=fire?view==='dream'?Math.max(.18,Math.min(1.25,1.7/(1+fire.depth*.13))):.52:1;
 const here=onIsland(point.x,point.y,view),closestSeat=fireSeatPositions.map((p,i)=>({i,d:Math.hypot(p.x-canonical.x,p.z-canonical.z)})).filter(p=>!occupiedSeats.includes(p.i)).sort((a,b)=>a.d-b.d)[0],nearbySeat=here&&closestSeat&&closestSeat.d<.95?closestSeat.i:null;
 const near=here&&distance<=4.5&&sight;
 async function act(action:CampfireAction){audio.unlock();onEnableSound();const ok=await onFire(action);if(ok){if(action==='wood')setNotice('장작이 타오르며 불이 조금 더 따뜻해졌어요.');if(action==='aurora')setNotice('초록·보라·푸른 오로라빛이 피어나요.');if(action==='roast')setNotice('호일에 싸서 넣었어요. 잠깐 기다려요 🍠');if(action==='collect'){onEat();setNotice('')}}return ok}
 function cook(){if(effects.potatoReadyAt!==null){if(!remaining)void act('collect');return}if(wrapping)return;setWrapping(true);audio.unlock();onEnableSound();wrapTimer.current=setTimeout(()=>{void act('roast').finally(()=>setWrapping(false))},1200)}
 async function watch(){if(resting){onRest();return}if(!await act('watch'))return;if(nearbySeat!==null)onSelectSeat(nearbySeat);else if(closestSeat){const seat=fireSeatPositions[closestSeat.i];onNavigate(fromWorld(seat.x,seat.z,view))}}
 const parcel=wrapping?'wrapping':effects.potatoReadyAt===null?'none':remaining?'cooking':'ready';
 return <div data-fire-sight={sight} data-fire-lit={fireLit} data-fire-distance={distance.toFixed(2)} data-aurora={aurora} data-potato-stage={parcel} className="sea-island" data-island-view={view} aria-label="작은 무인도와 캠프파이어">
 {fireVisible&&fire&&<div className={`island-campfire ${fireLit?'lit':''} ${aurora?'aurora-fire':''} ${boosted?'stoked-fire':''}`} style={{left:`${fire.x*100}%`,top:`${fire.y*100}%`,width:145*fireScale,height:166*fireScale,zIndex:1050}} role="img" aria-label={aurora?'오로라빛 캠프파이어':fireLit?'타오르는 캠프파이어':'캠프파이어 자리'}><i className="campfire-glow"/><DetailedCampfire lit={fireLit} aurora={aurora} boosted={boosted} parcel={parcel}/></div>}
 {here&&(near||resting)&&<div className="island-fire-actions fire-activity-menu ui" onPointerDown={e=>e.stopPropagation()}>
 <button disabled={fireBusy||seatBusy||(!resting&&occupiedSeats.length>=10&&ownSeat===null)} aria-label={resting?'불멍 자리에서 일어나기':nearbySeat!==null?'빈 불멍 자리에 앉기':'불멍 자리로 가기'} onClick={e=>{e.stopPropagation();void watch()}}>{resting?'↑ 일어나기':nearbySeat!==null?'앉기':'불멍하기'}</button>
 <button disabled={fireBusy||!near} onClick={e=>{e.stopPropagation();void act('wood')}}>🪵 장작 넣기</button>
 <button disabled={fireBusy||!near} aria-label="오로라 가루 넣기" onClick={e=>{e.stopPropagation();void act('aurora')}}>✧ 오로라 가루</button>
 <button disabled={fireBusy||wrapping||remaining>0||!near} aria-label={effects.potatoReadyAt!==null&&!remaining?'고구마 꺼내 먹기':'고구마 굽기'} onClick={e=>{e.stopPropagation();cook()}}>{wrapping?'호일에 싸는 중…':effects.potatoReadyAt===null?'🍠 고구마 굽기':remaining?`굽는 중 ${remaining}초`:'🍠 꺼내 먹기'}</button>
 </div>}
 {(notice||fireError||seatError)&&<div className="fire-interaction-notice ui" role="status">{fireError||seatError||notice}</div>}
 {near&&audio.error&&<button className="fire-audio-retry ui" onClick={()=>{onEnableSound();audio.unlock()}}>모닥불 소리 듣기</button>}
 </div>
}
