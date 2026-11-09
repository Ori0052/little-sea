import {Vector3,type Object3D} from 'three';
import {boatCapacity,boatSeatPosition,boatPosition,type BoatSnapshot} from './boat-space';
export function oarGripPoint(side:number,arm:number){const x=-side*.35+arm*.08,t=(x+side*.52)/(side*1.56);return new Vector3(x,.06-.18*t,0)}
export function bindBoatRig(model:Object3D){
 const need=(name:string)=>{const n=model.getObjectByName(name);if(!n)throw Error('배 동작 모델을 확인하지 못했어요: '+name);return n};
 const hull=need('BoatRoot'),riders=Array.from({length:boatCapacity},(_,i)=>need(`Passenger_${i}`)),oars=Array.from({length:boatCapacity},(_,i)=>need(`Oar_${i}`)),hats=Array.from({length:boatCapacity},(_,i)=>need(`Hat_${i}`));
 const arms=riders.map((_,i)=>[-1,1].map(side=>({side,grip:oarGripPoint(i%2===0?-1:1,side),root:need(`Arm_${i}_${side}`),upper:need(`Upper_${i}_${side}`),fore:need(`Fore_${i}_${side}`),elbow:need(`Elbow_${i}_${side}`),hand:need(`Hand_${i}_${side}`)})));
 const up=new Vector3(0,1,0),target=new Vector3(),direction=new Vector3(),bend=new Vector3(),elbow=new Vector3(),segment=new Vector3();
 return{hull,apply(snapshot:BoatSnapshot,time:number,showRiders=true,animate=true,showHats=false){
 const pose=boatPosition(snapshot,time);hull.position.set(pose.x,animate?Math.sin(time*.0012)*.025:0,pose.z);hull.rotation.y=pose.heading;
 for(let i=0;i<boatCapacity;i++){
  const occupied=showRiders&&snapshot.passengers.some(p=>p.seat===i),seat=boatSeatPosition({...pose,x:0,z:0,heading:0},i),r=riders[i],o=oars[i],side=i%2===0?-1:1;
  r.visible=occupied;hats[i].visible=showHats;r.position.x=seat.x;r.position.z=seat.z;o.position.z=seat.z+.24;o.visible=occupied||(!showRiders&&i===0);
  const phase=animate&&pose.moving?Math.sin((time-snapshot.departed)*.0027):0;o.rotation.y=phase*.26*side;o.rotation.z=phase*.05*side;
  o.updateWorldMatrix(true,false);r.updateWorldMatrix(true,false);
  for(const a of arms[i]){
   // Hands are solved from the moving shaft, rather than animated independently.
   target.copy(a.grip).applyMatrix4(o.matrixWorld);r.worldToLocal(target);target.sub(a.root.position);
   const distance=Math.max(.001,target.length()),length=Math.max(.22,distance*.5+.002);direction.copy(target).divideScalar(distance);
   bend.set(a.side,.05,.20).addScaledVector(direction,-bend.dot(direction)).normalize();
   const along=distance*.5,height=Math.sqrt(Math.max(0,length*length-along*along));elbow.copy(direction).multiplyScalar(along).addScaledVector(bend,height);
   a.root.rotation.set(0,0,0);a.upper.position.set(0,0,0);a.upper.scale.y=elbow.length();a.upper.quaternion.setFromUnitVectors(up,segment.copy(elbow).normalize());
   a.fore.position.copy(elbow);segment.copy(target).sub(elbow);a.fore.scale.y=segment.length();a.fore.quaternion.setFromUnitVectors(up,segment.normalize());
   a.elbow.position.copy(elbow);a.hand.position.copy(target);
  }
 }
 return pose;
 }};
}
export function labSnapshot(count:number,sailing:boolean):BoatSnapshot{const n=Math.max(1,Math.min(boatCapacity,Math.floor(count)||1));return{x:0,z:0,heading:0,targetX:sailing?0:null,targetZ:sailing?100000:null,departed:0,serverNow:0,passengers:Array.from({length:n},(_,seat)=>({id:`preview-${seat}`,seat})),captain:'preview-0',selfSeat:0,selfCaptain:true}}
