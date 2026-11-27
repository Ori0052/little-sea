const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SEA_TEST_URL||'http://127.0.0.1:5173';
const output=process.env.SEA_COZY_OUTPUT||'/workspace/outputs/little-sea-cozy-3d';
fs.mkdirSync(output,{recursive:true});
const report={renderer:'Chromium SwiftShader software WebGL; functional QA only, not physical-device performance',cases:[],screenshots:[],modelRequests:[],errors:[]};
const allowedModels=['cozy-character.glb','cozy-world.glb'];

async function fixture(page){
 await page.addInitScript(()=>{
  if(!localStorage.getItem('little-sea-cozy-qa-seeded')){
   localStorage.setItem('little-sea-cozy-qa-seeded','true');
   localStorage.setItem('little-sea-onboarding-v3',JSON.stringify({status:'completed'}));
   localStorage.setItem('little-sea-auto-weather-v1',JSON.stringify({mode:'manual',region:'seoul'}));
   localStorage.setItem('little-sea-preferences-v1',JSON.stringify({view:'dream',mood:'day',volume:.3}));
  }
  window.__cozyAudioPlays=0;window.__cozyGraphicsFailures=[];
  addEventListener('sea-graphics-error',event=>window.__cozyGraphicsFailures.push(event.detail));
  HTMLMediaElement.prototype.play=function(){window.__cozyAudioPlays++;return Promise.resolve()};
  HTMLMediaElement.prototype.pause=function(){};
 });
 const audit={api:0,models:[],js:[],gl:[],consoleErrors:[]};
 page.on('pageerror',error=>audit.js.push(error.message));
 page.on('console',message=>{const text=message.text();if(message.type()==='error')audit.consoleErrors.push(text);if(/shader error|validate_status|invalid_operation|invalid_enum|gl_invalid|undeclared identifier|redefinition|duplicate.*uniform|already has a body/i.test(text))audit.gl.push(text)});
 page.on('request',request=>{const match=request.url().match(/\/models\/([^?]+\.glb)/);if(match){audit.models.push(match[1]);report.modelRequests.push(match[1])}});
 await page.route('**/googletagmanager.com/**',route=>route.abort());
 await page.route('**/google-analytics.com/**',route=>route.abort());
 await page.route('**/analytics.google.com/**',route=>route.abort());
 await page.route('**/api/**',route=>{audit.api++;return route.fulfill({status:503,json:{error:'QA: no live writes'}})});
 await page.route('**/api/session',route=>{audit.api++;return route.fulfill({json:{id:'11111111-1111-4111-8111-111111111111',token:'c'.repeat(64),expiresAt:Date.now()+7200000}})});
 await page.route('**/api/presence',route=>{audit.api++;return route.fulfill({json:{count:1,selfId:'a'.repeat(24),peers:[],seats:[],selfSeat:null,fireSeats:[],selfFireSeat:null,serverNow:Date.now(),boat:{x:0,z:8.5,heading:0,targetX:null,targetZ:null,departed:0,serverNow:Date.now(),passengers:[],captain:null,selfSeat:null,selfCaptain:false},campfire:{lit:true,updated:Date.now()},angling:{fishCount:0,castReadyAt:null,fishReadyAt:null},sharedCooking:{potatoes:0,fish:0}}})});
 return audit;
}

function pass(name,details){report.cases.push({name,details});console.log('PASS',name,details?JSON.stringify(details):'')}
async function screenshot(page,name){await page.screenshot({path:output+'/'+name,animations:'disabled',timeout:90000});report.screenshots.push(name);console.log('SCREENSHOT',output+'/'+name)}
async function diagnostics(page){return page.locator('.cozy-world').evaluateAll(nodes=>nodes.map(node=>({...node.dataset,canvas:node.querySelectorAll('canvas').length})))}
async function clean(page,audit){assert.deepEqual(audit.js,[],'JavaScript errors');assert.deepEqual(audit.gl,[],'WebGL/shader errors');assert.deepEqual(await page.evaluate(()=>window.__cozyGraphicsFailures),[],'Graphics failures');assert.equal(await page.evaluate(()=>window.__cozyAudioPlays),0,'No audio without explicit consent')}
async function ready(page,audit,label){
 try{
  await page.locator('main.sea.cozy-ready .cozy-world[data-ready=true]').waitFor({timeout:90000});
  await page.waitForFunction(()=>{const node=document.querySelector('.cozy-world');return node?.dataset.glError==='0'&&Number(node.dataset.drawCalls)>0&&Number(node.dataset.triangles)>0},null,{timeout:90000});
 }catch(error){console.error('READINESS',label,JSON.stringify({diagnostics:await diagnostics(page),graphics:await page.evaluate(()=>window.__cozyGraphicsFailures),js:audit.js,gl:audit.gl}));throw error}
 assert.equal(await page.locator('.cozy-world>canvas').count(),1);
 assert.equal(await page.locator('.dream-scene,.shore-scene,.island-graphics-status').count(),0,'Old raw ocean and island rendering must unmount');
 assert.equal(await page.locator('main.sea canvas').count(),1,'One shared world canvas');
 await clean(page,audit);
 const data=(await diagnostics(page))[0];pass(label,{quality:data.quality,drawCalls:data.drawCalls,triangles:data.triangles,view:data.view,glError:data.glError});
}
async function controls(page){
 const bar=page.getByRole('navigation',{name:'이용 모드 선택',exact:true});assert.equal(await bar.locator('button').count(),2);
 for(const button of await bar.locator('button').all()){const rect=await button.boundingBox();assert(rect&&rect.height>=44&&rect.width>=44)}
 await page.getByRole('button',{name:'바다 메뉴 열기',exact:true}).waitFor();
 assert.equal(await page.locator('.cozy-world').evaluate(node=>getComputedStyle(node).pointerEvents),'none');
 assert.equal(await page.locator('.my-person .person-art').evaluate(node=>getComputedStyle(node).visibility),'hidden','Only artwork is replaced');
 const boats=await page.locator('.paper-boat').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&getComputedStyle(node).visibility==='visible'}).length);
 assert(boats>0,'Paperboat interaction areas survive');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow');
}
async function mood(page,label,klass){
 await page.getByRole('button',{name:'바다 메뉴 열기',exact:true}).click();
 await page.getByRole('dialog',{name:'전체',exact:true}).getByRole('button',{name:/^바다 설정/}).click();
 const dialog=page.getByRole('dialog',{name:'바다 설정',exact:true});
 await dialog.getByRole('button',{name:label,exact:true}).click();
 await dialog.getByRole('button',{name:'뒤로가기',exact:true}).click();
 await page.locator('main.sea.'+klass+'.cozy-ready').waitFor();
 await page.waitForFunction(frozen=>document.querySelector('.cozy-world')?.dataset.frozen===String(frozen),klass==='snow',{timeout:90000});
 await page.waitForTimeout(2400);
}
async function moveAndTap(page,audit){
 const position=await page.locator('.my-person').evaluate(node=>({x:Number(node.dataset.x),z:Number(node.dataset.y)}));
 try{await page.keyboard.down('ArrowUp');await page.waitForFunction(before=>{const node=document.querySelector('.my-person');return Math.hypot(Number(node.dataset.x)-before.x,Number(node.dataset.y)-before.z)>.03},position,{timeout:20000})}finally{await page.keyboard.up('ArrowUp')}
 const after=await page.locator('.my-person').evaluate(node=>({x:Number(node.dataset.x),z:Number(node.dataset.y)}));assert(Number.isFinite(after.x)&&Number.isFinite(after.z));
 const point=await page.evaluate(()=>{for(const [x,y]of [[.70,.69],[.75,.64],[.30,.69],[.58,.62]]){const px=innerWidth*x,py=innerHeight*y,element=document.elementFromPoint(px,py);if(element?.closest('.player-world')&&!element.closest('button,.ui,[role=button]'))return{x:px,y:py}}return null});assert(point,'A non-control world surface is reachable');
 await page.mouse.click(point.x,point.y);await page.locator('.ground-ping').waitFor({timeout:15000});
 const marker=await page.locator('.ground-ping').evaluate(node=>({x:Number(node.dataset.worldX),z:Number(node.dataset.worldZ),rect:node.getBoundingClientRect().toJSON()}));assert(Number.isFinite(marker.x)&&Number.isFinite(marker.z));assert(marker.rect.width>20&&marker.rect.height>8);
 await screenshot(page,'qa-cozy-ground-ping.png');await page.keyboard.press('ArrowLeft');await clean(page,audit);pass('Keyboard movement and tap destination marker',{from:position,to:after,goal:{x:marker.x,z:marker.z}});
}

(async()=>{
 let browser,fallback;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(90000);const audit=await fixture(page);
  await page.goto(base+'/#game',{waitUntil:'domcontentloaded'});await ready(page,audit,'Cold desktop shared 3D world');await controls(page);assert.deepEqual([...new Set(audit.models)].sort(),allowedModels);
  await screenshot(page,'qa-cozy-desktop-day.png');await moveAndTap(page,audit);
  await mood(page,'밤','night');await ready(page,audit,'Night palette keeps shared renderer healthy');await screenshot(page,'qa-cozy-desktop-night.png');
  await mood(page,'눈','snow');await ready(page,audit,'Frozen winter keeps shared renderer healthy');await screenshot(page,'qa-cozy-desktop-snow.png');
  await page.getByRole('button',{name:'파도 해변',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.cozy-world')?.dataset.view==='shore',null,{timeout:90000});await ready(page,audit,'Top view shares world and picking');await screenshot(page,'qa-cozy-shore.png');
  await mood(page,'낮','day');await page.getByRole('button',{name:'달빛 수평선',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.cozy-world')?.dataset.view==='dream',null,{timeout:90000});
  for(let cycle=1;cycle<=3;cycle++){
   await page.locator('.sea-mode-bar [data-sea-tab=asmr]').click();await page.locator('.rest-player').waitFor();assert.equal(await page.locator('.cozy-world').count(),0);assert.equal(await page.locator('main.sea canvas').count(),0);const before=audit.api;await page.waitForTimeout(900);assert.equal(audit.api,before,'No gameplay API polling in ASMR');assert.equal(await page.evaluate(()=>window.__cozyAudioPlays),0);
   await page.locator('.sea-mode-bar [data-sea-tab=game]').click();await ready(page,audit,'Game → ASMR → game redraw '+cycle);await controls(page);
  }
  assert.deepEqual([...new Set(audit.models)].sort(),allowedModels);await screenshot(page,'qa-cozy-after-three-remounts.png');await clean(page,audit);await context.close();
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),mobile=await mobileContext.newPage();mobile.setDefaultTimeout(90000);mobile.setDefaultNavigationTimeout(90000);const mobileAudit=await fixture(mobile);
  await mobile.goto(base+'/#game',{waitUntil:'domcontentloaded'});await ready(mobile,mobileAudit,'Cold mobile shared 3D world');await controls(mobile);await screenshot(mobile,'qa-cozy-mobile-day.png');await mood(mobile,'밤','night');await ready(mobile,mobileAudit,'Mobile night retains 3D and controls');await screenshot(mobile,'qa-cozy-mobile-night.png');assert.deepEqual([...new Set(mobileAudit.models)].sort(),allowedModels);await mobileContext.close();await browser.close();browser=null;
  fallback=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-webgl']});const fallbackPage=await fallback.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});fallbackPage.setDefaultTimeout(90000);const fallbackAudit=await fixture(fallbackPage);
  await fallbackPage.goto(base+'/#game',{waitUntil:'domcontentloaded'});await fallbackPage.locator('.dream-scene.ocean-fallback').waitFor();await fallbackPage.getByRole('button',{name:'바다 메뉴 열기',exact:true}).waitFor();assert.equal(await fallbackPage.locator('main.sea.cozy-ready').count(),0);assert.equal(await fallbackPage.locator('.cozy-world>canvas').count(),0);assert.equal(await fallbackPage.locator('.my-person .person-art').evaluate(node=>getComputedStyle(node).visibility),'visible');assert((await fallbackPage.locator('.my-person .person-art svg').boundingBox()).width>0);assert.equal(fallbackAudit.models.length,0,'Unsupported GL avoids fetching 3D assets');assert.equal(await fallbackPage.evaluate(()=>window.__cozyAudioPlays),0);assert.deepEqual(fallbackAudit.js,[]);
  await fallbackPage.getByRole('button',{name:'바다 메뉴 열기',exact:true}).click();await fallbackPage.getByRole('dialog',{name:'전체',exact:true}).waitFor();await fallbackPage.getByRole('button',{name:'뒤로가기',exact:true}).click();await screenshot(fallbackPage,'qa-cozy-webgl-fallback.png');
  await fallbackPage.locator('.sea-mode-bar [data-sea-tab=asmr]').click();await fallbackPage.locator('.rest-player').waitFor();await fallbackPage.locator('.sea-mode-bar [data-sea-tab=game]').click();await fallbackPage.locator('.dream-scene.ocean-fallback').waitFor();assert.equal(await fallbackPage.locator('.sea-mode-bar button').count(),2);assert.deepEqual(fallbackAudit.js,[]);pass('WebGL unavailable retains original scenery, SVG actors, interaction and ASMR navigation');
  report.completed=true;report.uniqueModelRequests=[...new Set(report.modelRequests)].sort();console.log('PASS full shared-3D regression, shader-idempotent remounts, controls/picking, settings views and WebGL-unavailable fallback');
 }catch(error){report.errors.push(error.stack||String(error));throw error}
 finally{await browser?.close();await fallback?.close();fs.writeFileSync(output+'/qa-cozy-report.json',JSON.stringify(report,null,2)+'\n')}
})().catch(error=>{console.error(error);process.exit(1)});
