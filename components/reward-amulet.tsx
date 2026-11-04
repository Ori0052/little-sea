'use client';
import {useEffect,useRef,useState} from 'react';
import {seaPlatform} from '../lib/sea-platform';
export function RewardAmulet({onReward}:{onReward:()=>void}){const ad=seaPlatform()?.rewardAd,[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),sink=useRef(onReward);sink.current=onReward;
 useEffect(()=>{if(!ad)return;let alive=true;void ad.prepare().then(()=>{if(alive)setReady(true)}).catch(()=>{if(alive)setMessage('광고를 준비하지 못했어요. 탐험은 계속할 수 있어요.')});return()=>{alive=false}},[ad]);
 if(!ad)return null;return <div className="reward-amulet"><button disabled={!ready||busy} onClick={async()=>{if(busy)return;setBusy(true);setMessage('');try{const completed=await ad.show();if(completed){sink.current();setMessage('부적 한 장을 더 간직했어요.')}else setMessage('끝까지 시청하면 부적을 받을 수 있어요.')}catch(e){setMessage(e instanceof Error?e.message:'광고를 재생하지 못했어요.')}finally{setBusy(false);setReady(false)}}}>{busy?'광고 시청 중…':ready?'광고 보고 부적 1장 더 받기':'광고 준비 중'}</button><small>선택해서 끝까지 시청하면 부적 10종 중 1장 · 각 10%</small>{message&&<p role="status">{message}</p>}</div>}
