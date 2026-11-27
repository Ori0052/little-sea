import * as THREE from 'three';
import {islandCenter,islandRadius,campingCenter,campingRadius,tinyCenter,tinyRadius} from './island-terrain';
import {newIslands} from './archipelago';

/** A shared, texture-free ocean/sky. All colours enter the renderer in linear space. */
export type CozyOceanState={
 time:number;delta:number;mood:string;frozen:boolean;reducedMotion:boolean;centerX:number;centerZ:number;
 yaw?:number;pitch?:number;aspect?:number;flash?:number;
};
type Palette={top:string;horizon:string;fog:string;shallow:string;deep:string;foam:string;sun:string;ambient:string;ground:string;cloud:number;night:number;warmth:number;sunPower:number;fillPower:number;wave:number;fogDensity:number};
const palettes:Record<string,Palette>={
 day:{top:'#96c9d7',horizon:'#e5ede3',fog:'#d3e7df',shallow:'#80cec0',deep:'#368c9b',foam:'#eff6e7',sun:'#ffebc7',ambient:'#c7e3ee',ground:'#8c9577',cloud:.24,night:0,warmth:.2,sunPower:3.1,fillPower:1.25,wave:1,fogDensity:.0045},
 sunset:{top:'#a8b1d1',horizon:'#f1c6ac',fog:'#dec0b9',shallow:'#9acbbd',deep:'#637fa2',foam:'#f6e6cf',sun:'#ffd1a1',ambient:'#bdc4e4',ground:'#9f827c',cloud:.26,night:0,warmth:1,sunPower:2.55,fillPower:1.9,wave:.8,fogDensity:.005},
 night:{top:'#12243d',horizon:'#576c88',fog:'#3c5574',shallow:'#4d8d9d',deep:'#263f64',foam:'#a6c5c9',sun:'#b7ceec',ambient:'#a5b9d8',ground:'#36485f',cloud:.12,night:1,warmth:0,sunPower:1.0,fillPower:1.4,wave:.72,fogDensity:.006},
 rain:{top:'#697f8d',horizon:'#bac9c8',fog:'#9eb9b9',shallow:'#77aca8',deep:'#426d7e',foam:'#cfe4de',sun:'#dce6dd',ambient:'#c3d4d9',ground:'#687b72',cloud:.8,night:0,warmth:0,sunPower:1.05,fillPower:1.75,wave:1.6,fogDensity:.007},
 thunder:{top:'#172c40',horizon:'#617381',fog:'#4c6577',shallow:'#527d84',deep:'#263e52',foam:'#c5d4d1',sun:'#a0b9d2',ambient:'#9aaec4',ground:'#384653',cloud:.95,night:.3,warmth:0,sunPower:.6,fillPower:1.25,wave:3.6,fogDensity:.009},
 snow:{top:'#b9cbdc',horizon:'#f2eee9',fog:'#d6e4e7',shallow:'#bedee0',deep:'#81b0c5',foam:'#f6fbf6',sun:'#fff0d8',ambient:'#deebf3',ground:'#a1acb1',cloud:.35,night:0,warmth:.05,sunPower:2.2,fillPower:2.35,wave:.6,fogDensity:.0055},
};
palettes.nightRain={...palettes.rain,top:'#172b3d',horizon:'#52687c',fog:'#3f5b70',shallow:'#3b6d7d',deep:'#263e5c',night:1,sunPower:.65,fillPower:1.15};
palettes.nightSnow={...palettes.snow,top:'#253b56',horizon:'#7188a2',fog:'#5b7590',shallow:'#88a7bc',deep:'#506e90',night:1,sunPower:.85,fillPower:1.3};
const colorKeys=['top','horizon','fog','shallow','deep','foam','sun','ambient','ground'] as const;
type ColorKey=typeof colorKeys[number];
type LinearPalette=Record<ColorKey,THREE.Color>&Omit<Palette,ColorKey>;
const linearPalettes:Record<string,LinearPalette>={};
for(const [name,palette]of Object.entries(palettes)){
 const colors=Object.fromEntries(colorKeys.map(key=>[key,new THREE.Color(palette[key])])) as Record<ColorKey,THREE.Color>;
 linearPalettes[name]={...palette,...colors};
}
const clamp=(value:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,value));

/** Same three broad wave bands used by the vertex shader. A calm sea stays below 8cm. */
export function cozyWaveHeight(x:number,z:number,time:number,scale=1){
 return scale*(Math.sin(x*.42+z*.21+time*.72)*.035+Math.sin(x*.75-z*.33+time*.5)*.022+Math.sin(x*.14+z*.35-time*.35)*.018);
}
export function cozyWaveScale(mood:string,frozen=false){return frozen?0:(palettes[mood]??palettes.day).wave}

const waterVertex=/* glsl */`
uniform float uTime;
uniform float uWaveScale;
varying vec3 vWorldPosition;
varying vec3 vWaterNormal;
float height(vec2 p){
 return (sin(p.x*.42+p.y*.21+uTime*.72)*.035+sin(p.x*.75-p.y*.33+uTime*.5)*.022+sin(p.x*.14+p.y*.35-uTime*.35)*.018)*uWaveScale;
}
void main(){
 vec3 transformed=position;
 vec2 world=(modelMatrix*vec4(position,1.)).xz;
 transformed.y+=height(world);
 vec2 slope=vec2(
  cos(world.x*.42+world.y*.21+uTime*.72)*.035*.42+cos(world.x*.75-world.y*.33+uTime*.5)*.022*.75+cos(world.x*.14+world.y*.35-uTime*.35)*.018*.14,
  cos(world.x*.42+world.y*.21+uTime*.72)*.035*.21-cos(world.x*.75-world.y*.33+uTime*.5)*.022*.33+cos(world.x*.14+world.y*.35-uTime*.35)*.018*.35
 )*uWaveScale;
 vWaterNormal=normalize(vec3(-slope.x,1.,-slope.y));
 vWorldPosition=(modelMatrix*vec4(transformed,1.)).xyz;
 #include <project_vertex>
}
`;
const waterFragment=/* glsl */`
uniform float uTime;
uniform float uFrozen;
uniform float uNight;
uniform float uFogDensity;
uniform float uCameraYaw;
uniform float uFlash;
uniform vec2 uViewCenter;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform vec3 uHorizon;
uniform vec3 uFog;
uniform vec3 uSun;
uniform vec4 uIslands[6];
varying vec3 vWorldPosition;
varying vec3 vWaterNormal;
float shoreDistance(vec2 p){
 float result=p.y-(.09*sin(p.x*.7)+.06*sin(p.x*1.8));
 for(int i=0;i<6;i++){
  vec4 island=uIslands[i];vec2 q=(p-island.xy)/island.zw;float a=atan(q.y,q.x);
  float d=(length(q)-(1.+.055*sin(a*3.)+.035*cos(a*5.)))*min(island.z,island.w);
  result=min(result,d);
 }
 return result;
}
void main(){
 vec2 p=vWorldPosition.xz;
 float coast=max(0.,shoreDistance(p));
 float depth=smoothstep(.12,8.,coast);
 vec3 color=mix(uShallow,uDeep,depth);
 vec3 normal=normalize(vWaterNormal+vec3(sin(p.x*3.2+p.y*1.5+uTime*.5),0.,cos(p.y*3.5-p.x*.7-uTime*.37))*.024*(1.-uFrozen));
 vec3 view=normalize(vec3(-sin(uCameraYaw)*.7,.72,-cos(uCameraYaw)*.7));
 vec3 light=normalize(vec3(-.4,.84,-.36));
 float fresnel=pow(1.-max(0.,dot(normal,view)),3.);
 color=mix(color,uHorizon,.13+fresnel*.22);
 float flowing=sin(p.x*1.45+p.y*1.9-uTime*.38+sin(p.x*.47+p.y*.6));
 float ripple=sin(p.y*4.3-p.x*2.7+uTime*.53+flowing*.8);
 color+=uFoam*(.012*flowing+.006*ripple)*(1.-uFrozen);
 float glint=pow(max(0.,dot(reflect(-light,normal),view)),40.);
 float broken=.4+.6*pow(max(0.,sin(p.x*10.8+p.y*14.6+uTime*.8)),4.);
 color+=uSun*glint*broken*.32*(1.-uFrozen);
 float wave=sin(coast*10.-uTime*.8+sin(p.x*1.2+p.y*.9)*.28);
 float foam=pow(max(0.,wave),12.)*exp(-coast*1.5)*.42;
 foam+=exp(-pow((coast-.055-.028*sin(uTime*.45+p.x*.9))/.075,2.))*.37;
 foam*=.7+.3*sin(p.x*13.+p.y*9.+sin(p.x*3.))*sin(p.y*11.-p.x*7.);
 color=mix(color,uFoam,clamp(foam*(1.-uFrozen),0.,.58));
 if(uFrozen>.001){
  float grain=sin(p.x*.9+sin(p.y*.38))*sin(p.y*.75+sin(p.x*.45));
  float crack=1.-smoothstep(.012,.036,abs(grain));
  vec3 ice=mix(uDeep,uShallow,.8)+uFoam*(.03*sin(p.x*.23+p.y*.2)+crack*.12);
  float frost=pow(max(0.,sin(p.x*2.1-p.y*1.6)*sin(p.x*1.1+p.y*2.7)),12.);
  ice+=uFoam*frost*.035;color=mix(color,ice,uFrozen);
 }
 color+=vec3(.15,.22,.28)*uFlash;
 float distance=length(p-uViewCenter);
 float fog=1.-exp(-pow(distance*uFogDensity,2.));
 color=mix(color,uFog,clamp(fog,0.,.99));
 gl_FragColor=vec4(max(vec3(0.),color),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
`;

const skyVertex=/* glsl */`
varying vec2 vUv;
void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,1.,1.);}
`;
const skyFragment=/* glsl */`
uniform float uTime;
uniform float uClouds;
uniform float uNight;
uniform float uWarmth;
uniform float uCameraYaw;
uniform float uCameraPitch;
uniform float uAspect;
uniform float uFlash;
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uFog;
uniform vec3 uSun;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float clouds(vec2 p){return noise(p)*.57+noise(p*2.02+11.1)*.28+noise(p*4.1+27.8)*.15;}
void main(){
 float horizon=1.-(.44+.616*uCameraPitch);
 float up=max(0.,(vUv.y-horizon)/max(.12,1.-horizon));
 vec3 color=mix(uHorizon,uTop,smoothstep(0.,1.,pow(up,.7)));
 color=mix(uFog,color,smoothstep(horizon-.2,horizon+.07,vUv.y));
 vec2 sky=vec2(vUv.x*uAspect+uCameraYaw*.28,vUv.y);
 float drift=uTime*.0014;
 float field=clouds(vec2(sky.x*3.8+drift,up*5.8+sin(sky.x*.8)*.12));
 float cloud=smoothstep(.64-uClouds*.16,.85-uClouds*.12,field)*smoothstep(.005,.13,up);
 vec3 cloudColor=mix(uHorizon*1.12,uTop*.58,smoothstep(.25,.98,uClouds));
 color=mix(color,cloudColor,cloud*(.46+uClouds*.45));
 vec2 glowPoint=vec2(.23+(sin(-uCameraYaw)*.15),horizon+.31);
 vec2 delta=vec2((vUv.x-glowPoint.x)*uAspect,vUv.y-glowPoint.y);
 float glow=exp(-dot(delta,delta)*4.5)*(1.-uNight)*(1.-uClouds*.75);
 color+=uSun*glow*(.065+uWarmth*.13);
 vec2 sunPoint=vec2(glowPoint.x,horizon+.11+(.26*(1.-uWarmth)));
 float sunDistance=length(vec2((vUv.x-sunPoint.x)*uAspect,vUv.y-sunPoint.y));
 float sun=(1.-smoothstep(.021,.028,sunDistance))*(1.-uNight)*(1.-uClouds*.8);
 color=mix(color,uSun*2.4,sun*.55);
 vec2 moonPoint=vec2(.68+sin(-uCameraYaw)*.12,horizon+.25);
 vec2 moon=vec2((vUv.x-moonPoint.x)*uAspect,vUv.y-moonPoint.y);
 float disc=1.-smoothstep(.027,.029,length(moon));
 float cut=1.-smoothstep(.025,.027,length(moon-vec2(.012,.008)));
 float crescent=max(0.,disc-cut);
 float moonGlow=exp(-dot(moon,moon)*110.)*.025;
 color+=vec3(.92,.84,.62)*(crescent*.7+moonGlow)*uNight;
 vec2 starUv=vec2((vUv.x+uCameraYaw*.2)*uAspect,vUv.y)*vec2(88.,60.);
 vec2 cell=floor(starUv),local=fract(starUv)-.5;
 float seed=hash(cell),star=exp(-dot(local,local)*130.)*step(.994,seed);
 float twinkle=.7+.3*sin(uTime*.25+seed*34.);
 color+=vec3(.52,.65,.8)*star*twinkle*uNight*smoothstep(horizon+.03,horizon+.2,vUv.y);
 color+=vec3(.22,.30,.39)*uFlash;
 gl_FragColor=vec4(max(vec3(0.),color),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
`;

// A dense 128m centre joins a coarse far ring at identical vertices. This keeps
// nearby swells smooth without spending mobile vertices on the distant horizon.
function oceanGeometry(){
 const steps=96,half=64,far=800,positions:number[]=[],indices:number[]=[];
 for(let z=0;z<=steps;z++)for(let x=0;x<=steps;x++)positions.push(-half+x/steps*half*2,0,-half+z/steps*half*2);
 for(let z=0;z<steps;z++)for(let x=0;x<steps;x++){const a=z*(steps+1)+x,b=a+1,c=a+steps+1,d=c+1;indices.push(a,c,b,b,c,d)}
 const edge=(side:number,n:number)=>side===0?n:side===1?n*(steps+1)+steps:side===2?steps*(steps+1)+steps-n:(steps-n)*(steps+1);
 for(let side=0;side<4;side++){
  const first=positions.length/3;
  for(let n=0;n<=steps;n++){const inner=edge(side,n),x=positions[inner*3],z=positions[inner*3+2];positions.push(x/half*far,0,z/half*far)}
  for(let n=0;n<steps;n++){const a=edge(side,n),b=edge(side,n+1),c=first+n,d=c+1;indices.push(a,b,c,b,d,c)}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeBoundingSphere();return geometry;
}

export function createCozyOcean(scene:THREE.Scene){
 const current=Object.fromEntries(colorKeys.map(key=>[key,linearPalettes.day[key].clone()])) as Record<ColorKey,THREE.Color>;
 const values={cloud:.24,night:0,warmth:.2,wave:1,frozen:0,fogDensity:.0045,sunPower:3.1,fillPower:1.25};
 const islandBounds=[
  new THREE.Vector4(islandCenter.x,islandCenter.z,islandRadius.x,islandRadius.z),
  new THREE.Vector4(campingCenter.x,campingCenter.z,campingRadius.x,campingRadius.z),
  new THREE.Vector4(tinyCenter.x,tinyCenter.z,tinyRadius.x,tinyRadius.z),
  ...newIslands.map(i=>new THREE.Vector4(i.x,i.z,i.rx,i.rz)),
 ];
 const waterGeometry=oceanGeometry();
 const waterMaterial=new THREE.ShaderMaterial({name:'Cozy clear-water surface',vertexShader:waterVertex,fragmentShader:waterFragment,uniforms:{uTime:{value:0},uWaveScale:{value:1},uFrozen:{value:0},uNight:{value:0},uFogDensity:{value:.0045},uCameraYaw:{value:0},uFlash:{value:0},uViewCenter:{value:new THREE.Vector2()},uShallow:{value:current.shallow},uDeep:{value:current.deep},uFoam:{value:current.foam},uHorizon:{value:current.horizon},uFog:{value:current.fog},uSun:{value:current.sun},uIslands:{value:islandBounds}},depthWrite:true,depthTest:true,toneMapped:true});
 const water=new THREE.Mesh(waterGeometry,waterMaterial);water.name='CozyOceanSurface';water.frustumCulled=false;water.renderOrder=-10;water.receiveShadow=false;scene.add(water);
 const skyGeometry=new THREE.BufferGeometry();skyGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const skyMaterial=new THREE.ShaderMaterial({name:'Cozy atmospheric sky',vertexShader:skyVertex,fragmentShader:skyFragment,uniforms:{uTime:{value:0},uClouds:{value:.24},uNight:{value:0},uWarmth:{value:.2},uCameraYaw:{value:0},uCameraPitch:{value:0},uAspect:{value:1},uFlash:{value:0},uTop:{value:current.top},uHorizon:{value:current.horizon},uFog:{value:current.fog},uSun:{value:current.sun}},depthWrite:false,depthTest:false,toneMapped:true});
 const sky=new THREE.Mesh(skyGeometry,skyMaterial);sky.name='CozyAtmosphereScreen';sky.userData.cozyScreenSpace=true;sky.frustumCulled=false;sky.renderOrder=-10000;scene.add(sky);
 const fill=new THREE.HemisphereLight(current.ambient,current.ground,linearPalettes.day.fillPower);fill.name='Cozy soft sky fill';
 const sun=new THREE.DirectionalLight(current.sun,linearPalettes.day.sunPower);sun.name='Cozy warm window sun';sun.position.set(-15,28,-12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.camera.near=.5;sun.shadow.camera.far=85;sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;sun.shadow.radius=3;
 scene.add(fill,sun,sun.target);
 const previousFog=scene.fog,previousBackground=scene.background;
 const fog=new THREE.FogExp2(current.fog,.0045);scene.fog=fog;scene.background=null;
 let motionTime=0,waveScale=1,disposed=false,firstUpdate=true;
 function update(state:CozyOceanState){
  if(disposed)return;
  const target=linearPalettes[state.mood]??linearPalettes.day,dt=clamp(Number.isFinite(state.delta)?state.delta:0,0,.1),blend=firstUpdate?1:1-Math.exp(-dt*1.8),quick=firstUpdate?1:1-Math.exp(-dt*3.5);firstUpdate=false;
  for(const key of colorKeys)current[key].lerp(target[key],blend);
  values.cloud=THREE.MathUtils.lerp(values.cloud,target.cloud,blend);values.night=THREE.MathUtils.lerp(values.night,target.night,blend);values.warmth=THREE.MathUtils.lerp(values.warmth,target.warmth,blend);values.wave=THREE.MathUtils.lerp(values.wave,target.wave,blend);values.frozen=THREE.MathUtils.lerp(values.frozen,state.frozen?1:0,quick);values.fogDensity=THREE.MathUtils.lerp(values.fogDensity,target.fogDensity,blend);
  motionTime=state.reducedMotion?0:state.time;waveScale=values.wave*(1-values.frozen);
  water.position.set(state.centerX,0,state.centerZ);waterMaterial.uniforms.uTime.value=motionTime;waterMaterial.uniforms.uWaveScale.value=waveScale;waterMaterial.uniforms.uFrozen.value=values.frozen;waterMaterial.uniforms.uNight.value=values.night;waterMaterial.uniforms.uCameraYaw.value=state.yaw??0;waterMaterial.uniforms.uFogDensity.value=values.fogDensity;waterMaterial.uniforms.uViewCenter.value.set(state.centerX,state.centerZ);waterMaterial.uniforms.uFlash.value=clamp(state.flash??0,0,1);
  skyMaterial.uniforms.uTime.value=motionTime;skyMaterial.uniforms.uClouds.value=values.cloud;skyMaterial.uniforms.uNight.value=values.night;skyMaterial.uniforms.uWarmth.value=values.warmth;skyMaterial.uniforms.uCameraYaw.value=state.yaw??0;skyMaterial.uniforms.uCameraPitch.value=state.pitch??0;skyMaterial.uniforms.uAspect.value=state.aspect??1;skyMaterial.uniforms.uFlash.value=clamp(state.flash??0,0,1);
  values.sunPower=THREE.MathUtils.lerp(values.sunPower,target.sunPower,blend);values.fillPower=THREE.MathUtils.lerp(values.fillPower,target.fillPower,blend);
  sun.color.copy(current.sun);fill.color.copy(current.ambient);fill.groundColor.copy(current.ground);sun.intensity=values.sunPower+clamp(state.flash??0,0,1)*1.8;fill.intensity=values.fillPower;
  const shadowX=Math.round(state.centerX*8)/8,shadowZ=Math.round(state.centerZ*8)/8;sun.position.set(shadowX-15,28,shadowZ-12);sun.target.position.set(shadowX,0,shadowZ);sun.target.updateMatrixWorld();fog.color.copy(current.fog);fog.density=values.fogDensity;
 }
 function heightAt(x:number,z:number){return cozyWaveHeight(x,z,motionTime,waveScale)}
 function dispose(){if(disposed)return;disposed=true;scene.remove(water,sky,fill,sun,sun.target);waterGeometry.dispose();waterMaterial.dispose();skyGeometry.dispose();skyMaterial.dispose();sun.shadow.map?.dispose();if(scene.fog===fog)scene.fog=previousFog;if(scene.background===null)scene.background=previousBackground}
 return{update,dispose,heightAt,water,sky,waterMaterial,skyMaterial,lights:{sun,fill}};
}
