import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type XYZ=readonly[number,number,number];
type Kind='fish'|'coral'|'jelly'|'chest';
export type CozyUnderwaterState={time:number;delta:number;active:boolean;reducedMotion:boolean;world:HTMLElement|null;centerX:number;centerZ:number};
const capacity=20,TAU=Math.PI*2;
const hash=(n:number)=>{const v=Math.sin(n*127.13+31.71)*43758.5453;return v-Math.floor(v)};

/** Small sculpted parts are baked into one vertex-colour geometry per animated part. */
class Sculpt {
 private parts:THREE.BufferGeometry[]=[];
 add(source:THREE.BufferGeometry,color:THREE.ColorRepresentation,position:XYZ=[0,0,0],scale:XYZ=[1,1,1],rotation:XYZ=[0,0,0]){
  const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
  for(const key of Object.keys(geometry.attributes))if(!['position','normal','color'].includes(key))geometry.deleteAttribute(key);
  if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();
  if(!geometry.getAttribute('color')){const c=new THREE.Color(color),values=new Float32Array(geometry.getAttribute('position').count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b}geometry.setAttribute('color',new THREE.BufferAttribute(values,3))}
  geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));this.parts.push(geometry);return this;
 }
 ball(size:XYZ,position:XYZ,color:THREE.ColorRepresentation,segments=12,rings=8){return this.add(new THREE.SphereGeometry(1,segments,rings),color,position,size)}
 box(size:XYZ,position:XYZ,color:THREE.ColorRepresentation,radius=.025){return this.add(new RoundedBoxGeometry(...size,2,Math.min(radius,...size.map(n=>n*.45))),color,position)}
 line(points:XYZ[],radius:number,color:THREE.ColorRepresentation){return this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(6,points.length*3),radius,5,false),color)}
 finish(){const geometry=mergeGeometries(this.parts,false);this.parts.forEach(p=>p.dispose());this.parts=[];if(!geometry)throw new Error('Could not assemble the underwater diorama');geometry.computeBoundingSphere();return geometry}
}
function fishBody(){
 const s=new Sculpt(),body=new THREE.SphereGeometry(1,18,12);body.scale(.225,.17,.355);
 const position=body.getAttribute('position'),colors=new Float32Array(position.count*3),orange=new THREE.Color('#e9a365'),cream=new THREE.Color('#fff1d5');
 for(let i=0;i<position.count;i++){const z=position.getZ(i),c=Math.abs(z+.125)<.043||Math.abs(z-.145)<.036?cream:orange;colors.set([c.r,c.g,c.b],i*3)}
 body.setAttribute('color',new THREE.BufferAttribute(colors,3));s.add(body,'#e9a365');
 for(const side of[-1,1]){
  s.ball([.047,.056,.037],[side*.177,.055,-.227],'#fff4dd',10,6);
  s.ball([.027,.036,.021],[side*.184,.055,-.252],'#303c38',10,6);
  s.ball([.008,.011,.007],[side*.184-.006,.068,-.270],'#fff9e9',8,5);
  s.ball([.11,.033,.12],[side*.208,-.055,.012],'#cf895d',10,6);
 }
 s.ball([.055,.035,.024],[0,-.047,-.345],'#e3a277',10,6);
 s.ball([.055,.088,.18],[0,.15,.08],'#ca9065',10,6);
 return s.finish();
}
function fishTail(){const s=new Sculpt();s.ball([.055,.06,.08],[0,0,.035],'#dd9c64',10,6);s.ball([.16,.15,.052],[0,0,.135],'#efbd80',12,8);s.ball([.13,.11,.01],[0,0,.183],'#f4d6a4',10,6);return s.finish()}
function coralBody(){
 const s=new Sculpt();s.ball([.20,.07,.16],[0,.025,0],'#8ca89a',12,6);
 const pink='#d797a6',light='#e9bec3',dark='#c17f96';
 const branches:XYZ[][]=[[[0,.05,0],[.015,.22,0],[0,.48,.01]],[[0,.18,0],[-.12,.28,.01],[-.17,.43,.015]],[[0,.27,0],[.13,.37,-.02],[.16,.54,-.025]],[[-.105,.28,.01],[-.24,.32,0],[-.29,.41,.01]],[[.12,.36,-.02],[.27,.40,.02],[.29,.47,.025]],[[0,.10,0],[.11,.20,.09],[.15,.29,.12]],[[-.12,.27,0],[-.11,.38,-.12],[-.13,.46,-.14]]];
 branches.forEach((points,i)=>{s.line(points,i===0?.034:.023,i%3===0?dark:pink);s.ball([.030,.033,.028],points[points.length-1],i%2?light:pink,8,5)});
 return s.finish();
}
function chestBody(){
 const s=new Sculpt(),wood='#bb8c58',cream='#e3bd79',gold='#d6af62';
 s.box([.66,.33,.44],[0,.20,0],wood,.045);s.box([.69,.17,.47],[0,.455,0],cream,.055);
 for(const x of[-.23,.23]){s.box([.055,.36,.46],[x,.215,0],gold,.015);s.box([.059,.17,.485],[x,.458,0],gold,.02)}
 s.box([.68,.035,.465],[0,.36,0],'#a17b4b',.014);
 s.box([.11,.15,.033],[0,.34,-.244],gold,.022);s.ball([.023,.028,.013],[0,.35,-.269],'#6d755f',8,6);
 for(const x of[-.30,.30])for(const y of[.10,.30])s.ball([.018,.018,.012],[x,y,-.227],cream,8,5);
 s.box([.54,.045,.35],[0,.025,0],'#8c7254',.022);return s.finish();
}
function jellyTendrils(){const s=new Sculpt();for(let i=0;i<6;i++){const a=i/6*TAU,r=.13;const points:XYZ[]=[];for(let j=0;j<7;j++){const t=j/6;points.push([Math.cos(a)*r+Math.sin(t*TAU+i)*.025,-.09-t*(.30+(i%3)*.045),Math.sin(a)*r+Math.cos(t*TAU+i)*.025])}s.line(points,.011,i%2?'#c4c1dd':'#e3dbed')}return s.finish()}
function seaGrass(){const s=new Sculpt();for(let i=0;i<5;i++){const a=i*2.399;s.line([[Math.cos(a)*.06,0,Math.sin(a)*.06],[Math.cos(a)*.075,.15+(i%3)*.02,Math.sin(a)*.075],[Math.cos(a)*.13,.27+(i%3)*.04,Math.sin(a)*.13]],.013,i%2?'#79aaa0':'#9db9a0')}return s.finish()}
const floorVertex=/* glsl */`
varying vec3 vSand;
void main(){
 vec3 transformed=position;
 vSand=(modelMatrix*vec4(transformed,1.)).xyz;
 #include <project_vertex>
}`;
const floorFragment=/* glsl */`
precision highp float;
uniform float uTime;
uniform vec2 uCenter;
uniform vec3 uSand;
uniform vec3 uShade;
uniform vec3 uFog;
varying vec3 vSand;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 p=vSand.xz;
 float bands=sin(p.x*1.12+sin(p.y*.68+uTime*.12)) + sin(p.y*1.23+sin(p.x*.81-uTime*.09));
 float secondary=sin(p.x*2.0+p.y*1.3-uTime*.11)+sin(p.y*1.7-p.x*.84+uTime*.08);
 float caustic=pow(max(0.,1.-abs(bands)*1.4),15.)*.14+pow(max(0.,1.-abs(secondary)*1.8),20.)*.045;
 float ripple=sin(p.x*2.6+p.y*.4+sin(p.y*.7)*.8)*.5+.5;
 vec3 color=mix(uSand,uShade,.12+ripple*.11);
 color+=vec3(.43,.65,.53)*caustic;
 color+=(hash(floor(p*145.))-.5)*.014;
 float distance=length(p-uCenter);
 color=mix(color,uFog,smoothstep(12.,65.,distance)*.92);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const tendrilVertex=/* glsl */`
uniform float uTime;
varying vec3 vTint;
void main(){
 vec3 transformed=position;
 float lower=max(0.,-position.y-.08);
 transformed.x+=sin(uTime*.85+position.y*9.)*lower*.07;
 transformed.z+=cos(uTime*.67+position.y*7.)*lower*.06;
 vTint=color;
 #include <project_vertex>
}`;
const tendrilFragment=/* glsl */`
precision highp float;
varying vec3 vTint;
void main(){gl_FragColor=vec4(vTint*.85+vec3(.12,.15,.18),.67);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

/** Existing DOM buttons remain the only hit targets and collection authority. */
export function createCozyUnderwater(scene:THREE.Scene){
 const root=new THREE.Group();root.name='CozyUnderwater';root.visible=false;scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 const ownGeometry=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g};
 const ownMaterial=<T extends THREE.Material>(m:T)=>{materials.add(m);return m};
 const matte=ownMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.67,metalness:.015,side:THREE.DoubleSide}));matte.name='Cozy underwater sculpted colours';
 const translucent=ownMaterial(new THREE.MeshPhysicalMaterial({color:'#d7cde4',roughness:.36,metalness:0,transparent:true,opacity:.60,clearcoat:.18,clearcoatRoughness:.4,emissive:'#727e9d',emissiveIntensity:.16,depthWrite:false,side:THREE.DoubleSide}));translucent.name='Cozy translucent jelly bells';
 const tendrilMaterial=ownMaterial(new THREE.ShaderMaterial({vertexColors:true,uniforms:{uTime:{value:0}},vertexShader:tendrilVertex,fragmentShader:tendrilFragment,transparent:true,depthWrite:false,side:THREE.DoubleSide}));tendrilMaterial.name='Cozy flowing jelly tendrils';
 function batch(geometry:THREE.BufferGeometry,name:string,material:THREE.Material=matte,size=capacity){const mesh=new THREE.InstancedMesh(ownGeometry(geometry),material,size);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);return mesh}
 const fishes=batch(fishBody(),'Cozy clownfish bodies'),tails=batch(fishTail(),'Cozy clownfish tails'),corals=batch(coralBody(),'Cozy coral pieces'),chests=batch(chestBody(),'Cozy treasure chests');
 const bellGeometry=new THREE.LatheGeometry([new THREE.Vector2(0,.20),new THREE.Vector2(.09,.194),new THREE.Vector2(.18,.15),new THREE.Vector2(.25,.07),new THREE.Vector2(.275,-.045),new THREE.Vector2(.25,-.095),new THREE.Vector2(.18,-.07),new THREE.Vector2(0,-.085)],24);
 const bells=batch(bellGeometry,'Cozy soft jelly bells',translucent),tendrils=batch(jellyTendrils(),'Cozy jelly tendrils',tendrilMaterial);
 const gemMaterial=ownMaterial(new THREE.MeshStandardMaterial({color:'#fff7de',roughness:.24,metalness:.18,emissive:'#9b8aaf',emissiveIntensity:.3}));gemMaterial.name='Cozy jewel reflections';
 const gems=batch(new THREE.OctahedronGeometry(.075,1),'Cozy chest gems',gemMaterial);for(let i=0;i<capacity;i++)gems.setColorAt(i,new THREE.Color('#e4d6b5'));
 const haloMaterial=ownMaterial(new THREE.MeshBasicMaterial({color:'#e8dfad',transparent:true,opacity:.20,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 const haloGeometry=new THREE.RingGeometry(.31,.33,36);haloGeometry.rotateX(-Math.PI/2);const halos=batch(haloGeometry,'Cozy nearby discovery halos',haloMaterial);
 const floorMaterial=ownMaterial(new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uCenter:{value:new THREE.Vector2()},uSand:{value:new THREE.Color('#8eaba0')},uShade:{value:new THREE.Color('#65978f')},uFog:{value:new THREE.Color('#356c78')}},vertexShader:floorVertex,fragmentShader:floorFragment,side:THREE.DoubleSide}));floorMaterial.name='Cozy blue sand and underwater caustics';
 const floorGeometry=ownGeometry(new THREE.PlaneGeometry(150,150,64,64));floorGeometry.rotateX(-Math.PI/2);const floor=new THREE.Mesh(floorGeometry,floorMaterial);floor.name='Cozy seabed';floor.position.y=-.14;floor.frustumCulled=false;root.add(floor);
 const rockMaterial=ownMaterial(new THREE.MeshStandardMaterial({color:'#8daca6',roughness:.93}));const stones=batch(new THREE.SphereGeometry(1,10,6),'Cozy seabed pebbles',rockMaterial,25),grass=batch(seaGrass(),'Cozy soft seagrass',matte,18);
 const bubbleMaterial=ownMaterial(new THREE.MeshBasicMaterial({color:'#cfe8dd',transparent:true,opacity:.22,depthWrite:false}));const bubbles=batch(new THREE.SphereGeometry(.022,6,5),'Cozy quiet water bubbles',bubbleMaterial,28);
 const slots=Array.from({length:capacity},()=>({x:0,z:0,kind:'coral' as Kind,treasure:-1,phase:0,near:false}));
 const dynamicMeshes=[fishes,tails,corals,bells,tendrils,chests,gems,halos];
 const counts={fish:0,coral:0,jelly:0,chest:0,halo:0},dummy=new THREE.Object3D(),gemColors=['#f8e8de','#e8a4ac','#b5b0e8','#96c7bd','#edc075','#82bdcf'].map(c=>new THREE.Color(c));
 let slotCount=0,lastScan=-100,lastWorld:HTMLElement|null=null,lastCellX=1e9,lastCellZ=1e9,disposed=false;
 const set=(mesh:THREE.InstancedMesh,index:number,x:number,y:number,z:number,yaw=0,sx=1,sy=sx,sz=sx,roll=0)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,roll);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix)};
 function scan(world:HTMLElement|null){slotCount=0;if(!world)return;const nodes=world.querySelectorAll<HTMLElement>('.sea-find[data-world-x][data-world-z]');for(const node of nodes){if(slotCount>=capacity)break;const x=Number(node.dataset.worldX),z=Number(node.dataset.worldZ),treasure=Number(node.dataset.treasure??-1),kind=node.dataset.kind;if(!Number.isFinite(x)||!Number.isFinite(z)||!['fish','coral','jelly'].includes(kind||''))continue;const item=slots[slotCount++];item.x=x;item.z=z;item.kind=treasure>=0?'chest':kind as Kind;item.treasure=treasure;item.phase=hash(x*3.17+z*.71)*TAU;item.near=node.dataset.near==='true'}}
 function decorate(centerX:number,centerZ:number){
  const cx=Math.floor(centerX/8),cz=Math.floor(centerZ/8);if(cx===lastCellX&&cz===lastCellZ)return;lastCellX=cx;lastCellZ=cz;
  // Hash world cells so crossing a cell boundary only changes the distant outer edge.
  for(let i=0;i<25;i++){const gx=cx+i%5-2,gz=cz+Math.floor(i/5)-2,seed=gx*7.17+gz*19.31,x=(gx+.20+hash(seed+7)*.6)*8,z=(gz+.20+hash(seed+11)*.6)*8,size=.09+hash(seed+17)*.12;set(stones,i,x,-.13+size*.36,z,hash(seed+9)*TAU,size*1.5,size*.6,size)}stones.count=25;stones.instanceMatrix.needsUpdate=true;
  for(let i=0;i<16;i++){const gx=cx+i%4-2,gz=cz+Math.floor(i/4)-2,seed=gx*13.17+gz*7.31,x=(gx+.2+hash(seed+67)*.65)*8,z=(gz+.15+hash(seed+87)*.7)*8;set(grass,i,x,-.13,z,hash(seed+59)*TAU,.55+hash(seed+71)*.55)}grass.count=16;grass.instanceMatrix.needsUpdate=true;
 }

 function update(state:CozyUnderwaterState){
  if(disposed)return;root.visible=state.active;if(!state.active){lastScan=-100;return}
  const time=state.reducedMotion?0:state.time;floor.position.x=state.centerX;floor.position.z=state.centerZ;floorMaterial.uniforms.uTime.value=time;floorMaterial.uniforms.uCenter.value.set(state.centerX,state.centerZ);tendrilMaterial.uniforms.uTime.value=time;
  if(state.world!==lastWorld||state.time-lastScan>.10||state.time<lastScan){lastWorld=state.world;lastScan=state.time;scan(state.world)}
  counts.fish=counts.coral=counts.jelly=counts.chest=counts.halo=0;
  for(let i=0;i<slotCount;i++){
   const item=slots[i],phase=item.phase,t=time+phase;
   if(item.kind==='fish'){
    const n=counts.fish++,yaw=-.65+Math.sin(t*.31)*.10,y=.30+Math.sin(t*.85)*.025,x=item.x+Math.sin(t*.49)*.035,z=item.z+Math.cos(t*.4)*.025;
    // The shared gameplay lens compresses height: compensate only the sculpt, never its hit coordinates.
    set(fishes,n,x,y,z,yaw,1,2.05,1);set(tails,n,x+Math.sin(yaw)*.33,y,z+Math.cos(yaw)*.33,yaw+Math.sin(t*3.0)*.24,1,2.05,1);
   }else if(item.kind==='coral'){set(corals,counts.coral++,item.x,.025,item.z,phase,.90,1.55,.90,Math.sin(t*.62)*.018)}
   else if(item.kind==='jelly'){
    const n=counts.jelly++,pulse=1+Math.sin(t*.9)*.055,y=.80+Math.sin(t*.75)*.035;
    set(bells,n,item.x,y,item.z,phase,pulse,2.1*(1-(pulse-1)*.7),pulse);set(tendrils,n,item.x,y,item.z,phase,pulse,1.3,pulse);
   }else{
    const n=counts.chest++;set(chests,n,item.x,0,item.z,-.18,1,1.75,1);set(gems,n,item.x,.84,item.z-.248,-.18,1,1.96,1);gems.setColorAt(n,gemColors[Math.max(0,item.treasure)%gemColors.length]);
   }
   if(item.near||item.kind==='chest')set(halos,counts.halo++,item.x,-.125,item.z,0,1+Math.sin(t*.7)*.025,1,1+Math.sin(t*.7)*.025);
  }
  fishes.count=tails.count=counts.fish;corals.count=counts.coral;bells.count=tendrils.count=counts.jelly;chests.count=gems.count=counts.chest;halos.count=counts.halo;
  for(const mesh of dynamicMeshes)mesh.instanceMatrix.needsUpdate=true;if(gems.instanceColor)gems.instanceColor.needsUpdate=true;
  decorate(state.centerX,state.centerZ);
  bubbles.visible=!state.reducedMotion;bubbles.count=state.reducedMotion?0:28;
  if(!state.reducedMotion){const cx=Math.floor(state.centerX/6),cz=Math.floor(state.centerZ/6);for(let i=0;i<28;i++){const gx=cx+i%7-3,gz=cz+Math.floor(i/7)-2,seed=gx*31.7+gz*17.2,phase=(time*.035+hash(seed+7))%1,x=(gx+.18+hash(seed+19)*.64)*6,z=(gz+.2+hash(seed+31)*.62)*6,y=.1+phase*2.5;set(bubbles,i,x+Math.sin(time*.2+seed)*.04,y,z,0,.6+hash(seed+31)*.65)}bubbles.instanceMatrix.needsUpdate=true}
  root.userData.visibleFinds=slotCount;root.userData.clownfish=counts.fish;root.userData.jellyfish=counts.jelly;root.userData.treasures=counts.chest;
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);root.clear();for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose()}
 return{root,update,dispose};
}
