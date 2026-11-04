'use client';
import {useEffect,useRef,useState} from 'react';
import {boatPosition,type BoatSnapshot} from '../components/boat-space';
export function useBoatMotion(snapshot:BoatSnapshot|null){const ref=useRef(snapshot),offset=useRef(0),[pose,setPose]=useState<ReturnType<typeof boatPosition>|null>(null);useEffect(()=>{ref.current=snapshot;if(snapshot)offset.current=snapshot.serverNow-Date.now()},[snapshot]);useEffect(()=>{let frame=0,last=0;const tick=(ms:number)=>{if(ms-last>30){last=ms;const s=ref.current;setPose(s?boatPosition(s,Date.now()+offset.current):null)}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[]);return pose}
