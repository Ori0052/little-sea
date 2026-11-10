'use client';
import {campfireProximity} from '../lib/campfire-mix';
import {seaPlatform} from '../lib/sea-platform';
import {useEffect,useRef,useState} from 'react';
export function useCampfireAudio({lit,enabled,distance,volume}:{lit:boolean;enabled:boolean;distance:number;volume:number}){
 const audio=useRef<HTMLAudioElement|null>(null),target=useRef(0),active=useRef(false),playing=useRef(false),level=useRef(volume),emitted=useRef(-1);level.current=volume;const [error,setError]=useState('');
 target.current=lit&&enabled?Math.sqrt(campfireProximity(distance))*volume*.95:0;active.current=lit&&enabled;
 function ensure(){if(!audio.current){const a=new Audio('/audio/v6/fire.mp3');a.loop=true;a.preload='none';a.volume=0;a.addEventListener('playing',()=>{playing.current=true});a.addEventListener('pause',()=>{playing.current=false});a.addEventListener('error',()=>{playing.current=false});audio.current=a}return audio.current}
 function unlock(){const a=ensure();void a.play().then(()=>{playing.current=!a.paused;setError('')}).catch(()=>setError('모닥불 소리를 다시 눌러주세요.')).finally(()=>{if(!active.current)a.pause()})}
 useEffect(()=>{if(!seaPlatform())return;let resume=false;const change=()=>{if(document.hidden){resume=Boolean(audio.current&&!audio.current.paused);audio.current?.pause()}else if(resume&&active.current){resume=false;void audio.current?.play().catch(()=>setError('모닥불 소리를 다시 눌러주세요.'))}};document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change)},[]);
 useEffect(()=>{let resume=false;const before=()=>{resume=Boolean(audio.current&&!audio.current.paused);audio.current?.pause()},after=()=>{if(resume&&active.current){resume=false;void audio.current?.play().catch(()=>setError('모닥불 소리를 다시 눌러주세요.'))}};window.addEventListener('sea-ad-start',before);window.addEventListener('sea-ad-end',after);return()=>{window.removeEventListener('sea-ad-start',before);window.removeEventListener('sea-ad-end',after)}},[]);
 const within=distance<10;
 useEffect(()=>{if(lit&&enabled&&within){const a=ensure();void a.play().then(()=>{playing.current=!a.paused;setError('')}).catch(()=>setError('모닥불 소리를 들으려면 소리 듣기를 눌러주세요.'))}else if(!enabled)audio.current?.pause()},[lit,enabled,within]);
 useEffect(()=>{const timer=setInterval(()=>{const a=audio.current;if(a){a.volume=Math.max(0,Math.min(1,a.volume+(target.current-a.volume)*.16));if(target.current===0&&a.volume<.003){a.volume=0;a.pause()}}const strength=a&&playing.current&&!a.paused&&level.current>0?Math.min(1,(a.volume/(level.current*.95))**2):0;if(Math.abs(strength-emitted.current)>.001){emitted.current=strength;window.dispatchEvent(new CustomEvent('sea-campfire-mix',{detail:{strength}}))}},100);return()=>{clearInterval(timer);window.dispatchEvent(new CustomEvent('sea-campfire-mix',{detail:{strength:0}}));audio.current?.pause();audio.current?.removeAttribute('src');audio.current?.load()}},[]);
 return {unlock,error};
}
