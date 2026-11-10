'use client';
import {useEffect,useRef,type RefObject} from 'react';
import {playSeaSound,setSeaSoundEnabled,stopSeaSound} from '../lib/sea-sound';
import type {AvatarState} from '../components/avatar-state';
import {seaLand} from '../components/island-space';
import {boatPosition,type BoatSnapshot} from '../components/boat-space';
import {seaPlatform} from '../lib/sea-platform';
export function useGameSounds({sound,volume,mood,thunder,actor,boat,paused,biteAt,clockOffset}:{sound:boolean;volume:number;mood:string;thunder:boolean;actor:RefObject<AvatarState|null>;boat:BoatSnapshot|null;paused:boolean;biteAt:number|null;clockOffset:number}){
 const latest=useRef({sound,volume,mood,thunder,boat,paused,biteAt,clockOffset}),offset=useRef(0);latest.current={sound,volume,mood,thunder,boat,paused,biteAt,clockOffset};useEffect(()=>{if(boat)offset.current=boat.serverNow-Date.now()},[boat]);
 useEffect(()=>{setSeaSoundEnabled(sound,volume)},[sound,volume]);
 useEffect(()=>{let nextStep=0,nextThunder=Date.now()+45000,lastSeat:number|null=null,initialized=false,blocked=false;const biteSeen=new Set<number>();const timer=setInterval(()=>{const s=latest.current,a=actor.current,now=Date.now(),away=document.hidden&&!!seaPlatform(),audible=s.sound&&!s.paused&&!away&&!blocked;setSeaSoundEnabled(audible,s.volume);const seat=s.boat?.selfSeat??null;
 if(initialized&&seat!==lastSeat&&audible)playSeaSound('boarding');lastSeat=seat;initialized=true;
 const moving=s.boat&&seat!==null?boatPosition(s.boat,now+offset.current).moving:!!a?.raft&&!!a.moving;
 if(audible&&moving)playSeaSound('rowing',{loop:true});else stopSeaSound('rowing');
 if(audible&&a?.moving&&!a.raft&&seat===null&&(a.depth??0)<.7&&seaLand(a.x,a.z,a.view)&&now>=nextStep){nextStep=now+620;playSeaSound('step')}
 if(audible&&s.biteAt!==null&&now+s.clockOffset>=s.biteAt&&now+s.clockOffset<s.biteAt+30000&&!biteSeen.has(s.biteAt)){biteSeen.add(s.biteAt);if(biteSeen.size>8)biteSeen.delete(biteSeen.values().next().value!);playSeaSound('bite')}
 if(audible&&s.mood==='rain'&&s.thunder&&now>=nextThunder){nextThunder=now+65000+Math.random()*40000;playSeaSound('thunder')}if(s.mood!=='rain'||!s.thunder){nextThunder=now+45000;stopSeaSound('thunder')}
 },200);const before=()=>{blocked=true;setSeaSoundEnabled(false,0)},after=()=>{blocked=false},visibility=()=>{if(document.hidden&&seaPlatform())setSeaSoundEnabled(false,0)};window.addEventListener('sea-ad-start',before);window.addEventListener('sea-ad-end',after);document.addEventListener('visibilitychange',visibility);return()=>{clearInterval(timer);setSeaSoundEnabled(false,0);window.removeEventListener('sea-ad-start',before);window.removeEventListener('sea-ad-end',after);document.removeEventListener('visibilitychange',visibility)}},[]);
}
