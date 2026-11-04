'use client';
import {useEffect,useState,type RefObject} from 'react';
export function useGraphicsRecovery(canvas:RefObject<HTMLCanvasElement|null>,failed:boolean){
 const[attempt,setAttempt]=useState(0);
 useEffect(()=>{const c=canvas.current;if(!c)return;const retry=()=>{if(document.visibilityState!=='hidden')setAttempt(n=>n+1)},restored=()=>setAttempt(n=>n+1);c.addEventListener('webglcontextrestored',restored);document.addEventListener('visibilitychange',retry);window.addEventListener('pageshow',retry);return()=>{c.removeEventListener('webglcontextrestored',restored);document.removeEventListener('visibilitychange',retry);window.removeEventListener('pageshow',retry)}},[canvas]);
 useEffect(()=>{if(!failed)return;const timers=[800,2500,6500].map(ms=>setTimeout(()=>{if(document.visibilityState!=='hidden')setAttempt(n=>n+1)},ms));return()=>timers.forEach(clearTimeout)},[failed]);
 return attempt;
}
