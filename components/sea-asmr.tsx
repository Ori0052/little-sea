'use client';
import{useState}from'react';
import{Waves,Play,Pause,Volume2,Mail,Mountain,Moon,Menu}from'lucide-react';
import{SeaTabBar}from'./sea-tab-bar';
import{SeaNavDialog}from'./sea-nav-dialog';
import{SeaBrand}from'./sea-brand';
import{SeaAsmrScene}from'./sea-asmr-scene';
import{SeaSleepPanel}from'./sea-sleep-panel';
import{SeaStoryShelf}from'./sea-story-shelf';
import{SeaAudioCredits}from'./sea-audio-credits';
import{useSeaAudio}from'../hooks/use-sea-audio';
import{useSeaPreferences}from'../hooks/use-sea-preferences';
import{useSeaLetters}from'../hooks/use-sea-letters';
import{resolveLetter,type SavedLetter,type SleepSound}from'../lib/sea-sleep';
type AsmrPanel='sounds'|'letters'|'scenery'|'settings';
const titles={waves:'잔잔한 파도',rain:'잔잔한 비',fire:'따뜻한 모닥불'};
export function SeaAsmr({onGame,onHome}:{onGame:()=>void;onHome:()=>void}){
 const{volume,setVolume}=useSeaPreferences(),[choice,setChoice]=useState<SleepSound>('waves'),[sleep,setSleep]=useState(false),[fade,setFade]=useState(1),[night,setNight]=useState(false),[panel,setPanel]=useState<AsmrPanel|null>(null),[letter,setLetter]=useState<SavedLetter|null>(null);
 const {sound,audioError,toggleSound}=useSeaAudio(choice==='rain'?'rain':sleep?'night':'day',volume*fade,undefined,choice==='fire'?'fire':'sea');
 const archive=useSeaLetters();const toggle=()=>toggleSound();
 if(sleep)return <SeaSleepPanel sound={sound} volume={volume} choice={choice} error={audioError} onChoice={setChoice} onVolume={setVolume} onToggle={toggle} onFade={setFade} onStop={()=>{if(sound)toggleSound()}} onExit={()=>{setFade(1);setSleep(false)}} exitLabel="휴식 화면으로"/>;
 return <main className={`sea-asmr ${night?'asmr-night':''}`}><div className="asmr-shell"><header className="asmr-header"><button className="asmr-home" data-asmr-home aria-label="처음 화면으로" onClick={onHome}><SeaBrand/></button></header><p className="asmr-tagline">잠들기 전, 마음이 쉬는 작은 바다</p><div className="asmr-heading"><h1>잠깐, 바다 곁에서 쉬어요</h1><p>오늘은 소리만 곁에 두어도 좋아요.</p></div><SeaAsmrScene night={night}/><section className="asmr-sound-card" aria-label="ASMR 소리 재생"><div className="asmr-sound-symbol"><Waves size={31}/></div><div className="asmr-sound-detail"><strong>{titles[choice]}</strong><label><Volume2 size={17}/><span className="sr-only">ASMR 소리 크기</span><input aria-label="ASMR 소리 크기" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label></div><button className="asmr-play" onClick={toggle} aria-label={sound?'ASMR 소리 멈추기':'ASMR 소리 재생'} aria-pressed={sound}>{sound?<Pause size={23}/>:<Play size={23}/>}</button></section>{audioError&&<p className="asmr-error" role="alert">{audioError}</p>}<button className="asmr-primary" onClick={()=>{setFade(1);setSleep(true)}}><Moon size={20}/>오늘 밤 쉬기</button><button className="asmr-game-link" onClick={onGame}>바다 둘러보기</button></div>
 {!panel&&!letter&&<SeaTabBar className="sea-main-tabs" label="휴식 화면 메뉴" active="rest" items={[{id:'rest',label:'휴식',icon:Waves},{id:'sounds',label:'소리',icon:Volume2},{id:'letters',label:'편지함',icon:Mail},{id:'scenery',label:'풍경',icon:Mountain},{id:'settings',label:'전체',icon:Menu}]} onSelect={id=>setPanel(id==='rest'?null:id as AsmrPanel)}/>}
 {panel&&<SeaNavDialog title={{sounds:'소리 선택',letters:'간직한 편지',scenery:'풍경 선택',settings:'ASMR 설정'}[panel]} onClose={()=>setPanel(null)} navigation={<SeaTabBar label="휴식 세부 메뉴" items={[{id:'sounds',label:'소리',icon:Volume2},{id:'letters',label:'편지함',icon:Mail},{id:'scenery',label:'풍경',icon:Mountain}]} active={panel} onSelect={id=>setPanel(id as AsmrPanel)} onBack={()=>setPanel(null)}/>} >{panel==='sounds'?<div className="asmr-options">{(['waves','rain','fire']as const).map(c=><button key={c} aria-pressed={choice===c} onClick={()=>setChoice(c)}>{titles[c]}</button>)}<p>소리를 바꿔도 재생은 직접 눌러야 시작돼요.</p></div>:panel==='scenery'?<div className="asmr-options">{[false,true].map(n=><button key={String(n)} aria-pressed={night===n} onClick={()=>setNight(n)}>{n?'달빛이 머무는 밤':'맑은 청록빛 바다'}</button>)}<p>같은 바다를 다른 빛으로 만나요.</p></div>:panel==='letters'?<div className="asmr-archive">{archive.letters.length?archive.letters.map(l=><button key={l.date} onClick={()=>{setPanel(null);setLetter(l)}}><time>{l.date}</time><span>{resolveLetter(l).title}</span></button>):<><p>아직 간직한 편지가 없어요.</p><p>바다를 둘러보다 종이배를 발견하면, 하루에 한 통씩 편지를 만날 수 있어요.</p><button className="asmr-secondary" onClick={onGame}>종이배가 있는 바다로</button></>}<p className="asmr-footnote">게임에서 발견한 편지를 그대로 읽을 수 있어요.{archive.storageError?' 이 기기에 저장된 편지를 읽지 못했어요.':''}</p></div>:<div className="asmr-options"><p>소리 재생은 직접 눌렀을 때 시작돼요. 수면 모드에서는 탐험·보상·날씨 효과가 나오지 않아요.</p><SeaAudioCredits/><button onClick={onGame}>기존 게임으로 이동</button><button onClick={onHome}>쉬는 방법 다시 고르기</button></div>}</SeaNavDialog>}
 {letter&&<SeaStoryShelf letter={letter} error={archive.storageError} onClose={()=>setLetter(null)}/>}
 </main>
}
