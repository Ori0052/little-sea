'use client';
import type {RefObject} from 'react';
import {projectSea,projectMap,fromWorld,toWorld,terrainVisible,type SeaCamera} from './sea-space';
import {canClaimWinterGift,winterGiftPosition} from '../lib/sea-winter';
import {ChristmasTreeArt} from './christmas-tree-art';
import {christmasTreeSites} from './christmas-tree-mesh';
import {WinterGiftArt} from './winter-art';
export function WinterWorld({frozen,owned,disabled,point,view,camera,world,onNavigate,onClaim}:{frozen:boolean;owned:boolean;disabled:boolean;point:{x:number;y:number};view:'dream'|'shore';camera:RefObject<SeaCamera>;world:RefObject<HTMLDivElement|null>;onNavigate:(p:{x:number;y:number})=>void;onClaim:()=>void}){
 if(!frozen)return null;
 const aspect=world.current?world.current.clientWidth/world.current.clientHeight:1;
 const project=(x:number,z:number)=>{if(view==='dream')return projectSea(x,z,camera.current,aspect);const q=fromWorld(x,z,view);return projectMap(q.x,q.y,camera.current,aspect)};
 const p=toWorld(point.x,point.y,view),gift=project(winterGiftPosition.x,winterGiftPosition.z),near=canClaimWinterGift(frozen,owned,p.x,p.z);
 return <div className="winter-world">
  {christmasTreeSites.map((tree,i)=>{const q=project(tree.x,tree.z);if(!q||q.x<-.1||q.x>1.1||q.y<0||q.y>1.15||view==='dream'&&!terrainVisible(tree.x,tree.z,camera.current,2))return null;return <div key={i} className="winter-decoration" style={{left:`${q.x*100}%`,top:`${q.y*100}%`,width:view==='dream'?Math.max(26,200/(1+q.depth*.09)):65,zIndex:Math.round(q.y*1000)}}><ChristmasTreeArt/></div>})}
  {!owned&&!disabled&&gift&&gift.x>.02&&gift.x<.98&&gift.y>.5&&gift.y<.96&&<button type="button" className="winter-gift" style={{left:`${gift.x*100}%`,top:`${gift.y*100}%`,width:view==='dream'?Math.max(34,74/(1+gift.depth*.06)):54}} aria-label={near?'겨울 선물상자 열기':'겨울 선물상자로 이동'} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(near)onClaim();else onNavigate(fromWorld(winterGiftPosition.x,winterGiftPosition.z,view))}}><WinterGiftArt/><span>{near?'선물 열기':'겨울 선물'}</span></button>}
 </div>;
}
