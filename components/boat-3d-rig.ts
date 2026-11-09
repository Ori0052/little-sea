import type {Object3D} from 'three';
import {boatCapacity,boatSeatPosition,boatPosition,type BoatSnapshot} from './boat-space';
export function bindBoatRig(model:Object3D){
 const hull=model.getObjectByName('BoatRoot');if(!hull)throw Error('배 본체를 찾지 못했어요.');
 const riders=Array.from({length:boatCapacity},(_,i)=>model.getObjectByName(`Passenger_${i}`));
 const oars=Array.from({length:boatCapacity},(_,i)=>model.getObjectByName(`Oar_${i}`));
 if(riders.some(x=>!x)||oars.some(x=>!x))throw Error('좌석이나 노 모델을 확인하지 못했어요.');
 const arms=riders.map(p=>{const a:Object3D[]=[];p!.traverse(n=>{if(n.name.startsWith('Arm_'))a.push(n)});return a});
 return{hull,apply(snapshot:BoatSnapshot,time:number,showRiders=true,animate=true){const pose=boatPosition(snapshot,time);hull.position.set(pose.x,animate?Math.sin(time*.0012)*.025:0,pose.z);hull.rotation.y=pose.heading;
 for(let i=0;i<boatCapacity;i++){const occupied=showRiders&&snapshot.passengers.some(p=>p.seat===i),seat=boatSeatPosition({...pose,x:0,z:0,heading:0},i),r=riders[i]!,o=oars[i]!;r.visible=occupied;r.position.x=seat.x;r.position.z=seat.z;o.position.z=seat.z;o.visible=occupied||(!showRiders&&i===0);const phase=animate&&pose.moving?Math.sin((time-snapshot.departed)*.0027):0,side=i%2===0?-1:1;o.rotation.y=phase*.36*side;o.rotation.z=phase*.07*side;arms[i].forEach(a=>{a.rotation.x=phase*.28});}
 return pose;}};
}
export function labSnapshot(count:number,sailing:boolean):BoatSnapshot{const n=Math.max(1,Math.min(boatCapacity,Math.floor(count)||1));return{x:0,z:0,heading:0,targetX:sailing?0:null,targetZ:sailing?100000:null,departed:0,serverNow:0,passengers:Array.from({length:n},(_,seat)=>({id:`preview-${seat}`,seat})),captain:'preview-0',selfSeat:0,selfCaptain:true}}
