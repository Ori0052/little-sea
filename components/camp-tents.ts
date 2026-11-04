import {campingCenter} from './island-terrain';
export const campTents=[{dx:-2.9,dz:-.4,color:[191,151,107]},{dx:.2,dz:1,color:[117,149,130]},{dx:3,dz:-1,color:[175,143,125]}];
export function tentEntrance(t:typeof campTents[number]){return{x:campingCenter.x+t.dx,z:campingCenter.z+t.dz-1.35}}
