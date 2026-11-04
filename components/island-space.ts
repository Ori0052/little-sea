import {newIslands,onNewIsland,extraIslandField} from './archipelago';
import {toWorld,fromWorld} from './sea-space';
export type SeaView='dream'|'shore';
import {islandCenter,islandRadius,fireCenter,rockBoundary,fireSeatPositions,campingCenter,campingRadius,campingField,tinyCenter,tinyRadius,tinyField} from './island-terrain';
export {islandCenter,islandRadius,fireCenter,fireSeatPositions} from './island-terrain';
const mapCenter=fromWorld(islandCenter.x,islandCenter.z,'shore');
export const islands={dream:{x:islandCenter.x,z:islandCenter.z,rx:islandRadius.x,rz:islandRadius.z},shore:{x:mapCenter.x,z:mapCenter.y,rx:islandRadius.z/12,rz:islandRadius.x/12}} as const;
export function islandLanding(view:SeaView){return fromWorld(islandCenter.x,islandCenter.z-islandRadius.z*.85,view)}
export function islandField(x:number,z:number,view:SeaView){const p=toWorld(x,z,view),i=islands.dream,a=(p.x-i.x)/i.rx,b=(p.z-i.z)/i.rz,angle=Math.atan2(b,a);return Math.hypot(a,b)-(1+.055*Math.sin(angle*3)+.035*Math.cos(angle*5))}
export function onIsland(x:number,z:number,view:SeaView){return islandField(x,z,view)<-.015}
// Keep rendered beaches and walkable ground on the same boundary.
export const islandGLSL=`float islandField(vec2 p,vec2 center,vec2 radius){vec2 q=(p-center)/radius;float a=atan(q.y,q.x);return length(q)-(1.+.055*sin(a*3.)+.035*cos(a*5.));}`;

export function onCampingIsland(x:number,z:number,view:SeaView){const p=toWorld(x,z,view);return campingField(p.x,p.z)<-.015}
export function campingLanding(view:SeaView){return fromWorld(campingCenter.x,campingCenter.z-campingRadius.z*.8,view)}
export {campingCenter,campingRadius,tinyCenter,tinyRadius};
export function onTinyIsland(x:number,z:number,view:SeaView){const p=toWorld(x,z,view);return tinyField(p.x,p.z)<-.015}
export function tinyLanding(view:SeaView){return fromWorld(tinyCenter.x,tinyCenter.z-tinyRadius.z*.65,view)}
export function onExtraIsland(x:number,z:number,view:SeaView){const p=toWorld(x,z,view);return Boolean(onNewIsland(p.x,p.z))}
export function extraLanding(x:number,z:number,view:SeaView){const p=toWorld(x,z,view),i=onNewIsland(p.x,p.z);return i?fromWorld(i.x,i.z-i.rz*.83,view):islandLanding(view)}
export function seaLand(x:number,z:number,view:SeaView){const p=toWorld(x,z,view);return onIsland(x,z,view)||onCampingIsland(x,z,view)||onTinyIsland(x,z,view)||onExtraIsland(x,z,view)||p.z<=.09*Math.sin(p.x*.7)+.06*Math.sin(p.x*1.8)}
export const islandRestPositions=fireSeatPositions;

export function canFishAt(x:number,z:number,view:SeaView){const p=toWorld(x,z,view),field=Math.min(islandField(x,z,view),campingField(p.x,p.z),tinyField(p.x,p.z),...newIslands.map(i=>extraIslandField(p.x,p.z,i)));return field<-.015&&field>-.38}
