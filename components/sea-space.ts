import {foliageOcclusionHeight} from './island-tropical-mesh';
import {terrainHeight,rockOcclusionHeight} from './island-terrain';
export type SeaCamera={x:number;z:number;yaw:number;pitch:number;depth:number;eye:number;ground?:number;spread?:number};
export function projectSea(x:number,z:number,camera:SeaCamera,aspect:number){const dx=x-camera.x,dz=z-camera.z,c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),right=dx*c-dz*s,depth=dx*s+dz*c;if(depth<-.3)return null;const h=.5-camera.pitch*.55;return {x:.5+right/(aspect*(depth*.6+4*camera.eye)*(camera.spread??1)),y:1-h+h*((6*camera.eye+1.5*((camera.ground??0)-terrainHeight(x,z))/(camera.spread??1))/(depth+6*camera.eye)-.12),depth}}
export function unprojectSea(x:number,y:number,camera:SeaCamera,aspect:number){const h=.5-camera.pitch*.55,sy=Math.max(.1,Math.min(.985,y));const flat=(1/((Math.max(1-h+.025,sy)-(1-h))/h+.12)-1)*6*camera.eye;
 const point=(d:number)=>{const r=(x-.5)*aspect*(d*.6+4*camera.eye)*(camera.spread??1),c=Math.cos(camera.yaw),s=Math.sin(camera.yaw);return {x:camera.x+r*c+d*s,z:camera.z-r*s+d*c}};
 let before=0,previous=projectSea(point(0).x,point(0).z,camera,aspect)!.y-sy;const max=Math.max(150,flat*1.7);for(let n=1;n<=90;n++){const d=(n/90)**2*max,p=point(d),f=projectSea(p.x,p.z,camera,aspect)!.y-sy;if(previous>=0&&f<=0){let lo=before,hi=d;for(let j=0;j<12;j++){const mid=(lo+hi)/2,q=point(mid);if(projectSea(q.x,q.z,camera,aspect)!.y>sy)lo=mid;else hi=mid}return point((lo+hi)/2)}before=d;previous=f}return point(flat)}
export function wrapAngle(angle:number){return Math.atan2(Math.sin(angle),Math.cos(angle))}

export function shoreCoast(y:number){return .22+.04*Math.sin((y-.5)*.8)+.023*Math.sin(y*10)+.012*Math.sin(y*24+.6)}
// The overhead shore is a map of the same canonical world, at 12 world units per screen unit.
export function toWorld(x:number,z:number,view:'dream'|'shore'){return view==='dream'?{x,z}:{x:(z-.55)*12,z:(x-shoreCoast(z))*12}}
export function fromWorld(x:number,z:number,view:'dream'|'shore'){if(view==='dream')return {x,y:z};const y=.55+x/12;return {x:shoreCoast(y)+z/12,y}}
export function convertPoint(x:number,z:number,from:'dream'|'shore',to:'dream'|'shore'){const p=toWorld(x,z,from);return fromWorld(p.x,p.z,to)}
export function projectMap(x:number,y:number,camera:SeaCamera,aspect:number){return {x:x-camera.x,y:.5+(y-camera.z-.5)*aspect,depth:2}}
export function unprojectMap(x:number,y:number,camera:SeaCamera,aspect:number){return {x:x+camera.x,y:(y-.5)/aspect+.5+camera.z}}
export function terrainVisible(x:number,z:number,camera:SeaCamera,above=0,foliage=false){const end=terrainHeight(x,z)+above,start=(camera.ground??0)+4*camera.eye;for(let i=1;i<14;i++){const t=i/14;if(Math.max(terrainHeight(camera.x+(x-camera.x)*t,camera.z+(z-camera.z)*t),rockOcclusionHeight(camera.x+(x-camera.x)*t,camera.z+(z-camera.z)*t),foliage?foliageOcclusionHeight(camera.x+(x-camera.x)*t,camera.z+(z-camera.z)*t):0)>start+(end-start)*t+.18)return false}return true}
