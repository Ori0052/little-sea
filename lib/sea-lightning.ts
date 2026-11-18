/** Original procedural artwork: twelve fixed branching silhouettes, placed anew per strike. */
export type LightningShape={id:number;core:string;branches:string;twigs:string};
function seeded(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
type Point={x:number;y:number};
function trace(points:Point[]){return points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
function makeShape(id:number):LightningShape{const r=seeded(8131+id*7919),points:Point[]=[{x:500,y:-30}];const drift=(id%3-1)*2.8;for(let i=1;i<=38;i++){const p=points[i-1];points.push({x:p.x+(r()-.5)*38+drift,y:p.y+11+r()*8})}let branches='',twigs='';for(let b=0;b<7+id%4;b++){const start=points[3+Math.floor(r()*28)],direction=(b+id)%2?1:-1,arm=[start],slope=-.35+r()*1.4;for(let j=0;j<9+b%4;j++){const p=arm[arm.length-1];arm.push({x:p.x+direction*(9+r()*17)+(r()-.5)*13,y:p.y+slope*(8+r()*16)+(r()-.5)*15})}branches+=trace(arm)+' ';const fork=arm[3],twig=[fork];for(let j=0;j<6;j++){const p=twig[twig.length-1];twig.push({x:p.x+direction*(5+r()*15),y:p.y+(r()-.25)*25})}twigs+=trace(twig)+' '}return{id,core:trace(points),branches,twigs}}
export const lightningShapes:readonly LightningShape[]=Array.from({length:12},(_,i)=>makeShape(i));
export type LightningStrike={serial:number;shape:number;x:number;y:number;scale:number;angle:number;flip:number};
export function nextLightning(previous:number,serial:number,random:()=>number=Math.random):LightningStrike{const unit=()=>Math.max(0,Math.min(.999999,random()));const index=Math.floor(unit()*(previous<0?12:11));return{serial,shape:previous<0?index:index>=previous?index+1:index,x:24+unit()*52,y:-8+unit()*12,scale:.65+unit()*.55,angle:-23+unit()*46,flip:unit()<.5?-1:1}}
