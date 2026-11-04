'use client';
import {useEffect,useRef,useState} from 'react';
let seenInSession=false;
export function BoatFirstHint(){const[show,setShow]=useState(false),eligible=useRef(false);useEffect(()=>{const key='little-sea-boat-guidance-v1';let seen=seenInSession;try{seen=seen||localStorage.getItem(key)==='seen'}catch{}if(seen&&!eligible.current)return;eligible.current=true;seenInSession=true;try{localStorage.setItem(key,'seen')}catch{}setShow(true);const timer=setTimeout(()=>setShow(false),3500);return()=>clearTimeout(timer)},[]);return show?<p className="boat-first-hint ui" role="status">선장 · 바다를 눌러 항해해요. 하단바에서 정박하거나 내려요.</p>:null}
