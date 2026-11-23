'use client';
import {useEffect,useRef,useState} from 'react';
import {winterCarolGain,winterCarolSeason,winterCarolUrl} from '../lib/winter-carol';
const preferenceKey='little-sea-winter-carol-v1';
/** Separate optional music channel: it never enables the user's sea audio. */
export function useWinterCarol({sound,volume,mood,paused}:{sound:boolean;volume:number;mood:string;paused:boolean}){
 const[enabled,setEnabled]=useState(true),[available,setAvailable]=useState(false),[error,setError]=useState('');
 const retryAt=useRef(0),current=useRef({sound,volume,mood,paused,enabled});current.current={sound,volume,mood,paused,enabled};
 useEffect(()=>{try{setEnabled(localStorage.getItem(preferenceKey)!=='false')}catch{}},[]);
 useEffect(()=>{
  let audio:HTMLAudioElement|null=null,pending=false,playing=false,disposed=false,generation=0,duckUntil=0,adBlocked=false,lastAvailable=false;
  const stop=()=>{generation++;playing=false;if(audio){audio.volume=0;audio.pause()}};
  const fail=()=>{retryAt.current=Date.now()+60000;setError('캐롤을 불러오지 못해 바다 소리만 들려드려요.');stop();if(audio){audio.removeEventListener('error',fail);audio.removeAttribute('src');audio=null}};
  const tick=()=>{
   if(disposed)return;
   const s=current.current,now=Date.now(),season=winterCarolSeason(now),blocked=adBlocked||document.hidden;
   if(season.active!==lastAvailable){lastAvailable=season.active;setAvailable(season.active)}
   const target=winterCarolGain({...s,now,blocked,duckUntil});
   // Consent, sleep, interruptions and the calendar cutoff stop immediately.
   if(!s.sound||!s.enabled||s.paused||blocked||!season.active||s.volume<=0){if(playing||pending)stop();return}
   if(target>0&&!playing&&!pending&&now>=retryAt.current){
    if(!audio){audio=new Audio(winterCarolUrl);audio.loop=true;audio.preload='none';audio.volume=0;audio.addEventListener('error',fail)}
    const a=audio,token=++generation;pending=true;
    void a.play().then(()=>{if(disposed||token!==generation){a.volume=0;a.pause();return}playing=true;setError('')}).catch(()=>{if(!disposed&&token===generation)fail()}).finally(()=>{pending=false});
   }
   if(!audio||!playing)return;
   audio.volume=Math.max(0,Math.min(1,audio.volume+(target-audio.volume)*.12));
   if(target===0&&audio.volume<.0005)stop();
  };
  const duck=(e:Event)=>{const d=(e as CustomEvent<{until:number;reset?:boolean}>).detail;duckUntil=d?.reset?0:Math.max(duckUntil,d?.until||0)};
  const before=()=>{adBlocked=true;stop()},after=()=>{adBlocked=false;tick()},visibility=()=>{if(document.hidden)stop();else tick()};
  tick();const timer=setInterval(tick,100);
  window.addEventListener('sea-sound-duck',duck);window.addEventListener('sea-ad-start',before);window.addEventListener('sea-ad-end',after);document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;clearInterval(timer);stop();if(audio){audio.removeEventListener('error',fail);audio.removeAttribute('src')}window.removeEventListener('sea-sound-duck',duck);window.removeEventListener('sea-ad-start',before);window.removeEventListener('sea-ad-end',after);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 function toggle(){retryAt.current=0;setError('');setEnabled(value=>{const next=!value;try{localStorage.setItem(preferenceKey,String(next))}catch{}return next})}
 return {enabled,available,error,toggle};
}
