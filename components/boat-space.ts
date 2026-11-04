import {seaLand} from './island-space';
export const boatCapacity=6,boatSpeed=5.4;
export type BoatRoute={x:number;z:number;heading:number;targetX:number|null;targetZ:number|null;departed:number};
export type BoatSnapshot=BoatRoute&{serverNow:number;passengers:{id:string;seat:number}[];captain:string|null;selfSeat:number|null;selfCaptain:boolean};
export function boatPosition(b:BoatRoute,now:number){const dx=(b.targetX??b.x)-b.x,dz=(b.targetZ??b.z)-b.z,d=Math.hypot(dx,dz),t=d?Math.min(1,Math.max(0,now-b.departed)/1000*boatSpeed/d):1;return{time:now,x:b.x+dx*t,z:b.z+dz*t,heading:d?Math.atan2(dx,dz):b.heading,moving:t<1}}
export function boatSeatPosition(b:ReturnType<typeof boatPosition>,seat:number){const right=seat%2===0?-.55:.55,forward=1.1-Math.floor(seat/2)*1.1;return{x:b.x+Math.cos(b.heading)*right+Math.sin(b.heading)*forward,z:b.z-Math.sin(b.heading)*right+Math.cos(b.heading)*forward}}
export function validBoatDestination(x:number,z:number){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=85&&z>=3&&z<=270&&!seaLand(x,z,'dream')}
export function clearBoatRoute(a:{x:number;z:number},b:{x:number;z:number}){if(!validBoatDestination(b.x,b.z))return false;const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.25));for(let n=1;n<=count;n++){const t=n/count;if(seaLand(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,'dream'))return false}return true}
