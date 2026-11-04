import type {AvatarState} from '../components/avatar-state';
export const presenceActiveInterval=1000;
export const presenceRestInterval=5000;
export function presenceInterval(state:AvatarState|null,lastSent:string,sharedActive=false){
 if(sharedActive||state?.moving||state?.fishing||state?.cooking||state?.eating||JSON.stringify(state)!==lastSent)return presenceActiveInterval;
 return presenceRestInterval;
}
export function presenceRetryDelay(failures:number){return Math.min(30000,5000*2**Math.max(0,failures-1))}
