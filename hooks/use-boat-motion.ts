'use client';
import {useEffect,useRef,useState} from 'react';
import type {boatPosition,BoatSnapshot} from '../components/boat-space';
import {createBoatMotion} from '../components/boat-motion';
export function useBoatMotion(snapshot:BoatSnapshot|null){
 const current=useRef(snapshot);current.current=snapshot;
 const clock=useRef(createBoatMotion()),sample=useRef(()=>clock.current(current.current,performance.now())),[pose,setPose]=useState<ReturnType<typeof boatPosition>|null>(null);
 useEffect(()=>{let frame=0,last=0;const tick=(ms:number)=>{const next=sample.current();if(ms-last>30){last=ms;setPose(next)}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[]);
 return {pose,sample:sample.current};
}
