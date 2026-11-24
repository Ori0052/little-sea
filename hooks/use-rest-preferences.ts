'use client';
import {useEffect,useState} from 'react';
import {defaultRestPreferences,parseRestPreferences,parseEntryPreferences,restPreferencesKey,entryPreferencesKey,type RestPreferences,type EntryPreferences} from '../lib/sea-rest';

export function useRestPreferences(){
 const[preferences,setPreferences]=useState<RestPreferences>(()=>defaultRestPreferences()),[entry,setEntry]=useState<EntryPreferences>({lastMode:'game',restoreLastMode:true}),[loaded,setLoaded]=useState(false),[storageError,setStorageError]=useState(false);
 useEffect(()=>{try{setPreferences(parseRestPreferences(localStorage.getItem(restPreferencesKey)));setEntry(parseEntryPreferences(localStorage.getItem(entryPreferencesKey)))}catch{setStorageError(true)}setLoaded(true)},[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(restPreferencesKey,JSON.stringify(preferences))}catch{setStorageError(true)}},[preferences,loaded]);
 function change<K extends keyof RestPreferences>(key:K,value:RestPreferences[K]){setPreferences(v=>({...v,[key]:value}))}
 function restoreLastMode(value:boolean){setEntry(current=>{let previous=current;try{previous=parseEntryPreferences(localStorage.getItem(entryPreferencesKey))}catch{}const next={...previous,restoreLastMode:value};try{localStorage.setItem(entryPreferencesKey,JSON.stringify(next))}catch{setStorageError(true)}return next})}
 return{...preferences,loaded,storageError,restoreLastMode:entry.restoreLastMode,setRestoreLastMode:restoreLastMode,setChoice:(v:RestPreferences['choice'])=>change('choice',v),setNight:(v:boolean)=>change('night',v),setMinutes:(v:RestPreferences['minutes'])=>change('minutes',v)};
}
