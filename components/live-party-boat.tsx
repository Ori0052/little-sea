'use client';
import {useEffect,useRef,type RefObject} from 'react';
import type * as THREE from 'three';
import type {BoatSnapshot,boatPosition} from './boat-space';
import type {SeaCamera} from './sea-space';
import type {AvatarLook,SeaPeer} from './avatar-state';
import type {CrownId} from './deepsea-catalog';
import atlas from '../public/treasure-art/manifest.json';
import {bindBoatRig} from './boat-3d-rig';
import {boatProjectionGLSL} from './boat-screen-projection';
import {shouldUseDetailedPassenger,shouldWarmDetail} from './boat-quality';
export type LiveBoatProps={boat:BoatSnapshot;pose:ReturnType<typeof boatPosition>;view:'dream'|'shore';camera:RefObject<SeaCamera>;localDistance:number;selfId:string;selfLook:AvatarLook;selfCrown:CrownId|null;peers:SeaPeer[];onReady:(ready:boolean)=>void};
export function LivePartyBoat(props:LiveBoatProps){
 const host=useRef<HTMLDivElement>(null),current=useRef(props);current.current=props;
 useEffect(()=>{let disposed=false,frame=0,renderer:THREE.WebGLRenderer|undefined,scene:THREE.Scene|undefined,observer:ResizeObserver|undefined,texture:THREE.Texture|undefined,contextLost=false,ready=false,shaderFailed=false;
 const node=host.current!,geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 const collect=(root:THREE.Object3D)=>root.traverse(n=>{const m=n as THREE.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>materials.add(v))});
 const announce=(value:boolean)=>{if(ready===value)return;ready=value;node.style.visibility=value?'visible':'hidden';current.current.onReady(value)};
 const lost=(e:Event)=>{e.preventDefault();contextLost=true;announce(false)},restored=()=>{contextLost=false};
 async function start(){try{
  const T=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');if(disposed)return;
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.debug.onShaderError=(gl,program,vs,fs)=>{shaderFailed=true;console.error("Boat shader",gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs))};renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1;
  node.appendChild(renderer.domElement);renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  scene=new T.Scene();const camera=new T.PerspectiveCamera(40,1,.1,1000),ambient=new T.HemisphereLight('#ffffff','#e7e0f0',1.1),soft=new T.AmbientLight('#ffffff',.65),sun=new T.DirectionalLight('#fff5ed',2),fill=new T.DirectionalLight('#fffaff',.7);sun.position.set(-3,5,6);fill.position.set(3,3,7);scene.add(ambient,soft,sun,fill);
  const cameraUniform={value:new T.Vector4()},lensUniform={value:new T.Vector4()},mapUniform={value:0};
  const patch=(material:THREE.Material)=>{material.onBeforeCompile=shader=>{shader.uniforms.boatCamera=cameraUniform;shader.uniforms.boatLens=lensUniform;shader.uniforms.boatMap=mapUniform;shader.vertexShader=boatProjectionGLSL+"\n"+shader.vertexShader.replace('#include <project_vertex>','vec4 mvPosition=modelViewMatrix*vec4(transformed,1.); gl_Position=boatClip((modelMatrix*vec4(transformed,1.)).xyz);')};material.customProgramCacheKey=()=> 'live-sea-boat-v1'};
  const prepare=(root:THREE.Object3D)=>root.traverse(n=>{n.frustumCulled=false;const m=n as THREE.Mesh;if(m.material){const original=Array.isArray(m.material)?m.material:[m.material];const cloned=original.map(v=>{const copy=v.clone();patch(copy);materials.add(v);return copy});m.material=Array.isArray(m.material)?cloned:cloned[0]}});
  const loader=new GLTFLoader(),asset=await loader.loadAsync('/models/sea-boat.glb?live=lod-1');if(disposed){collect(asset.scene);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());return}
  prepare(asset.scene);asset.scene.getObjectByName('Island')!.visible=false;scene.add(asset.scene);const base=bindBoatRig(asset.scene);
  let high:ReturnType<typeof bindBoatRig>|undefined,highState='idle';const detailed=Array(6).fill(false);const device=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};let limited=Boolean(device.deviceMemory&&device.deviceMemory<=2)||device.hardwareConcurrency<=2||device.connection?.saveData===true,slow=0;
  function riderStyles(root:THREE.Object3D){return Array.from({length:6},(_,i)=>{const shirts:THREE.MeshStandardMaterial[]=[];root.getObjectByName(`Passenger_${i}`)?.traverse(n=>{const m=n as THREE.Mesh;if(m.material)for(const mat of Array.isArray(m.material)?m.material:[m.material])if(mat.name.startsWith('shirt ')&&!shirts.includes(mat as THREE.MeshStandardMaterial))shirts.push(mat as THREE.MeshStandardMaterial)});return shirts})}
  const baseStyles=riderStyles(asset.scene);let highStyles:ReturnType<typeof riderStyles>|undefined;
  const warm=()=>{if(highState!=='idle'||disposed)return;highState='loading';void loader.loadAsync('/models/sea-characters-high.glb?live=lod-1').then(h=>{if(disposed){collect(h.scene);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());return}prepare(h.scene);high=bindBoatRig(h.scene);highStyles=riderStyles(h.scene);scene!.add(h.scene);highState='ready'}).catch(()=>{highState='failed'})};
  const crownGeometry=new Map<CrownId,THREE.PlaneGeometry>();let crownTextureReady=false,crownTextureFailed=false;texture=new T.TextureLoader().load('/treasure-art/crowns.png',()=>{crownTextureReady=true},undefined,()=>{crownTextureFailed=true});texture.colorSpace=T.SRGBColorSpace;
  const crowns=Array.from({length:6},()=>{const mat=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.04,depthWrite:false,side:T.DoubleSide});patch(mat);const mesh=new T.Mesh(new T.PlaneGeometry(.001,.001),mat);geometries.add(mesh.geometry);scene!.add(mesh);mesh.frustumCulled=false;mesh.visible=false;return mesh});
  const point=new T.Vector3();let last=0,sample=0,frames=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  observer=new ResizeObserver(()=>{if(renderer)renderer.setSize(node.clientWidth,node.clientHeight,false)});observer.observe(node);
  const draw=(ms:number)=>{if(disposed||!renderer)return;frame=requestAnimationFrame(draw);if(document.hidden||contextLost){sample=ms;frames=0;return}if(ms-last<33)return;last=ms;
   try{const p=current.current,c=p.camera.current,aspect=node.clientWidth/Math.max(1,node.clientHeight),aboard=p.boat.selfSeat!==null,night=node.closest('main')?.classList.contains('night');
    cameraUniform.value.set(c.x,c.z,c.yaw,c.pitch);lensUniform.value.set(c.eye,c.ground??0,c.spread??1,aspect);mapUniform.value=p.view==='shore'?1:0;
    if(p.view==='dream'){camera.up.set(0,1,0);camera.position.set(c.x,(c.ground??0)+4*c.eye,c.z);camera.lookAt(c.x+Math.sin(c.yaw)*10,0,c.z+Math.cos(c.yaw)*10)}else{camera.up.set(1,0,0);camera.position.set(p.pose.x,30,p.pose.z);camera.lookAt(p.pose.x,0,p.pose.z)}camera.updateMatrixWorld();
    const apply=(rig:ReturnType<typeof bindBoatRig>)=>{rig.apply(p.boat,p.pose.time,true,!reduced,true);rig.hull.position.x=p.pose.x;rig.hull.position.z=p.pose.z;rig.hull.rotation.y=p.pose.heading};apply(base);if(!p.boat.passengers.length)asset.scene.getObjectByName("Oar_0")!.visible=true;if(high)apply(high);
    if(shouldWarmDetail({aboard,distance:p.localDistance,mode:'auto',limited}))warm();
    let highCount=0,hasCrown=false;for(let i=0;i<6;i++){const member=p.boat.passengers.find(m=>m.seat===i),self=!!member&&(member.id===p.selfId||member.seat===p.boat.selfSeat),peer=member?p.peers.find(v=>v.id===member.id):undefined,look=self?p.selfLook:peer?.look??{color:'#c9b5e3',hat:true,tube:'#a9ced4'},crown=self?p.selfCrown:peer?.crown??null;
     const distance=Math.hypot(c.x-p.pose.x,c.z-p.pose.z)/Math.max(.5,c.eye),useHigh=!!member&&shouldUseDetailedPassenger({aboard,distance,ready:highState==='ready',previous:detailed[i],mode:'auto',limited});detailed[i]=useHigh;base.riders[i].visible=!!member&&!useHigh;if(high)high.riders[i].visible=!!member&&useHigh;if(useHigh)highCount++;
     for(const root of [asset.scene,...(high?[high.hull]:[])])root.getObjectByName(`Hat_${i}`)!.visible=look.hat&&!crown;for(const mat of baseStyles[i])mat.color.set(look.color);if(highStyles)for(const mat of highStyles[i])mat.color.set(look.color);
     const mesh=crowns[i];mesh.visible=!!member&&!!crown&&crownTextureReady;if(member&&crown){hasCrown=true;let geometry=crownGeometry.get(crown);if(!geometry){const a=atlas[crown].crown,[x,y,w,h]=a.frame;geometry=new T.PlaneGeometry(.48,.32);const uv=geometry.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,(x+uv.getX(k)*w)/a.width,1-(y+(1-uv.getY(k))*h)/a.height);crownGeometry.set(crown,geometry);geometries.add(geometry)}mesh.geometry=geometry;const rider=useHigh&&high?high.riders[i]:base.riders[i];rider.updateWorldMatrix(true,false);rider.localToWorld(point.set(0,1.05,0));mesh.position.copy(point);mesh.quaternion.copy(camera.quaternion)}
    }
    ambient.intensity=night?.6:1.1;soft.intensity=night?.45:.65;sun.intensity=night?.8:2;fill.intensity=night?.25:.7;sun.color.set(night?'#c8d5ff':'#fff5ed');
    const ratio=limited?1:Math.min(devicePixelRatio,1.5);if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);renderer.setSize(node.clientWidth,node.clientHeight,false)}
    if(hasCrown&&(!crownTextureReady||crownTextureFailed)){announce(false);node.style.visibility='hidden'}else{renderer.render(scene!,camera);announce(!shaderFailed)}
    node.dataset.asset=highState;node.dataset.limited=String(limited);node.dataset.quality=highCount?'detail':'light';node.dataset.detailCount=String(highCount);node.dataset.passengers=String(p.boat.passengers.length);node.dataset.view=p.view;node.dataset.aboard=String(aboard);
    frames++;if(!sample)sample=ms;if(ms-sample>=1200){const fps=frames*1000/(ms-sample);slow=fps<18?slow+1:0;if(slow>=4)limited=true;frames=0;sample=ms}
   }catch(error){console.error("Live boat draw",error);announce(false);node.style.visibility='hidden';contextLost=true}
  };frame=requestAnimationFrame(draw);
 }catch(error){console.error("Live boat load",error);if(!disposed){node.style.visibility='hidden';current.current.onReady(false)}}}
 void start();return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();current.current.onReady(false);if(scene)collect(scene);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture?.dispose();if(renderer){renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
 },[]);
 return <div ref={host} className="live-party-boat" aria-hidden="true"/>;
}
