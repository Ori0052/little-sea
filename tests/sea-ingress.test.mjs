import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
const db=new DatabaseSync(':memory:');
db.exec('CREATE TABLE sea_rate_limits(key TEXT PRIMARY KEY,window_start INTEGER,count INTEGER);CREATE TABLE sea_sessions(id TEXT PRIMARY KEY,visitor TEXT,token_hash TEXT,expires_at INTEGER)');
let sqlCalls=0,failDB=false,failPrepare=false,clock=Date.now();const realNow=Date.now;Date.now=()=>clock;
globalThis.__ingressTestEnv={DB:{prepare(sql){if(failPrepare)throw Error('binding offline');return{bind(...args){return{async first(){sqlCalls++;if(failDB)throw Error('offline');return db.prepare(sql).get(...args)??null}}}}}}};
const bundled=await build({stdin:{contents:`export * from './lib/sea-request-guard';export {GET,POST} from './app/api/presence/route';export {POST as issue} from './app/api/session/route';export {seaCorsPreflight,withSeaCors,tossOrigins} from './lib/sea-origin';`,resolveDir:new URL('..',import.meta.url).pathname,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'test-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__ingressTestEnv;',loader:'js'}))}}]});
const url='data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64');
const a=await import(url+'#isolate-a'),b=await import(url+'#isolate-b'),c=await import(url+'#isolate-c');
const req=(ip,path='/api/presence',headers={},body={id:crypto.randomUUID(),visitor:crypto.randomUUID(),token:'f'.repeat(64)})=>new Request('https://little-sea.rhfenrdltkfk.chatgpt.site'+path,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':ip,...headers},body:JSON.stringify(body)});
test('anonymous snapshots are closed without any DB work, including HEAD-compatible handler use',async()=>{const before=sqlCalls;for(let n=0;n<250;n++){const r=await a.GET();assert.equal(r.status,405);assert.equal(r.headers.get('Allow'),'POST');assert.equal(r.headers.get('Cache-Control'),'no-store');const d=await r.json();assert.equal(d.peers,undefined);assert.equal(d.count,undefined)}assert.equal(sqlCalls,before)});
test('rotated bad credentials and spoofed forwarded headers share one pre-auth network budget; repeated denials do not query D1',async()=>{
 const ip='203.0.113.10',start=sqlCalls;
 for(let n=0;n<a.ingressLimit;n++){const r=await a.POST(req(ip,'/api/presence',{'X-Forwarded-For':String(n),'X-Real-IP':String(n)}));assert.equal(r.status,401)}
 assert.equal(sqlCalls-start,a.ingressLimit+a.ingressLimit/a.ingressLease);
 let r=await a.POST(req(ip));assert.equal(r.status,429);assert.ok(Number(r.headers.get('Retry-After'))>0);
 const deniedAt=sqlCalls;
 for(let n=0;n<250;n++){const r=await a.POST(req(ip));assert.equal(r.status,429)}
 assert.equal(sqlCalls,deniedAt);
 // All endpoints share ingress admission; session issuance is blocked before its own DB operations.
 assert.equal((await a.issue(req(ip,'/api/session',{}, {visitor:crypto.randomUUID()}))).status,429);assert.equal(sqlCalls,deniedAt);
 // New isolate cannot mint a fresh per-IP budget; one denial check then memory rejection.
 assert.equal((await b.POST(req(ip))).status,429);assert.equal(sqlCalls,deniedAt+1);
 for(let n=0;n<50;n++)assert.equal((await b.POST(req(ip))).status,429);
 assert.equal(sqlCalls,deniedAt+1);
});
test('simultaneous requests across three isolates cannot exceed the shared grant budget',async()=>{
 const ip='203.0.113.20',runs=[];
 for(let n=0;n<2100;n++)runs.push([a,b,c][n%3].guardSeaRequest(req(ip)));
 const rs=await Promise.all(runs);
 assert.equal(rs.filter(r=>r===null).length,1800);assert.equal(rs.filter(r=>r?.status===429).length,300);
 const used=db.prepare("SELECT count FROM sea_rate_limits WHERE key LIKE 'ingress:%' AND count=1800").all();assert.ok(used.length>=2);
});
test('window rollover and separate networks work without granting old-window reset attacks',async()=>{
 const ip='203.0.113.10';clock=Math.floor(clock/a.ingressPeriod)*a.ingressPeriod+a.ingressPeriod+1;
 assert.equal(await a.guardSeaRequest(req(ip)),null);assert.equal(await a.guardSeaRequest(req('203.0.113.11')),null);
 const current=db.prepare("SELECT window_start FROM sea_rate_limits WHERE key LIKE 'ingress:%' ORDER BY window_start DESC LIMIT 1").get().window_start;
 assert.equal(current,Math.floor(clock/a.ingressPeriod)*a.ingressPeriod);
});
test('failure to reserve capacity fails closed and backs off without touching auth tables',async()=>{
 failDB=true;const ip='203.0.113.30',before=sqlCalls;
 assert.equal((await a.POST(req(ip))).status,503);assert.equal(sqlCalls,before+1);
 for(let n=0;n<25;n++)assert.equal((await a.POST(req(ip))).status,503);
 assert.equal(sqlCalls,before+1);failDB=false;clock+=5001;
 assert.equal((await a.POST(req(ip))).status,401);
});
test('synchronous binding errors also recover after the cooldown without a stuck pending grant',async()=>{failPrepare=true;assert.equal((await a.guardSeaRequest(req('203.0.113.31'))).status,503);failPrepare=false;clock+=5001;assert.equal(await a.guardSeaRequest(req('203.0.113.31')),null)});
test('web and both Toss origins retain POST CORS, GET preflight is denied',()=>{
 for(const origin of a.tossOrigins){const r=new Request('https://little-sea.rhfenrdltkfk.chatgpt.site/api/presence',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}});assert.equal(a.seaCorsPreflight(r).status,204);const limited=a.withSeaCors(r,new Response(null,{status:429,headers:{'Retry-After':'60'}}));assert.equal(limited.headers.get('Access-Control-Allow-Origin'),origin);const get=new Request(r,{headers:{Origin:origin,'Access-Control-Request-Method':'GET'}});assert.equal(a.seaCorsPreflight(get).status,403)}
});
process.on('exit',()=>{Date.now=realNow;db.close()});
