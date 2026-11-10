/** Local distance mix: calm sea remains faint under a nearby, audible fire. */
export function campfireProximity(distance:number){if(!Number.isFinite(distance))return 0;const t=Math.max(0,Math.min(1,(10-Math.max(0,distance))/8.5));return t*t*(3-2*t)}
export function campfireWaveGain(strength:number){return 1-.88*Math.max(0,Math.min(1,Number.isFinite(strength)?strength:0))}
