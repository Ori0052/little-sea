import {boatPosition,type BoatSnapshot} from './boat-space';
// One monotonic clock is shared by the hull and follow camera. Network refreshes
// correct their display over 180ms instead of snapping back to the last packet.
export function createBoatMotion(){
 let packet:BoatSnapshot|null=null,anchor=0,previous:ReturnType<typeof boatPosition>|null=null,last=0,correction={x:0,z:0,heading:0};
 return (snapshot:BoatSnapshot|null,now:number)=>{
  if(!snapshot){packet=null;previous=null;return null}
  const changed=packet!==snapshot,dt=Math.max(0,now-last),resume=dt>500;
  if(changed){packet=snapshot;anchor=now}
  const raw=boatPosition(snapshot,snapshot.serverNow+now-anchor);
  if(changed&&previous&&!resume){correction={x:previous.x-raw.x,z:previous.z-raw.z,heading:Math.atan2(Math.sin(previous.heading-raw.heading),Math.cos(previous.heading-raw.heading))}}
  if(!previous||resume)correction={x:0,z:0,heading:0};
  const decay=Math.exp(-dt/180);correction.x*=decay;correction.z*=decay;correction.heading*=decay;last=now;
  previous={...raw,x:raw.x+correction.x,z:raw.z+correction.z,heading:raw.heading+correction.heading};return previous;
 };
}
