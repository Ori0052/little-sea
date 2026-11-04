import {extraIslandHeight} from './archipelago';
export const islandCenter={x:0,z:28};
export const islandRadius={x:6.5,z:5.2};
export const fireCenter={x:0,z:25.1};
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const tinyCenter={x:-18,z:130};
export const tinyRadius={x:2.1,z:1.65};
export function tinyField(x:number,z:number){const a=(x-tinyCenter.x)/tinyRadius.x,b=(z-tinyCenter.z)/tinyRadius.z,angle=Math.atan2(b,a);return Math.hypot(a,b)-(1+.055*Math.sin(angle*3)+.035*Math.cos(angle*5))}
export const campingCenter={x:18,z:62};
export const campingRadius={x:7,z:5.5};
export function campingField(x:number,z:number){const a=(x-campingCenter.x)/campingRadius.x,b=(z-campingCenter.z)/campingRadius.z,angle=Math.atan2(b,a);return Math.hypot(a,b)-(1+.055*Math.sin(angle*3)+.035*Math.cos(angle*5))}
export function terrainHeight(x:number,z:number){const extra=extraIslandHeight(x,z);if(extra!==null)return extra;const tr=Math.hypot((x-tinyCenter.x)/tinyRadius.x,(z-tinyCenter.z)/tinyRadius.z);if(tr<1.04)return (.18+.35*Math.exp(-tr*tr*5))*(1-smooth(.55,1.04,tr));const cr=Math.hypot((x-campingCenter.x)/campingRadius.x,(z-campingCenter.z)/campingRadius.z);if(cr<1.04)return (.28+.75*Math.exp(-((x-campingCenter.x+1)**2/14+(z-campingCenter.z-1.7)**2/5)))*(1-smooth(.65,1.04,cr));return rockyHeight(x,z)}
// Overlapping angular ridges keep the original basalt silhouette, while remaining walkable.
export const rockPeaks=[[-1.0,2.8,2.1,.85,.9],[.2,3.2,2.8,.85,.9],[1.2,2.8,1.9,.65,.8]];
export const islandSummit={x:.2,z:31.2};
const trail=[[2.2,27.5],[2.1,28.6],[1.5,29.6],[.9,30.6],[.2,31.2]];
export function islandTrailDistance(x:number,z:number){let d=1e6;for(let i=1;i<trail.length;i++){const [ax,az]=trail[i-1],[bx,bz]=trail[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(x-ax-dx*t,z-az-dz*t))}return d}

function rockyHeight(x:number,z:number){const dx=x-islandCenter.x,dz=z-islandCenter.z,r=Math.hypot(dx/islandRadius.x,dz/islandRadius.z);if(r>1.04)return 0;const base=.22*(1-smooth(.5,1,r));let ridge=0;for(const [px,pz,peak,rx,rz]of rockPeaks){const a=Math.abs((dx-px)/rx),b=Math.abs((dz-pz)/rz),distance=Math.max(a*.82+b*.18,b*.85+a*.15);const roof=1-.5*a-.12*b+.05*(dx-px)/rx;const profile=Math.max(0,Math.min(roof,(1.25-distance)*3.2));ridge=Math.max(ridge,peak*profile)}return (base+ridge)*(1-smooth(.9,1.03,r))}
// The mountain is continuous walkable ground; height and rendering share this function.
export function rockBoundary(x:number,z:number){return {x,z}}
export function rockOcclusionHeight(x:number,z:number){return terrainHeight(x,z)}
export const fireSeatPositions=Array.from({length:10},(_,i)=>{const a=-1.3+i*2.6/9;return {x:fireCenter.x+Math.sin(a)*3.6,z:fireCenter.z+.6+Math.cos(a)*1.2}});
