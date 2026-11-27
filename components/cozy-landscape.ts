import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {terrainHeight,islandCenter,islandRadius,campingCenter,campingRadius,tinyCenter,tinyRadius,fireCenter,islandTrailDistance} from './island-terrain';
import {newIslands} from './archipelago';

export type CozyLandscapeState={time:number;delta:number;mood:string;frozen:boolean;reducedMotion:boolean;centerX:number;centerZ:number;view?:'dream'|'shore';yaw?:number;cameraX?:number;cameraZ?:number;aspect?:number;eye?:number;spread?:number};
type LensState=CozyLandscapeState&{view:'dream';yaw:number;cameraX:number;cameraZ:number;aspect:number;eye:number;spread:number};
function hasCozyLens(state:CozyLandscapeState):state is LensState{return state.view==='dream'&&typeof state.yaw==='number'&&Number.isFinite(state.yaw)&&typeof state.cameraX==='number'&&Number.isFinite(state.cameraX)&&typeof state.cameraZ==='number'&&Number.isFinite(state.cameraZ)&&typeof state.aspect==='number'&&Number.isFinite(state.aspect)&&state.aspect>0&&typeof state.eye==='number'&&Number.isFinite(state.eye)&&state.eye>0&&typeof state.spread==='number'&&Number.isFinite(state.spread)&&state.spread>0}
/** Conservative bounds use the gameplay lens; wide crowns and fronds get a 3.5m margin. */
export function cozyDecorationInView(x:number,z:number,state:CozyLandscapeState){if(!hasCozyLens(state))return true;const dx=x-state.cameraX,dz=z-state.cameraZ,c=Math.cos(state.yaw),s=Math.sin(state.yaw),depth=dx*s+dz*c,right=dx*c-dz*s;return depth>=-3.5&&Math.abs(right)<=state.aspect*Math.max(.1,depth*.6+4*state.eye)*state.spread*.5+3.5}
type Placement={x:number;z:number;y:number;scale:number;angle:number;phase:number;groundY?:number};
type Batch={mesh:THREE.InstancedMesh;placements:Placement[];kind:string;wind:boolean;limit:number;near:number;far:number;offset?:THREE.Vector3;stretch?:THREE.Vector3};
type Island={id:string;x:number;z:number;rx:number;rz:number};
const islands:Island[]=[{id:'fire',...islandCenter,rx:islandRadius.x,rz:islandRadius.z},{id:'camping',...campingCenter,rx:campingRadius.x,rz:campingRadius.z},{id:'tiny',...tinyCenter,rx:tinyRadius.x,rz:tinyRadius.z},...newIslands];
const TAU=Math.PI*2;
// The shared +Z lens compresses height by about one half. Compensate props, never terrain.
const propHeightScale=2;
const hash=(n:number)=>{const value=Math.sin(n*127.17+31.71)*43758.5453;return value-Math.floor(value)};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
export const cozyMainlandCoast=(x:number)=>.09*Math.sin(x*.7)+.06*Math.sin(x*1.8);
/** Rendered island coast follows the exact walkable outline, not a decorative ellipse. */
export function cozyIslandBoundary(island:Island,angle:number){const ripple=1+.055*Math.sin(angle*3)+.035*Math.cos(angle*5);return{x:island.x+Math.cos(angle)*island.rx*ripple,z:island.z+Math.sin(angle)*island.rz*ripple}}

/** A deterministic coastal garden. Kit geometry is flattened once and instanced by material. */
export function createCozyLandscape(scene:THREE.Scene,kit:THREE.Object3D){
 const root=new THREE.Group();root.name='CozyLandscape';scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),batches:Batch[]=[],terrainObjects:THREE.Object3D[]=[],groundColors:{geometry:THREE.BufferGeometry;normal:Float32Array;snow:Float32Array}[]=[],materialColors:{material:THREE.MeshStandardMaterial;color:THREE.Color;frost:number}[]=[];
 const dummy=new THREE.Object3D(),white=new THREE.Color('#f1f5ec');let lastFrozen:boolean|undefined,lastX=1e9,lastZ=1e9,lastWind=-1,lastView:CozyLandscapeState['view']=undefined,lastCull=false,lastCameraX=1e9,lastCameraZ=1e9,lastYaw=1e9,lastAspect=0,lastEye=0,lastSpread=0;
 const ownGeometry=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g};
 const ownMaterial=<T extends THREE.Material>(m:T)=>{materials.add(m);return m};
 const palette={sand:new THREE.Color('#e4d1a5'),wet:new THREE.Color('#b8b68e'),grass:new THREE.Color('#7e9855'),moss:new THREE.Color('#627d48'),stone:new THREE.Color('#89917b'),snow:new THREE.Color('#edf2ee'),shade:new THREE.Color('#b9cad0')};
 let mainland:THREE.Mesh|undefined;
 const ground=ownMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97,metalness:0}));ground.name='Cozy living sand and moss';
 function finishTerrain(geometry:THREE.BufferGeometry,name:string){
  geometry.computeVertexNormals();const pos=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),colors=new Float32Array(pos.count*3),snow=new Float32Array(pos.count*3),color=new THREE.Color(),winter=new THREE.Color();
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),coast=cozyMainlandCoast(x),onMain=z<=coast+.002;
   const island=onMain?undefined:islands.find(s=>Math.hypot((x-s.x)/s.rx,(z-s.z)/s.rz)<1.14);
   const r=island?Math.hypot((x-island.x)/island.rx,(z-island.z)/island.rz):1;
   const grass=onMain?smooth(.95,3.8,coast-z):1-smooth(.60,.91,r);
   const variation=.5+.5*Math.sin(x*2.7+Math.sin(z*3.2)*.6)*Math.cos(z*2.5+x*.27);
   color.copy(palette.wet).lerp(palette.sand,onMain?smooth(.02,.7,coast-z):smooth(.98,.80,r));
   color.lerp(palette.grass,grass*.9).lerp(palette.moss,grass*variation*.25);
   const slope=1-normal.getY(i),stone=smooth(.25,.70,slope)*smooth(.45,1.4,y);
   color.lerp(palette.stone,stone*.78);color.multiplyScalar(.96+variation*.07);
   winter.copy(palette.snow).lerp(palette.shade,clamp(slope*1.4)*.38).multiplyScalar(.97+variation*.035);
   colors.set([color.r,color.g,color.b],i*3);snow.set([winter.r,winter.g,winter.b],i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));groundColors.push({geometry,normal:colors.slice(),snow});ownGeometry(geometry);
  const mesh=new THREE.Mesh(geometry,ground);mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=false;mesh.frustumCulled=false;mesh.userData.cozyGround=true;root.add(mesh);terrainObjects.push(mesh);return mesh;
 }
 // A modest radial tessellation keeps curves smooth without covering ocean with hidden land.
 for(const island of islands){
  const angular=72,rings=island.id==='tiny'?22:34,vertices:number[]=[island.x,terrainHeight(island.x,island.z),island.z],indices:number[]=[];
  for(let ring=1;ring<=rings;ring++){const r=ring/rings;for(let j=0;j<angular;j++){const edge=cozyIslandBoundary(island,j/angular*TAU),x=island.x+(edge.x-island.x)*r,z=island.z+(edge.z-island.z)*r;vertices.push(x,terrainHeight(x,z),z)}}
  for(let j=0;j<angular;j++)indices.push(0,1+(j+1)%angular,1+j);
  for(let ring=1;ring<rings;ring++)for(let j=0;j<angular;j++){const a=1+(ring-1)*angular+j,b=1+(ring-1)*angular+(j+1)%angular,c=1+ring*angular+j,d=1+ring*angular+(j+1)%angular;indices.push(a,b,c,b,d,c)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);finishTerrain(geometry,`Cozy ${island.id} island ground`);
 }
 // Mainland coast is the canonical game coast at every X. Far back is only a visual dune.
 {
  const nx=192,nz=32,vertices:number[]=[],indices:number[]=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-100+i/nx*200,z=cozyMainlandCoast(x)-(j/nz)*26;vertices.push(x,0,z)}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,b,c,b,d,c)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);mainland=finishTerrain(geometry,'Cozy mainland beach and coastal meadow');
 }
 // Flatten only within a prototype's local coordinates, keeping all kit roots independent.
 const prototypeCache=new Map<string,{geometry:THREE.BufferGeometry;material:THREE.Material}[]>();
 function flatten(name:string){
  const cached=prototypeCache.get(name);if(cached)return cached;
  const source=kit.getObjectByName(name);if(!source)throw Error(`Cozy world kit is missing ${name}`);source.updateWorldMatrix(true,true);const inverse=source.matrixWorld.clone().invert(),groups=new Map<THREE.Material,THREE.BufferGeometry[]>();
  source.traverse(node=>{const mesh=node as THREE.Mesh;if(!mesh.isMesh||!mesh.geometry)return;const sourceMaterials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   for(let slot=0;slot<sourceMaterials.length;slot++){
    const material=sourceMaterials[slot];let geometry=mesh.geometry.clone();if(geometry.index){const indexed=geometry;geometry=indexed.toNonIndexed();indexed.dispose()}
    if(sourceMaterials.length>1){const selected=geometry.groups.filter(g=>g.materialIndex===slot),positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv'),p:number[]=[],n:number[]=[],u:number[]=[];for(const g of selected)for(let k=g.start;k<g.start+g.count;k++){p.push(positions.getX(k),positions.getY(k),positions.getZ(k));n.push(normals.getX(k),normals.getY(k),normals.getZ(k));u.push(uv?uv.getX(k):0,uv?uv.getY(k):0)}geometry.dispose();geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(u,2))}
    for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(key))geometry.deleteAttribute(key);if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();if(!geometry.getAttribute('uv'))geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count*2),2));
    geometry.clearGroups();geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));const list=groups.get(material)||[];list.push(geometry);groups.set(material,list);
   }
  });
  const parts:{geometry:THREE.BufferGeometry;material:THREE.Material}[]=[];
  for(const [original,pieces]of groups){const merged=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!merged)continue;ownGeometry(merged);const material=ownMaterial(original.clone());if(material instanceof THREE.MeshStandardMaterial){material.roughness=Math.max(.68,material.roughness);const frost=/leaves|evergreen|grass|stone/i.test(material.name)?.17:0;materialColors.push({material,color:material.color.clone(),frost})}parts.push({geometry:merged,material})}
  prototypeCache.set(name,parts);return parts;
 }
 function batchKit(name:string,placements:Placement[],kind=name,{wind=false,limit=999,near=0,far=72}:{wind?:boolean;limit?:number;near?:number;far?:number}={}){
  for(const part of flatten(name)){
   const mesh=new THREE.InstancedMesh(part.geometry,part.material,placements.length);mesh.name=`${name} instanced ${part.material.name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=name!=='CozyGrass';mesh.receiveShadow=true;mesh.count=0;root.add(mesh);batches.push({mesh,placements,kind,wind,limit,near,far});
  }
 }
 const trees:{oak:Placement[];palm:Placement[];pine:Placement[]}={oak:[],palm:[],pine:[]},rocks:Placement[]=[],grass:Placement[]=[];
 function place(x:number,z:number,scale:number,seed:number):Placement{return{x,z,y:terrainHeight(x,z),scale,angle:hash(seed)*TAU,phase:hash(seed+13)*TAU}}
 // Grove silhouettes frame the first beach without hiding the player or the inviting horizon.
 for(const [i,v]of [[-4.2,-2.1,.95],[-6.2,-4.8,1.1],[4.9,-2.4,1.00],[6.5,-4.2,1.12],[-10,-3.9,.9],[11,-3.6,.95],[-15,-5.0,1.05],[17,-4.6,1.10]].entries())trees.oak.push(place(v[0],v[1],v[2],i+60));
 for(const [i,v]of [[-2.95,-.6,.7],[3.45,-.9,.77],[-8.5,-1.2,.85],[9,-.9,.8]].entries())trees.palm.push(place(v[0],v[1],v[2],i+90));
 for(const island of islands){
  const seed=100+islands.indexOf(island)*100;
  const count=island.id==='tiny'?2:island.id==='fire'?8:island.id==='camping'?7:6;
  let placed=0;
  for(let attempt=0;attempt<100&&placed<count;attempt++){
   const angle=hash(seed+attempt*3)*TAU,r=.40+hash(seed+attempt*3+1)*.35,x=island.x+Math.cos(angle)*island.rx*r,z=island.z+Math.sin(angle)*island.rz*r;
   if(island.id==='fire'&&(Math.hypot(x-fireCenter.x,z-fireCenter.z)<3.45||islandTrailDistance(x,z)<.65))continue;
   if(Math.hypot(x-island.x,z-island.z)<1.25||trees.oak.concat(trees.palm,trees.pine).some(p=>Math.hypot(p.x-x,p.z-z)<1.3))continue;
   const scale=(island.id==='tiny'?.48:.60)+hash(seed+attempt*3+2)*.25,type=island.id==='fire'||island.id==='tiny'||island.id==='coral'?(placed%3===2?'oak':'palm'):island.id==='starlight'?'pine':placed%2?'pine':'oak';
   trees[type].push(place(x,z,scale,seed+attempt+1));placed++;
  }
  for(let i=0;i<12;i++){const angle=i/12*TAU+hash(seed+i)*.25,r=.73+hash(seed+i+20)*.17,x=island.x+Math.cos(angle)*island.rx*r,z=island.z+Math.sin(angle)*island.rz*r;if(island.id==='fire'&&Math.hypot(x,z-fireCenter.z)<2.4)continue;rocks.push(place(x,z,.28+hash(seed+i+5)*.56,seed+i+40))}
  for(let i=0;i<(island.id==='tiny'?5:18);i++){const angle=hash(seed+i*2)*TAU,r=.37+hash(seed+i*2+1)*.48,x=island.x+Math.cos(angle)*island.rx*r,z=island.z+Math.sin(angle)*island.rz*r;if(island.id==='fire'&&(Math.hypot(x,z-fireCenter.z)<2.6||islandTrailDistance(x,z)<.6))continue;grass.push(place(x,z,.7+hash(seed+i+17)*.7,seed+i+23))}
 }
 // A dense enough near meadow to reward the close view, fading into the sandy walking area.
 for(let i=0;i<58;i++){const x=(hash(i+800)-.5)*38,z=-1.55-hash(i+900)*8.8;if(Math.abs(x)<1.3&&z>-3)continue;grass.push(place(x,z,.75+hash(i+811)*.7,i+850));if(i%5===0)rocks.push(place(x,z,.24+hash(i+890)*.3,i+855))}
 // Flowers at the front of the first beach remain in front of the starting camera.
 // Keep the middle 2.4m walking lane clear and use small coastal tufts, not hedges.
 for(let i=0;i<16;i++){const side=i%2===0?-1:1,x=side*(1.3+hash(i+1700)*2.1),z=-1.2-hash(i+1750);grass.push(place(x,z,.68+hash(i+1800)*.27,i+1850))}
 batchKit('CozyOak',trees.oak,'oak',{wind:true,limit:10,far:62});batchKit('CozyPalm',trees.palm,'palm',{wind:true,limit:9,far:62});batchKit('CozyPine',trees.pine,'pine',{wind:true,limit:9,far:62});batchKit('CozyRock',rocks,'rocks',{limit:32,far:65});batchKit('CozyGrass',grass,'grass',{wind:true,limit:48,far:30});
 // Two small far-tree batches preserve the wooded island silhouette without full-detail crowns.
 const trunkGeometry=ownGeometry(new THREE.CylinderGeometry(.11,.17,1.9,7,1)),canopyGeometry=ownGeometry(new THREE.DodecahedronGeometry(.95,1));trunkGeometry.translate(0,.95,0);canopyGeometry.scale(1,.75,1);canopyGeometry.translate(0,2.3,0);
 const farTrunk=ownMaterial(new THREE.MeshStandardMaterial({color:'#987046',roughness:.95})),farLeaf=ownMaterial(new THREE.MeshStandardMaterial({color:'#6e8f52',roughness:1}));materialColors.push({material:farLeaf,color:farLeaf.color.clone(),frost:.30});const allTrees=[...trees.oak,...trees.palm,...trees.pine];
 for(const [geometry,material,name]of [[trunkGeometry,farTrunk,'trunk'],[canopyGeometry,farLeaf,'canopy']] as const){const mesh=new THREE.InstancedMesh(geometry,material,allTrees.length);mesh.name=`Cozy distant grove ${name}`;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;root.add(mesh);batches.push({mesh,placements:allTrees,kind:'farTrees',wind:false,limit:999,near:62,far:190})}
 // Thin snow blankets rest on the real canopy tops and stones, while green sides remain visible.
 const snowGeometry=ownGeometry(new THREE.SphereGeometry(1,14,7,0,TAU,0,Math.PI*.48)),snowMaterial=ownMaterial(new THREE.MeshStandardMaterial({color:'#f2f6ef',roughness:.98}));
 const snowTrees:Placement[]=[],snowRocks:Placement[]=[];
 function canopySnow(p:Placement,x:number,y:number,z:number,size:number){const c=Math.cos(p.angle),s=Math.sin(p.angle);return{...p,x:p.x+(x*c+z*s)*p.scale,z:p.z+(-x*s+z*c)*p.scale,y:p.y+y*p.scale,groundY:p.y,scale:p.scale*size,phase:0}}

 for(const p of [...trees.oak,...trees.palm,...trees.pine]){
  const pine=trees.pine.includes(p),palm=trees.palm.includes(p);
  if(pine){for(let level=0;level<3;level++)snowTrees.push(canopySnow(p,0,1.05+level*.68,0,.83-level*.18))}
  else if(palm){snowTrees.push(canopySnow(p,.32,2.72,0,.67))}
  else{for(const [x,z,y,s]of [[-.45,0,2.47,.66],[.45,-.1,2.74,.63],[-.15,.25,3.28,.7]])snowTrees.push(canopySnow(p,x,y,z,s))}
 }
 for(const p of rocks)snowRocks.push({...p,y:p.y+.52*p.scale,groundY:p.y,scale:p.scale*.48,phase:0});
 for(const [placements,kind,stretch]of [[snowTrees,'snowTrees',new THREE.Vector3(1,.21,1)],[snowRocks,'snowRocks',new THREE.Vector3(1,.18,.8)]] as const){const mesh=new THREE.InstancedMesh(snowGeometry,snowMaterial,placements.length);mesh.name=`Cozy ${kind} blankets`;mesh.visible=false;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;mesh.count=0;root.add(mesh);batches.push({mesh,placements,kind,wind:false,limit:110,near:0,far:85,stretch})}
 // Lanterns make the camp feel inhabited; their brightness is handled by the shared scene light.
 const lanterns=[place(-2.3,25.35,.62,1200),place(2.5,25.9,.62,1201),place(16.1,60.0,.75,1202),place(20.3,62.5,.60,1203)];batchKit('CozyLantern',lanterns,'lanterns',{far:90});
 batchKit('CozyTent',[place(18.1,62.4,.85,1300),place(20.7,63.7,.72,1301)],'tents',{far:100});
 // Hand-rounded landmarks make each distant island worth a quiet visit.
 const landmarkRoot=new THREE.Group();landmarkRoot.name='Cozy island landmarks';root.add(landmarkRoot);
 function staticMesh(geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number,scale?:THREE.Vector3){ownGeometry(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);if(scale)mesh.scale.copy(scale);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;landmarkRoot.add(mesh);return mesh}
 const ruin=ownMaterial(new THREE.MeshStandardMaterial({color:'#b3b6a0',roughness:.98})),ruinDark=ownMaterial(new THREE.MeshStandardMaterial({color:'#8c9e89',roughness:1})),coral=ownMaterial(new THREE.MeshStandardMaterial({color:'#dca49a',roughness:.72})),pearl=ownMaterial(new THREE.MeshStandardMaterial({color:'#fff0cf',roughness:.28,metalness:.12})),tower=ownMaterial(new THREE.MeshStandardMaterial({color:'#e9dcca',roughness:.78})),towerRoof=ownMaterial(new THREE.MeshStandardMaterial({color:'#718d95',roughness:.55})),lightGlass=ownMaterial(new THREE.MeshStandardMaterial({color:'#ffe8b1',emissive:'#e4b25a',emissiveIntensity:.65,roughness:.35}));
 const mistY=terrainHeight(55,145);
 for(const side of [-1,1]){const post=staticMesh(new THREE.CapsuleGeometry(.26,1.28,4,10),ruin,55+side*.81,mistY+.86,145);post.rotation.z=side*.055;staticMesh(new THREE.SphereGeometry(.38,10,6),ruinDark,55+side*.81,mistY+1.84,145,new THREE.Vector3(1,.38,1))}
 staticMesh(new THREE.CapsuleGeometry(.24,1.45,4,10),ruin,55,mistY+2.02,145).rotation.z=Math.PI/2;
 for(let i=0;i<6;i++)staticMesh(new THREE.IcosahedronGeometry(.38,1),i%2?ruin:ruinDark,55+Math.sin(i*.8)*.2,terrainHeight(55,142.2+i*.45)+.035,142.2+i*.45,new THREE.Vector3(1,.1,.7));
 const starY=terrainHeight(-52,235);staticMesh(new THREE.CylinderGeometry(.44,.65,1.8,16),tower,-52,starY+.90,235);staticMesh(new THREE.CylinderGeometry(.50,.50,.52,16),lightGlass,-52,starY+1.99,235);staticMesh(new THREE.ConeGeometry(.72,.65,16),towerRoof,-52,starY+2.55,235);staticMesh(new THREE.SphereGeometry(.15,12,8),pearl,-52,starY+2.95,235);
 // Organic, rounded coral branches are merged by material rather than separate draw calls.
 const coralParts:THREE.BufferGeometry[]=[];
 for(let i=0;i<10;i++){const angle=i/10*TAU,x=-42+Math.cos(angle)*1.20,z=80+Math.sin(angle)*.9,y=terrainHeight(x,z);for(let j=0;j<3;j++){const height=.45+hash(i*3+j+2000)*.45,geometry=new THREE.CapsuleGeometry(.07,height,3,7);geometry.rotateZ((j-1)*.42);geometry.translate(x+(j-1)*.09,y+height*.5+.08,z);coralParts.push(geometry)}}
 const mergedCoral=mergeGeometries(coralParts,false);coralParts.forEach(g=>g.dispose());if(mergedCoral)staticMesh(mergedCoral,coral,0,0,0);staticMesh(new THREE.SphereGeometry(.28,16,10),pearl,-42,terrainHeight(-42,80)+.31,80);
 // Prime instance buffers so the first render is complete before readiness is announced.
 const selected=new Map<string,Placement[]>();
 function choose(batch:Batch,state:CozyLandscapeState){const key=`${batch.kind}:${batch.near}:${batch.far}:${batch.limit}`;let values=selected.get(key);if(values)return values;values=batch.placements.filter(p=>{const d=Math.hypot(p.x-state.centerX,p.z-state.centerZ);return d>=batch.near&&d<=batch.far&&cozyDecorationInView(p.x,p.z,state)}).sort((a,b)=>(a.x-state.centerX)**2+(a.z-state.centerZ)**2-(b.x-state.centerX)**2-(b.z-state.centerZ)**2).slice(0,batch.limit);selected.set(key,values);return values}
 function update(state:CozyLandscapeState){
  if(mainland&&Math.abs(state.centerX-mainland.position.x)>45){const shift=Math.round(state.centerX/32)*32,positions=mainland.geometry.getAttribute('position');for(let j=0;j<=32;j++)for(let i=0;i<=192;i++){const index=j*193+i;positions.setZ(index,cozyMainlandCoast(positions.getX(index)+shift)-j/32*26)}positions.needsUpdate=true;mainland.position.x=shift;mainland.geometry.computeBoundingSphere()}
  const hasLens=hasCozyLens(state),cameraChanged=hasLens!==lastCull||state.view!==lastView||(hasLens&&(Math.hypot(state.cameraX-lastCameraX,state.cameraZ-lastCameraZ)>.25||Math.abs(Math.atan2(Math.sin(state.yaw-lastYaw),Math.cos(state.yaw-lastYaw)))>.035||Math.abs(state.aspect-lastAspect)>.005||Math.abs(state.eye-lastEye)>.01||Math.abs(state.spread-lastSpread)>.01));
  const moved=cameraChanged||Math.hypot(state.centerX-lastX,state.centerZ-lastZ)>1.2,seasonChanged=lastFrozen!==state.frozen,windTime=state.reducedMotion?0:Math.floor(state.time*8)/8,windChanged=windTime!==lastWind;
  if(seasonChanged){lastFrozen=state.frozen;for(const item of groundColors){(item.geometry.getAttribute('color') as THREE.BufferAttribute).array.set(state.frozen?item.snow:item.normal);item.geometry.getAttribute('color').needsUpdate=true}for(const item of materialColors)item.material.color.copy(item.color).lerp(white,state.frozen?item.frost:0)}
  if(!moved&&!seasonChanged&&!windChanged)return;
  if(moved||seasonChanged){selected.clear();lastX=state.centerX;lastZ=state.centerZ;lastCull=hasLens;lastView=state.view;if(hasLens){lastCameraX=state.cameraX;lastCameraZ=state.cameraZ;lastYaw=state.yaw;lastAspect=state.aspect;lastEye=state.eye;lastSpread=state.spread}}
  for(const batch of batches){
   const isSnow=batch.kind.startsWith('snow');batch.mesh.visible=!isSnow||state.frozen;if(!batch.mesh.visible)continue;
   if(!moved&&!seasonChanged&&(!batch.wind||!windChanged))continue;
   const values=choose(batch,state);batch.mesh.count=values.length;
   for(let i=0;i<values.length;i++){const p=values[i],sway=batch.wind&&!state.reducedMotion?Math.sin(windTime*.52+p.phase)*.012:0;const baseY=p.groundY??p.y;dummy.position.set(p.x,baseY+(p.y-baseY)*propHeightScale,p.z);dummy.rotation.set(sway,p.angle,sway*.55);dummy.scale.set(p.scale,p.scale*propHeightScale,p.scale);if(batch.stretch)dummy.scale.multiply(batch.stretch);dummy.updateMatrix();batch.mesh.setMatrixAt(i,dummy.matrix)}
   batch.mesh.instanceMatrix.needsUpdate=true;
  }
  lastWind=windTime;root.userData.frozen=state.frozen;
 }
 update({time:0,delta:0,mood:'day',frozen:false,reducedMotion:true,centerX:0,centerZ:-2.5});
 root.userData.statistics={terrainVertices:terrainObjects.reduce((sum,o)=>sum+(o as THREE.Mesh).geometry.getAttribute('position').count,0),drawCalls:root.children.filter(o=>(o as THREE.Mesh).isMesh).length+landmarkRoot.children.length,trees:allTrees.length,grassClusters:grass.length,instancedBatches:batches.length,propHeightScale};
 function dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());for(const batch of batches)batch.mesh.dispose();root.clear()}
 return{update,dispose,terrainObjects,root};
}
