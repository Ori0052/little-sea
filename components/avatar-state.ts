import {cleanSeaName} from './sea-names';
export type AvatarLook={color:string;hat:boolean;tube:string};
export type AvatarState={x:number;z:number;heading:number;view:'dream'|'shore';look:AvatarLook;tube:boolean;moving:boolean;depth?:number;rest?:boolean;eating?:boolean;seat?:number|null;name?:string};
export type SeaPeer=AvatarState&{id:string;seen:number};
export const outfitColors=['#b7b0db','#e8b5b2','#93b9b2','#f0d394','#83a8cd'];
export const tubeColors=['#f2b8c8','#a9ced4','#f0d394'];
export function validAvatar(v:unknown):v is AvatarState{if(!v||typeof v!=='object')return false;const a=v as AvatarState;return Number.isFinite(a.x)&&Math.abs(a.x)<=1e7&&Number.isFinite(a.z)&&Math.abs(a.z)<=1e7&&Number.isFinite(a.heading)&&Math.abs(a.heading)<=Math.PI+0.001&&(a.view==='dream'||a.view==='shore')&&typeof a.tube==='boolean'&&typeof a.moving==='boolean'&&(a.eating===undefined||typeof a.eating==='boolean')&&(a.rest===undefined||typeof a.rest==='boolean')&&(a.depth===undefined||(Number.isFinite(a.depth)&&a.depth>=0&&a.depth<=10))&&(a.seat===undefined||a.seat===null||(Number.isInteger(a.seat)&&a.seat>=0&&a.seat<100))&&(a.name===undefined||(typeof a.name==='string'&&a.name.length>0&&cleanSeaName(a.name)===a.name))&&!!a.look&&outfitColors.includes(a.look.color)&&typeof a.look.hat==='boolean'&&tubeColors.includes(a.look.tube)}
