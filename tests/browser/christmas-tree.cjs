const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SEA_TEST_URL||'http://127.0.0.1:5173',out=process.env.SEA_TREE_OUTPUT||'/workspace/outputs/little-sea-tree',now=Date.parse('2026-11-23T13:00:00Z');fs.mkdirSync(out,{recursive:true});
async function seed(p){
 await p.addInitScript(now=>{
  Date.now=()=>now;
  localStorage.setItem('little-sea-onboarding-v3',JSON.stringify({status:'completed'}));localStorage.setItem('little-sea-auto-weather-v1',JSON.stringify({mode:'manual',region:'seoul'}));localStorage.setItem('little-sea-preferences-v1',JSON.stringify({view:'dream',mood:'snow',volume:0}));
  window.treeDrawCounts={};const draw=WebGLRenderingContext.prototype.drawArrays;WebGLRenderingContext.prototype.drawArrays=function(mode,first,count){window.treeDrawCounts[count]=(window.treeDrawCounts[count]||0)+1;return draw.call(this,mode,first,count)};
 },now);
 await p.route('**/api/session',r=>r.fulfill({json:{id:'11111111-1111-4111-8111-111111111111',token:'a'.repeat(64),expiresAt:now+7200000}}));
 await p.route('**/api/presence',r=>r.fulfill({json:{count:1,selfId:'a'.repeat(24),peers:[],seats:[],selfSeat:null,fireSeats:[],selfFireSeat:null,serverNow:now,boat:null,campfire:{lit:false,updated:0},angling:{fishCount:0,castReadyAt:null,fishReadyAt:null},sharedCooking:{potatoes:0,fish:0}}}));
 await p.route('**/api/weather',r=>r.fulfill({json:{fetchedAt:now,observations:[{station:'RKSS',observedAt:now,condition:'snow',windMs:2,temperature:-3}]}}));
}
(async()=>{let b,fallback;const errors=[];try{
 b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:760,height:680},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/shader|GL_INVALID|winter tree/i.test(m.text()))errors.push(m.text())});await seed(p);await p.goto(base+'/#game');
 await p.locator('[data-terrain=islands][data-graphics-mode=webgl-shared]').waitFor({state:'attached'});
 await p.waitForFunction(()=>Number(document.querySelector('[data-winter-tree-vertices]')?.dataset.winterTreeVertices)>0);
 const vertices=Number(await p.locator('[data-winter-tree-vertices]').getAttribute('data-winter-tree-vertices'));
 assert.ok(await p.evaluate(n=>window.treeDrawCounts[n]>0,vertices));assert.equal(await p.locator('.winter-decoration').first().isVisible(),false);
 const contexts=await p.locator('canvas').count();
 await p.keyboard.down('ArrowUp');await p.waitForFunction(()=>Number(document.querySelector('.my-person')?.dataset.y)>18,null,{timeout:90000});await p.keyboard.up('ArrowUp');
 await p.screenshot({path:out+'/tree-close-day.png'});
 await p.keyboard.down('e');await p.waitForFunction(()=>Number(document.querySelector('.my-person')?.dataset.yaw)>.25);await p.keyboard.up('e');
 await p.screenshot({path:out+'/tree-turned-day.png'});
 await p.setViewportSize({width:600,height:760});await p.getByRole('button',{name:'설정',exact:true}).click();await p.getByRole('button',{name:'지역 날씨',exact:true}).click();await p.locator('main.snow.auto-weather-night').waitFor();await p.getByRole('button',{name:'바다 설정 닫기',exact:true}).click();await p.setViewportSize({width:760,height:680});
 await p.screenshot({path:out+'/tree-close-night.png'});
 await p.getByRole('button',{name:'파도 해변',exact:true}).click();await p.locator('[data-graphics-mode=webgl-shared]').waitFor({state:'attached'});await p.waitForTimeout(500);
 assert.equal(await p.locator('canvas').count(),contexts);assert.equal(await p.locator('.winter-decoration').first().isVisible(),false);
 await p.screenshot({path:out+'/tree-shore-night.png'});
 await p.locator('.moods>button').filter({hasText:'낮'}).click();await p.locator('main.sea.day').waitFor();await p.waitForTimeout(500);
 const before=await p.evaluate(n=>window.treeDrawCounts[n],vertices);await p.waitForTimeout(700);assert.equal(await p.evaluate(n=>window.treeDrawCounts[n],vertices),before);assert.equal(await p.locator('.winter-world').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS real shared WebGL: close/turned day and automatic snow night, both views, hidden duplicate, no extra canvas, normal-weather draw stops');await b.close();b=null;
 fallback=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-webgl']});const mobile=await fallback.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await seed(mobile);await mobile.goto(base+'/#game');await mobile.locator('.winter-decoration').first().waitFor();
 assert.ok(await mobile.locator('[data-christmas-fallback=rounded]').count()>0);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const ids=await mobile.locator('.winter-decoration defs [id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(new Set(ids).size,ids.length);
 await mobile.screenshot({path:out+'/tree-fallback-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS mobile shaded fallback, unique gradient IDs and no horizontal overflow or JS errors');
}finally{await b?.close();await fallback?.close()}})().catch(e=>{console.error(e);process.exit(1)});
