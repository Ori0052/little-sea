import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {build,transform} from 'esbuild';
const {code}=await transform(await readFile(new URL('../lib/sea-presence-policy.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm'});
const policy=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('rest reduces one minute of polls by 80%, movement and changes retain one second updates',()=>{
 const state={x:0,z:0,moving:false},sent=JSON.stringify(state);
 assert.equal(policy.presenceInterval(state,sent),5000);
 assert.equal(60000/policy.presenceInterval(state,sent),12);
 for(const changed of [{...state,moving:true},{...state,x:1},{...state,fishing:true},{...state,cooking:'fish'}])assert.equal(policy.presenceInterval(changed,sent),1000);
 assert.equal(policy.presenceInterval(state,sent,true),1000);
 assert.deepEqual([1,2,3,4,5].map(policy.presenceRetryDelay),[5000,10000,20000,30000,30000]);
});
const db=new DatabaseSync(':memory:');
for(const f of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())db.exec(await readFile(new URL('../drizzle/'+f,import.meta.url),'utf8'));
let statements=[];
const bind=(sql,args=[])=>({bind:(...next)=>bind(sql,next),async first(){statements.push(sql);return db.prepare(sql).get(...args)??null},async all(){statements.push(sql);return{results:db.prepare(sql).all(...args)}},async run(){statements.push(sql);const r=db.prepare(sql).run(...args);return{meta:{changes:r.changes}}}});
globalThis.__presenceTestEnv={DB:{prepare:sql=>bind(sql),async batch(items){db.exec('BEGIN');try{const result=[];for(const item of items)result.push(await item.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}}};
const bundled=await build({entryPoints:[new URL('../app/api/presence/route.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'test-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__presenceTestEnv;',loader:'js'}))}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const realNow=Date.now;let clock=realNow();
const id=crypto.randomUUID(),visitor=crypto.randomUUID(),token='a'.repeat(64);
const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
const state={x:0,z:0,heading:0,view:'dream',look:{color:'#b7b0db',hat:true,tube:'#f2b8c8'},tube:true,moving:false};
const post=(extra={})=>api.POST(new Request('https://little-sea.rhfenrdltkfk.chatgpt.site/api/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,visitor,token,state,...extra})}));
test('heartbeat skips repeated housekeeping and empty-boat writes; leases, ownership and revocation stay enforced',async()=>{
 Date.now=()=>clock;
 try{
 db.prepare('INSERT INTO sea_sessions VALUES(?,?,?,?,?,?)').run(id,visitor,hash,'test',clock,clock+3600000);
 assert.equal((await post()).status,200);
 statements=[];clock+=5000;
 const response=await post();assert.equal(response.status,200);
 assert.equal(statements.filter(s=>s.startsWith('DELETE')).length,0);
 assert.equal(statements.filter(s=>s.startsWith('UPDATE sea_boat')).length,0);
 // Expired boat membership is not renewed by a later heartbeat.
 db.prepare('INSERT INTO boat_passengers(seat,visitor,session,seen) VALUES(0,?,?,?)').run(visitor,id,clock-16000);
 db.prepare('INSERT INTO beach_seats(seat,visitor,session,seen) VALUES(0,?,?,?)').run(visitor,id,clock-91000);
 let body=await(await post({state:{...state,seat:0}})).json();
 assert.equal(body.selfSeat,null);assert.equal(body.boat.selfSeat,null);assert.equal(body.boat.passengers.length,0);
 assert.equal(db.prepare('SELECT seen FROM boat_passengers').get().seen,clock-16000);
 // Live owned seating still gets its heartbeat and foreign ownership is rejected.
 db.prepare('UPDATE beach_seats SET seen=?').run(clock);clock+=5000;
 body=await(await post({state:{...state,seat:0}})).json();assert.equal(body.selfSeat,0);
 assert.equal(db.prepare('SELECT seen FROM beach_seats').get().seen,clock);
 assert.equal((await post({visitor:crypto.randomUUID()})).status,401);
 clock+=61000;statements=[];assert.equal((await post()).status,200);
 assert.equal(statements.filter(s=>s.startsWith('DELETE FROM presence WHERE seen')).length,1);
 assert.equal((await post({leave:true})).status,200);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM presence WHERE id=?').get(id).n,0);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM boat_passengers WHERE session=?').get(id).n,0);
 assert.equal((await post()).status,401);
 }finally{Date.now=realNow}
});
