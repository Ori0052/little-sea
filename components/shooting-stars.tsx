'use client';
import {useEffect,useState,type CSSProperties} from 'react';
type Meteor={id:number;x:number;y:number;length:number;distance:number;duration:number};
export function ShootingStars({active}:{active:boolean}){
 const [meteor,setMeteor]=useState<Meteor|null>(null);
 useEffect(()=>{if(!active||matchMedia('(prefers-reduced-motion: reduce)').matches)return;let timer:ReturnType<typeof setTimeout>;let alive=true;
 const spawn=()=>{if(!alive)return;setMeteor({id:performance.now(),x:8+Math.random()*52,y:8+Math.random()*30,length:75+Math.random()*65,distance:130+Math.random()*100,duration:1.3+Math.random()*.5});timer=setTimeout(spawn,2200+Math.random()*3300)};
 timer=setTimeout(spawn,600+Math.random()*1000);return()=>{alive=false;clearTimeout(timer);setMeteor(null)};
 },[active]);
 return <div className="shooting-star-sky" aria-hidden="true">{active&&meteor&&<i key={meteor.id} className="shooting-star" style={{left:`${meteor.x}%`,top:`${meteor.y}%`,width:`${meteor.length}px`,'--meteor-x':`${meteor.distance}px`,'--meteor-y':`${meteor.distance*.625}px`,animationDuration:`${meteor.duration}s`} as CSSProperties} onAnimationEnd={()=>setMeteor(null)}><b/></i>}</div>
}
