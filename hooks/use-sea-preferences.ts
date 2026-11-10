'use client';
import {useEffect,useState} from 'react';
export type SeaPreferences={view:'dream'|'shore';mood:'day'|'sunset'|'night'|'rain'|'thunder';volume:number};
export const defaultSeaPreferences:SeaPreferences={view:'dream',mood:'day',volume:.35};
export const seaPreferencesKey='little-sea-preferences-v1';
export function parseSeaPreferences(raw:string|null):SeaPreferences{try{const d=JSON.parse(raw||'null');return{view:d?.view==='shore'?'shore':'dream',mood:['day','sunset','night','rain','thunder'].includes(d?.mood)?d.mood:'day',volume:typeof d?.volume==='number'&&Number.isFinite(d.volume)?Math.max(0,Math.min(1,d.volume)):.35}}catch{return defaultSeaPreferences}}
export function useSeaPreferences(){const[value,setValue]=useState(defaultSeaPreferences),[loaded,setLoaded]=useState(false);useEffect(()=>{try{setValue(parseSeaPreferences(localStorage.getItem(seaPreferencesKey)))}catch{}setLoaded(true)},[]);useEffect(()=>{if(loaded)try{localStorage.setItem(seaPreferencesKey,JSON.stringify(value))}catch{}},[loaded,value]);function change<K extends keyof SeaPreferences>(key:K,next:SeaPreferences[K]){setValue(v=>({...v,[key]:next}))}return{...value,setView:(v:SeaPreferences['view'])=>change('view',v),setMood:(v:SeaPreferences['mood'])=>change('mood',v),setVolume:(v:number)=>change('volume',v)}}
