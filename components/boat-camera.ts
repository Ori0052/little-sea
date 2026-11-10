// The camera looks forward along yaw, so a rear view shares the boat heading;
// docking keeps the sea ahead visible while passengers turn toward the viewer.
export function boatCameraAngles(heading:number,moving:boolean){return{yaw:Math.atan2(Math.sin(heading+(moving?0:.5)),Math.cos(heading+(moving?0:.5))),pitch:-.1}}
export function followBoatAngle(current:number,target:number,dt:number,reduced=false){const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));return Math.atan2(Math.sin(current+delta*(reduced?1:1-Math.exp(-Math.max(0,dt)*1.5))),Math.cos(current+delta*(reduced?1:1-Math.exp(-Math.max(0,dt)*1.5))))}
