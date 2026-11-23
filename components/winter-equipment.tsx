import type {useExploration} from '../hooks/use-exploration';
import {WinterGear} from './winter-art';
type Exploration=ReturnType<typeof useExploration>;
export function WinterEquipment({frozen,exploration,onFind,aboard=false}:{frozen:boolean;exploration:Exploration;onFind:()=>void;aboard?:boolean}){
 if(!frozen&&!exploration.rudolphOwned)return null;
 const selected=exploration.rudolphEquipped?'rudolph':exploration.raftEquipped?'sled':'ski';
 function choose(kind:'ski'|'sled'|'rudolph'){
  if(!frozen||aboard)return;
  if(kind==='rudolph'){if(!exploration.rudolphEquipped)exploration.toggleRudolph(frozen);return}
  if(exploration.rudolphEquipped)exploration.toggleRudolph(frozen);
  if((kind==='sled')!==exploration.raftEquipped)exploration.toggleRaft();
 }
 return <section className="winter-equipment" aria-label="겨울 이동 장비"><h3>겨울 이동 장비</h3><p className="hub-note">{frozen?'눈 덮인 땅에서는 걷고, 얼음 바다에서는 선택한 장비로 이동해요.':'루돌프 썰매는 눈 오는 날 다시 탈 수 있어요.'}</p><div>
  {frozen&&<button type="button" className="sea-button sea-button--secondary" aria-pressed={selected==='ski'} disabled={aboard} onClick={()=>choose('ski')}><svg viewBox="-5 40 135 60" aria-hidden="true"><WinterGear kind="ski"/></svg><span>기본 스키<small>누구나 이용 가능</small></span></button>}
  {frozen&&exploration.raftOwned&&<button type="button" className="sea-button sea-button--secondary" aria-pressed={selected==='sled'} disabled={aboard} onClick={()=>choose('sled')}><svg viewBox="-5 40 135 60" aria-hidden="true"><WinterGear kind="sled"/></svg><span>나무 썰매<small>가지고 있던 뗏목의 겨울 모습</small></span></button>}
  {exploration.rudolphOwned?<button type="button" className="sea-button sea-button--secondary" aria-pressed={frozen&&selected==='rudolph'} disabled={!frozen||aboard} onClick={()=>choose('rudolph')}><svg viewBox="-5 40 135 60" aria-hidden="true"><WinterGear kind="rudolph"/></svg><span>루돌프 산타 썰매<small>{frozen?'나무 썰매보다 이동속도 약 40% 증가':'눈 오는 날 사용 가능 · 획득 완료'}</small></span></button>:frozen&&<button type="button" className="sea-button sea-button--secondary" disabled={aboard} onClick={onFind}><svg viewBox="-5 40 135 60" aria-hidden="true"><WinterGear kind="rudolph"/></svg><span>겨울 선물 찾기<small>눈 모드 한정 · 루돌프 산타 썰매</small></span></button>}
 </div>{exploration.storageError&&<p className="hub-note" role="status">장비 기록을 저장하지 못했어요. 이번 방문 동안에는 사용할 수 있어요.</p>}</section>;
}
