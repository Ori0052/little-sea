export const newIslands=[
 {id:'coral',name:'산호섬',x:-42,z:80,rx:5.8,rz:4.6,tag:'산호 바위 사이의 숨은 진주',color:'#dfa699',landmark:'산호의 울림',hint:'분홍 산호 사이, 작은 진주가 머무는 곳'},
 {id:'mist',name:'안개섬',x:55,z:145,rx:6.5,rz:5.3,tag:'돌길을 따라 오래된 유적으로',color:'#9eafa9',landmark:'바다 유적',hint:'돌문에 새겨진 세 개의 별을 살펴보세요'},
 {id:'starlight',name:'별빛섬',x:-52,z:235,rx:5.4,rz:4.4,tag:'밤이면 빛나는 수정 언덕',color:'#afa0ce',landmark:'별빛 등대',hint:'언덕 위 등대에 오늘의 빛을 남겨보세요'}
] as const;
export type NewIslandId=typeof newIslands[number]['id'];
export function extraIslandField(x:number,z:number,island:typeof newIslands[number]){const a=(x-island.x)/island.rx,b=(z-island.z)/island.rz,t=Math.atan2(b,a);return Math.hypot(a,b)-(1+.055*Math.sin(t*3)+.035*Math.cos(t*5))}
export function onNewIsland(x:number,z:number){return newIslands.find(i=>extraIslandField(x,z,i)<-.015)}
export function extraIslandHeight(x:number,z:number){const i=newIslands.find(i=>Math.hypot((x-i.x)/i.rx,(z-i.z)/i.rz)<1.04);if(!i)return null;const r=Math.hypot((x-i.x)/i.rx,(z-i.z)/i.rz),t=Math.max(0,Math.min(1,(r-.65)/.39)),edge=1-t*t*(3-2*t);return (.22+(i.id==='coral'?.55:i.id==='mist'?1.1:1.65)*Math.exp(-((x-i.x)**2/8+(z-i.z-1)**2/6)))*edge}
export function newIslandLanding(i:typeof newIslands[number]){return{x:i.x,z:i.z-i.rz*.83}}
export const islandPorts=[{id:'beach',name:'해변 선착장',x:0,z:8.5},{id:'fire',name:'모닥불 섬',x:0,z:21.4},{id:'camping',name:'캠핑 섬',x:18,z:54.9},{id:'tiny',name:'먼 작은 섬',x:-18,z:127.2},...newIslands.map(i=>({id:i.id,name:i.name,x:i.x,z:i.z-i.rz-1.8}))];
