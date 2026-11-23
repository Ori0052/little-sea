'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {SeaAsmr} from './sea-asmr';
type Mode='game'|'asmr';
export function SeaExperience({renderGame}:{renderGame:(onAsmr:()=>void)=>ReactNode}){
 const[mode,setMode]=useState<Mode|null>(null);
 useEffect(()=>{const sync=()=>setMode(location.hash==='#asmr'?'asmr':'game');sync();window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync)}},[]);
 function choose(next:Mode){if(next===mode)return;history.pushState(null,'',next==='game'?'#game':'#asmr');setMode(next)}
 if(mode===null)return <main className="sea-experience-loading" aria-busy="true" aria-label="바다를 준비하고 있어요"/>;
 return mode==='game'?renderGame(()=>choose('asmr')):<SeaAsmr onGame={()=>choose('game')}/>;
}
