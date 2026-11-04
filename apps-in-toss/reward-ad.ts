import {loadFullScreenAd,showFullScreenAd} from '@apps-in-toss/web-framework';
/** No group ID means no ad request and no ad CTA. Only completion earns a reward. */
export function createRewardAd(groupId:string){if(!groupId.trim())return undefined;let ready=false,busy=false,loadCleanup:()=>void=()=>{};
 return{isReady:()=>ready,
 prepare:()=>new Promise<void>((resolve,reject)=>{if(ready){resolve();return}if(!loadFullScreenAd.isSupported()){reject(Error('토스 앱을 업데이트해 주세요.'));return}let done=false;const timer=setTimeout(()=>end(Error('광고를 준비하지 못했어요. 나중에 다시 시도해 주세요.')),12000);const end=(error?:Error)=>{if(done)return;done=true;clearTimeout(timer);loadCleanup();error?reject(error):resolve()};try{loadCleanup=loadFullScreenAd({options:{adGroupId:groupId},onEvent:event=>{if(event.type==='loaded'){ready=true;end()}},onError:end})}catch(e){end(e instanceof Error?e:Error('광고 준비 실패'))}}),
 show:()=>new Promise<boolean>((resolve,reject)=>{if(!ready||busy){reject(Error('광고가 아직 준비되지 않았어요.'));return}ready=false;busy=true;let earned=false,done=false,cleanup:()=>void=()=>{};const end=(error?:Error)=>{if(done)return;done=true;busy=false;cleanup();window.dispatchEvent(new Event('sea-ad-end'));error?reject(error):resolve(earned)};try{window.dispatchEvent(new Event('sea-ad-start'));cleanup=showFullScreenAd({options:{adGroupId:groupId},onEvent:event=>{if(event.type==='userEarnedReward')earned=true;else if(event.type==='dismissed')end();else if(event.type==='failedToShow')end(Error('광고를 재생하지 못했어요.'))},onError:end})}catch(e){end(e instanceof Error?e:Error('광고 재생 실패'))}})
 }
}
