/** Winter travel is a local seasonal rule; no polling or database writes. */
export type WinterRide='ski'|'sled'|'rudolph';
export const winterGiftPosition={x:-2.8,z:7.2};
export const winterSpeed={ski:3,sled:3.8,rudolph:5.3} as const;
export function winterRide(frozen:boolean,onLand:boolean,aboard:boolean,raft:boolean,rudolph:boolean):WinterRide|undefined{
 if(!frozen||onLand||aboard)return undefined;
 return rudolph?'rudolph':raft?'sled':'ski';
}
export function travelSpeed(frozen:boolean,onLand:boolean,raft:boolean,rudolph:boolean){
 const ride=winterRide(frozen,onLand,false,raft,rudolph);
 return ride?winterSpeed[ride]:raft&&!onLand?3.8:2.4;
}
export function winterOwnership(value:unknown){
 const d=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const rudolphOwned=d.rudolphOwned===true;
 return {rudolphOwned,rudolphEquipped:rudolphOwned&&d.rudolphEquipped===true};
}
export function canClaimWinterGift(frozen:boolean,owned:boolean,x:number,z:number){
 return frozen&&!owned&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-winterGiftPosition.x,z-winterGiftPosition.z)<1.2;
}
