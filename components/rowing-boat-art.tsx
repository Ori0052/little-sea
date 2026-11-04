import type {ReactNode} from 'react';
export type BoatVertex={r:number;f:number;h:number};
export type BoatProjection={x:number;y:number;depth:number};
type Face={points:BoatVertex[];fill:string;stroke?:string;order?:number;oar?:number};
/** A low polygon open hull. Every surface is projected through the world camera. */
export function RowingBoatArt({project,moving,phase,riders,seats}:{project:(p:BoatVertex)=>BoatProjection|null;moving:boolean;phase:number;seats:number[];riders:{seat:number;r:number;f:number;art:ReactNode;name:string;self:boolean}[]}){
 const faces:Face[]=[],p=(r:number,f:number,h:number):BoatVertex=>({r,f,h}),face=(points:BoatVertex[],fill:string,stroke?:string,order=0)=>faces.push({points,fill,stroke,order}),quad=(a:BoatVertex,b:BoatVertex,c:BoatVertex,d:BoatVertex,color:string,stroke?:string)=>face([a,b,c,d],color,stroke);
 const count=40,ring=(i:number,size:number,h:number)=>{const a=i/count*Math.PI*2;return p(Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.8*1.14*size*(1-.24*Math.cos(a)),Math.cos(a)*3.65*size,h)};
 // Narrow waterline and three courses of timber give the sides their curved volume.
 for(let i=0;i<count;i++){
  const tones=['#a88560','#c6ab80','#d8c59e','#e5d5b3'],levels=[[-.16,.66],[.12,.80],[.43,.92],[.74,.98],[1.05,1]];
  for(let j=0;j<4;j++){const[a,s]=levels[j],[b,t]=levels[j+1];quad(ring(i,s,a),ring(i+1,s,a),ring(i+1,t,b),ring(i,t,b),tones[j],'#aa9270')}
  quad(ring(i,.9,1.0),ring(i+1,.9,1.0),ring(i+1,.64,.06),ring(i,.64,.06),'#ae8c61','#c3a97c');
 }
 // Floor boards and three real bench seats, with a pale teal cushion at each seat.
 face(Array.from({length:count},(_,i)=>ring(i,.64,.07)),'#c6a677','#a58960');
 for(let f=-1.9;f<=2;f+=.4){const w=.74*Math.sqrt(Math.max(0,1-(f/2.2)**2));quad(p(-w,f,.075),p(w,f,.075),p(w,f+.026,.075),p(-w,f+.026,.075),'#806e53')}
 for(const f of [1.1,0,-1.1]){
  quad(p(-1.06,f-.23,.48),p(1.06,f-.23,.48),p(1.06,f+.23,.48),p(-1.06,f+.23,.48),'#c5a578','#e1c698');
  quad(p(-1.06,f-.23,.35),p(1.06,f-.23,.35),p(1.06,f-.23,.48),p(-1.06,f-.23,.48),'#957650');

 }
 // A thick rounded gunwale leaves the interior visibly open.
 for(let i=0;i<count;i++){quad(ring(i,1.015,1.05),ring(i+1,1.015,1.05),ring(i+1,.9,1.05),ring(i,.9,1.05),'#76949b','#67858a');quad(ring(i,1.015,.94),ring(i+1,1.015,.94),ring(i+1,1.015,1.05),ring(i,1.015,1.05),'#587b86');}
 // One compact paddle for each occupied seat. An empty boat carries one spare.
 const oars=(seats.length?seats:[0]).map(seat=>{const side=seat%2===0?-1:1,f=1.1-Math.floor(seat/2)*1.1,stroke=phase+Math.floor(seat/2)*.18,sweep=moving?Math.sin(stroke)*.50:.20,lift=moving?Math.max(0,Math.cos(stroke))*.28:.12;
  const pivot=p(side*1.08,f,1.07),handle=p(side*.42,f-sweep*.72,1.12+lift*.3),neck=p(side*2.16,f+sweep,.16+lift),tip=p(side*2.85,f+sweep*1.65,.035+lift);
  const start=faces.length;
  quad(p(handle.r,handle.f-.045,handle.h),p(neck.r,neck.f-.055,neck.h),p(neck.r,neck.f+.055,neck.h),p(handle.r,handle.f+.045,handle.h),'#b08957','#977448');
  face([p(neck.r,neck.f-.1,neck.h),p(tip.r,tip.f-.29,tip.h),p(side*2.97,tip.f,tip.h),p(tip.r,tip.f+.29,tip.h),p(neck.r,neck.f+.1,neck.h)],'#c39a60','#9a754a');
  for(let n=start;n<faces.length;n++)faces[n].oar=seat;
  quad(p(pivot.r-.07,f-.11,1.07),p(pivot.r+.07,f-.11,1.07),p(pivot.r+.07,f+.11,1.07),p(pivot.r-.07,f+.11,1.07),'#526969');
  return{seat,handle,stroke};
 });
 const items:{key:string;depth:number;node:ReactNode}[]=[];
 faces.forEach((f,i)=>{const q=f.points.map(project);if(q.some(p=>!p))return;const v=q as BoatProjection[];items.push({key:'f'+i,depth:v.reduce((a,p)=>a+p.depth,0)/v.length+(f.order||0),node:<polygon data-oar-seat={f.oar} points={v.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} fill={f.fill} stroke={f.stroke||f.fill} strokeWidth=".65" strokeLinejoin="round"/>})});
 riders.forEach(r=>{const oar=oars.find(o=>o.seat===r.seat)!,q=project(p(r.r,r.f,.48)),head=project(p(r.r,r.f,1.65));if(!q||!head)return;const height=Math.max(23,Math.min(61,Math.abs(q.y-head.y)*1.7)),width=height*.78,lean=moving?Math.sin(oar.stroke)*7:0;
 const hand=project(oar.handle);const shoulderY=q.y-height*.54,shoulderX=q.x,elbow=hand?{x:(shoulderX+hand.x)*.5,y:(shoulderY+hand.y)*.5+height*.08}:null;
 items.push({key:'p'+r.seat,depth:q.depth-.06,node:<g data-rower-seat={r.seat} data-rowing={moving} data-stroke={moving?Math.sin(oar.stroke).toFixed(3):'0'}><foreignObject data-boat-passenger={r.seat} data-self={r.self} x={q.x-width/2} y={q.y-height*.88} width={width} height={height+19} overflow="visible"><div className="rowing-boat-rider" style={{width,height}}><div className="rower-figure" style={{transform:`rotate(${lean}deg)`,transformOrigin:'50% 76%'}}>{r.art}</div><span>{r.self?'나':r.name}</span></div></foreignObject>{hand&&elbow&&<g data-rowing-arms={r.seat} fill="none" stroke="#edc5af" strokeWidth={Math.max(2,height*.067)} strokeLinecap="round" strokeLinejoin="round"><path d={`M${shoulderX-width*.19} ${shoulderY} Q${elbow.x-width*.08} ${elbow.y} ${hand.x} ${hand.y}`}/><path d={`M${shoulderX+width*.19} ${shoulderY} Q${elbow.x+width*.08} ${elbow.y} ${hand.x+2} ${hand.y-1}`}/></g>}</g>});});
 items.sort((a,b)=>b.depth-a.depth);
 return <>{items.map(i=><g key={i.key}>{i.node}</g>)}</>;
}
