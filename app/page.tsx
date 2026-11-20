'use client';
import {lazy,Suspense} from 'react';
import {SeaExperience} from '../components/sea-experience';
const SeaGame=lazy(()=>import('../components/sea-game'));
export default function Sea(){return <SeaExperience renderGame={onAsmr=><Suspense fallback={<main className="sea-asmr asmr-loading" role="status">작은 바다를 준비하고 있어요…</main>}><SeaGame onAsmr={onAsmr}/></Suspense>}/>}
