'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {parseSleepDiary,parseRestSessions,saveDiaryEntry,sleepDiaryKey,restSessionsKey,type SleepDiary,type RestSession} from '../lib/sea-rest';
import type {SleepSound} from '../lib/sea-sleep';

export function useRestJournal(){
 const[data,setData]=useState<{diary:SleepDiary[];sessions:RestSession[]}>({diary:[],sessions:[]}),cache=useRef(data),[loaded,setLoaded]=useState(false),[storageError,setStorageError]=useState(false);
 const commit=useCallback((key:typeof sleepDiaryKey|typeof restSessionsKey,value:SleepDiary[]|RestSession[])=>{const next={...cache.current,[key===sleepDiaryKey?'diary':'sessions']:value};cache.current=next;setData(next);try{localStorage.setItem(key,JSON.stringify(value))}catch{setStorageError(true)}},[]);
 useEffect(()=>{const read=()=>{let next=cache.current;try{next={diary:parseSleepDiary(localStorage.getItem(sleepDiaryKey)),sessions:parseRestSessions(localStorage.getItem(restSessionsKey))}}catch{setStorageError(true)}cache.current=next;setData(next);setLoaded(true)};read();const sync=(e:StorageEvent)=>{if(e.key===sleepDiaryKey||e.key===restSessionsKey||e.key===null)read()};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
 const saveDiary=useCallback((entry:SleepDiary)=>{let previous=cache.current.diary;try{previous=parseSleepDiary(localStorage.getItem(sleepDiaryKey))}catch{}commit(sleepDiaryKey,saveDiaryEntry(previous,entry))},[commit]);
 const deleteDiary=useCallback((day:string)=>commit(sleepDiaryKey,cache.current.diary.filter(e=>e.day!==day)),[commit]);
 const beginSession=useCallback((entry:RestSession)=>{commit(restSessionsKey,[entry,...cache.current.sessions].slice(0,60))},[commit]);
 const observeSession=useCallback((id:string,now:number,sound?:SleepSound)=>{const entry=cache.current.sessions.find(s=>s.id===id);if(!entry||entry.endedAt!==undefined)return;commit(restSessionsKey,cache.current.sessions.map(s=>s.id===id?{...s,lastObservedAt:now,sounds:sound?[...new Set([...s.sounds,sound])]:s.sounds}:s))},[commit]);
 const endSession=useCallback((id:string,now:number,reason:RestSession['reason'])=>{const entry=cache.current.sessions.find(s=>s.id===id);if(!entry||entry.endedAt!==undefined)return;commit(restSessionsKey,cache.current.sessions.map(s=>s.id===id?{...s,lastObservedAt:now,endedAt:now,reason}:s))},[commit]);
 const clear=useCallback(()=>{commit(sleepDiaryKey,[]);commit(restSessionsKey,[])},[commit]);
 return{...data,loaded,storageError,saveDiary,deleteDiary,beginSession,observeSession,endSession,clear};
}
