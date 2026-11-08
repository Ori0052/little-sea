import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const r=await build({stdin:{contents:`export {parseSeaPreferences} from './hooks/use-sea-preferences';export {SeaIdleNotice} from './components/sea-idle-notice';`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom','react-dom/server']});const m={exports:{}};new Function('require','module','exports',r.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports);const{parseSeaPreferences,SeaIdleNotice}=m.exports;
test('return visits accept only supported preferences and recover from corrupt storage',()=>{for(const raw of [null,'bad','null','[]','{"view":"invalid","mood":"invalid","volume":"loud"}'])assert.deepEqual(parseSeaPreferences(raw),{view:'dream',mood:'day',volume:.35});assert.deepEqual(parseSeaPreferences('{"view":"shore","mood":"night","volume":0}'),{view:'shore',mood:'night',volume:0});assert.equal(parseSeaPreferences('{"volume":8}').volume,1);assert.equal(parseSeaPreferences('{"volume":-4}').volume,0)});
test('resting preserves an accessible nonblocking return action rather than a forced logout dialog',()=>{const draw=p=>renderToStaticMarkup(React.createElement(SeaIdleNotice,{onResume(){},...p}));assert.equal(draw({idle:false,remaining:null}),'');const html=draw({idle:true,remaining:null});assert.doesNotMatch(html,/<dialog|aria-modal|접속을 종료/);assert.match(html,/다시 함께하기/);assert.match(html,/소리와 풍경은 그대로/);const warning=draw({idle:false,remaining:29});assert.doesNotMatch(warning,/29|접속이 종료/);assert.match(warning,/자리 점유/)});
