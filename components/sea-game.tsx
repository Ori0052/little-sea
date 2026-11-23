'use client';
import {useSeaLiveWeather} from '../hooks/use-sea-live-weather';
import {CloudSun,Volume2,SlidersHorizontal} from 'lucide-react';
import {SeaNavDialog} from './sea-nav-dialog';
import {SeaTabBar} from './sea-tab-bar';
import {SeaWeatherSettings} from '../components/sea-weather-settings';
import {SnowWeather} from '../components/snow-weather';
import {SeaSleepPanel} from '../components/sea-sleep-panel';
import type {SleepSound} from '../lib/sea-sleep';
import {SeaBrand} from '../components/sea-brand';
import {useSeaIdle} from '../hooks/use-sea-idle';
import {SeaIdleNotice} from '../components/sea-idle-notice';
import {useEffect,useRef,useState} from 'react';
import {OceanShore} from '../components/ocean-shore';
import {DreamSea,type SeaCamera} from '../components/dream-sea';
import {SeaServiceInfo} from '../components/sea-service-info';
import {SeaOnboarding} from '../components/sea-onboarding';
import {BeachPlayer} from '../components/beach-player';
import {useSeaPresence} from '../hooks/use-sea-presence';
import {onIsland} from '../components/island-space';
import {DockIcon} from '../components/mobile-dock';
import {useSeaPreferences} from '../hooks/use-sea-preferences';
import {useWinterCarol} from '../hooks/use-winter-carol';
import {useGameSounds} from '../hooks/use-game-sounds';
import {SeaAudioCredits} from '../components/sea-audio-credits';
import {useSeaAudio} from '../hooks/use-sea-audio';
import {ThunderWeather} from '../components/thunder-weather';
import {hasThunder} from '../lib/sea-weather';
import {RainWeather} from '../components/rain-weather';
import type {AvatarState} from '../components/avatar-state';
type Mood='day'|'sunset'|'night'|'rain'|'thunder'|'snow';
export default function SeaGame({onAsmr}:{onAsmr:()=>void}){
 const {idle,remaining,resume}=useSeaIdle();
 const [onboardingActive,setOnboardingActive]=useState(true);
 const {view,setView,mood:manualMood,setMood,volume,setVolume}=useSeaPreferences();
 const [sleep,setSleep]=useState(false),[sleepChoice,setSleepChoice]=useState<SleepSound>('waves'),[sleepFade,setSleepFade]=useState(1);
 const weather=useSeaLiveWeather(sleep||onboardingActive);
 const mood:Mood=sleep||weather.mode==='manual'?manualMood:weather.mood;
 const sceneMood=mood==='snow'?weather.mode==='manual'?'day':weather.timeMood:mood==='thunder'?'rain':mood;
 const solarPalette=!sleep&&weather.mode!=='manual'&&!['rain','thunder'].includes(mood)?weather.palette:undefined;
 const [quiet,setQuiet]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[settingsTab,setSettingsTab]=useState('weather');
 const camera=useRef<SeaCamera>({x:0,z:-2.5,yaw:0,pitch:0,depth:0,eye:1});
 const localState=useRef<AvatarState|null>(null);const {sound,audioError,toggleSound}=useSeaAudio(mood,volume*(sleep?sleepFade:1),localState,sleep&&sleepChoice==='fire'?'fire':'sea');const [thunder,setThunder]=useState(false),[flashes,setFlashes]=useState(true);useEffect(()=>{try{setThunder(localStorage.getItem('little-sea-thunder')==='true');setFlashes(localStorage.getItem('little-sea-lightning')!=='false')}catch{}},[]);
 function openHelp(){setSettingsOpen(false);window.dispatchEvent(new Event('sea-help-open'))}
 function changeMood(next:Mood){weather.setMode('manual');setMood(next)}
 const [solo,setSolo]=useState(false);
 useEffect(()=>{try{setSolo(localStorage.getItem('little-sea-solo')==='true')}catch{}},[]);
 function toggleSolo(){setSolo(s=>{const next=!s;try{localStorage.setItem('little-sea-solo',String(next))}catch{}return next})}
 const [onIsle,setOnIsle]=useState(false);const isleRef=useRef(false);
 const {boat,boatBusy,boatError,changeBoat,angling,sharedCooking,fishingBusy,fishingError,changeFishing,fireEffects,fireSeats,selfFireSeat,fireSeatBusy,fireSeatError,claimFireSeat,releaseFireSeat,campfire,fireBusy,fireError,setCampfire,count,peers,selfId,connected,seats,selfSeat,seatBusy,seatError,claimSeat,releaseSeat}=useSeaPresence(localState,!idle&&!sleep&&!onboardingActive);
 useGameSounds({sound,volume,mood,thunder,actor:localState,boat,paused:onboardingActive||sleep,biteAt:angling.castReadyAt,clockOffset:fireEffects.clockOffset});
 const carol=useWinterCarol({sound,volume,mood,paused:onboardingActive||sleep});
 const beforeSleep=useRef({mood,quiet,volume});
 function startSleep(){beforeSleep.current={mood,quiet,volume};setSleepChoice('waves');setSleepFade(1);setMood('night');setSleep(true);setQuiet(false);setSettingsOpen(false)}
 function leaveSleep(){if(sound)toggleSound();setSleep(false);setSleepFade(1);setMood(beforeSleep.current.mood);setVolume(beforeSleep.current.volume);setQuiet(beforeSleep.current.quiet);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('[data-sleep-entry]')?.focus())}
 function chooseSleepSound(next:SleepSound){setSleepChoice(next);setMood(next==='rain'?'rain':'night')}
 async function changeView(next:typeof view){if(seatBusy)return;if(selfSeat!==null&&!await releaseSeat())return;setView(next)}
 useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))setQuiet(false)};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[]);

 return <main className={`sea ${mood==='thunder'?'rain thunder':mood} ${view} ${weather.mode!=='manual'&&weather.timeMood==='night'?'auto-weather-night':''} ${quiet?'quiet':''} ${onboardingActive?'onboarding-open':''} ${sleep?'sleep-active':''}`}><div className="sea-world-content" style={{display:'contents'}} inert={sleep||undefined} aria-hidden={sleep||undefined}><>{view==='dream'?<DreamSea frozen={mood==='snow'&&!sleep} solarPalette={solarPalette} storm={mood==='thunder'&&!sleep} mood={sceneMood} camera={camera}/>:<><OceanShore frozen={mood==='snow'&&!sleep} solarPalette={solarPalette} storm={mood==='thunder'&&!sleep} mood={sceneMood} camera={camera}/></>}</><SeaIdleNotice idle={idle} remaining={remaining} onResume={resume}/><div className="grain"/><BeachPlayer onAsmr={onAsmr} frozen={mood==='snow'&&!sleep} boat={boat} boatBusy={boatBusy} boatError={boatError} onBoat={changeBoat} paused={onboardingActive||idle||sleep} onFishingView={()=>void changeView('dream')} angling={angling} sharedCooking={sharedCooking} fishingBusy={fishingBusy} fishingError={fishingError} onFishing={changeFishing} fireEffects={fireEffects} solo={solo} onToggleSolo={toggleSolo} occupiedFireSeats={fireSeats} fireSeat={selfFireSeat} fireSeatBusy={fireSeatBusy} fireSeatError={fireSeatError} onClaimFireSeat={claimFireSeat} onReleaseFireSeat={releaseFireSeat} campfire={campfire} fireBusy={fireBusy} fireError={fireError} onFire={setCampfire} volume={volume} view={view} camera={camera} peers={peers} selfId={selfId} occupiedSeats={seats} seat={selfSeat} seatBusy={seatBusy} seatError={seatError} sound={sound&&!sleep} onToggleSound={()=>void toggleSound()} settingsOpen={settingsOpen} onSettings={()=>setSettingsOpen(s=>!s)} onCloseSettings={()=>setSettingsOpen(false)} onSit={claimSeat} onStand={releaseSeat} onState={state=>{localState.current=state;const here=onIsland(state.x,state.z,state.view);if(here!==isleRef.current){isleRef.current=here;setOnIsle(here)}}}/>
 {mood==='snow'&&!sleep&&<SnowWeather/>}{mood==='thunder'&&!sleep&&<div className="sea-storm-atmosphere" aria-hidden="true"/>}{(mood==='rain'||mood==='thunder')&&<RainWeather/>}<ThunderWeather active={!sleep&&hasThunder(mood,thunder)} flashes={flashes}/>
 <header className="ui"><div className="brand" aria-label="나의 작은 바다"><SeaBrand/></div><div className="header-presence"><div className="online-badge" role="status" aria-label={idle?'함께 연결 쉬는 중':count===null?'접속 인원 확인 중':`함께 쉬는 사람 ${count}명`}><svg width="15" height="17" viewBox="0 0 18 20" fill="none" aria-hidden="true"><circle cx="9" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M3 18v-3a6 6 0 0112 0v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg><strong>{count??'—'}</strong><span>명</span><span className="info" tabIndex={0}>ⓘ<span className="tooltip">최근 90초의 익명 브라우저 접속 기준이에요. 같은 브라우저의 여러 창은 한 명으로 집계하고, 다른 기기나 브라우저는 별도로 셉니다. 캐릭터의 위치·옷차림·잠수·앉기 상태를 활동에 따라 약 1~5초마다 공유해요. 쉬는 동안에는 연결을 잠시 멈춰요. 달빛 수평선과 파도 해변 지도는 같은 바다의 위치를 보여줘요.</span></span></div>{onIsle&&<span className="island-capacity" role="status" aria-label={`불멍 자리 ${fireSeats.length}/10 사용 중`} title="캠프파이어 주변 자리 사용 현황">🔥 <b>{fireSeats.length}</b>/10</span>}</div></header>
 <nav className="view-switch ui" aria-label="바다 풍경 선택"><button aria-pressed={view==='dream'} onClick={()=>void changeView('dream')}>달빛 수평선</button><button aria-pressed={view==='shore'} onClick={()=>void changeView('shore')}>파도 해변</button></nav>
 <section className="intro ui"><span className="eyebrow">{mood==='snow'?'눈 내리는 작은 크리스마스':'잠들기 전, 마음이 쉬는 바다'}</span><h1>{view==='dream'?<>달빛 아래,<br/>마음도 둥둥.</>:<>오늘은,<br/>여기서 쉬어가.</>}</h1><p>멀리 가지 않아도 괜찮아.<br/>너의 속도로, 파도에 마음을 맡겨봐.</p><small className="rotation-hint">{view==='dream'?'위아래·좌우로 둘러보기 · 짧게 눌러 이동':'같은 바다를 위에서 보기 · 눌러서 이동'}</small><div className="sea-story-entry"><button className="sea-night-entry" onClick={onAsmr}>소리 들으며 쉬기</button><button className="sea-night-entry" data-sleep-entry onClick={startSleep}>☾ 오늘 밤 쉬기</button></div></section>
 <div className="horizon-label ui"><i/> {view==='shore'?'SLOW WAVES, SHARED SILENCE':'JUST YOU & THE SEA'}</div>
 {settingsOpen&&<SeaNavDialog title="바다 설정" onClose={()=>setSettingsOpen(false)} navigation={<SeaTabBar label="설정 메뉴" active={settingsTab} items={[{id:'weather',label:'날씨',icon:CloudSun},{id:'sound',label:'소리',icon:Volume2},{id:'display',label:'화면',icon:SlidersHorizontal}]} onSelect={setSettingsTab} onBack={()=>setSettingsOpen(false)}/>}>
 <div className="sea-settings-groups">
 {settingsTab==='weather'&&<><SeaWeatherSettings weather={weather}/><section><h3>원하는 날씨로 쉬기</h3><div className="moods" aria-label="바다 시간과 날씨 선택">{(['day','sunset','night','rain','thunder','snow'] as Mood[]).map((m,i)=><button key={m} aria-pressed={mood===m} onClick={()=>changeMood(m)}><span aria-hidden="true">{['☀','◒','☾','☂','ϟ','❄'][i]}</span>{['낮','노을','밤','비','천둥','눈'][i]}</button>)}</div></section><>{hasThunder(mood,thunder)&&<label className="sea-thunder-setting"><input type="checkbox" checked={flashes} onChange={e=>{setFlashes(e.target.checked);try{localStorage.setItem('little-sea-lightning',String(e.target.checked))}catch{}}}/> 번개 효과</label>}</></>}
 {settingsTab==='sound'&&<><h3>곁에 둘 소리</h3><div className="audio"><span className="audio-caption">잔잔한 파도</span><button data-sound-toggle onClick={toggleSound} aria-pressed={sound}><span className="audio-state-icon"><DockIcon name={sound?'sound':'muted'}/></span> {sound?'파도 소리 끄기':'파도 소리 켜기'}</button><input aria-label="파도 소리 크기" type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></div>{mood==='rain'&&<label className="sea-thunder-setting"><input type="checkbox" checked={thunder} onChange={e=>{setThunder(e.target.checked);try{localStorage.setItem('little-sea-thunder',String(e.target.checked))}catch{}}}/> 비 오는 날 먼 천둥 듣기</label>}{mood==='snow'&&carol.available&&<label><input type="checkbox" aria-label="잔잔한 캐롤 함께 듣기" checked={carol.enabled} onChange={carol.toggle}/>잔잔한 캐롤 함께 듣기<small>12월 25일까지</small></label>}{carol.error&&<p role="status">{carol.error}</p>}<SeaAudioCredits/></>}
 {settingsTab==='display'&&<><h3>나에게 편한 바다</h3><button className="company-setting" aria-pressed={solo} onClick={toggleSolo} title="내 화면에서만 다른 캐릭터를 숨겨요. 접속 인원은 그대로예요.">{solo?'♧ 함께 쉬기':'☾ 혼자 쉬기'}</button><button className="hide" onClick={()=>{setQuiet(true);setSettingsOpen(false)}}>⛶ <span>바다만 보기</span></button><button className="sea-help-button" onClick={openHelp}>조작 방법</button><SeaServiceInfo/></>}
 </div></SeaNavDialog>}
 {audioError&&<p className="sea-audio-notice" role="status">{audioError}</p>}
 <SeaOnboarding onStartSleep={startSleep} onActiveChange={setOnboardingActive} onStartSound={()=>{if(!sound)toggleSound(true)}}/>
 {quiet&&<div className="quiet-controls"><button className="sea-button" data-sound-toggle onClick={toggleSound} aria-label={sound?'파도 소리 끄기':'파도 소리 켜기'}><DockIcon name={sound?'sound':'muted'}/></button><button className="sea-button" onClick={()=>setQuiet(false)} aria-label="메뉴 다시 보기">메뉴 보기</button></div>}
 </div>{sleep&&<SeaSleepPanel sound={sound} volume={volume} choice={sleepChoice} error={audioError} onChoice={chooseSleepSound} onVolume={setVolume} onToggle={()=>toggleSound()} onFade={setSleepFade} onStop={()=>{if(sound)toggleSound()}} onExit={leaveSleep}/>}
 </main>
}
