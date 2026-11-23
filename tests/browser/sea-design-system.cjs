// Browser regression for the actual SeaMenu and shared visual review page.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright SEA_TEST_URL=http://127.0.0.1:5173 node tests/browser/sea-design-system.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.SEA_TEST_URL||'http://127.0.0.1:5173';
const output=process.env.SEA_TEST_OUTPUT||'/workspace/outputs/little-sea-design-system';
fs.mkdirSync(output,{recursive:true});
function rgb(s){return s.match(/[\d.]+/g).slice(0,3).map(Number)}
function luminance(s){return rgb(s).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=[luminance(a),luminance(b)].sort((a,b)=>a-b);return(x[1]+.05)/(x[0]+.05)}
function hex(s){return '#'+rgb(s).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
async function read(button){return button.evaluate(e=>{const s=getComputedStyle(e),title=e.querySelector('span'),small=e.querySelector('small');return {background:s.backgroundColor,text:getComputedStyle(title||e).color,small:small?getComputedStyle(small).color:null,outline:s.outlineColor,outlineWidth:s.outlineWidth,focusVisible:e.matches(':focus-visible'),pressed:s.getPropertyValue('--sea-soft-pressed').trim()}})}
let minimum=Infinity,checks=0;
function readable(s,label){for(const color of [s.text,s.small].filter(Boolean)){const ratio=contrast(color,s.background);minimum=Math.min(minimum,ratio);assert.ok(ratio>=4.5,`${label}: ${ratio.toFixed(2)}:1 (${color} on ${s.background})`);checks++}}
async function setup(p,mood='night'){
 await p.addInitScript(mood=>{localStorage.setItem('little-sea-onboarding-v3',JSON.stringify({status:'completed'}));localStorage.setItem('little-sea-auto-weather-v1',JSON.stringify({mode:'manual',region:'seoul'}));localStorage.setItem('little-sea-preferences-v1',JSON.stringify({view:'dream',mood,volume:.35}));},mood);
 await p.route('**/api/**',r=>r.fulfill({status:503,json:{error:'visual-test'}}));
}
(async()=>{let b;try{
 b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-webgl']});
 const p=await b.newPage({viewport:{width:1180,height:850},reducedMotion:'reduce'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await setup(p);
 await p.goto(base+'/#game');await p.locator('main.sea.night').waitFor();
 await p.getByRole('button',{name:'바다 메뉴 펼치기',exact:true}).click();
 for(const button of await p.locator('.sea-menu-options>button').all())readable(await read(button),'actual game night');
 await p.keyboard.press('Escape');
 await p.goto(base+'/design-system');await p.locator('.kit-swatch code').first().filter({hasText:'#8066AA'}).waitFor();await p.getByRole('button',{name:'실제 바다 메뉴 열기'}).click();
 const menu=p.getByRole('dialog',{name:'바다 메뉴',exact:true}),buttons=menu.locator('.sea-menu-options>button');
 await menu.waitFor();assert.equal(await buttons.count(),3);
 // Disable transitions for deterministic endpoint color checks.
 // Use the same production SeaMenu on the review route, where gameplay RAF cannot remove the submerged class.
 // Weather/network logic has its own tests; the real game is checked separately on desktop and touch.
 for(const mode of ['day','night','rain thunder','submerged','rain auto-weather-night','snow auto-weather-night']){
  const dark=mode!=='day';
  await p.locator('main.sea').evaluate((e,mode)=>{e.className='sea sea-ui-kit '+mode},mode);
  for(let i=0;i<3;i++){
   const button=buttons.nth(i);await p.mouse.move(0,0);await p.waitForTimeout(200);
   const normal=await read(button);readable(normal,mode+' base '+i);
   assert.ok(dark?luminance(normal.background)<.1:luminance(normal.background)>.6,mode+' surface theme');
   await button.hover();await p.waitForTimeout(200);const hover=await read(button);readable(hover,mode+' hover '+i);
   assert.notEqual(hover.background,normal.background,mode+' hover feedback');
   await button.evaluate(e=>e.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation()},{capture:true,once:true}));
   await p.mouse.down();await p.waitForTimeout(200);const pressed=await read(button);readable(pressed,mode+' pressed '+i);
   assert.equal(hex(pressed.background).toLowerCase(),pressed.pressed.toLowerCase(),mode+' pressed feedback');
   await p.mouse.up();await p.mouse.move(0,0);
  }
  await buttons.first().focus();await p.keyboard.press('Tab');const focus=await read(buttons.nth(1));
  assert.equal(focus.focusVisible,true);assert.equal(focus.outlineWidth,'3px');assert.ok(contrast(focus.outline,focus.background)>=3);
  console.log('checked',mode);
  await buttons.last().evaluate(e=>{e.disabled=true});await buttons.last().hover({force:true});await p.waitForTimeout(200);
  const disabled=await read(buttons.last());assert.notEqual(disabled.background,(await read(buttons.first())).background);await buttons.last().evaluate(e=>{e.disabled=false});
 }
 await p.keyboard.press('Escape');await menu.waitFor({state:'detached'});
 // The review page must report computed production colors, not a stale second palette.
 await p.goto(base+'/design-system');await p.locator('.kit-swatch code').first().filter({hasText:'#8066AA'}).waitFor();
 for(const theme of ['day','night','thunder','underwater','auto-night']){
  await p.getByLabel('확인할 환경').selectOption(theme);
  await p.waitForTimeout(100);
  for(const swatch of await p.locator('.kit-swatch').all()){
   const actual=hex(await swatch.evaluate(e=>getComputedStyle(e).backgroundColor));assert.equal(await swatch.locator('code').textContent(),actual);
  }
  const primary=p.getByRole('button',{name:'기본 버튼',exact:true});readable(await read(primary),theme+' primary');assert.equal(hex((await read(primary)).background),'#8066AA');
  await primary.hover();await p.waitForTimeout(200);readable(await read(primary),theme+' primary hover');
  await p.mouse.down();await p.waitForTimeout(200);readable(await read(primary),theme+' primary pressed');await p.mouse.move(0,0);await p.mouse.up();
 }
 await p.getByLabel('확인할 환경').selectOption('thunder');await p.screenshot({path:output+'/design-system-dark-desktop.png',fullPage:true});
 await p.getByRole('button',{name:'실제 바다 메뉴 열기'}).click();await p.locator('.sea-menu-options>button').first().hover();await p.waitForTimeout(200);await p.screenshot({path:output+'/dark-menu-hover-desktop.png'});
 assert.deepEqual(errors,[]);
 const mobile=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await setup(mobile,'thunder');await mobile.goto(base+'/#game');
 await mobile.locator('main.sea.thunder').waitFor();await mobile.getByRole('button',{name:'메뉴',exact:true}).click();await mobile.getByRole('dialog',{name:'바다 메뉴',exact:true}).waitFor();
 for(const button of await mobile.locator('.sea-menu-options>button').all())readable(await read(button),'touch thunder');
 await mobile.screenshot({path:output+'/dark-menu-mobile.png'});
 await mobile.locator('.sea-menu-options>button').first().click();await mobile.getByRole('dialog',{name:'바다 메뉴',exact:true}).waitFor({state:'detached'});await mobile.locator('.closet').waitFor();
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log(`PASS ${checks} text contrast checks (minimum ${minimum.toFixed(2)}:1); 6 production scene contexts; base/hover/pressed/focus/disabled; 5 live review palettes; touch menu to My Info; no overflow or JS errors.`);
}finally{await b?.close()}})().catch(e=>{console.error(e);process.exit(1)});
