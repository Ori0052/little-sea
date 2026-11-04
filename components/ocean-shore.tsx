'use client';
import {newIslands} from './archipelago';
import {useGraphicsRecovery} from '../hooks/use-graphics-recovery';
import {drawSeaTerrain} from './sea-graphics-layer';
import {recordGraphicsFailure} from './graphics-diagnostics';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {islandGLSL,islandCenter,islandRadius,campingCenter,campingRadius,tinyCenter,tinyRadius} from './island-space';
import type {SeaCamera} from './sea-space';
type Mood='day'|'sunset'|'night'|'rain';
const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment=`
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float mood;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.04+vec2(11.7,7.3);a*=.5;}return v;}
float cells(vec2 p){vec2 b=floor(p),f=fract(p);float a=8.,c=8.;for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 seed=vec2(hash(b+o),hash(b+o+19.4));vec2 q=o+.5+.36*sin(seed*6.283+time*.23)-f;float d=dot(q,q);if(d<a){c=a;a=d;}else if(d<c){c=d;}}}return sqrt(c)-sqrt(a);}
${islandGLSL}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;uv.y=1.-uv.y;
 float aspect=resolution.x/resolution.y;uv.y=(uv.y-.5)/aspect+.5;uv+=offset;vec2 p=vec2(uv.x*aspect,uv.y);
 float shore=.22+.04*sin((uv.y-.5)*.8)+.023*sin(uv.y*10.)+.012*sin(uv.y*24.+.6);float worldX=(uv.y-.55)*12.;float baseShore=shore;shore+=(.09*sin(worldX*.7)+.06*sin(worldX*1.8))/12.;
 float coast=(uv.x-shore)*aspect;
 float n=fbm(p*5.+vec2(time*.025,0));
 float storm=step(2.5,mood);float sweep=sin(time*(.40+storm*.55)+uv.y*1.5)*(.025+storm*.035);
 float wet=coast-sweep;
 vec3 sand=mix(vec3(.85,.84,.77),vec3(.96,.94,.86),fbm(p*65.));
 sand*=1.-.14*exp(-pow((wet+.025)/.055,2.));
 vec3 water=mix(vec3(.39,.77,.79),vec3(.045,.43,.54),smoothstep(0.,aspect*.85,coast));
 water+=vec3(.03,.07,.08)*(n-.5);
 float ripple=sin(p.y*47.+p.x*18.+time*.35+fbm(p*8.)*5.);
 water+=ripple*(.015+storm*.025);float rolling=sin(p.x*13.+p.y*19.-time*.42+n*4.);water+=vec3(.012,.023,.025)*rolling;
 vec2 warp=vec2(fbm(p*5.+time*.03),fbm(p*5.+vec2(8.,-time*.035)));
 float cell=cells(p*19.+warp*2.2+vec2(-time*.045,time*.03));
 float light=pow(1.-smoothstep(.012,.10,cell),2.);
 float small=cells(p*33.+warp*3.1+vec2(time*.02));
 float rays=(light*.36+pow(1.-smoothstep(.008,.05,small),2.)*.11)*(.65+fbm(p*9.)*.6);
 water+=vec3(.72,.90,.83)*rays*smoothstep(-.02,.055,wet);
 float froth=0.;
 for(int i=0;i<3;i++){
 float phase=fract(time*(.048+storm*.065)+float(i)/3.);
 float front=.40*(1.-phase)-.025;
 float edge=coast-front-sweep+.015*sin(uv.y*18.+time*.7)+.012*sin(uv.y*43.-time*.4);
 float lace=fbm(p*65.+vec2(time*.20,-time*.08));
 float crest=exp(-pow(edge/(.009+.008*lace+storm*.008),2.));
 float trailing=smoothstep(-.005,.016,edge)*(1.-smoothstep(.025,.105,edge));
 float holes=1.-smoothstep(.035,.12,cells(p*48.+warp*4.+vec2(-time*.13,0)));
 float wash=trailing*(holes*.62+smoothstep(.55,.72,lace)*.25);
 float alive=smoothstep(0.,.10,phase)*(1.-smoothstep(.83,1.,phase));
 froth=max(froth,(crest*.90+wash)*alive);
 water*=1.-.09*exp(-pow((edge+.015)/.025,2.))*alive;
 }
 float beachfoam=exp(-pow((wet-.005)/.014,2.))*(.4+.6*noise(p*130.));
 froth=max(froth,beachfoam);
 water=mix(water,vec3(.96,.99,.94),clamp(froth,0.,.97));
 vec3 color=mix(sand,water,smoothstep(-.006,.008,wet));
 float island=islandField(vec2(worldX,(uv.x-baseShore)*12.),vec2(0.,${islandCenter.z.toFixed(1)}),vec2(${islandRadius.x.toFixed(1)},${islandRadius.z.toFixed(1)}));island=min(island,islandField(vec2(worldX,(uv.x-baseShore)*12.),vec2(${campingCenter.x.toFixed(1)},${campingCenter.z.toFixed(1)}),vec2(${campingRadius.x.toFixed(1)},${campingRadius.z.toFixed(1)})));island=min(island,islandField(vec2(worldX,(uv.x-baseShore)*12.),vec2(${tinyCenter.x.toFixed(1)},${tinyCenter.z.toFixed(1)}),vec2(${tinyRadius.x.toFixed(1)},${tinyRadius.z.toFixed(1)})));${newIslands.map(i=>`island=min(island,islandField(vec2(worldX,(uv.x-baseShore)*12.),vec2(${i.x.toFixed(1)},${i.z.toFixed(1)}),vec2(${i.rx.toFixed(1)},${i.rz.toFixed(1)})));`).join('')}float reef=exp(-pow((island-.14)/.20,2.));color=mix(color,vec3(.38,.85,.78),reef*.40);float islandFoam=exp(-pow((island-.03-sin(time*.8)*.015)/.035,2.));color=mix(color,vec3(.98,1.,.94),islandFoam*.8);
 if(mood>.5&&mood<1.5){color=mix(color*vec3(1.03,.77,.76),vec3(.98,.73,.56),rays*.36);}
 if(mood>2.5){color=color*vec3(.64,.75,.8);}
 if(mood>1.5&&mood<2.5){color=color*vec3(.25,.38,.55)+vec3(.10,.16,.22)*rays;}
 color+=(hash(gl_FragCoord.xy)-.5)*.015;
 gl_FragColor=vec4(color,1.);
}`;
export function OceanShore({mood,camera}:{mood:Mood;camera:RefObject<SeaCamera>}){
 const ref=useRef<HTMLCanvasElement>(null),moodRef=useRef(mood);const [failed,setFailed]=useState(false);const attempt=useGraphicsRecovery(ref,failed);moodRef.current=mood;
 useEffect(()=>{const canvas=ref.current!;const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl){recordGraphicsFailure('shore',{stage:'context_unavailable',detail:'getContext(webgl) returned null'});setFailed(true);return}
 if(gl.isContextLost()){setFailed(true);return}let stopped=false,frame=0,last=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error((type===gl.VERTEX_SHADER?'vertex_compile: ':'fragment_compile: ')+(gl.getShaderInfoLog(s)||'Shader compilation failed'));return s};
 let program:WebGLProgram,vs:WebGLShader,fs:WebGLShader;
 try{vs=shader(gl.VERTEX_SHADER,vertex);fs=shader(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('program_link: '+(gl.getProgramInfoLog(program)||'Program link failed'))}catch(e){recordGraphicsFailure('shore',{stage:'shader_setup',detail:e instanceof Error?e.message:String(e)});setFailed(true);return}
 setFailed(false);gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
 const offset=gl.getUniformLocation(program,'offset');const res=gl.getUniformLocation(program,'resolution'),time=gl.getUniformLocation(program,'time'),mode=gl.getUniformLocation(program,'mood');
 const resize=()=>{const d=Math.min(devicePixelRatio,1.25,Math.sqrt(900000/(canvas.clientWidth*canvas.clientHeight)));canvas.width=Math.round(canvas.clientWidth*d);canvas.height=Math.round(canvas.clientHeight*d);gl.viewport(0,0,canvas.width,canvas.height)};resize();window.addEventListener('resize',resize);
 const draw=(ms:number)=>{if(stopped)return;if(ms-last>40){last=ms;gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);for(let n=0;n<3;n++)gl.disableVertexAttribArray(n);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);gl.uniform2f(res,canvas.width,canvas.height);gl.uniform2f(offset,camera.current.x,camera.current.z);gl.uniform1f(time,reduced?18:ms/1000);gl.uniform1f(mode,{day:0,sunset:1,night:2,rain:3}[moodRef.current]);gl.drawArrays(gl.TRIANGLES,0,6);drawSeaTerrain({gl,canvas,view:'shore'})}frame=requestAnimationFrame(draw)};frame=requestAnimationFrame(draw);
 const lost=(e:Event)=>{e.preventDefault();recordGraphicsFailure('shore',{stage:'context_lost',detail:'WebGL context lost'});stopped=true;setFailed(true)};canvas.addEventListener('webglcontextlost',lost);
 return()=>{stopped=true;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);canvas.removeEventListener('webglcontextlost',lost);if(buffer&&gl.isBuffer(buffer))gl.deleteBuffer(buffer);if(gl.isProgram(program))gl.deleteProgram(program);if(gl.isShader(vs))gl.deleteShader(vs);if(gl.isShader(fs))gl.deleteShader(fs)};
 },[attempt,camera]);
 return <div className={`shore-scene ${failed?'shore-fallback':''}`}><canvas ref={ref} role="img" aria-label="위에서 바라본 청록빛 해변. 하얀 포말이 모래 위로 밀려오고 물속 빛이 반짝입니다."/>{failed&&<div className="fallback-foam"/>}</div>
}
export function SeaFriends({count}:{count:number|null}){
 const visible=Math.min(count??0,12);
 return <div className="sea-friends" role="img" aria-label={count===null?'접속 창 수 확인 중':`${count}개의 접속 창을 나타내는 익명의 물멍 친구들. 최대 12명을 표시합니다.`}>
 {Array.from({length:visible},(_,i)=>{const y=[.43,.68,.24,.81,.55,.16,.75,.35,.62,.29,.49,.87][i];const shore=.17+.1*y+.023*Math.sin(y*10)+.012*Math.sin(y*24+.6);return <div className="sea-friend" key={i} style={{left:`${(shore-.055-(i%2)*.025)*100}%`,top:`${y*100}%`,transform:`translate(-50%,-50%) rotate(${i%2?12:-8}deg)`}}><svg width="28" height="36" viewBox="0 0 28 36" aria-hidden="true"><ellipse cx="11" cy="25" rx="10" ry="6" fill="#173c4426"/><rect x="5" y="9" width="18" height="22" rx="4" fill={['#e5b68f','#a7bec0','#d6bb9c','#b7bf9c'][i%4]} opacity=".8"/><path d="M14 21L22 25M15 19L24 20" fill="none" stroke="#465e64" strokeWidth="4" strokeLinecap="round"/><ellipse cx="12" cy="17" rx="5.5" ry="7" fill={['#faf4e7','#506c7b','#b47359','#e6d8b9'][i%4]}/><circle cx="12" cy="9" r="5.5" fill="#c6a47f"/><circle cx="12" cy="9" r="3.3" fill="#ead3a6"/></svg></div>})}
 {count!==null&&count>12&&<span className="friends-more">그리고 {count-12}개의 창도 함께 쉬는 중</span>}
 </div>
}
