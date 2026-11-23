'use client';
import {ArrowLeft,Gamepad2,Moon,type LucideIcon} from 'lucide-react';
export type SeaTab={id:string;label:string;icon:LucideIcon};
let rootFocusTab='game';
export function seaNavigationFocusTab(){return rootFocusTab}
export const seaModeTabs:readonly SeaTab[]=[{id:'game',label:'게임 플레이하기',icon:Gamepad2},{id:'asmr',label:'오늘은 쉬기',icon:Moon}];
export function SeaModeBar({mode,onGame,onRest}:{mode:'game'|'asmr';onGame:()=>void;onRest:()=>void}){return <SeaTabBar className="sea-main-tabs sea-mode-bar ui" label="이용 모드 선택" items={seaModeTabs} active={mode} onSelect={id=>id==='game'?onGame():onRest()}/>}
/** Navigation destinations only. Play/pause, sound and travel stay outside this bar. */
export function SeaTabBar({items,active,onSelect,onBack,label='바다 하단 메뉴',className=''}:{items:readonly SeaTab[];active:string;onSelect:(id:string)=>void;onBack?:()=>void;label?:string;className?:string}){
 return <nav className={`sea-tab-bar ${onBack?'has-back':''} ${className}`} aria-label={label} data-sea-tab-bar={onBack?'detail':'main'} onPointerDown={e=>e.stopPropagation()}>
  {onBack&&<button type="button" className="sea-tab-back" aria-label="뒤로가기" onClick={onBack}><ArrowLeft aria-hidden="true"/><span className="sr-only">이전 화면으로</span></button>}
  <div className="sea-tab-items">{items.map(({id,label,icon:Icon})=><button type="button" key={id} data-sea-tab={id} aria-current={active===id?'page':undefined} onClick={()=>{if(!onBack)rootFocusTab=id;onSelect(id)}}><Icon aria-hidden="true"/><span>{label}</span></button>)}</div>
 </nav>;
}
