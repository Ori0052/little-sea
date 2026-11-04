import {fishRoastMs,potatoRoastMs} from './campfire-state';
export type FoodKind='fish'|'potato';
export const foodBurnDelay={fish:30000,potato:40000};
export function foodProgress(kind:FoodKind,readyAt:number,now:number){const duration=kind==='fish'?fishRoastMs:potatoRoastMs,progress=Math.max(0,Math.min(1,(now-readyAt+duration)/duration)),char=Math.max(0,Math.min(1,(now-readyAt)/foodBurnDelay[kind]));return{progress,char,burnt:now>=readyAt+foodBurnDelay[kind],ready:now>=readyAt}}
function mix(a:number[],b:number[],t:number){return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('')}
export function foodColor(kind:FoodKind,readyAt:number,now:number){const p=foodProgress(kind,readyAt,now),raw=kind==='fish'?[112,169,187]:[164,108,155],cooked=kind==='fish'?[218,182,129]:[190,136,91],warm=mix(raw,cooked,p.progress);if(!p.ready)return warm;const brown=kind==='fish'?[218,182,129]:[190,136,91];return mix(brown,[48,42,43],Math.pow(p.char,1.7))}
export function cookingStatus(kind:FoodKind,readyAt:number,now:number){const p=foodProgress(kind,readyAt,now),burnAt=readyAt+foodBurnDelay[kind],warning=p.ready&&!p.burnt&&burnAt-now<=10000;return{...p,stage:p.burnt?'burnt':warning?'warning':p.ready?'ready':'cooking',label:p.burnt?'탔어요':warning?'타기 직전':p.ready?'먹기 좋아요':'굽는 중',seconds:Math.max(0,Math.ceil(((p.ready?burnAt:readyAt)-now)/1000))}}
