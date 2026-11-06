import {CookingStatus} from './cooking-status';
import {cookingStatus,type FoodKind} from './cooking-progress';
// Progress is informational; only start/collect transitions are controls.
export function CookingAction({kind,readyAt,now,stock=1,busy,near,preparing=false,onStart,onCollect}:{kind:FoodKind;readyAt:number|null;now:number;stock?:number;busy:boolean;near:boolean;preparing?:boolean;onStart:()=>void;onCollect:()=>void}){
 const state=readyAt===null?null:cookingStatus(kind,readyAt,now);
 if(kind==='fish'&&stock<=0&&readyAt===null)return null;
 if(preparing)return <p className="activity-status" role="status">호일에 싸는 중…</p>;
 const label=state?.burnt?(kind==='fish'?'탄 생선 정리':'탄 고구마 정리'):state?.ready?(kind==='fish'?'구운 물고기 먹기':'고구마 꺼내 먹기'):kind==='fish'?`물고기 굽기 · ${stock}`:'고구마 굽기';
 return <><CookingStatus kind={kind} readyAt={readyAt} now={now}/>{(!state||state.ready)&&<button disabled={busy||!near} aria-busy={busy||undefined} onClick={state?onCollect:onStart}>{label}</button>}</>;
}
