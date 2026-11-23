import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const result=await build({stdin:{contents:"export * from './lib/sea-winter'; export {validAvatar} from './components/avatar-state'; export * from './components/peer-motion';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'}),m={exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports);
const {winterRide,travelSpeed,winterOwnership,canClaimWinterGift,winterGiftPosition,validAvatar,makePeerTrack,pushPeerFrame,advancePeer}=m.exports;
test('all visitors get skis on frozen water; land and boat passengers keep their own pose',()=>{
 assert.equal(winterRide(true,false,false,false,false),'ski');
 assert.equal(winterRide(true,false,false,true,false),'sled');
 assert.equal(winterRide(true,false,false,true,true),'rudolph');
 for(const [frozen,land,boat]of [[false,false,false],[true,true,false],[true,false,true]])assert.equal(winterRide(frozen,land,boat,true,true),undefined);
});
test('Rudolph increases frozen-water speed by about 40 percent; no bonus on land or in ordinary weather',()=>{
 assert.equal(travelSpeed(true,false,false,false),3);
 assert.equal(travelSpeed(true,false,true,false),3.8);
 assert.ok(Math.abs(travelSpeed(true,false,true,true)/3.8-1.4)<.01);
 assert.equal(travelSpeed(true,true,true,true),2.4);
 assert.equal(travelSpeed(false,false,false,true),2.4);
 assert.equal(travelSpeed(false,false,true,true),3.8);
});
test('old saves need no winter fields and an unowned reward cannot be equipped',()=>{
 assert.deepEqual(winterOwnership({raftOwned:true}),{rudolphOwned:false,rudolphEquipped:false});
 assert.deepEqual(winterOwnership({rudolphOwned:'true',rudolphEquipped:true}),{rudolphOwned:false,rudolphEquipped:false});
 assert.deepEqual(winterOwnership({rudolphOwned:true,rudolphEquipped:true}),{rudolphOwned:true,rudolphEquipped:true});
});
test('gift requires snow, proximity and a first acquisition, including finite coordinates',()=>{
 const {x,z}=winterGiftPosition;
 assert.equal(canClaimWinterGift(true,false,x,z),true);
 for(const args of [[false,false,x,z],[true,true,x,z],[true,false,x+1.21,z],[true,false,NaN,z],[true,false,x,Infinity]])assert.equal(canClaimWinterGift(...args),false);
});
test('shared avatar accepts bounded seasonal flags and rejects malformed flags while remaining backward compatible',()=>{
 const avatar={x:0,z:5,heading:0,view:'dream',tube:false,moving:true,look:{color:'#b7b0db',hat:true,tube:'#f2b8c8'}};
 assert.equal(validAvatar(avatar),true);assert.equal(validAvatar({...avatar,winter:true,rudolph:true}),true);
 for(const field of ['winter','rudolph'])for(const value of ['true',[],1,{}])assert.equal(validAvatar({...avatar,[field]:value}),false);
});

test('other visitors follow a fast Rudolph without cumulative lag or teleport fades',()=>{
 const peer={id:'winter-peer',seen:10000,x:0,z:0,heading:0,view:'dream',tube:false,moving:true,winter:true,rudolph:true,look:{color:'#b7b0db',hat:true,tube:'#f2b8c8'}};
 const track=makePeerTrack(peer,0);let last=0;
 for(let t=20;t<=10000;t+=20){
  if(t%1000===0)pushPeerFrame(track,{...peer,seen:10000+t,z:t/1000*5.3},t);
  const shown=advancePeer(track,t,.02);assert.ok(shown.z>=last);assert.ok(shown.z-last<.14);assert.equal(track.warp,undefined);last=shown.z;
 }
 assert.ok(Math.abs(last-(10-1.15)*5.3)<.25);
});
