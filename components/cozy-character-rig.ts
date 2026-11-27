import {cozyRowingGrip} from '../lib/sea-rowing-motion';
import {Color,Group,Mesh,MeshStandardMaterial,Quaternion,Vector3,type Object3D} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

export const cozyCharacterAsset='/models/cozy-character.glb';
export const cozyCharacterSeatHipHeight=.305;
export const cozyCharacterHeight=1.167;
export type CozyCharacterPose={time:number;delta:number;moving:boolean;swimming:boolean;seated:boolean;rowing:boolean;eating:boolean;fishing:boolean;hat:boolean;color:string;reducedMotion:boolean};
type Arm={root:Object3D;fore:Object3D;hand:Object3D;side:number;neutral:Quaternion};
type Rig={motion:Object3D;head:Object3D;eyes:Object3D[];body:Object3D;hat:Object3D;food:Object3D;rod:Object3D;arms:Arm[];legs:{root:Object3D;shin:Object3D;side:number}[];shirt:MeshStandardMaterial[];phase:number;color:string;joints:{node:Object3D;previous:Quaternion;target:Quaternion}[];ready:boolean};
let template:Promise<Object3D>|null=null;
const rigs=new WeakMap<Object3D,Rig>();
const down=new Vector3(0,-1,0),target=new Vector3(),direction=new Vector3(),bend=new Vector3(),elbow=new Vector3(),fore=new Vector3(),segment=new Vector3(),inverse=new Quaternion();

/** One downloaded GLB; each avatar owns its pose and tint, while sharing GPU geometry. */
export async function loadCozyCharacter():Promise<Object3D>{
 if(!template)template=new GLTFLoader().loadAsync(cozyCharacterAsset).then(g=>g.scene).catch(error=>{template=null;throw error});
 const source=await template,root=new Group();root.name='CozyCharacterInstance';
 const model=source.clone(true),materials=new Map<MeshStandardMaterial,MeshStandardMaterial>();root.add(model);
 model.traverse(node=>{if(!(node instanceof Mesh))return;node.castShadow=true;node.receiveShadow=true;const own=(m:MeshStandardMaterial)=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m)!};node.material=Array.isArray(node.material)?node.material.map(m=>own(m as MeshStandardMaterial)):own(node.material as MeshStandardMaterial)});
 bind(root);return root;
}

function bind(root:Object3D){
 const need=(name:string)=>{const node=root.getObjectByName(name);if(!node)throw new Error('Cozy character node is missing: '+name);return node};
 const shirt:MeshStandardMaterial[]=[];
 root.traverse(node=>{if(node instanceof Mesh)for(const m of(Array.isArray(node.material)?node.material:[node.material]))if(m instanceof MeshStandardMaterial&&m.name==='Cozy shirt tint'&&!shirt.includes(m))shirt.push(m)});
 const rig:Rig={motion:need('CozyMotion'),head:need('CozyHead'),eyes:['L','R'].map(label=>need('CozyEye'+label)),body:need('CozyBody'),hat:need('CozyHat'),food:need('CozyFood'),rod:need('CozyFishingRod'),arms:['L','R'].map((label,i)=>({root:need('CozyArm'+label),fore:need('CozyForearm'+label),hand:need('CozyHand'+label),side:i?1:-1,neutral:need('CozyArm'+label).quaternion.clone()})),legs:['L','R'].map((label,i)=>({root:need('CozyLeg'+label),shin:need('CozyShin'+label),side:i?1:-1})),shirt,phase:Math.random()*Math.PI*2,color:'',joints:[],ready:false};
 rig.joints=[rig.motion,rig.head,...rig.arms.flatMap(a=>[a.root,a.fore,a.hand]),...rig.legs.flatMap(l=>[l.root,l.shin])].map(node=>({node,previous:new Quaternion(),target:new Quaternion()}));
 rig.food.visible=false;rig.rod.visible=false;
 rigs.set(root,rig);return rig;
}

/** Wrist targets are shared across both shoulders, keeping hands on one imaginary oar shaft. */
function aimArm(arm:Arm,x:number,y:number,z:number){
 target.set(x,y,z).sub(arm.root.position);
 const upper=.145,lower=.140,length=Math.min(upper+lower-.001,Math.max(.012,target.length()));
 direction.copy(target).normalize();
 const along=(upper*upper-lower*lower+length*length)/(2*length),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 bend.set(arm.side*.9,-.3,-.1).addScaledVector(direction,-bend.dot(direction)).normalize();
 elbow.copy(direction).multiplyScalar(along).addScaledVector(bend,height);
 arm.root.quaternion.setFromUnitVectors(down,segment.copy(elbow).normalize());
 inverse.copy(arm.root.quaternion).invert();
 fore.copy(direction).multiplyScalar(length).sub(elbow).applyQuaternion(inverse).normalize();
 arm.fore.quaternion.setFromUnitVectors(down,fore);
 // Keep the wrists upright so fingers curl down over the shared horizontal shaft.
 inverse.copy(arm.root.quaternion).multiply(arm.fore.quaternion).invert();arm.hand.quaternion.copy(inverse);
}

function settle(r:Rig,delta:number,reduced:boolean){const amount=reduced||!r.ready?1:1-Math.exp(-Math.min(.1,Math.max(.001,delta||.016))*14);for(const joint of r.joints){joint.target.copy(joint.node.quaternion);joint.node.quaternion.slerpQuaternions(joint.previous,joint.target,amount)}r.ready=true}

/** Local rig only: the scene owns world position, heading, seat height and water depth. */
export function animateCozyCharacter(root:Object3D,state:CozyCharacterPose):void{
 const r=rigs.get(root)||bind(root),t=state.time,still=state.reducedMotion,step=still?0:Math.sin(t*4.4+r.phase),breath=still?0:Math.sin(t*1.5+r.phase),wave=still?0:Math.sin(t*2.3+r.phase);
 for(const joint of r.joints)joint.previous.copy(joint.node.quaternion);
 const blinkPhase=(t+r.phase*2)%4.8,blink=still?1:blinkPhase<.17?Math.max(.07,Math.abs(blinkPhase-.085)/.085):1;for(const eye of r.eyes)eye.scale.y=blink;
 r.hat.visible=state.hat;r.food.visible=state.eating;r.rod.visible=state.fishing;
 if(r.color!==state.color){r.color=state.color;const tint=new Color(state.color);for(const m of r.shirt)m.color.copy(tint)}
 r.motion.position.y=state.moving&&!state.swimming&&!state.seated&&!still?Math.abs(step)*.014:breath*.003;
 r.motion.rotation.set(0,0,state.moving&&!state.seated&&!still?step*.014:0);
 r.body.scale.set(1,1+breath*.006,1);r.head.rotation.set(breath*.012,Math.sin(t*.63+r.phase)*(still?0:.024),state.seated?breath*.018:0);
 for(const arm of r.arms){arm.root.quaternion.copy(arm.neutral);arm.fore.rotation.set(0,0,0);arm.hand.rotation.set(0,0,0);arm.root.rotation.z=arm.side*.14;arm.root.rotation.x=state.moving&&!still?-step*arm.side*.24:0;arm.fore.rotation.x=-.10}
 for(const leg of r.legs){leg.root.rotation.set(state.seated?-1.25:state.swimming?-.45:state.moving?step*leg.side*.28:0,0,0);leg.shin.rotation.set(state.seated?1.35:state.swimming?.25:state.moving?Math.max(0,-step*leg.side)*.23:0,0,0)}
 if(state.swimming){for(const arm of r.arms){arm.root.rotation.set(-.28+wave*arm.side*.18,0,arm.side*(.95+wave*.1));arm.fore.rotation.x=-.22;arm.fore.rotation.z=-arm.side*.16}r.head.rotation.x=.035;settle(r,state.delta,still);return}
 if(state.rowing){const grip=cozyRowingGrip(t,state.moving,still);for(const arm of r.arms)aimArm(arm,arm.side*.061,grip.y,grip.z);r.head.rotation.x=grip.stroke*.018;settle(r,state.delta,still);return}
 if(state.eating){aimArm(r.arms[1],.040,.648+wave*.007,.174);aimArm(r.arms[0],-.053,.439,.170);r.head.rotation.x=.055+wave*.018;settle(r,state.delta,still);return}
 if(state.fishing){aimArm(r.arms[1],.073,.462,.205);aimArm(r.arms[0],-.049,.435,.180);settle(r,state.delta,still);return}
 if(state.seated){for(const arm of r.arms)aimArm(arm,arm.side*.10,.338,.155);r.head.rotation.x=.015}
 settle(r,state.delta,still);
}
