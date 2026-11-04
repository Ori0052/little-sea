import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const db=new DatabaseSync(':memory:');
db.exec(`CREATE TABLE sea_sessions(id TEXT PRIMARY KEY,visitor TEXT,token_hash TEXT,network TEXT,created_at INTEGER,expires_at INTEGER);CREATE TABLE sea_rate_limits(key TEXT PRIMARY KEY,window_start INTEGER,count INTEGER);CREATE TABLE beach_seats(seat INTEGER PRIMARY KEY,visitor TEXT UNIQUE,session TEXT,seen INTEGER);CREATE TABLE island_fire_seats(seat INTEGER PRIMARY KEY,visitor TEXT UNIQUE,session TEXT,seen INTEGER);CREATE TABLE boat_passengers(seat INTEGER PRIMARY KEY,visitor TEXT UNIQUE,session TEXT,seen INTEGER);`);
globalThis.__seaSecurityTestEnv = {
 DB: {
  prepare(sql) {
   return {
    bind(...args) {
     return {
      async first() { return db.prepare(sql).get(...args) ?? null; },
      async run() { return db.prepare(sql).run(...args); }
     };
    }
   };
  }
 }
};
const source=(await readFile(new URL('../lib/sea-session.ts',import.meta.url),'utf8')).replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__seaSecurityTestEnv;');
const {code}=await transform(source,{loader:'ts',format:'esm'});
const auth=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function reset(){for(const table of ['sea_sessions','sea_rate_limits','beach_seats','island_fire_seats','boat_passengers'])db.exec('DELETE FROM '+table)}
test('tokens authenticate the exact owner and session, reject expiry and missing proof',async()=>{reset();const token='a'.repeat(64);db.prepare('INSERT INTO sea_sessions VALUES(?,?,?,?,?,?)').run('session','owner',await auth.secretHash(token),'network',Date.now(),Date.now()+60000);assert.equal(await auth.authorizeSea({id:'session',visitor:'owner',token}),null);for(const credentials of [{id:'session',visitor:'attacker',token},{id:'session',visitor:'owner',token:'b'.repeat(64)},{id:'session',visitor:'owner'}])assert.equal((await auth.authorizeSea(credentials)).status,401);db.exec('UPDATE sea_sessions SET expires_at=0');assert.equal((await auth.authorizeSea({id:'session',visitor:'owner',token})).status,401)});
test('rate limit accepts exactly the budget and resets on a new window',async()=>{reset();for(let n=0;n<6;n++)assert.equal(await auth.allowRate('network',6,600000),true);assert.equal(await auth.allowRate('network',6,600000),false);db.exec('UPDATE sea_rate_limits SET window_start=0');assert.equal(await auth.allowRate('network',6,600000),true)});
test('shared SQL guards count other resources and permit only the owners existing slot',()=>{reset();const now=Date.now();for(let n=0;n<6;n++)db.prepare('INSERT INTO sea_sessions VALUES(?,?,?,?,?,?)').run('s'+n,'v'+n,'hash','shared',now,now+60000);for(let n=0;n<4;n++)db.prepare('INSERT INTO beach_seats VALUES(?,?,?,?)').run(n,'v'+n,'s'+n,now);const allowed=(id,visitor)=>db.prepare('SELECT '+auth.seatLimitSQL+' AS allowed').get(...auth.seatLimitArgs(id,visitor,now)).allowed;assert.equal(allowed('s4','v4'),0);assert.equal(allowed('s0','v0'),1);assert.equal(db.prepare('SELECT '+auth.visitorFreeSQL+' AS allowed').get(...auth.visitorFreeArgs('v0',now)).allowed,0);db.prepare('INSERT INTO boat_passengers VALUES(?,?,?,?)').run(0,'v4','s4',now);db.prepare('INSERT INTO boat_passengers VALUES(?,?,?,?)').run(1,'v5','s5',now);assert.equal(db.prepare('SELECT '+auth.boatNetworkSQL+' AS allowed').get('s0',now-15000,'v0').allowed,0);db.exec('DELETE FROM beach_seats;UPDATE boat_passengers SET seen=0');assert.equal(allowed('s0','v0'),1)});
