'use client';
import type {RefObject} from 'react';
import {projectSea,projectMap,fromWorld,toWorld,terrainVisible,type SeaCamera} from './sea-space';
import {canClaimWinterGift,winterGiftPosition} from '../lib/sea-winter';
import {WinterGiftArt} from './winter-art';
const trees=[{x:2.7,z:25.6},{x:17.3,z:60.8}];
function ChristmasTree(){return <svg viewBox="0 0 100 130" aria-hidden="true"><ellipse cx="50" cy="119" rx="38" ry="7" fill="#8daab022"/><path d="M46 98h9v22h-9z" fill="#997c68"/><path d="M50 14 28 51h11L19 80h15l-22 30q38 14 76 0L66 80h15L61 51h11z" fill="#648b80" stroke="#4e766e" strokeWidth="1.5"/><path d="M50 14 36 38q14 6 28 0M30 62q20 9 39 0M24 93q26 11 51 0" stroke="#e8f0eb" strokeWidth="6" fill="none" strokeLinecap="round"/><path d="M34 48q16 16 33 10M27 76q23 15 48 10M21 101q32 15 61 3" stroke="#dbc68c" strokeWidth="1.8" fill="none"/>{[[37,51],[54,57],[66,58],[29,79],[47,86],[66,87],[25,104],[44,110],[63,111],[78,105]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="6" fill="#fbe1a1" opacity=".14"/><circle cx={x} cy={y} r="2" fill="#ffe9b2"/></g>)}<circle cx="49" cy="68" r="4" fill="#bd7482"/><circle cx="61" cy="96" r="4" fill="#c78c9b"/><circle cx="37" cy="98" r="3.5" fill="#d6bd87"/><path d="m50 1 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#efd798"/><g transform="translate(6 109)"><rect width="17" height="14" rx="2" fill="#b86f80"/><path d="M8 0v14M0 4h17" stroke="#ecd5ab" strokeWidth="2"/></g><g transform="translate(72 111)"><rect width="17" height="12" rx="2" fill="#a49ab7"/><path d="M8 0v12M0 4h17" stroke="#eee1c4" strokeWidth="2"/></g></svg>}
export function WinterWorld({frozen,owned,disabled,point,view,camera,world,onNavigate,onClaim}:{frozen:boolean;owned:boolean;disabled:boolean;point:{x:number;y:number};view:'dream'|'shore';camera:RefObject<SeaCamera>;world:RefObject<HTMLDivElement|null>;onNavigate:(p:{x:number;y:number})=>void;onClaim:()=>void}){
 if(!frozen)return null;
 const aspect=world.current?world.current.clientWidth/world.current.clientHeight:1;
 const project=(x:number,z:number)=>{if(view==='dream')return projectSea(x,z,camera.current,aspect);const q=fromWorld(x,z,view);return projectMap(q.x,q.y,camera.current,aspect)};
 const p=toWorld(point.x,point.y,view),gift=project(winterGiftPosition.x,winterGiftPosition.z),near=canClaimWinterGift(frozen,owned,p.x,p.z);
 return <div className="winter-world">
  {trees.map((tree,i)=>{const q=project(tree.x,tree.z);if(!q||q.x<-.1||q.x>1.1||q.y<0||q.y>1.15||view==='dream'&&!terrainVisible(tree.x,tree.z,camera.current,2))return null;return <div key={i} className="winter-decoration" style={{left:`${q.x*100}%`,top:`${q.y*100}%`,width:view==='dream'?Math.max(26,200/(1+q.depth*.09)):65,zIndex:Math.round(q.y*1000)}}><ChristmasTree/></div>})}
  {!owned&&!disabled&&gift&&gift.x>.02&&gift.x<.98&&gift.y>.5&&gift.y<.96&&<button type="button" className="winter-gift" style={{left:`${gift.x*100}%`,top:`${gift.y*100}%`,width:view==='dream'?Math.max(34,74/(1+gift.depth*.06)):54}} aria-label={near?'겨울 선물상자 열기':'겨울 선물상자로 이동'} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(near)onClaim();else onNavigate(fromWorld(winterGiftPosition.x,winterGiftPosition.z,view))}}><WinterGiftArt/><span>{near?'선물 열기':'겨울 선물'}</span></button>}
 </div>;
}
