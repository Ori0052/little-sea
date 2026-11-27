import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {cozyRowingGrip} from '../lib/sea-rowing-motion';
let geometry:T.BufferGeometry|undefined;
const material=new T.MeshStandardMaterial({color:'#b7793e',roughness:.65});
export function createCozyOar(){
 if(!geometry){const curve=new T.CatmullRomCurve3([new T.Vector3(-.16,0,0),new T.Vector3(.15,0,0),new T.Vector3(.75,-.17,0),new T.Vector3(1.55,-.58,0)]),shaft=new T.TubeGeometry(curve,14,.019,7,false),blade=new T.CapsuleGeometry(.09,.28,3,10);blade.rotateZ(-Math.PI*.3);blade.scale(1,.90,.30);blade.translate(1.66,-.62,0);geometry=mergeGeometries([shaft,blade],false)!;shaft.dispose();blade.dispose()}
 const group=new T.Group();group.name='CozyWristHeldOar';const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;group.add(mesh);group.visible=false;return group;
}
export function animateCozyOar(oar:T.Group,time:number,moving:boolean,reducedMotion:boolean,side:number){const grip=cozyRowingGrip(time,moving,reducedMotion);oar.position.set(0,grip.y,grip.z);oar.scale.x=side;oar.rotation.y=grip.stroke*.14}
