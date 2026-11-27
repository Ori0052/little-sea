import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {terrainHeight,tinyCenter} from './island-terrain';
import {campPosition,campCapacity} from './camp-space';
import {christmasTreeSites} from './christmas-tree-mesh';
import {winterGiftPosition} from '../lib/sea-winter';

type RideKind='tube'|'raft'|'skis'|'sled'|'rudolph'|'crown';
type XYZ=readonly [number,number,number];
const cream='#f3e5c9',wood='#b47c45',gold='#dfb55c',ruby='#a34e4d',teal='#719e9b';
const rideCache=new Map<string,THREE.Group>();
const coloredMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.76,metalness:.035});

/** One vertex-coloured mesh per part family, rather than a material/draw call per detail. */
class Sculpt {
 private pieces:THREE.BufferGeometry[]=[];
 add(source:THREE.BufferGeometry,color:THREE.ColorRepresentation,position:XYZ=[0,0,0],scale:XYZ=[1,1,1],rotation:XYZ=[0,0,0]){
  const g=source.index?source.toNonIndexed():source;
  if(g!==source)source.dispose();
  for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);
  if(!g.getAttribute('normal'))g.computeVertexNormals();
  const c=new THREE.Color(color),a=new Float32Array(g.getAttribute('position').count*3);
  for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b}
  g.setAttribute('color',new THREE.BufferAttribute(a,3));
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));
  this.pieces.push(g);return this;
 }
 box(size:XYZ,position:XYZ,color:THREE.ColorRepresentation,radius=.025,rotation:XYZ=[0,0,0]){return this.add(new RoundedBoxGeometry(...size,2,Math.min(radius,...size.map(v=>v*.45))),color,position,[1,1,1],rotation)}
 ball(size:XYZ,position:XYZ,color:THREE.ColorRepresentation){return this.add(new THREE.SphereGeometry(1,12,8),color,position,size)}
 cylinder(radius:number,length:number,position:XYZ,color:THREE.ColorRepresentation,rotation:XYZ=[0,0,0],top=radius){return this.add(new THREE.CylinderGeometry(top,radius,length,10),color,position,[1,1,1],rotation)}
 line(points:XYZ[],radius:number,color:THREE.ColorRepresentation){return this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(6,points.length*3),radius,5,false),color)}
 finish(){const merged=mergeGeometries(this.pieces,false);for(const g of this.pieces)g.dispose();this.pieces=[];if(!merged)throw new Error('Could not assemble cozy prop');merged.computeBoundingSphere();return merged}
}
function mesh(geometry:THREE.BufferGeometry,name:string,material:THREE.Material=coloredMaterial){const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;return m}

function addSled(s:Sculpt){
 for(const x of[-.4,.4]){
  s.line([[x,.045,-.72],[x,.035,-.45],[x,.035,.42],[x,.11,.69],[x,.26,.76]],.035,gold);
  for(const z of[-.45,.4])s.cylinder(.028,.18,[x,.13,z],wood);
 }
 for(let i=0;i<6;i++)s.box([.145,.07,1.28],[(i-2.5)*.16,.245,0],i%2?'#c89454':'#d5a260',.025);
 s.box([.92,.3,.09],[0,.43,-.61],ruby,.04);
 s.box([.98,.06,.13],[0,.59,-.61],gold,.025);
 s.box([.72,.07,.66],[0,.32,-.19],'#b56860',.035);
 for(const x of[-.46,.46])s.line([[x,.31,-.6],[x,.46,-.2],[x,.3,.49]],.035,ruby);
}
function reindeerGeometry(){
 const s=new Sculpt();
 s.ball([.21,.24,.31],[0,.42,1.02],'#ba8352');
 s.ball([.16,.27,.14],[0,.65,1.2],'#c38d5c');
 s.ball([.2,.2,.21],[0,.84,1.28],'#c99763');
 s.ball([.15,.095,.13],[0,.76,1.46],'#ead0a5');
 s.ball([.063,.058,.057],[0,.81,1.56],'#c54541');
 for(const x of[-.105,.105]){
  s.ball([.04,.047,.023],[x,.877,1.46],'#352c27');s.ball([.012,.014,.01],[x-.01,.891,1.48],cream);
  s.ball([.075,.13,.045],[x*1.8,.99,1.24],'#bb8458');s.ball([.037,.08,.023],[x*1.8,1,1.277],'#e6bea0');
  s.line([[x,.96,1.23],[x*1.2,1.1,1.18],[x*1.7,1.22,1.19]],.024,'#76533b');
  s.line([[x*1.25,1.09,1.18],[x*2,1.13,1.12]],.018,'#76533b');
  for(const z of[.83,1.14]){s.cylinder(.035,.28,[x,.19,z],'#ad774c');s.ball([.052,.045,.065],[x,.045,z+.025],'#5b4334')}
 }
 s.ball([.09,.08,.13],[0,.48,.72],cream);
 s.add(new THREE.TorusGeometry(.17,.025,6,20),ruby,[0,.65,1.18],[1,1,1],[Math.PI*.42,0,0]);
 for(const x of[-.09,.09])s.ball([.025,.027,.025],[x,.58,1.33],gold);
 return s.finish();
}

/** Feet at Y0; local +Z is forward. Returned meshes share immutable cached geometry. */
export function createCozyRide(kind:RideKind,color?:string):THREE.Group{
 const key=kind+':'+(color||'default'),cached=rideCache.get(key);if(cached)return cached.clone(true);
 const root=new THREE.Group();root.name='CozyRide_'+kind;const s=new Sculpt();
 if(kind==='tube'){
  s.add(new THREE.TorusGeometry(.38,.105,10,40),color||'#e6b0bc',[0,.3,0],[1,1,1],[Math.PI/2,0,0]);
  for(const a of[.1,Math.PI+.1])s.add(new THREE.TorusGeometry(.38,.108,8,10,.42),cream,[0,.3,0],[1,1,1],[Math.PI/2,0,a]);
  for(const x of[-.43,.43])s.box([.1,.035,.07],[x,.375,0],cream,.016);
 }else if(kind==='raft'){
  for(let i=0;i<6;i++){const x=(i-2.5)*.18;s.add(new THREE.CapsuleGeometry(.098,1.2,3,10),i%2?'#c59861':'#b58650',[x,.12,0],[1,1,1],[Math.PI/2,0,0]);for(const z of[-.7,.7])s.cylinder(.065,.008,[x,.12,z],'#e2b77c',[Math.PI/2,0,0])}
  for(const z of[-.42,.42])s.line([[-.54,.17,z],[-.3,.23,z],[0,.225,z],[.3,.23,z],[.54,.17,z]],.024,'#82775a');
  s.box([.68,.07,.34],[0,.25,-.1],wood,.025);
 }else if(kind==='skis'){
  for(const x of[-.18,.18]){s.box([.13,.055,1.16],[x,.045,-.08],cream,.028);s.line([[x,.05,.4],[x,.07,.6],[x,.145,.71]],.06,teal);s.box([.035,.011,1.06],[x,.08,-.13],teal,.006);s.box([.14,.075,.15],[x,.1,-.03],'#696b60',.018);s.box([.14,.04,.09],[x,.09,-.32],'#7f8b7d',.012)}
 }else if(kind==='sled'||kind==='rudolph'){
  addSled(s);if(kind==='rudolph'){for(const x of[-.3,.3])s.line([[x,.34,.53],[x*.55,.45,.8],[x*.4,.56,1.2]],.013,gold);root.add(mesh(reindeerGeometry(),'RudolphDeer'))}
 }else{
  s.add(new THREE.TorusGeometry(.151,.024,8,32),gold,[0,.032,0],[1,1,1],[Math.PI/2,0,0]);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,x=Math.cos(a)*.15,z=Math.sin(a)*.15;s.add(new THREE.ConeGeometry(.039,.11,6),gold,[x,.088,z]);s.ball([.021,.023,.021],[x,.15,z],cream)}
 }
 root.add(mesh(s.finish(),'CozyRideBody_'+kind));root.scale.y=2;rideCache.set(key,root);return root.clone(true);
}

function flattenKit(kit:THREE.Object3D,name:string){
 const source=kit.getObjectByName(name);if(!source)return null;source.updateWorldMatrix(true,true);const inverse=source.matrixWorld.clone().invert(),pieces:THREE.BufferGeometry[]=[];
 source.traverse(node=>{const m=node as THREE.Mesh;if(!m.isMesh||!m.geometry)return;let g=m.geometry.clone();if(g.index){const full=g.toNonIndexed();g.dispose();g=full}for(const key of Object.keys(g.attributes))if(!['position','normal','color'].includes(key))g.deleteAttribute(key);if(!g.getAttribute('normal'))g.computeVertexNormals();const base=(Array.isArray(m.material)?m.material[0]:m.material) as THREE.MeshStandardMaterial,c=base.color||new THREE.Color(1,1,1),old=g.getAttribute('color'),a=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<a.length/3;i++){a[i*3]=(old?.getX(i)??1)*c.r;a[i*3+1]=(old?.getY(i)??1)*c.g;a[i*3+2]=(old?.getZ(i)??1)*c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));pieces.push(g)});
 if(!pieces.length)return null;const joined=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());return joined;
}
function paperGeometry(){const positions:number[]=[],colors:number[]=[],c=new THREE.Color();const tri=(a:XYZ,b:XYZ,d:XYZ,tone:string)=>{positions.push(...a,...b,...d);c.set(tone);for(let i=0;i<3;i++)colors.push(c.r,c.g,c.b)};const tip:XYZ=[0,.2,0],left:XYZ=[-.23,.06,0],right:XYZ=[.23,.06,0],front:XYZ=[0,.025,.13],back:XYZ=[0,.025,-.13];tri(left,tip,front,cream);tri(tip,right,front,'#fff5df');tri(left,back,tip,'#d6cce1');tri(tip,back,right,'#eee1d2');tri(left,front,[0,-.015,.05],'#d6b9a5');tri(front,right,[0,-.015,.05],'#eed9bc');tri(right,back,[0,-.015,-.05],'#cbb9cf');tri(back,left,[0,-.015,-.05],'#e5d4cf');const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g}
function shellGeometry(){
 const p:number[]=[],color:number[]=[],indices:number[]=[],c=new THREE.Color();const rings=10,sides=24;
 for(let r=0;r<=rings;r++)for(let i=0;i<=sides;i++){const u=r/rings,a=i/sides*Math.PI,rad=.17*u*(1+.035*Math.cos(a*12));p.push(Math.cos(a)*rad,.012+.05*(1-u*u)+Math.cos(a*12)*.008*u,Math.sin(a)*rad-.055);c.set(i%4<2?'#dfaea6':'#f2d7c1');color.push(c.r,c.g,c.b)}
 for(let r=0;r<rings;r++)for(let i=0;i<sides;i++){const a=r*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function canopyGeometry(open=false){
 const s=new Sculpt();s.box([1.62,.035,1.34],[0,.025,0],'#e0d7b9',.018);
 for(let i=0;i<6;i++)s.box([1.6,.004,.035],[0,.046,-.52+i*.2],i%2?'#aac2b5':'#f3e8ce',.001);
 for(const x of[-.42,.42])s.box([.46,.1,.35],[x,.1,-.38],x<0?'#b3c5b8':'#d8c4c4',.045);
 if(open)return s.finish();
 for(const x of[-.7,.7])for(const z of[-.5,.5])s.cylinder(.026,1.48,[x,.77,z],'#b29368');
 const p:number[]=[],indices:number[]=[],rows=6,cols=10;
 for(let z=0;z<=rows;z++)for(let x=0;x<=cols;x++){const a=(x/cols-.5)*1.8,b=(z/rows-.5)*1.4;p.push(a,1.51+.21*(1-(a/.9)**2)-.055*(b/.7)**2,b)}
 for(let z=0;z<rows;z++)for(let x=0;x<cols;x++){const a=z*(cols+1)+x,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1)}const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(p,3));roof.setIndex(indices);roof.computeVertexNormals();s.add(roof,'#e9e1c9');
 s.line([[-.9,1.47,-.7],[-.4,1.65,-.7],[.4,1.65,-.7],[.9,1.47,-.7]],.023,'#b7c9ba');s.line([[-.9,1.47,.7],[-.4,1.65,.7],[.4,1.65,.7],[.9,1.47,.7]],.023,'#b7c9ba');return s.finish();
}
function giftGeometry(){const s=new Sculpt();s.box([.43,.36,.43],[0,.2,0],ruby,.055);s.box([.47,.08,.47],[0,.4,0],'#b35b55',.025);s.box([.075,.39,.44],[0,.21,0],gold,.012);s.box([.44,.39,.075],[0,.21,0],gold,.012);for(const x of[-.085,.085])s.add(new THREE.TorusGeometry(.075,.022,6,20),gold,[x,.47,0],[1,.6,1],[Math.PI/2,.5,x<0?-.4:.4]);s.ball([.042,.035,.04],[0,.48,0],gold);return s.finish()}
function chestGeometry(){const s=new Sculpt();s.box([.62,.34,.4],[0,.2,0],wood,.035);s.add(new THREE.CapsuleGeometry(.2,.26,3,12),'#c29658',[0,.4,0],[1,1,.94],[0,0,Math.PI/2]);for(const x of[-.2,.2]){s.box([.035,.43,.41],[x,.25,0],gold,.008);s.add(new THREE.TorusGeometry(.205,.018,6,20,Math.PI),gold,[x,.39,0],[1,1,1],[0,Math.PI/2,0])}s.box([.095,.12,.04],[0,.32,.222],gold,.012);s.ball([.014,.02,.01],[0,.32,.247],'#5e5141');return s.finish()}
function starGeometry(){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.075:.16,x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.008})}

type WorldPropState={time:number;delta:number;frozen:boolean;reducedMotion:boolean;world:HTMLElement|null;actorX:number;actorZ:number;ownSeat?:number|null};
/** Preallocated scene pools mirror the DOM's interactive points without replacing their actions. */
export function createCozyWorldProps(scene:THREE.Scene,kit:THREE.Object3D){
 const root=new THREE.Group();root.name='CozyInteractiveProps';scene.add(root);const ownedGeometries=new Set<THREE.BufferGeometry>(),ownedMaterials=new Set<THREE.Material>();
 const standard=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.025,side:THREE.DoubleSide});ownedMaterials.add(standard);
 const own=(g:THREE.BufferGeometry)=>{ownedGeometries.add(g);return g};
 function pool(geometry:THREE.BufferGeometry,capacity:number,name:string,material:THREE.Material=standard){const m=new THREE.InstancedMesh(own(geometry),material,capacity);m.name=name;m.count=0;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(m);return m}
 const paper=pool(flattenKit(kit,'CozyPaperboat')||paperGeometry(),16,'CozyPaperboats'),shells=pool(shellGeometry(),16,'CozyBeachShells'),canopies=pool(canopyGeometry(),campCapacity,'CozyBeachCanopies'),blankets=pool(canopyGeometry(true),campCapacity,'CozyBeachBlankets');
 const pickupRaft=createCozyRide('raft'),pickupSled=createCozyRide('sled');pickupRaft.name='CozyPickupRaft';pickupSled.name='CozyPickupSled';root.add(pickupRaft,pickupSled);
 const gift=mesh(own(giftGeometry()),'CozyWinterGift',standard),chest=mesh(own(chestGeometry()),'CozyTreasureChest',standard);root.add(gift,chest);
 const winter=new THREE.Group();winter.name='CozySeasonalTrees';root.add(winter);
 let pine=flattenKit(kit,'CozyPine');
 if(!pine){const s=new Sculpt();s.cylinder(.09,.5,[0,.25,0],wood);for(let i=0;i<5;i++)s.add(new THREE.ConeGeometry(.73-i*.12,.8,16),'#69856a',[0,.7+i*.36,0]);pine=s.finish()}
 pine.computeBoundingBox();const bounds=pine.boundingBox!,height=Math.max(.1,bounds.max.y-bounds.min.y),scale=2.45/height;pine.translate(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);pine.scale(scale,scale,scale);
 const trees=new THREE.InstancedMesh(own(pine),standard,christmasTreeSites.length);trees.name='CozyWinterPines';trees.castShadow=true;trees.receiveShadow=true;trees.frustumCulled=false;winter.add(trees);
 const ornaments=new THREE.InstancedMesh(own(new THREE.SphereGeometry(.065,10,7)),standard,christmasTreeSites.length*24);ornaments.name='CozyWinterBaubles';ornaments.castShadow=true;ornaments.frustumCulled=false;winter.add(ornaments);
 const bulbMaterial=new THREE.MeshBasicMaterial({color:'#ffdf9d',toneMapped:false});ownedMaterials.add(bulbMaterial);const bulbs=new THREE.InstancedMesh(own(new THREE.SphereGeometry(.022,6,4)),bulbMaterial,christmasTreeSites.length*32);bulbs.name='CozyWinterLights';bulbs.frustumCulled=false;winter.add(bulbs);
 const starSculpt=new Sculpt();starSculpt.add(starGeometry(),gold);const stars=new THREE.InstancedMesh(own(starSculpt.finish()),standard,christmasTreeSites.length);stars.name='CozyWinterStars';stars.frustumCulled=false;winter.add(stars);
 const dummy=new THREE.Object3D(),tint=new THREE.Color();
 const place=(p:THREE.InstancedMesh,i:number,x:number,y:number,z:number,s=1,yaw=0)=>{dummy.position.set(x,y,z);dummy.scale.set(s,s*2,s);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();p.setMatrixAt(i,dummy.matrix)};
 christmasTreeSites.forEach((site,index)=>{const y=terrainHeight(site.x,site.z),s=site.scale;place(trees,index,site.x,y,site.z,s);place(stars,index,site.x,y+5*s,site.z,s);
  for(let n=0;n<24;n++){const h=.52+(n%6)*.29,a=n*2.39996,r=Math.max(.13,.69-h*.22);place(ornaments,index*24+n,site.x+Math.cos(a)*r*s,y+h*s*2,site.z+Math.sin(a)*r*s,s);ornaments.setColorAt(index*24+n,tint.set(n%3===0?'#ac4844':n%3===1?'#e3b85e':'#f3e2bb'))}
  for(let n=0;n<32;n++){const h=.4+n/31*1.88,a=n*.77,r=Math.max(.07,.72-h*.25);place(bulbs,index*32+n,site.x+Math.cos(a)*r*s,y+h*s*2,site.z+Math.sin(a)*r*s,s)}
 });
 for(const p of[trees,stars,ornaments,bulbs])p.instanceMatrix.needsUpdate=true;if(ornaments.instanceColor)ornaments.instanceColor.needsUpdate=true;
 let lastScan=-Infinity,lastFrozen=false,disposed=false;const boatPoints:{x:number;z:number;phase:number}[]=[];
 function scan(state:WorldPropState){
  const scope=state.world?.closest('main.sea')||state.world;if(!scope){paper.count=shells.count=canopies.count=blankets.count=0;pickupRaft.visible=pickupSled.visible=gift.visible=chest.visible=false;return}
  boatPoints.length=0;for(const el of Array.from(scope.querySelectorAll<HTMLElement>('.paper-boat[data-world-x][data-world-z]')).slice(0,16)){const x=Number(el.dataset.worldX),z=Number(el.dataset.worldZ);if(Number.isFinite(x)&&Number.isFinite(z))boatPoints.push({x,z,phase:x*.73+z*.29})}
  paper.count=boatPoints.length;let n=0;for(const el of Array.from(scope.querySelectorAll<HTMLElement>('.beach-shell[data-world-x][data-world-z]')).slice(0,16)){const x=Number(el.dataset.worldX),z=Number(el.dataset.worldZ);if(Number.isFinite(x)&&Number.isFinite(z)){place(shells,n++,x,terrainHeight(x,z)+.015,z,1,x*.13)}}shells.count=n;shells.instanceMatrix.needsUpdate=true;
  n=0;let matCount=0;const campIds=Array.from(scope.querySelectorAll<HTMLElement>('.beach-camp[data-seat-id]')).map(el=>Number(el.dataset.seatId));if(state.ownSeat!=null&&!campIds.includes(state.ownSeat))campIds.push(state.ownSeat);for(const id of campIds.slice(0,campCapacity)){if(!Number.isInteger(id)||id<0||id>=campCapacity)continue;const p=campPosition(id),open=Math.abs(p.x)<2.6||id===state.ownSeat;place(open?blankets:canopies,open?matCount++:n++,p.x,terrainHeight(p.x,p.z),p.z,1,0)}canopies.count=n;blankets.count=matCount;canopies.instanceMatrix.needsUpdate=blankets.instanceMatrix.needsUpdate=true;
  const raftVisible=!!scope.querySelector('.drifting-raft');pickupRaft.visible=raftVisible&&!state.frozen;pickupSled.visible=raftVisible&&state.frozen;for(const g of[pickupRaft,pickupSled]){g.position.set(2.7,.02,7.5);g.rotation.y=.24}
  gift.visible=state.frozen&&!!scope.querySelector('.winter-gift');gift.position.set(winterGiftPosition.x,terrainHeight(winterGiftPosition.x,winterGiftPosition.z)+.025,winterGiftPosition.z);gift.rotation.y=.3;gift.scale.y=2;
  chest.visible=!!scope.querySelector('.island-treasure');chest.position.set(tinyCenter.x,terrainHeight(tinyCenter.x,tinyCenter.z),tinyCenter.z);chest.rotation.y=.4;chest.scale.y=2;
 }
 return{root,
  update(state:WorldPropState){if(disposed)return;winter.visible=state.frozen;if(state.time-lastScan>.14||state.frozen!==lastFrozen){lastScan=state.time;lastFrozen=state.frozen;scan(state)}for(let i=0;i<boatPoints.length;i++){const p=boatPoints[i],bob=state.frozen||state.reducedMotion?0:Math.sin(state.time*.9+p.phase)*.014;place(paper,i,p.x,.045+bob,p.z,1,Math.sin(p.phase)*.34+(state.reducedMotion?0:Math.sin(state.time*.35+p.phase)*.025))}paper.instanceMatrix.needsUpdate=true;if(!state.reducedMotion&&pickupRaft.visible)pickupRaft.position.y=.025+Math.sin(state.time*.8)*.015},
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of ownedGeometries)g.dispose();for(const m of ownedMaterials)m.dispose();paper.dispose();shells.dispose();canopies.dispose();blankets.dispose();trees.dispose();ornaments.dispose();bulbs.dispose();stars.dispose()},
 };
}
