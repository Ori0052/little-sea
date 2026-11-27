import * as T from 'three';
import {fireCenter,terrainHeight} from './island-terrain';

export function createCozyFire(scene:T.Scene,kit:T.Object3D){
 const root=new T.Group();root.name='CozyLivingCampfire';root.position.set(fireCenter.x,terrainHeight(fireCenter.x,fireCenter.z)+.015,fireCenter.z);scene.add(root);
 const logs=kit.getObjectByName('CozyCampfire')?.clone(true);if(logs)root.add(logs);
 const shape=new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.13,.03),new T.Vector2(.21,.16),new T.Vector2(.17,.35),new T.Vector2(.11,.60),new T.Vector2(.035,.82),new T.Vector2(0,1)],18);
 const vertex=`varying vec3 vCozyFlame;void main(){vCozyFlame=position;vec3 transformed=position;#include <project_vertex>}`.replace(';#include',';\n#include');
 const fragment=`precision highp float;uniform vec3 tint;uniform float strength;varying vec3 vCozyFlame;void main(){float h=vCozyFlame.y;vec3 flame=mix(vec3(1.,.67,.18),tint,smoothstep(.04,.85,h));float a=(.48+.22*(1.-h))*strength;gl_FragColor=vec4(flame,a);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include');
 // Alpha-composite the nested lobes: additive layers burned the entire flame white.
 const flames=Array.from({length:7},(_,i)=>{const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{tint:{value:new T.Color(i%2?'#ff6522':'#ffb241')},strength:{value:1}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.NormalBlending});const mesh=new T.Mesh(shape,material);mesh.position.set(Math.sin(i*2.4)*.13,.12,Math.cos(i*2.4)*.12);mesh.scale.setScalar(i===0?.93:.44+(i%3)*.14);root.add(mesh);return mesh});
 const sparksGeometry=new T.SphereGeometry(.018,5,4),sparksMaterial=new T.MeshBasicMaterial({color:'#ffe2a3',transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending}),sparks=new T.InstancedMesh(sparksGeometry,sparksMaterial,22);root.add(sparks);
 const glowGeometry=new T.CircleGeometry(2.1,40),glowMaterial=new T.MeshBasicMaterial({color:'#ffb54d',transparent:true,opacity:.085,depthWrite:false,blending:T.AdditiveBlending}),glow=new T.Mesh(glowGeometry,glowMaterial);glow.rotation.x=-Math.PI/2;glow.position.y=.015;root.add(glow);
 const light=new T.PointLight('#ffb75b',2.4,7,1.7);light.position.set(0,.7,0);root.add(light);
 const matrix=new T.Matrix4(),position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3(),auroraColor=new T.Color('#9ce5c0'),warmColor=new T.Color('#ff9a38');let lastLit=false;
 function update({time,lit,aurora,reducedMotion,near}:{time:number;lit:boolean;aurora:boolean;reducedMotion:boolean;near:boolean}){
  root.visible=near;light.visible=lit;glow.visible=lit;for(let i=0;i<flames.length;i++){const flame=flames[i],wave=reducedMotion?0:Math.sin(time*3.2+i*1.73),base=i===0?.93:.44+(i%3)*.14;flame.visible=lit;flame.scale.set(base*(1+wave*.05),base*(1+wave*.12),base);flame.rotation.set(wave*.09,0,Math.sin(time*2.3+i)*(!reducedMotion?.11:0));flame.material.uniforms.tint.value.copy(aurora?auroraColor:warmColor);if(aurora&&i%3===0)flame.material.uniforms.tint.value.set('#b896ed')}
  light.color.copy(aurora?auroraColor:warmColor);light.intensity=lit?2.1+(reducedMotion?0:Math.sin(time*3.1)*.14+Math.sin(time*5.4)*.09):0;
  sparks.visible=lit&&!reducedMotion;for(let i=0;i<22;i++){const phase=(time*.16+i*.137)%1,angle=i*2.4;position.set(Math.sin(angle+phase*2)*(.12+phase*.31),.25+phase*1.9,Math.cos(angle)*(.12+phase*.19));scale.setScalar((1-phase)*(.4+(i%3)*.15));matrix.compose(position,quaternion,scale);sparks.setMatrixAt(i,matrix)}sparks.instanceMatrix.needsUpdate=true;
  glowMaterial.color.copy(aurora?auroraColor:warmColor);if(lastLit!==lit){lastLit=lit;root.userData.lit=lit}
 }
 function dispose(){scene.remove(root);shape.dispose();sparksGeometry.dispose();sparksMaterial.dispose();glowGeometry.dispose();glowMaterial.dispose();for(const flame of flames)flame.material.dispose()}
 return{root,update,dispose};
}
