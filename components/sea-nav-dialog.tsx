'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
import {seaNavigationFocusTab} from './sea-tab-bar';
export function SeaNavDialog({title,onClose,onBack=onClose,navigation,children,className=''}:{title:string;onClose:()=>void;onBack?:()=>void;navigation:ReactNode;children:ReactNode;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),heading=useId();
 useEffect(()=>{const d=ref.current,previous=document.activeElement as HTMLElement|null,tab=seaNavigationFocusTab();d?.showModal();return()=>{d?.close();queueMicrotask(()=>{if(previous?.isConnected&&previous!==document.body)previous.focus();else document.querySelector<HTMLButtonElement>(`.sea-main-tabs [data-sea-tab="${tab}"]`)?.focus()})}},[]);
 return <dialog ref={ref} className={`sea-nav-dialog ${className}`} aria-label={title} aria-labelledby={heading} onCancel={e=>{if(e.target!==e.currentTarget)return;e.preventDefault();e.stopPropagation();onBack()}} onClick={e=>{if(e.target===ref.current)onClose()}}>
  <header className="sea-nav-heading"><h2 id={heading}>{title}</h2><button type="button" aria-label={`${title} 닫기`} onClick={onClose}><X size={22} aria-hidden="true"/></button></header>
  <div className="sea-nav-content">{children}</div>
  <div className="sea-nav-bottom">{navigation}</div>
 </dialog>;
}
