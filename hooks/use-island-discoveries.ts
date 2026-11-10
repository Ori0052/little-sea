'use client';
import {playSeaSound,playSeaSequence} from '../lib/sea-sound';
import {useEffect,useState} from 'react';
import {newIslands,type NewIslandId} from '../components/archipelago';
const key='little-sea-island-discoveries-v1';
function read():NewIslandId[]{try{const d=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(d)?newIslands.filter(i=>d.includes(i.id)).map(i=>i.id):[]}catch{return[]}}
export function useIslandDiscoveries(){const[visited,setVisited]=useState<NewIslandId[]>([]),[saveError,setSaveError]=useState(false);useEffect(()=>{const sync=()=>setVisited(read());sync();window.addEventListener('sea-island-discovery',sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener('sea-island-discovery',sync);window.removeEventListener('storage',sync)}},[]);function discover(id:NewIslandId){if(!read().includes(id)&&!visited.includes(id))playSeaSound('achievement');const next=[...new Set([...read(),...visited,id])];setVisited(next);try{localStorage.setItem(key,JSON.stringify(next));setSaveError(false);window.dispatchEvent(new Event('sea-island-discovery'))}catch{setSaveError(true)}}return{visited,discover,saveError}}
