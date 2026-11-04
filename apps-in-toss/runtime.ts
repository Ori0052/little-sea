import {createRewardAd} from './reward-ad';
import {Clipboard,Environment,File as TossFile,SafeArea,Screen,Share,Storage,User,graniteEvent} from '@apps-in-toss/web-framework';
import {isAmuletId} from '../components/amulet-catalog';
import type {SeaPlatform} from '../lib/sea-platform';
declare const __SEA_TOSS_APP_NAME__:string;
declare const __SEA_API_ORIGIN__:string;
export const savedKeys=['little-sea-visitor','little-sea-session-proof-v1','little-sea-island-discoveries-v1','little-sea-onboarding-v1','little-sea-guidance-v1','little-sea-name','little-sea-look','little-sea-tube-enabled','little-sea-solo','little-sea-treasures-v1','little-sea-deepsea-v1','little-sea-exploration-v2'];
export function hasTossBridge(){return Boolean((window as unknown as {ReactNativeWebView?:unknown}).ReactNativeWebView)}
export function installPlatform(){
 const platform:SeaPlatform={rewardAd:createRewardAd(import.meta.env.VITE_TOSS_REWARDED_AD_GROUP_ID||''),host:'toss',apiOrigin:import.meta.env.DEV?'':__SEA_API_ORIGIN__,
  createGiftLink:async id=>{if(!isAmuletId(id))throw Error('알 수 없는 부적이에요.');return Share.createLink({path:`intoss://${__SEA_TOSS_APP_NAME__}/?amulet=${encodeURIComponent(id)}`})},
  shareMessage:message=>Share.sendMessage({message}),
  copyText:text=>Clipboard.setText(text),
  saveImage:async file=>{if(!TossFile.saveBase64.isSupported())throw Error('토스 앱을 업데이트한 뒤 다시 저장해 주세요.');const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('이미지를 읽지 못했어요.'));reader.readAsDataURL(file)});await TossFile.saveBase64({data,fileName:file.name,mimeType:'image/png'})}
 };
 globalThis.__littleSeaPlatform=platform;
 // Local preview uses its same-origin proxy; release always uses the fixed HTTPS API.
 if(import.meta.env.DEV)platform.apiOrigin=location.origin;
 try{const initial=new URL(Environment.initialURL);const gift=initial.searchParams.get('amulet');if(initial.protocol==='intoss:'&&initial.hostname===__SEA_TOSS_APP_NAME__&&isAmuletId(gift)){const url=new URL(location.href);url.searchParams.set('amulet',gift);history.replaceState(history.state,'',url)}}catch{}
}
export function updateSafeArea(insets:{top:number;bottom:number;left:number;right:number}){for(const edge of ['top','bottom','left','right'] as const){const n=insets[edge];document.documentElement.style.setProperty(`--toss-safe-${edge}`,`${Number.isFinite(n)?Math.max(0,Math.min(160,n)):0}px`)}}
export function subscribeHost(onBack:()=>void){if(!hasTossBridge())return()=>{};const cleanups:(()=>void)[]=[];try{updateSafeArea(SafeArea.get());cleanups.push(SafeArea.subscribe({onEvent:updateSafeArea}))}catch{}try{cleanups.push(graniteEvent.addEventListener('backEvent',{onEvent:onBack,onError:()=>{}}))}catch{}return()=>cleanups.forEach(stop=>stop())}
/** Close one layer, never teleport the player when handling native Back. */
export function dismissSeaLayer(){
 const dialogs=Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'));const top=dialogs[dialogs.length-1];
 if(top){if(top.dispatchEvent(new Event('cancel',{cancelable:true})))top.close();return true}
 const closer=document.querySelector<HTMLButtonElement>('.closet [aria-label="옷장 닫기"],.island-cook-menu button[aria-label],footer.settings-open [aria-label="바다 설정 닫기"]');
 if(closer){closer.click();return true}
 const main=document.querySelector('main.sea');
 if(main?.classList.contains('fishing-focus')){window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return true}
 if(main?.classList.contains('island-menu-open')){document.querySelector<HTMLButtonElement>('.island-menu-handle')?.click();return true}
 if(main?.classList.contains('quiet')){document.querySelector<HTMLButtonElement>('.restore')?.click();return true}
 return false;
}
export async function closeMiniApp(){await Screen.close()}
export async function restoreNativeSave(){
 if(!hasTossBridge())return;
 const prefix=`little-sea:${location.hostname.includes('private-')?'test':'release'}:`;
 let active=true;const restored=new Set<string>();
 // A slow bridge must not leave a blank startup screen or overwrite later play.
 const restore=Promise.all(savedKeys.map(async key=>{try{const value=await Storage.getItem(prefix+key);if(active){if(value!==null&&localStorage.getItem(key)===null)localStorage.setItem(key,value);restored.add(key)}}catch{}}));
 await Promise.race([restore,new Promise<void>(resolve=>setTimeout(resolve,1800))]);active=false;
 const previous=new Map<string,string>();let syncing=false;
 const persist=async()=>{if(syncing)return;syncing=true;try{await Promise.all(savedKeys.map(async key=>{try{const value=localStorage.getItem(key);if(restored.has(key)&&value!==null&&previous.get(key)!==value){await Storage.setItem(prefix+key,value);previous.set(key,value)}}catch{}}))}finally{syncing=false}};
 const timer=window.setInterval(()=>void persist(),900);const save=()=>void persist();window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',save);
 // This key is local-only; it is not accepted as server authentication.
 void(async()=>{try{if(User.getAnonymousKey.isSupported()){const key=await User.getAnonymousKey();if(key?.type==='HASH')await Storage.setItem(prefix+'anonymous-key',key.hash)}}catch{}})();
 return()=>{clearInterval(timer);window.removeEventListener('pagehide',save);document.removeEventListener('visibilitychange',save);void persist()};
}
