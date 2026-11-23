const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SEA_TEST_URL||'http://127.0.0.1:5173',out='/workspace/outputs/little-sea-winter';fs.mkdirSync(out,{recursive:true});
async function setup(p,raft=false){
 await p.addInitScript(raft=>{localStorage.setItem('little-sea-onboarding-v3',JSON.stringify({status:'completed'}));localStorage.setItem('little-sea-auto-weather-v1',JSON.stringify({mode:'manual',region:'seoul'}));localStorage.setItem('little-sea-preferences-v1',JSON.stringify({view:'dream',mood:'snow',volume:.3}));if(!localStorage.getItem('little-sea-exploration-v2'))localStorage.setItem('little-sea-exploration-v2',JSON.stringify({raftOwned:raft,raftEquipped:raft,earnedAmulet:false,giftAmulet:false}));localStorage.setItem('little-sea-tube-enabled','false');window.requestedSounds=[];window.addEventListener('sea-sound-request',e=>window.requestedSounds.push(e.detail.id));HTMLMediaElement.prototype.play=function(){return Promise.resolve()};HTMLMediaElement.prototype.pause=function(){}},raft);
 await p.route('**/api/**',r=>r.fulfill({status:503,json:{error:'test'}}));
}
async function explorer(p,mobile=false){await p.getByRole('button',{name:mobile?'메뉴':'바다 메뉴 펼치기',exact:true}).click();await p.getByRole('dialog',{name:'바다 메뉴',exact:true}).getByRole('button',{name:/^탐험/}).click();await p.getByRole('dialog',{name:'바다 탐험',exact:true}).waitFor()}
async function closeExplorer(p){await p.getByRole('button',{name:'바다 탐험 닫기'}).click()}
async function walk(p,ms){const before=Number(await p.locator('.my-person').getAttribute('data-y'));await p.keyboard.down('ArrowUp');await p.waitForTimeout(ms);await p.keyboard.up('ArrowUp');return Number(await p.locator('.my-person').getAttribute('data-y'))-before}
(async()=>{let b;try{
 b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-webgl']});
 const p=await b.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await setup(p);
 await p.goto(base+'/#game');await p.locator('main.sea.snow').waitFor();await p.locator('.my-person[data-snow=true]').waitFor();
 assert.ok(await p.locator('.winter-decoration').count()>0);assert.equal(await p.locator('.swimming').count(),0);
 await walk(p,1200);await p.locator('.my-person[data-winter-travel=ski]').waitFor();
 assert.equal(await p.locator('.my-person').getAttribute('data-diving'),'false');assert.equal(await p.locator('.my-person .swim-stroke').count(),0);assert.equal(await p.locator('[data-winter-art=ski]').count(),1);assert.equal(await p.locator('.voyage [data-icon=ski]').count(),1);assert.equal(await p.locator('.sea-help-button').first().evaluate(e=>getComputedStyle(e).whiteSpace),'nowrap');
 await p.getByRole('button',{name:'파도 소리 켜기',exact:true}).click();await p.getByRole('button',{name:'스키 타기',exact:true}).click();await p.waitForTimeout(350);await p.getByRole('button',{name:'멈추기',exact:true}).click();
 await p.screenshot({path:out+'/snow-default-skis-desktop.png'});console.log('PASS default skis, no swimming/diving and Christmas decorations');
 await explorer(p);assert.equal(await p.getByRole('button',{name:'물속으로 잠수',exact:true}).count(),0);await p.getByRole('button',{name:/^겨울 선물 찾기/}).click();
 await p.getByRole('button',{name:'겨울 선물상자 열기',exact:true}).waitFor({timeout:15000});await p.getByRole('button',{name:'겨울 선물상자 열기',exact:true}).click();await p.locator('.my-person[data-winter-travel=rudolph]').waitFor();
 let inventory=await p.evaluate(()=>JSON.parse(localStorage.getItem('little-sea-exploration-v2')));assert.equal(inventory.rudolphOwned,true);assert.equal(inventory.raftOwned,false);assert.equal(await p.locator('.winter-gift').count(),0);
 await p.screenshot({path:out+'/rudolph-claimed-desktop.png'});console.log('PASS approach, explicit gift opening, single acquisition and Rudolph equipment');
 await explorer(p);await p.getByRole('button',{name:'썰매 있는 곳으로 가기',exact:true}).click();await p.getByRole('button',{name:'썰매 줍기',exact:true}).waitFor({timeout:15000});await p.getByRole('button',{name:'썰매 줍기',exact:true}).click();
 await explorer(p);await p.getByRole('button',{name:/^나무 썰매/}).click();await closeExplorer(p);await p.locator('.my-person[data-winter-travel=sled]').waitFor();const normal=await walk(p,850);
 await explorer(p);await p.getByRole('button',{name:/^루돌프 산타 썰매/}).click();await closeExplorer(p);await p.locator('.my-person[data-winter-travel=rudolph]').waitFor();const boosted=await walk(p,850);assert.ok(boosted/normal>1.18&&boosted/normal<1.65,`speed ratio ${boosted/normal}`);
 console.log('PASS raft becomes a sled; measured Rudolph/wood speed ratio',Number((boosted/normal).toFixed(2)));
 assert.equal(await p.evaluate(()=>window.requestedSounds.some(id=>id==='rowing'||id==='step')),false);
 await p.reload();await p.locator('.my-person[data-snow=true]').waitFor();inventory=await p.evaluate(()=>JSON.parse(localStorage.getItem('little-sea-exploration-v2')));assert.equal(inventory.rudolphOwned,true);assert.equal(inventory.rudolphEquipped,true);
 await explorer(p);await p.getByRole('button',{name:/^나무 썰매/}).click();await closeExplorer(p);
 await p.locator('.moods>button').filter({hasText:'낮'}).click();await p.locator('main.sea.day').waitFor();await walk(p,1200);await p.locator('.my-person.rafting').waitFor();assert.equal(await p.locator('.my-person [data-raft-art=true]').count(),1);assert.equal(await p.locator('.winter-world').count(),0);assert.equal(await p.locator('.winter-gift').count(),0);
 await explorer(p);await p.getByRole('button',{name:'뗏목 내려두기',exact:true}).click();await closeExplorer(p);await p.getByRole('button',{name:'잠수',exact:true}).click();await p.locator('.my-person[data-diving=true]').waitFor();
 await p.locator('.moods>button').filter({hasText:'눈'}).click();await p.locator('.my-person[data-winter-travel=ski][data-diving=false]').waitFor();await p.waitForFunction(()=>Number(document.querySelector('.my-person').dataset.depth)<.1);
 await explorer(p);await p.getByRole('button',{name:/^루돌프 산타 썰매/}).click();await p.screenshot({path:out+'/winter-equipment-desktop.png'});await closeExplorer(p);
 assert.deepEqual(errors,[]);console.log('PASS reload persistence, normal-weather raft restoration, surfacing when water freezes and no wrong movement audio');
 const mobile=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await setup(mobile,true);await mobile.goto(base+'/#game');await mobile.locator('main.sea.snow').waitFor();await explorer(mobile,true);await mobile.getByRole('button',{name:'자유롭게 썰매 타기',exact:true}).click();await mobile.locator('.my-person[data-winter-travel=sled]').waitFor();await mobile.screenshot({path:out+'/snow-sled-mobile.png'});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS mobile sled navigation, no horizontal overflow and no JS errors');
}finally{await b?.close()}})().catch(e=>{console.error(e);process.exit(1)});
