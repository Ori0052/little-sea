'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Volume2,Mail,Mountain,Settings,Timer,BookOpen,Moon} from 'lucide-react';
import {SeaTabBar,SeaModeBar} from './sea-tab-bar';
import {SeaNavDialog} from './sea-nav-dialog';
import {SeaBrand} from './sea-brand';
import {SeaAsmrScene} from './sea-asmr-scene';
import {SeaStoryShelf} from './sea-story-shelf';
import {SeaAudioCredits} from './sea-audio-credits';
import {SeaRestJournal} from './sea-rest-journal';
import {useRestPreferences} from '../hooks/use-rest-preferences';
import {useRestPlayer} from '../hooks/use-rest-player';
import {useRestJournal} from '../hooks/use-rest-journal';
import {useRestMediaSession} from '../hooks/use-rest-media-session';
import {useSeaPreferences} from '../hooks/use-sea-preferences';
import {useSeaLetters} from '../hooks/use-sea-letters';
import {seaPlatform} from '../lib/sea-platform';
import {daySerial,restDay,restMessages,restTimers,restSoundTitles,type RestMinutes,type RestSession} from '../lib/sea-rest';
import {resolveLetter,type SavedLetter} from '../lib/sea-sleep';
type AsmrPanel='sounds'|'timer'|'scenery'|'letters'|'settings';
const panelTitles={sounds:'소리 선택',timer:'잠들기 타이머',scenery:'풍경 선택',letters:'간직한 편지',settings:'휴식 설정'};
export function SeaAsmr({onGame}:{onGame:()=>void}){
 const preferences=useRestPreferences(),{volume,setVolume}=useSeaPreferences(),player=useRestPlayer({...preferences,volume}),journal=useRestJournal(),archive=useSeaLetters();
 const[panel,setPanel]=useState<AsmrPanel|null>(null),[letter,setLetter]=useState<SavedLetter|null>(null),[showJournal,setShowJournal]=useState(false),[dimmed,setDimmed]=useState(false),[now,setNow]=useState(Date.now()),[native,setNative]=useState(false);
 const active=useRef<string|null>(null),reason=useRef<RestSession['reason']>('interrupted'),dimButton=useRef<HTMLButtonElement>(null),undimButton=useRef<HTMLButtonElement>(null),latest=useRef({journal,player});latest.current={journal,player};
 useEffect(()=>{setNative(!!seaPlatform());const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{if(player.sound){const now=Date.now(),id=crypto.randomUUID();active.current=id;journal.beginSession({id,startedAt:now,lastObservedAt:now,sounds:[preferences.choice],minutes:preferences.minutes});reason.current='interrupted'}else if(active.current){journal.endSession(active.current,Date.now(),player.finished||player.isExpired()?'timer':reason.current);active.current=null}},[player.sound,player.finished,journal.beginSession,journal.endSession]);
 useEffect(()=>{if(active.current)journal.observeSession(active.current,Date.now(),preferences.choice)},[preferences.choice,journal.observeSession]);
 useEffect(()=>{const timer=setInterval(()=>{if(active.current&&latest.current.player.sound)latest.current.journal.observeSession(active.current,Date.now())},15000);return()=>{clearInterval(timer);if(active.current)latest.current.journal.endSession(active.current,Date.now(),'left')}},[]);
 useEffect(()=>{if(!dimmed)return;undimButton.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setDimmed(false)}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);queueMicrotask(()=>dimButton.current?.focus())}},[dimmed]);
 function pause(){reason.current='pause';player.pause()}
 function toggle(){if(player.sound||player.starting)pause();else void player.play()}
 useRestMediaSession({title:restSoundTitles[preferences.choice],playing:player.sound,enabled:player.hasPlayed,onPlay:player.resume,onPause:pause});
 function timer(next:RestMinutes){preferences.setMinutes(next);player.changeTimer(next)}
 function clearRecords(){active.current=null;player.pause();journal.clear()}
 const today=restDay(now),message=restMessages[(daySerial(today)!/86400000)%restMessages.length],h=new Date(now+9*3600000).getUTCHours(),morning=h>=5&&h<12;
 return <main className={`sea-asmr sea-rest-home sea-nightly-rest ${preferences.night?'asmr-night':''}`}>
  <div className="rest-page" inert={dimmed?true:undefined} aria-hidden={dimmed?true:undefined}>
   <div className="asmr-shell"><header className="asmr-header"><button className="asmr-home" data-asmr-home aria-label="게임 화면으로" onClick={onGame}><SeaBrand/></button><div className="rest-header-tools"><button className="asmr-icon-button" aria-label="나의 쉼 기록" onClick={()=>setShowJournal(true)}><BookOpen size={21} aria-hidden="true"/></button><button className="asmr-icon-button" aria-label="휴식 설정" onClick={()=>setPanel('settings')}><Settings size={21} aria-hidden="true"/></button></div></header>
    <div className="asmr-heading"><span className="rest-eyebrow">잠들기 전, 마음이 쉬는 바다</span><h1>{journal.sessions.length?'오늘도, 쉬어가요.':'오늘은, 쉬어가요.'}</h1><p>{message}</p></div>
    <SeaAsmrScene night={preferences.night}/>
    <section className="rest-player" aria-label="ASMR 소리 재생"><div className="rest-player-top"><button className="rest-sound-choice" onClick={()=>setPanel('sounds')}><Volume2 size={19} aria-hidden="true"/><strong>{restSoundTitles[preferences.choice]}</strong><span aria-hidden="true">⌄</span></button><button className="rest-timer-choice" aria-label="타이머 설정" onClick={()=>setPanel('timer')}><Timer size={17} aria-hidden="true"/>{preferences.minutes?`${preferences.minutes}분`:'계속 듣기'}</button></div>
     <label className="rest-volume"><span className="sr-only">ASMR 소리 크기</span><Volume2 size={16} aria-hidden="true"/><input aria-label="ASMR 소리 크기" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><span>{Math.round(volume*100)}%</span></label>
     <button className="rest-primary rest-play" disabled={!preferences.loaded} aria-label={player.sound?'소리 잠시 멈추기':player.starting?'소리 준비 취소':'소리 켜고 쉬기'} aria-pressed={player.sound} onClick={toggle}>{player.sound||player.starting?<Pause size={20} aria-hidden="true"/>:<Play size={20} aria-hidden="true"/>}{player.sound?'소리 잠시 멈추기':player.starting?'소리 준비 중…':'소리 켜고 쉬기'}</button>
     <div className="rest-player-bottom"><p className="rest-timer-status" role="status">{player.finished?'타이머가 끝났어요. 편안한 밤 보내세요.':player.remaining!==null?`약 ${Math.ceil(player.remaining/60000)}분 뒤 천천히 잦아들어요.`:player.sound?'편안한 만큼 머물러요.':'소리는 직접 켤 때 시작해요.'}</p><button ref={dimButton} className="rest-dim" onClick={()=>setDimmed(true)}><Moon size={16} aria-hidden="true"/>화면 어둡게</button></div>
     {player.audioError&&<p className="asmr-error" role="alert">{player.audioError}</p>}
    </section>
    {morning&&<button className="rest-morning-link" onClick={()=>setShowJournal(true)}>어젯밤은 어땠나요? <span>아침 기록 남기기 ↗</span></button>}
   </div>
   {!panel&&!letter&&!showJournal&&<SeaModeBar mode="asmr" onGame={onGame} onRest={()=>{}}/>}
   {panel&&<SeaNavDialog className="rest-dialog" title={panelTitles[panel]} onClose={()=>setPanel(null)} navigation={<SeaTabBar label="휴식 세부 메뉴" items={[{id:'sounds',label:'소리',icon:Volume2},{id:'timer',label:'타이머',icon:Timer},{id:'scenery',label:'풍경',icon:Mountain}]} active={panel} onSelect={id=>setPanel(id as AsmrPanel)} onBack={()=>setPanel(null)}/> }>
    {panel==='sounds'?<div className="rest-options">{(['waves','rain','fire'] as const).map(c=><button key={c} aria-pressed={preferences.choice===c} onClick={()=>preferences.setChoice(c)}>{restSoundTitles[c]}</button>)}<p>재생 중에는 소리를 부드럽게 바꿔요. 다음에 와도 선택을 기억해요.</p><SeaAudioCredits/></div>:
     panel==='timer'?<div className="rest-options"><p>재생을 누른 순간부터 시간을 세고, 마지막 30초에 천천히 소리를 줄여요.</p>{restTimers.map(n=><button key={n} aria-pressed={preferences.minutes===n} onClick={()=>timer(n)}>{n?`${n}분`:'계속 듣기'}</button>)}<p>재생 중 타이머를 바꾸면 지금부터 다시 세어요.</p></div>:
     panel==='scenery'?<div className="rest-options">{[false,true].map(n=><button key={String(n)} aria-pressed={preferences.night===n} onClick={()=>preferences.setNight(n)}>{n?'달빛이 머무는 밤':'맑은 청록빛 바다'}</button>)}<p>휴식 화면에서는 날씨·보상 효과가 나오지 않아요.</p></div>:
     panel==='letters'?<div className="asmr-archive">{archive.letters.length?archive.letters.map(l=><button key={l.date} onClick={()=>setLetter(l)}><time>{l.date}</time><span>{resolveLetter(l).title}</span></button>):<><p>아직 간직한 편지가 없어요.</p><p>게임 속 종이배에서 하루에 한 통씩 발견할 수 있어요. 잠들기 전 꼭 찾지 않아도 괜찮아요.</p><button className="rest-primary" onClick={onGame}>종이배가 있는 바다로</button></>}<p>{archive.storageError?'기기에 저장된 편지를 읽지 못했어요.':'발견한 편지는 여기서 다시 읽을 수 있어요.'}</p></div>:
     <div className="rest-settings"><label className="rest-switch"><span>다음에도 마지막 화면으로 시작</span><input type="checkbox" checked={preferences.restoreLastMode} onChange={e=>preferences.setRestoreLastMode(e.target.checked)}/></label><button onClick={()=>setPanel('letters')}><Mail size={20} aria-hidden="true"/>간직한 편지</button><button onClick={()=>{setPanel(null);setShowJournal(true)}}><BookOpen size={20} aria-hidden="true"/>아침·재생 기록</button><SeaAudioCredits/><p>{native?'토스에서는 앱을 벗어나거나 화면을 잠그면 소리가 멈춰요.':'웹에서는 앱 전환 후에도 재생을 이어가도록 했어요. 화면 잠금 중 재생과 타이머는 기기·브라우저의 절전 정책에 따라 달라질 수 있어요.'}</p><p>소리·음량·타이머·풍경을 기억해요. 다음에 열어도 소리가 자동으로 켜지지 않아요.</p>{preferences.storageError&&<p role="alert">설정을 기기에 저장하지 못했어요.</p>}</div>}
   </SeaNavDialog>}
   {showJournal&&<SeaRestJournal {...journal} playingSession={player.sound?active.current:null} onSave={journal.saveDiary} onDelete={journal.deleteDiary} onClear={clearRecords} onClose={()=>setShowJournal(false)}/>}
   {letter&&<SeaStoryShelf letter={letter} error={archive.storageError} onClose={()=>setLetter(null)}/>}
  </div>
  {dimmed&&<div className="rest-dark-screen"><span>편안한 밤 보내세요.</span><button ref={undimButton} data-sleep-undim onClick={()=>setDimmed(false)}>화면 밝히기</button></div>}
 </main>
}
