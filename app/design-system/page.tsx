'use client';
import {useEffect,useRef,useState} from 'react';
import {SeaBrand} from '../../components/sea-brand';
import {SeaTabBar,SeaModeBar,seaModeTabs} from '../../components/sea-tab-bar';
import {SeaMenu} from '../../components/sea-hub';

const themes=[
 {id:'day',label:'밝은 모드',classes:'day'},
 {id:'night',label:'밤',classes:'night'},
 {id:'thunder',label:'천둥',classes:'rain thunder'},
 {id:'underwater',label:'잠수',classes:'submerged'},
 {id:'auto-night',label:'자동 날씨 · 야간',classes:'rain auto-weather-night'},
] as const;
function Swatch({label,token,ink,theme}:{label:string;token:string;ink:string;theme:string}){
 const ref=useRef<HTMLDivElement>(null),[value,setValue]=useState('');
 useEffect(()=>{if(ref.current){const rgb=getComputedStyle(ref.current).backgroundColor.match(/\d+/g);if(rgb)setValue('#'+rgb.slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join('').toUpperCase())}},[theme]);
 return <div ref={ref} className="kit-swatch" style={{background:`var(${token})`,color:`var(${ink})`}}><span>{label}</span><code>{value}</code></div>;
}
export default function DesignSystem(){
 const[theme,setTheme]=useState('day'),[active,setActive]=useState(0),[menu,setMenu]=useState(false);
 const selected=themes.find(t=>t.id===theme)!;
 return <main className={`sea sea-ui-kit ${selected.classes}`}>
  <header><div className="brand"><SeaBrand/></div><label className="kit-theme">확인할 환경<select value={theme} onChange={e=>setTheme(e.target.value)}>{themes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label></header>
  <h1>나의 작은 바다 디자인 시스템</h1>
  <p>주요 버튼은 라벤더로 통일하고, 배경과 보조 버튼은 환경에 맞춰 바뀝니다. 아래 색상값과 컴포넌트는 실제 공통 스타일을 사용합니다.</p>
  <div className="kit-grid">
   <section className="kit-card"><h2>현재 컬러</h2>
    <Swatch label="주요 버튼" token="--sea-action" ink="--sea-action-ink" theme={theme}/>
    <Swatch label="보조 버튼" token="--sea-soft" ink="--sea-soft-ink" theme={theme}/>
    <Swatch label="보조 버튼 · 마우스 올림" token="--sea-soft-hover" ink="--sea-soft-ink" theme={theme}/>
    <Swatch label="보조 버튼 · 누름" token="--sea-soft-pressed" ink="--sea-soft-ink" theme={theme}/>
    <Swatch label="패널 배경" token="--sea-surface" ink="--sea-text" theme={theme}/>
    <p>주요 버튼 기본색은 모든 환경에서 같습니다. 밤·천둥·잠수·자동 야간은 보조 버튼의 모든 상태에 같은 다크 팔레트를 사용합니다.</p>
   </section>
   <section className="kit-card"><h2>버튼과 상태</h2>
    <div className="kit-row"><button className="sea-button sea-button--primary">기본 버튼</button><button className="sea-button sea-button--primary is-preview-pressed">누른 상태</button></div>
    <div className="kit-row"><button className="sea-button sea-button--secondary">보조 버튼</button><button className="sea-button sea-button--secondary is-preview-pressed">누른 보조 버튼</button></div>
    <div className="kit-row"><button className="sea-button sea-button--primary" disabled>사용할 수 없어요</button><button className="sea-button sea-button--secondary" disabled>비활성 보조 버튼</button></div>
    <div className="kit-row"><button className="sea-button sea-button--ghost">텍스트 버튼</button><button className="sea-button sea-button--primary" disabled aria-busy="true">처리 중이에요</button></div>
    <p>일반 버튼 최소 높이 44px · 모서리 16px · 기본 간격 8px<br/>Tab 키로 이동하면 포커스 테두리를 확인할 수 있습니다.</p>
    <button className="sea-button sea-button--primary" onClick={()=>setMenu(true)}>실제 바다 메뉴 열기</button>
   </section>
   <section className="kit-card"><h2>온보딩 조작부</h2>
    <SeaTabBar label="버튼 사용법 미리보기" items={seaModeTabs} active={seaModeTabs[active]?.id||'game'} onSelect={id=>setActive(seaModeTabs.findIndex(t=>t.id===id))}/>
    <div className="sea-start-actions"><button className="sea-start-back">이전</button><button className="sea-start-primary">바다 시작하기</button></div>
   </section>
   <section className="kit-card"><h2>게임 하단바</h2>
    <SeaModeBar mode={active===1?'asmr':'game'} onGame={()=>setActive(0)} onRest={()=>setActive(1)}/>
    <p>실제 게임과 같은 하단바 컴포넌트입니다. 게임·휴식 모드의 선택 상태와 아이콘·글자 간격을 확인할 수 있습니다.</p>
   </section>
  </div>
  <p>이 페이지는 공통 게임 UI의 검토 화면입니다. ASMR의 화면 배치와 기존 개별 컴포넌트 스타일은 별도 검토가 필요합니다.</p>
  <p><a href="/">나의 작은 바다로 돌아가기</a></p>
  {menu&&<SeaMenu onClose={()=>setMenu(false)} onChoose={()=>setMenu(false)}/>}
 </main>;
}
