'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {parseEntryPreferences,initialSeaMode,entryPreferencesKey} from '../lib/sea-rest';
import {SeaAsmr} from './sea-asmr';
type Mode='game'|'asmr';
export function SeaExperience({renderGame}:{renderGame:(onAsmr:()=>void)=>ReactNode}){
 const[mode,setMode]=useState<Mode|null>(null);
 function remember(next:Mode){try{const previous=parseEntryPreferences(localStorage.getItem(entryPreferencesKey));localStorage.setItem(entryPreferencesKey,JSON.stringify({...previous,lastMode:next}))}catch{}}
 useEffect(()=>{let entry=parseEntryPreferences(null),onboarded=false;try{entry=parseEntryPreferences(localStorage.getItem(entryPreferencesKey));const state=JSON.parse(localStorage.getItem('little-sea-onboarding-v3')||'null');onboarded=state?.status==='completed'||state?.status==='skipped'}catch{}setMode(initialSeaMode(location.hash,entry,onboarded));const sync=()=>{const next=location.hash==='#asmr'?'asmr':'game';setMode(next);remember(next)};window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync)}},[]);
 function choose(next:Mode){if(next===mode)return;history.pushState(null,'',next==='game'?'#game':'#asmr');setMode(next);remember(next)}
 if(mode===null)return <main className="sea-experience-loading" aria-busy="true" aria-label="바다를 준비하고 있어요"/>;
 return mode==='game'?renderGame(()=>choose('asmr')):<SeaAsmr onGame={()=>choose('game')}/>;
}
