import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
const built=await build({stdin:{contents:`export {boatAction} from './components/journey-state';export {PartyBoat} from './components/party-boat';export {SeaFeedback} from './components/sea-feedback';export {CookingAction} from './components/cooking-action';`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom','react-dom/server']});
const m={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports);const{boatAction,PartyBoat,SeaFeedback,CookingAction}=m.exports;
const draw=(C,props)=>render(React.createElement(C,props));
const ref=current=>({current}),now=Date.now(),camera=ref({x:0,z:-2,yaw:0,pitch:0,depth:0,eye:1,ground:0,spread:1});
const boat={x:0,z:8.5,heading:0,targetX:null,targetZ:null,departed:0,serverNow:now,captain:null,passengers:[],selfSeat:null,selfCaptain:false};
const base={boat,pose:{x:0,z:8.5,heading:0,time:now,moving:false},view:'dream',camera,world:ref(null),point:{x:0,y:0},peers:[],selfId:'self',selfLook:{color:'#b7b0db',hat:true,tube:'#f2b8c8'},selfCrown:null,selfName:'test',onApproach(){},onBoard(){},busy:false};
test('approach is an action only before moving; arrival reveals boarding, statuses are never buttons',()=>{
 assert.match(draw(PartyBoat,base),/배로 다가가기/);
 assert.doesNotMatch(draw(PartyBoat,{...base,approaching:true}),/<button/);
 assert.match(draw(PartyBoat,{...base,approaching:true,point:{x:0,y:7}}),/함께 타기/);
 for(const p of [{...base,busy:true},{...base,pose:{...base.pose,moving:true}},{...base,boat:{...boat,passengers:Array.from({length:6},(_,seat)=>({seat,id:String(seat)}))}}]){const html=draw(PartyBoat,p);assert.doesNotMatch(html,/<button/);assert.match(html,/role="status"/)}
 assert.equal(boatAction({aboard:true,near:true,moving:false,full:false,busy:false,approaching:true}),'none');
});
test('journeys render a single distance readout with no floating stop button or duplicate tip',()=>{
 const props={journey:{name:'함께 타는 배',kind:'boat',x:0,z:8},arrival:'도착',point:{x:0,y:0},view:'dream',mode:'swim'};
 const html=draw(SeaFeedback,props);assert.match(html,/8m 남음/);assert.doesNotMatch(html,/<button|journey-hud|journey-arrow|arrival-hud/);assert.match(html,/aria-live="off"/);
 assert.doesNotMatch(draw(SeaFeedback,{...props,hideJourney:true}),/8m 남음/);
 assert.equal(draw(SeaFeedback,{...props,disabled:true}),'');
});
test('cooking countdowns have named progress only; ready/burnt food has a real action and absent fish stays absent',()=>{
 const p={kind:'potato',readyAt:now+10000,now,stock:1,busy:false,near:true,onStart(){},onCollect(){}};
 let html=draw(CookingAction,p);assert.match(html,/고구마 · 굽는 중/);assert.doesNotMatch(html,/<button/);
 assert.match(draw(CookingAction,{...p,readyAt:null}),/고구마 굽기/);
 assert.match(draw(CookingAction,{...p,readyAt:now-1}),/고구마 꺼내 먹기/);
 assert.match(draw(CookingAction,{...p,readyAt:now-50000}),/탄 고구마 정리/);
 assert.doesNotMatch(draw(CookingAction,{...p,preparing:true}),/<button/);
 assert.equal(draw(CookingAction,{...p,kind:'fish',readyAt:null,stock:0}),'');
 html=draw(CookingAction,{...p,kind:'fish',stock:0});assert.match(html,/생선 · 굽는 중/);assert.doesNotMatch(html,/<button/);
 assert.match(draw(CookingAction,{...p,kind:'fish',stock:0,readyAt:now-1}),/구운 물고기 먹기/);
});
