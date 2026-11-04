import {newIslands} from './archipelago';
import {islandCenter,islandRadius,campingCenter,campingRadius,tinyCenter,tinyRadius,seaLand} from './island-space';
// Cast away from the nearest island, past the actual shared shoreline boundary.
export function fishingSpot(x:number,z:number){const islands=[{...islandCenter,rx:islandRadius.x,rz:islandRadius.z},{...campingCenter,rx:campingRadius.x,rz:campingRadius.z},{...tinyCenter,rx:tinyRadius.x,rz:tinyRadius.z},...newIslands],island=islands.sort((a,b)=>Math.hypot((x-a.x)/a.rx,(z-a.z)/a.rz)-Math.hypot((x-b.x)/b.rx,(z-b.z)/b.rz))[0];let dx=(x-island.x)/(island.rx*island.rx),dz=(z-island.z)/(island.rz*island.rz),length=Math.hypot(dx,dz);if(length<.001){dx=0;dz=-1;length=1}dx/=length;dz/=length;let distance=1.8;while(distance<9&&seaLand(x+dx*distance,z+dz*distance,'dream'))distance+=.2;distance+=2.6;return{x:x+dx*distance,z:z+dz*distance,heading:Math.atan2(dx,dz)}}
export const castWaitMs=9000;
