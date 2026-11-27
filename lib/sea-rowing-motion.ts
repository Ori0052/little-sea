/** One grip trajectory drives both wrists and the actual wooden oar. Time is in seconds. */
export function cozyRowingGrip(time:number,moving:boolean,reducedMotion:boolean){
 const stroke=moving&&!reducedMotion?Math.sin(time*2.5):0;
 return{stroke,y:.444+stroke*.022,z:.205-stroke*.026};
}
