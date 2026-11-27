import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {castWaitMs} from './fishing-space';

export type CozyFishingState={active:boolean;rod:THREE.Object3D|null;tip:THREE.Vector3;spot:{x:number;z:number};surface:number;time:number;clock:number;readyAt?:number;reducedMotion:boolean};
export const cozyCastDurationMs=850;
export function cozyCastProgress(clock:number,readyAt?:number){if(readyAt===undefined||!Number.isFinite(readyAt))return 1;return Math.max(0,Math.min(1,(clock-(readyAt-castWaitMs))/cozyCastDurationMs))}

type XYZ=readonly [number,number,number];
/** Small, untextured toy props share a single vertex-coloured material. */
function combine(parts:{geometry:THREE.BufferGeometry;color:string;position?:XYZ;scale?:XYZ;rotation?:XYZ}[]){
 const geometries:THREE.BufferGeometry[]=[],color=new THREE.Color(),matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 for(const part of parts){const source=part.geometry,g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();for(const name of Object.keys(g.attributes))if(!['position','normal'].includes(name))g.deleteAttribute(name);if(!g.getAttribute('normal'))g.computeVertexNormals();color.set(part.color);const values=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<values.length;i+=3){values[i]=color.r;values[i+1]=color.g;values[i+2]=color.b}g.setAttribute('color',new THREE.BufferAttribute(values,3));p.set(...(part.position||[0,0,0]));q.setFromEuler(new THREE.Euler(...(part.rotation||[0,0,0])));scale.set(...(part.scale||[1,1,1]));matrix.compose(p,q,scale);g.applyMatrix4(matrix);geometries.push(g)}
 const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)throw new Error('Could not build cozy fishing prop');geometry.computeBoundingSphere();return geometry;
}
function bobberGeometry(){return combine([
 {geometry:new THREE.SphereGeometry(1,12,8),color:'#eee6ca',position:[0,.015,0],scale:[.042,.075,.042]},
 {geometry:new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.46),color:'#b75c50',position:[0,.015,0],scale:[.043,.077,.043]},
 {geometry:new THREE.CapsuleGeometry(.014,.065,2,8),color:'#aa5849',position:[0,-.068,0]},
 {geometry:new THREE.CylinderGeometry(.005,.005,.115,6),color:'#f0dfb5',position:[0,.125,0]},
 {geometry:new THREE.SphereGeometry(.009,8,5),color:'#c98260',position:[0,.185,0]},
 ])}

/** The parent supplies the actual GLB rod tip, already in canonical world space. */
export function createCozyFishing(scene:THREE.Scene){
 const root=new THREE.Group();root.name='CozyFishing';root.visible=false;scene.add(root);
 const positions=new Float32Array(32*3),geometry=new THREE.BufferGeometry(),attribute=new THREE.BufferAttribute(positions,3);attribute.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('position',attribute);geometry.setDrawRange(0,32);
 const lineMaterial=new THREE.LineBasicMaterial({color:'#eee6cc',transparent:true,opacity:.82,depthWrite:false,toneMapped:true});const line=new THREE.Line(geometry,lineMaterial);line.name='CozyFishingLine';line.frustumCulled=false;line.renderOrder=3;root.add(line);
 const floatMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.57,metalness:.025});const floatGeometry=bobberGeometry(),float=new THREE.Mesh(floatGeometry,floatMaterial);float.name='CozyFishingBobber';float.castShadow=true;float.receiveShadow=true;float.frustumCulled=false;root.add(float);
 const ringGeometry=new THREE.RingGeometry(.93,1,40),ringMaterials=[new THREE.MeshBasicMaterial({color:'#fff6dc',transparent:true,opacity:.4,side:THREE.DoubleSide,depthWrite:false}),new THREE.MeshBasicMaterial({color:'#f4f2d9',transparent:true,opacity:.23,side:THREE.DoubleSide,depthWrite:false})];
 const rings=ringMaterials.map((material,i)=>{const ring=new THREE.Mesh(ringGeometry,material);ring.name='CozyFishingRipple_'+i;ring.rotation.x=-Math.PI/2;ring.frustumCulled=false;root.add(ring);return ring});
 const destination=new THREE.Vector3(),bob=new THREE.Vector3(),control=new THREE.Vector3();let disposed=false;
 return{
  root,
  update(state:CozyFishingState){
   if(disposed)return;const valid=Number.isFinite(state.tip.x)&&Number.isFinite(state.tip.y)&&Number.isFinite(state.tip.z)&&Number.isFinite(state.spot.x)&&Number.isFinite(state.spot.z)&&Number.isFinite(state.surface);root.visible=state.active&&valid;if(!root.visible)return;
   const progress=cozyCastProgress(state.clock,state.readyAt),cast=progress*progress*(3-2*progress),bite=state.readyAt!==undefined&&state.clock>=state.readyAt,motion=state.reducedMotion?0:1;
   destination.set(state.spot.x,state.surface+.04,state.spot.z);
   const dx=destination.x-state.tip.x,dz=destination.z-state.tip.z,distance=Math.hypot(dx,dz),arc=Math.min(1.05,.3+distance*.15);
   bob.lerpVectors(state.tip,destination,cast);bob.y+=Math.sin(cast*Math.PI)*arc;
   const waitingWobble=Math.sin(state.time*2.3)*.006,biteWobble=Math.sin(state.time*22)*.019;
   bob.x+=(bite?biteWobble:Math.sin(state.time*1.4)*.005)*motion*cast;
   bob.z+=(bite?Math.cos(state.time*18)*.012:Math.cos(state.time*1.7)*.004)*motion*cast;
   bob.y+=(bite?Math.sin(state.time*27)*.014-.017:waitingWobble)*motion*cast;
   control.addVectors(state.tip,bob).multiplyScalar(.5);control.y-=Math.min(.32,distance*.035+.06)*cast*(bite?.3:1);
   for(let i=0;i<32;i++){const t=i/31,u=1-t;attribute.setXYZ(i,u*u*state.tip.x+2*u*t*control.x+t*t*bob.x,u*u*state.tip.y+2*u*t*control.y+t*t*bob.y,u*u*state.tip.z+2*u*t*control.z+t*t*bob.z)}attribute.needsUpdate=true;
   float.visible=progress>.02;float.position.copy(bob);float.rotation.set(0,0,(bite?biteWobble*3:Math.sin(state.time*1.7)*.035)*motion);float.scale.set(1,1.25,1);
   const phase=state.reducedMotion?0:(state.time*(bite?1.6:.55))%1;
   for(let i=0;i<2;i++){const ring=rings[i],pulse=state.reducedMotion?0:(phase+i*.5)%1,size=(bite?.13:.1)+(i*.065)+pulse*(bite?.12:.06);ring.visible=progress>=1;ring.position.set(bob.x,state.surface+.012+i*.001,bob.z);ring.scale.setScalar(size);ringMaterials[i].opacity=(i?.23:.42)*(1-pulse*.7)}
   root.userData.stage=progress<1?'casting':bite?'bite':'waiting';root.userData.castProgress=progress;
  },
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometry.dispose();floatGeometry.dispose();ringGeometry.dispose();lineMaterial.dispose();floatMaterial.dispose();ringMaterials.forEach(m=>m.dispose())},
 };
}

let fishTemplate:THREE.Group|null=null;
/** A bite-sized roasted fish, centred on the same hand-local anchor as the potato. */
export function createCozyFishSnack():THREE.Group{
 if(fishTemplate)return fishTemplate.clone(true);
 const parts:Parameters<typeof combine>[0]=[
  {geometry:new THREE.SphereGeometry(1,12,8),color:'#be8e59',scale:[.038,.022,.065]},
  {geometry:new THREE.SphereGeometry(1,12,8),color:'#ead1a0',position:[0,.011,-.002],scale:[.029,.014,.048]},
  {geometry:new THREE.SphereGeometry(1,10,6),color:'#b1804e',position:[0,0,.044],scale:[.027,.02,.026]},
 ];
 const tail=new THREE.BufferGeometry();tail.setAttribute('position',new THREE.Float32BufferAttribute([0,.001,-.047,-.034,.002,-.089,-.025,.002,-.049,0,.001,-.047,.034,.002,-.089,.025,.002,-.049],3));tail.computeVertexNormals();parts.push({geometry:tail,color:'#b17f48'});
 for(const z of[-.025,0,.025])parts.push({geometry:new THREE.CapsuleGeometry(.0022,.045,1,5),color:'#8f693d',position:[0,.024,z],rotation:[0,0,Math.PI/2+.22]});
 for(const side of[-1,1]){parts.push({geometry:new THREE.SphereGeometry(.0033,6,4),color:'#39312b',position:[side*.025,.008,.052]});parts.push({geometry:new THREE.CapsuleGeometry(.002,.035,1,5),color:'#f5e4be',position:[side*.012,.025,-.012],rotation:[0,side*.32,Math.PI/2]})}
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.74,metalness:.02,side:THREE.DoubleSide}),fish=new THREE.Mesh(combine(parts),material);fish.name='CozyRoastedFish';fish.castShadow=true;fish.receiveShadow=true;fish.frustumCulled=false;fishTemplate=new THREE.Group();fishTemplate.name='CozyFishSnack';fishTemplate.add(fish);return fishTemplate.clone(true);
}
