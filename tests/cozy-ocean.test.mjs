import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import * as THREE from 'three';
const compiled=await build({entryPoints:['components/cozy-ocean.ts'],bundle:true,write:false,platform:'node',format:'cjs',external:['three']}),module={exports:{}};
new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const{createCozyOcean,cozyWaveHeight,cozyWaveScale}=module.exports;
const state={time:23,delta:1/60,mood:'day',frozen:false,reducedMotion:false,centerX:0,centerZ:0};
test('calm swells stay under 8cm, vary continuously, and storms have a bounded larger range',()=>{
 for(let i=0;i<1000;i++){
  const x=i*.113-50,z=i*.417,t=i*.071,h=cozyWaveHeight(x,z,t);
  assert(Math.abs(h)<=.0750001);
  assert(Math.abs(cozyWaveHeight(x,z,t+.016)-h)<.002);
  assert(Math.abs(cozyWaveHeight(x,z,t,cozyWaveScale('thunder')))<=.271);
 }
 assert.equal(cozyWaveScale('day',true),0);
 assert.equal(cozyWaveScale('unknown'),1);
});
test('near/far sea mesh stays within the mobile vertex budget and its four joins share exact boundary vertices',()=>{
 const scene=new THREE.Scene(),ocean=createCozyOcean(scene),g=ocean.water.geometry,p=g.getAttribute('position'),indices=g.getIndex().array;
 assert.equal(p.count,9797);assert.equal(indices.length/3,19200);
 for(const i of indices)assert(i>=0&&i<p.count);
 // Dense water ends at 64m; its far ring must reference that existing edge.
 const nearVertices=97*97,ringIndices=indices.slice(96*96*6);
 assert.equal(ringIndices.filter(i=>i<nearVertices).length,4*96*3);
 assert.equal(p.getX(nearVertices),-800);assert.equal(p.getZ(nearVertices),-800);
 assert.equal(ocean.sky.userData.cozyScreenSpace,true);ocean.dispose();
});
test('water sampling follows world coordinates while the grid is recentered, and frozen/reduced motion are stable',()=>{
 const scene=new THREE.Scene(),ocean=createCozyOcean(scene);ocean.update(state);const first=ocean.heightAt(2,9);
 ocean.update({...state,centerX:240,centerZ:100});assert.equal(ocean.heightAt(2,9),first);assert.equal(ocean.water.position.x,240);
 ocean.update({...state,reducedMotion:true,time:60});const fixed=ocean.heightAt(2,9);ocean.update({...state,reducedMotion:true,time:600});assert.equal(ocean.heightAt(2,9),fixed);ocean.dispose();
 const frozen=createCozyOcean(new THREE.Scene());frozen.update({...state,mood:'snow',frozen:true});assert.equal(frozen.heightAt(2,9),0);frozen.dispose();
});
test('initial night entry starts dark immediately, later weather changes fade, and lightning does not accumulate light power',()=>{
 const scene=new THREE.Scene(),ocean=createCozyOcean(scene);ocean.update({...state,mood:'night'});assert.equal(ocean.skyMaterial.uniforms.uNight.value,1);assert.equal(ocean.lights.sun.intensity,1);
 ocean.update(state);assert(ocean.skyMaterial.uniforms.uNight.value>0&&ocean.skyMaterial.uniforms.uNight.value<1);
 for(let i=0;i<240;i++)ocean.update({...state,mood:'thunder',flash:1});assert(ocean.lights.sun.intensity<2.5);
 ocean.dispose();
});
test('disposal removes only owned objects, restores prior fog/background and is idempotent',()=>{
 const scene=new THREE.Scene(),external=new THREE.Group(),fog=new THREE.Fog(0xaaaaff,10,100),background=new THREE.Color('pink');scene.add(external);scene.fog=fog;scene.background=background;
 const ocean=createCozyOcean(scene);assert.notEqual(scene.fog,fog);ocean.dispose();ocean.dispose();assert.deepEqual(scene.children,[external]);assert.equal(scene.fog,fog);assert.equal(scene.background,background);
});
