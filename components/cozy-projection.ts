import type {Material,BufferGeometry,Vector4} from 'three';
const originalHooks=new WeakMap<Material,Material['onBeforeCompile']>();
const oriented=new WeakSet<BufferGeometry>();
/** This game's +Z/right+X lens has opposite handedness to Three's standard camera. */
export function orientCozyGeometry(geometry:BufferGeometry){if(oriented.has(geometry))return;const index=geometry.getIndex(),count=index?.count??geometry.getAttribute('position').count,values=Array.from({length:count},(_,i)=>index?index.getX(i):i);for(let i=0;i+2<count;i+=3){const swap=values[i+1];values[i+1]=values[i+2];values[i+2]=swap}geometry.setIndex(values);oriented.add(geometry)}
import {boatProjectionGLSL} from './boat-screen-projection';
/** The gameplay and its hit targets already share this lens; keep one projection for every surface. */
export function bindCozyProjection(material:Material,uniforms:{camera:{value:Vector4};lens:{value:Vector4};map:{value:number}}){
 if(!originalHooks.has(material))originalHooks.set(material,material.onBeforeCompile);
 const prior=originalHooks.get(material)!;
 material.onBeforeCompile=(shader,renderer)=>{
  prior.call(material,shader,renderer);
  shader.uniforms.boatCamera=uniforms.camera;shader.uniforms.boatLens=uniforms.lens;shader.uniforms.boatMap=uniforms.map;
  if(!shader.vertexShader.includes('vec4 boatClip('))shader.vertexShader=boatProjectionGLSL+'\n'+shader.vertexShader.replace('#include <project_vertex>',`
   vec4 cozyLocal=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    cozyLocal=instanceMatrix*cozyLocal;
   #endif
   vec4 cozyWorld=modelMatrix*cozyLocal;
   vec4 mvPosition=viewMatrix*cozyWorld;
   gl_Position=boatClip(cozyWorld.xyz);
   float cozyDepth=(cozyWorld.x-boatCamera.x)*sin(boatCamera.z)+(cozyWorld.z-boatCamera.y)*cos(boatCamera.z);
   if(boatMap<.5&&cozyDepth<-.3)gl_Position.z=gl_Position.w*1.01;
  `);
 };
 material.customProgramCacheKey=()=> 'little-sea-cozy-projection-1';
 material.needsUpdate=true;
}

export function cozyPixelRatio(width:number,height:number,deviceRatio:number,limited:boolean){return Math.max(.6,Math.min(deviceRatio,limited?1:1.5,Math.sqrt((limited?720000:1450000)/Math.max(1,width*height))))}
export function smoothCozyHeading(current:number,target:number,delta:number){return current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(1-Math.exp(-Math.min(.1,Math.max(0,delta))*9))}
