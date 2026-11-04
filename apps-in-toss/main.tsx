import {Component,useEffect,useRef,useState,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import Sea from '../app/page';
import {closeMiniApp,dismissSeaLayer,installPlatform,restoreNativeSave,subscribeHost} from './runtime';
import '../app/globals.css';
import './toss.css';
class GameBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}render(){return this.state.failed?<section className="toss-start-message"><h1>바다를 다시 불러올게요.</h1><p>잠시 연결을 확인하고 다시 시작해 주세요.</p><button onClick={()=>location.reload()}>다시 시작하기</button></section>:this.props.children}}
function App(){const[exit,setExit]=useState(false),[closing,setClosing]=useState(false),[error,setError]=useState(''),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>subscribeHost(()=>{if(!dismissSeaLayer())setExit(true)}),[]);
 useEffect(()=>{if(exit)dialog.current?.showModal();return()=>dialog.current?.close()},[exit]);
 return <><GameBoundary><Sea/></GameBoundary>{exit&&<dialog className="toss-exit-dialog" role="dialog" ref={dialog} aria-labelledby="exit-title" onCancel={e=>{e.preventDefault();setExit(false)}}><h2 id="exit-title">바다에서 나갈까요?</h2><p>모은 수집품은 이 기기에 보관돼요.<br/>언제든 다시 쉬러 오세요.</p>{error&&<p role="status">{error}</p>}<div><button autoFocus disabled={closing} onClick={()=>setExit(false)}>더 머무르기</button><button disabled={closing} onClick={async()=>{setClosing(true);setError('');try{await closeMiniApp()}catch{setError('화면 위 닫기 버튼으로 나갈 수 있어요.');setClosing(false)}}}>{closing?'나가는 중…':'나가기'}</button></div></dialog>}</>}
async function start(){installPlatform();await restoreNativeSave();createRoot(document.getElementById('root')!).render(<App/>)}
void start();
