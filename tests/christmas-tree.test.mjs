import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const result=await build({stdin:{contents:"export * from './components/christmas-tree-mesh';export {terrainHeight} from './components/island-terrain';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'}),m={exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports);
const {createChristmasTreeMesh,christmasTreeSites,terrainHeight}=m.exports,mesh=createChristmasTreeMesh();

test('solid tree geometry fits its interleaved GPU format and a bounded seasonal buffer',()=>{
 assert.equal(mesh.length%21,0);assert.ok(mesh.byteLength<3*1024*1024);
 for(let i=0;i<mesh.length;i+=7){
  assert.ok(Array.from(mesh.subarray(i,i+7)).every(Number.isFinite));
  for(let c=3;c<6;c++)assert.ok(mesh[i+c]>=0&&mesh[i+c]<=1);
  assert.ok(mesh[i+6]>=-1&&mesh[i+6]<=0);
 }
});
test('both island trees have ground contact and genuine depth, including their illuminated decorations',()=>{
 for(const site of christmasTreeSites){
  const vertices=[];for(let i=0;i<mesh.length;i+=7)if(Math.hypot(mesh[i]-site.x,mesh[i+1]-site.z)<2*site.scale)vertices.push(Array.from(mesh.subarray(i,i+7)));
  assert.ok(vertices.length>1000);
  const extent=n=>Math.max(...vertices.map(v=>v[n]))-Math.min(...vertices.map(v=>v[n]));
  assert.ok(extent(0)>1.4*site.scale);assert.ok(extent(1)>1.3*site.scale);assert.ok(extent(2)>4.5*site.scale);
  assert.ok(vertices.some(v=>Math.abs(v[2]-terrainHeight(v[0],v[1]))<.04));
  const lamps=vertices.filter(v=>v[6]<-.7);assert.ok(lamps.some(v=>v[1]>site.z)&&lamps.some(v=>v[1]<site.z));
 }
});
test('tree layout remains stable across visits rather than changing when graphics is recreated',()=>{
 assert.deepEqual(createChristmasTreeMesh(),mesh);
});
