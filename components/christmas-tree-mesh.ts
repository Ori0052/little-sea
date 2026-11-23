import {terrainHeight} from './island-terrain';
export const christmasTreeSites=[{x:2.7,z:25.6,scale:1},{x:17.3,z:60.8,scale:.86}] as const;
type Color=[number,number,number];
type P={x:number;y:number;z:number};
const light={x:-.48,y:.79,z:-.39};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const hash=(n:number)=>{const a=Math.sin(n*127.1+8.7)*43758.5453;return a-Math.floor(a)};
/** Interleaved x,z,height,r,g,b,material: negative material is warm self-illumination.
 * Built once, grounded in the existing island mesh, with no textures or extra GL context. */
export function createChristmasTreeMesh(){
 const out:number[]=[];
 const add=(p:P,c:Color,glow=0)=>out.push(p.x,p.z,p.y,...c.map(n=>clamp(n/255)),-glow);
 const tri=(a:P,b:P,c:P,color:Color,glow=0)=>{add(a,color,glow);add(b,color,glow);add(c,color,glow)};
 const quad=(a:P,b:P,c:P,d:P,color:Color,glow=0)=>{tri(a,b,c,color,glow);tri(a,c,d,color,glow)};
 const shade=(color:Color,n:P,gloss=0):Color=>{
  const len=Math.hypot(n.x,n.y,n.z)||1,d=Math.max(0,(n.x*light.x+n.y*light.y+n.z*light.z)/len);
  const diffuse=.55+.45*d,spec=Math.pow(d,18)*gloss;
  return color.map((c,i)=>Math.min(255,c*diffuse+[255,239,201][i]*spec)) as Color;
 };
 function ellipsoid(center:P,r:P,color:Color,angle=0,gloss=0,glow=0,snow=false,segments=10,rings=6){
  const ca=Math.cos(angle),sa=Math.sin(angle);
  const vertex=(j:number,k:number)=>{
   const u=k/segments*Math.PI*2,v=-Math.PI/2+j/rings*Math.PI,nx=Math.cos(v)*Math.cos(u),ny=Math.sin(v),nz=Math.cos(v)*Math.sin(u);
   const p={x:center.x+nx*r.x*ca-nz*r.z*sa,y:center.y+ny*r.y,z:center.z+nx*r.x*sa+nz*r.z*ca};
   const normal={x:nx/r.x*ca-nz/r.z*sa,y:ny/r.y,z:nx/r.x*sa+nz/r.z*ca};
   const cap=snow&&ny>.66&&Math.sin(u*2.3+angle*3)>-.28;
   const c=glow>.7?color:shade(cap?[235,243,242]:color,normal,cap?.02:gloss);
   return {p,c};
  };
  for(let j=0;j<rings;j++)for(let k=0;k<segments;k++){
   const a=vertex(j,k),b=vertex(j+1,k),c=vertex(j+1,k+1),d=vertex(j,k+1);
   if(j>0){add(a.p,a.c,glow);add(b.p,b.c,glow);add(d.p,d.c,glow)}
   if(j<rings-1){add(b.p,b.c,glow);add(c.p,c.c,glow);add(d.p,d.c,glow)}
  }
 }
 function tube(a:P,b:P,radius:number,color:Color,taper=1,sides=6,glow=0){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz)||1;
  const axis={x:dx/len,y:dy/len,z:dz/len},ref=Math.abs(axis.y)>.9?{x:1,y:0,z:0}:{x:0,y:1,z:0};
  const u={x:axis.y*ref.z-axis.z*ref.y,y:axis.z*ref.x-axis.x*ref.z,z:axis.x*ref.y-axis.y*ref.x},ul=Math.hypot(u.x,u.y,u.z)||1;
  u.x/=ul;u.y/=ul;u.z/=ul;const v={x:axis.y*u.z-axis.z*u.y,y:axis.z*u.x-axis.x*u.z,z:axis.x*u.y-axis.y*u.x};
  const ring=(p:P,i:number,r:number)=>{const q=i*Math.PI*2/sides;return {x:p.x+(u.x*Math.cos(q)+v.x*Math.sin(q))*r,y:p.y+(u.y*Math.cos(q)+v.y*Math.sin(q))*r,z:p.z+(u.z*Math.cos(q)+v.z*Math.sin(q))*r}};
  for(let i=0;i<sides;i++){const q=(i+.5)*Math.PI*2/sides,n={x:u.x*Math.cos(q)+v.x*Math.sin(q),y:u.y*Math.cos(q)+v.y*Math.sin(q),z:u.z*Math.cos(q)+v.z*Math.sin(q)};quad(ring(a,i,radius),ring(b,i,radius*taper),ring(b,i+1,radius*taper),ring(a,i+1,radius),shade(color,n,.03),glow)}
 }
 for(const [siteIndex,site] of christmasTreeSites.entries()){
  const s=site.scale,root=terrainHeight(site.x,site.z);
  const p=(x:number,y:number,z:number):P=>({x:site.x+x*s,y:root+y*s,z:site.z+z*s});
  // A soft, ground-following contact shadow, using the same snow shading as the terrain.
  for(let ring=0;ring<3;ring++)for(let k=0;k<32;k++){
   const q=(r:number,n:number)=>{const a=n*Math.PI*2/32,x=site.x+.17*s+Math.cos(a)*r*1.04*s,z=site.z+.13*s+Math.sin(a)*r*.79*s;return {x,y:terrainHeight(x,z)+.012,z}};
   const tone=ring===0?[175,193,199]:ring===1?[200,214,221]:[222,232,239];
   quad(q(ring/3,k),q((ring+1)/3,k),q((ring+1)/3,k+1),q(ring/3,k+1),tone as Color);
  }
  tube(p(0,.03,0),p(.02,4.6,0),.095*s,[123,91,65],.25,10);
  // Seven overlapping whorls. Radially elongated, drooping branch clusters replace flat cones.
  for(let layer=0;layer<7;layer++){
   const y=.62+layer*.55,radius=.78*(1-layer/8.15),count=10-Math.floor(layer*.75),phase=layer*.41+siteIndex*.53;
   ellipsoid(p(0,y+.13,0),{x:radius*.69*s,y:.37*s,z:radius*.69*s},[56+layer*3,103+layer*4,72+layer*2],phase,.02,0,false,12,5);
   for(let j=0;j<count;j++){
    const a=j*Math.PI*2/count+phase,reach=radius*(.91+hash(j+layer*11)*.17),cx=Math.cos(a),cz=Math.sin(a);
    tube(p(cx*.08,y+.17,cz*.08),p(cx*reach*.91,y-.12,cz*reach*.91),.026*s,[91,94,62],.3,5);
    ellipsoid(p(cx*reach*.57,y+.035,cz*reach*.57),{x:reach*.56*s,y:(.18+layer*.005)*s,z:radius*.26*s},[63+layer*2,113+layer*3,76+layer*2],a,.025,0,layer%2===0,10,5);
    if(layer<5)ellipsoid(p(cx*reach*.94,y-.11,cz*reach*.94),{x:.16*s,y:.13*s,z:.13*s},[69,122,83],a,.02,0,false,8,4);
   }
  }
  ellipsoid(p(0,4.08,0),{x:.14*s,y:.52*s,z:.14*s},[75,133,88],0,.02,0,true,10,6);
  const radiusAt=(y:number)=>.79*Math.pow(Math.max(.025,1-(y-.4)/4.12),.8)+.045;
  // A true spiral wraps around both the near and far branches, with steady warm bulbs.
  const cable=(t:number)=>{const y=.59+t*3.6,a=t*Math.PI*2*4.1+.4,r=radiusAt(y);return p(Math.cos(a)*r,y,Math.sin(a)*r)};
  for(let i=0;i<164;i++)tube(cable(i/164),cable((i+1)/164),.009*s,[187,151,84],1,4);
  for(let i=0;i<43;i++){
   const t=(i+.2)/43,a=t*Math.PI*2*4.1+.4,c=cable(t),bulb={x:c.x+Math.cos(a)*.026*s,y:c.y-.035*s,z:c.z+Math.sin(a)*.026*s};
   tube(c,bulb,.009*s,[181,148,87],1,4);
   ellipsoid(bulb,{x:.045*s,y:.057*s,z:.045*s},[255,224,147],0,0,1,false,6,4);
  }
  // Glossy baubles, ivory pendants and gold caps have volume from every viewing angle.
  for(let i=0;i<24;i++){
   const y=.86+(i%6)*.49,a=i*2.39996+siteIndex*.7,r=radiusAt(y)+.015,center=p(Math.cos(a)*r,y-.12,Math.sin(a)*r),size=(.081+hash(i+71)*.03)*s;
   const colors:Color[]=[[166,49,58],[216,172,79],[239,229,200],[194,75,71]];
   tube({x:center.x,y:center.y+.27*s,z:center.z},{x:center.x,y:center.y+size,z:center.z},.005*s,[199,168,104],1,4);
   ellipsoid(center,{x:size,y:size*(i%5===2?1.36:1),z:size},colors[i%4],a,.29,0,false,10,7);
   tube({x:center.x,y:center.y+size*.87,z:center.z},{x:center.x,y:center.y+size*1.16,z:center.z},size*.3,[207,171,96],1,6);
  }
  // Bevelled five-point star: front and back peaks plus a solid rim.
  const rotation=.2,star=(x:number,y:number,z:number)=>p(x*Math.cos(rotation)-z*Math.sin(rotation),4.63+y,x*Math.sin(rotation)+z*Math.cos(rotation));
  for(let i=0;i<10;i++){
   const corner=(j:number,z:number)=>{const a=Math.PI/2+j*Math.PI/5,r=j%2?.112:.255;return star(Math.cos(a)*r,Math.sin(a)*r,z)};
   tri(star(0,0,.092),corner(i,.026),corner(i+1,.026),i%2?[250,220,147]:[216,170,81],.38);
   tri(star(0,0,-.092),corner(i+1,-.026),corner(i,-.026),i%2?[221,182,103]:[190,148,68],.2);
   quad(corner(i,.026),corner(i,-.026),corner(i+1,-.026),corner(i+1,.026),[204,157,73],.12);
  }
  // Small red and gold parcels with ribbon bands on their top and sides.
  const box=(x:number,z:number,w:number,d:number,h:number,angle:number,color:Color,ribbon:Color)=>{
   const base=terrainHeight(site.x+x*s,site.z+z*s);
   const world=(a:number,b:number,c:number)=>({...p(x+a*Math.cos(angle)-c*Math.sin(angle),0,z+a*Math.sin(angle)+c*Math.cos(angle)),y:base+(b+.018)*s});
   const face=(coords:number[][],tone:Color)=>quad(...coords.map(([a,b,c])=>world(a,b,c)) as [P,P,P,P],tone);
   face([[-w/2,h,-d/2],[w/2,h,-d/2],[w/2,h,d/2],[-w/2,h,d/2]],color.map(c=>Math.min(255,c*1.08)) as Color);
   for(const side of [-1,1]){face([[-w/2,0,side*d/2],[w/2,0,side*d/2],[w/2,h,side*d/2],[-w/2,h,side*d/2]],color.map(c=>c*(side>0?.72:.9)) as Color);face([[side*w/2,0,-d/2],[side*w/2,0,d/2],[side*w/2,h,d/2],[side*w/2,h,-d/2]],color.map(c=>c*(side>0?.82:.95)) as Color)}
   const band=.047;face([[-band,h+.006,-d/2],[band,h+.006,-d/2],[band,h+.006,d/2],[-band,h+.006,d/2]],ribbon);face([[-w/2,h+.008,-band],[w/2,h+.008,-band],[w/2,h+.008,band],[-w/2,h+.008,band]],ribbon);
   for(const side of [-1,1])face([[-band,0,side*(d/2+.003)],[band,0,side*(d/2+.003)],[band,h,side*(d/2+.003)],[-band,h,side*(d/2+.003)]],ribbon);
   for(const side of [-1,1])ellipsoid(world(side*.09,h+.042,0),{x:.10*s,y:.035*s,z:.052*s},ribbon,angle+side*.4,.08,0,false,8,4);
   ellipsoid(world(0,h+.035,0),{x:.045*s,y:.035*s,z:.04*s},ribbon,0,.08,0,false,8,4);
  };
  box(-.49,-.53,.48,.40,.34,-.2,[169,64,65],[225,189,110]);
  box(.28,-.63,.42,.35,.29,.18,[218,182,107],[156,51,59]);
  box(.67,-.33,.31,.32,.43,-.32,[139,56,65],[231,202,139]);
  box(-.22,.53,.36,.32,.31,.3,[199,158,85],[158,63,69]);
 }
 return new Float32Array(out);
}
