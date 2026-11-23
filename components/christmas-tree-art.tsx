'use client';
import {useId} from 'react';
/** Shaded fallback for devices where the shared WebGL scene is unavailable. */
export function ChristmasTreeArt(){
 const id='christmas-'+useId().replace(/:/g,'');
 return <svg viewBox="0 0 120 158" aria-hidden="true" data-christmas-fallback="rounded">
  <defs>
   <radialGradient id={id+'-leaf'} cx="30%" cy="22%" r="80%"><stop stopColor="#81a47d"/><stop offset=".5" stopColor="#507c59"/><stop offset="1" stopColor="#294f40"/></radialGradient>
   <radialGradient id={id+'-red'} cx="28%" cy="24%"><stop stopColor="#efb2a1"/><stop offset=".28" stopColor="#c96665"/><stop offset="1" stopColor="#7b283b"/></radialGradient>
   <radialGradient id={id+'-gold'} cx="28%" cy="24%"><stop stopColor="#fff1ba"/><stop offset=".35" stopColor="#dfbd75"/><stop offset="1" stopColor="#a47739"/></radialGradient>
   <linearGradient id={id+'-snow'} x2="0" y2="1"><stop stopColor="#f7faf4"/><stop offset="1" stopColor="#bfcece"/></linearGradient>
   <filter id={id+'-soft'} x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <ellipse cx="63" cy="147" rx="42" ry="6" fill="#6f8c9a" opacity=".23" filter={`url(#${id}-soft)`}/>
  <path d="M55 126h11v23H55z" fill="#92735a"/>
  {[0,1,2,3,4,5,6].map(i=>{const y=116-i*14,r=44-i*5.4;return <g key={i}><ellipse cx="60" cy={y+8} rx={r} ry="9" fill="#274d3e" opacity=".75"/><path d={`M60 ${y-23}C${60-r*.45} ${y-7} ${60-r*.83} ${y-7} ${60-r} ${y+5}Q${60-r*.8} ${y+14} ${60-r*.5} ${y+12}Q60 ${y+22} ${60+r*.5} ${y+12}Q${60+r*.8} ${y+14} ${60+r} ${y+5}C${60+r*.8} ${y-7} ${60+r*.45} ${y-7} 60 ${y-23}`} fill={`url(#${id}-leaf)`}/>{i%2===0&&<path d={`M${60-r*.73} ${y+2}q${r*.22} -8 ${r*.43} -1q${r*.25} 5 ${r*.5} -1q${r*.15} -4 ${r*.36} 2`} fill="none" stroke={`url(#${id}-snow)`} strokeWidth="4" strokeLinecap="round"/>}</g>})}
  <path d="M48 36q20 12 28 3M38 61q27 13 45 0M28 87q34 14 63 2M19 116q42 15 82 0" stroke="#b49b60" strokeWidth="1.1" fill="none"/>
  {[[48,36],[59,41],[72,41],[38,61],[53,67],[70,67],[82,62],[28,87],[44,94],[63,96],[80,93],[91,88],[19,116],[39,123],[60,126],[80,122],[100,117]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="3.6" fill="#f6d89a" opacity=".12"/><circle cx={x} cy={y} r="1.5" fill="#ffe9b1"/></g>)}
  {[[45,50],[70,58],[31,77],[58,85],[86,102],[43,111],[67,119]].map(([x,y],i)=><g key={i}><path d={`M${x} ${y-7}v5`} stroke="#c4ad75" strokeWidth=".8"/><circle cx={x} cy={y} r={i%3===0?4.3:3.6} fill={`url(#${id+(i%2?'-gold':'-red')})`}/><circle cx={x-1} cy={y-1.4} r=".7" fill="#fff1d5" opacity=".7"/></g>)}
  <path d="m60 4 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1z" fill={`url(#${id}-gold)`}/><path d="m60 4 1 15 13-5-9 9 3 8-8-12-9 12 4-11-9-6 14 5z" fill="#fff0b4" opacity=".34"/>
  <g><path d="m19 134 22-4 7 6-23 4z" fill="#cb7976"/><path d="m25 140 23-4v16l-23 4z" fill="#a84b59"/><path d="m19 134 6 6v16l-6-6z" fill="#873c4b"/><path d="m30 132 7 6v16m-13-15 23-4" fill="none" stroke="#e9cf95" strokeWidth="3"/></g>
  <g><path d="m70 138 18-5 10 6-19 5z" fill="#efd59d"/><path d="m79 144 19-5v13l-19 5z" fill="#d1ad6c"/><path d="m70 138 9 6v13l-9-6z" fill="#b99157"/><path d="m79 136 9 6v13m-15-13 21-5" fill="none" stroke="#a95c64" strokeWidth="2.8"/></g>
 </svg>;
}
