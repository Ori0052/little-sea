'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useSeaAudio} from './use-sea-audio';
import {sleepEnvelope,type SleepSound} from '../lib/sea-sleep';
import type {RestMinutes} from '../lib/sea-rest';

export function useRestPlayer({choice,night,volume,minutes}:{choice:SleepSound;night:boolean;volume:number;minutes:RestMinutes}){
 const currentMinutes=useRef(minutes);currentMinutes.current=minutes;
 const deadline=useRef<number|null>(null),[gain,setGain]=useState(1),[remaining,setRemaining]=useState<number|null>(null),[finished,setFinished]=useState(false),[starting,setStarting]=useState(false),[hasPlayed,setHasPlayed]=useState(false),generation=useRef(0);
 const audio=useSeaAudio(choice==='rain'?'rain':night?'night':'day',volume*gain,undefined,choice==='fire'?'fire':'sea',{background:'continue',canContinue:()=>deadline.current===null||Date.now()<deadline.current});
 const callbacks=useRef(audio);callbacks.current=audio;
 const tick=useCallback(()=>{const envelope=sleepEnvelope(deadline.current,Date.now());setRemaining(envelope.remaining);setGain(envelope.gain);if(envelope.finished){deadline.current=null;setFinished(true);callbacks.current.stopSound()}},[]);
 useEffect(()=>{const interval=setInterval(tick,1000);document.addEventListener('visibilitychange',tick);window.addEventListener('pageshow',tick);return()=>{generation.current++;clearInterval(interval);document.removeEventListener('visibilitychange',tick);window.removeEventListener('pageshow',tick)}},[tick]);
 function pause(){generation.current++;audio.stopSound();deadline.current=null;setRemaining(null);setGain(1);setStarting(false)}
 async function play(){const token=++generation.current;deadline.current=null;setFinished(false);setGain(1);setStarting(true);const ok=await audio.playSound();if(token!==generation.current)return;if(ok){setHasPlayed(true);deadline.current=currentMinutes.current?Date.now()+currentMinutes.current*60000:null;tick()}setStarting(false)}
 function changeTimer(next:RestMinutes){currentMinutes.current=next;deadline.current=audio.sound&&next?Date.now()+next*60000:null;setFinished(false);tick()}
 function isExpired(){return deadline.current!==null&&Date.now()>=deadline.current}
 function resume(){if(finished||isExpired()){tick();return}if(!audio.sound&&!starting)void play()}
 function toggle(){if(audio.sound||starting)pause();else void play()}
 return{...audio,remaining,finished,starting,hasPlayed,toggle,play,pause,resume,isExpired,changeTimer};
}
