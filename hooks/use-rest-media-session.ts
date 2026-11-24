'use client';
import {useEffect,useRef} from 'react';

/** System media controls are progressive enhancement; they do not grant native background rights. */
export function useRestMediaSession({title,playing,enabled,onPlay,onPause}:{title:string;playing:boolean;enabled:boolean;onPlay:()=>void;onPause:()=>void}){
 const callbacks=useRef({onPlay,onPause});callbacks.current={onPlay,onPause};
 useEffect(()=>{if(!enabled||!('mediaSession'in navigator))return;const media=navigator.mediaSession;const handlers={play:()=>callbacks.current.onPlay(),pause:()=>callbacks.current.onPause(),stop:()=>callbacks.current.onPause()};for(const [action,handler]of Object.entries(handlers))try{media.setActionHandler(action as MediaSessionAction,handler)}catch{}return()=>{for(const action of Object.keys(handlers))try{media.setActionHandler(action as MediaSessionAction,null)}catch{}try{media.playbackState='none';media.metadata=null}catch{}}},[enabled]);
 useEffect(()=>{if(!enabled||!('mediaSession'in navigator))return;try{navigator.mediaSession.playbackState=playing?'playing':'paused';if(typeof MediaMetadata!=='undefined')navigator.mediaSession.metadata=new MediaMetadata({title,artist:'나의 작은 바다',artwork:[{src:new URL('/brand/app-icon-600.png',location.href).href,sizes:'600x600',type:'image/png'}]})}catch{}},[title,playing,enabled]);
}
