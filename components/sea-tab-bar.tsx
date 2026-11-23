'use client';
import {ArrowLeft,Waves,Compass,Archive,UserRound,Menu,type LucideIcon} from 'lucide-react';
export type SeaTab={id:string;label:string;icon:LucideIcon};
let rootFocusTab='sea';
export function seaNavigationFocusTab(){return rootFocusTab}
export const seaMainTabs:readonly SeaTab[]=[{id:'sea',label:'바다',icon:Waves},{id:'explore',label:'탐험',icon:Compass},{id:'collection',label:'수집함',icon:Archive},{id:'wardrobe',label:'내 정보',icon:UserRound},{id:'all',label:'전체',icon:Menu}];
/** Navigation destinations only. Play/pause, sound and travel stay outside this bar. */
export function SeaTabBar({items,active,onSelect,onBack,label='바다 하단 메뉴',className=''}:{items:readonly SeaTab[];active:string;onSelect:(id:string)=>void;onBack?:()=>void;label?:string;className?:string}){
 return <nav className={`sea-tab-bar ${onBack?'has-back':''} ${className}`} aria-label={label} data-sea-tab-bar={onBack?'detail':'main'} onPointerDown={e=>e.stopPropagation()}>
  {onBack&&<button type="button" className="sea-tab-back" aria-label="뒤로가기" onClick={onBack}><ArrowLeft aria-hidden="true"/><span className="sr-only">이전 화면으로</span></button>}
  <div className="sea-tab-items">{items.map(({id,label,icon:Icon})=><button type="button" key={id} data-sea-tab={id} aria-current={active===id?'page':undefined} onClick={()=>{if(!onBack)rootFocusTab=id;onSelect(id)}}><Icon aria-hidden="true"/><span>{label}</span></button>)}</div>
 </nav>;
}
