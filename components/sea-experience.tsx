'use client';
import{useEffect,useState,type ReactNode}from'react';
import{SeaAsmr}from'./sea-asmr';
import{SeaAsmrScene}from'./sea-asmr-scene';
import{SeaBrand}from'./sea-brand';
type Mode='choose'|'game'|'asmr';
export function SeaExperience({renderGame}:{renderGame:(onAsmr:()=>void)=>ReactNode}){
 const[mode,setMode]=useState<Mode>('choose'),[ready,setReady]=useState(false);
 useEffect(()=>{const sync=()=>setMode(location.hash==='#game'?'game':location.hash==='#asmr'?'asmr':'choose');sync();setReady(true);window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync)}},[]);
 function choose(next:Mode){history.pushState(null,'',next==='choose'?location.pathname:next==='game'?'#game':'#asmr');setMode(next)}
 if(mode==='game')return renderGame(()=>choose('asmr'));
 if(mode==='asmr')return <SeaAsmr onGame={()=>choose('game')} onHome={()=>choose('choose')}/>;
 return <main className="sea-asmr sea-experience-choice"><div className="asmr-shell"><header className="asmr-header"><SeaBrand/><span className="asmr-edition">잠깐의 쉼, 작은 바다</span></header><div className="asmr-heading"><span className="asmr-kicker">MY LITTLE SEA</span><h1>오늘은 어떻게<br/>쉬고 싶나요?</h1><p>소리에 기대어도, 천천히 둘러봐도 괜찮아요.</p></div><SeaAsmrScene/><nav className="experience-paths" aria-label="바다에서 쉬는 방법"><button className="asmr-primary" disabled={!ready} onClick={()=>choose('asmr')}><strong>소리 들으며 쉬기</strong><span>잔잔한 파도 · 편안한 수면</span></button><button className="asmr-secondary" disabled={!ready} onClick={()=>choose('game')}><strong>바다 둘러보기</strong><span>탐험 · 낚시 · 종이배 편지</span></button></nav><p className="asmr-footnote">소리는 직접 재생할 때 시작돼요.</p></div></main>
}
