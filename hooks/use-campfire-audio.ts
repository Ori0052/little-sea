'use client';
import {useEffect,useRef,useState} from 'react';
export function useCampfireAudio({lit,enabled,distance,volume}:{lit:boolean;enabled:boolean;distance:number;volume:number}){
 const audio=useRef<HTMLAudioElement|null>(null),target=useRef(0),active=useRef(false);const [error,setError]=useState('');
 target.current=lit&&enabled?Math.pow(Math.max(0,1-distance/9),2)*volume*.9:0;active.current=lit&&enabled;
 function ensure(){if(!audio.current){const a=new Audio('/audio/campfire-natural-v2.mp3');a.loop=true;a.preload='none';a.volume=0;audio.current=a}return audio.current}
 function unlock(){const a=ensure();void a.play().then(()=>setError('')).catch(()=>setError('모닥불 소리를 다시 눌러주세요.')).finally(()=>{if(!active.current)a.pause()})}
 const within=distance<10;
 useEffect(()=>{if(lit&&enabled&&within){const a=ensure();void a.play().then(()=>setError('')).catch(()=>setError('모닥불 소리를 들으려면 소리 듣기를 눌러주세요.'))}else audio.current?.pause()},[lit,enabled,within]);
 useEffect(()=>{const timer=setInterval(()=>{const a=audio.current;if(a)a.volume=Math.max(0,Math.min(1,a.volume+(target.current-a.volume)*.35))},100);return()=>{clearInterval(timer);audio.current?.pause();audio.current?.removeAttribute('src');audio.current?.load()}},[]);
 return {unlock,error};
}
