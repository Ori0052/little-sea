export const islandCenter={x:0,z:28};
export const islandRadius={x:6.5,z:5.2};
export const fireCenter={x:0,z:25.1};
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const campingCenter={x:18,z:62};
export const campingRadius={x:7,z:5.5};
export function campingField(x:number,z:number){const a=(x-campingCenter.x)/campingRadius.x,b=(z-campingCenter.z)/campingRadius.z,angle=Math.atan2(b,a);return Math.hypot(a,b)-(1+.055*Math.sin(angle*3)+.035*Math.cos(angle*5))}
export function terrainHeight(x:number,z:number){const cr=Math.hypot((x-campingCenter.x)/campingRadius.x,(z-campingCenter.z)/campingRadius.z);if(cr<1.04)return (.28+.75*Math.exp(-((x-campingCenter.x+1)**2/14+(z-campingCenter.z-1.7)**2/5)))*(1-smooth(.65,1.04,cr));return rockyHeight(x,z)}
function rockyHeight(x:number,z:number){const dx=x-islandCenter.x,dz=z-islandCenter.z,r=Math.hypot(dx/islandRadius.x,dz/islandRadius.z);if(r>1.04)return 0;const base=.22*(1-smooth(.5,1,r));const mx=dx/2.55,mz=(dz-1.65)/1.65,m=Math.hypot(mx,mz),angle=Math.atan2(mz,mx);const ridge=Math.pow(Math.max(0,1-Math.max(0,m-.18)/.9),.84)*(5.8+(.4*Math.sin(angle*3)+.25*Math.cos(dx*2.1))*smooth(.18,.65,m));const terrace=Math.floor(ridge/.32)*.32;return (base+ridge*.72+terrace*.28)*(1-smooth(.9,1.03,r))}
// The mountain is continuous walkable ground; height and rendering share this function.
export function rockBoundary(x:number,z:number){return {x,z}}
export function rockOcclusionHeight(x:number,z:number){return terrainHeight(x,z)}
export const fireSeatPositions=Array.from({length:10},(_,i)=>{const a=-1.3+i*2.6/9;return {x:fireCenter.x+Math.sin(a)*3.6,z:fireCenter.z+.6+Math.cos(a)*1.2}});
