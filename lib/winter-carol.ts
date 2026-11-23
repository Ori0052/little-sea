export const winterCarolUrl='/audio/seasonal/silent-night-v1.mp3';
export const winterCarolRelativeGain=.2;
const kst=9*60*60*1000;
/** Every November 1 through December 25, inclusive, in Korea; January snow stays quiet. */
export function winterCarolSeason(now=Date.now()){
 if(!Number.isFinite(now))return {active:false,end:0};
 const year=new Date(now+kst).getUTCFullYear();
 const start=Date.UTC(year,10,1)-kst,end=Date.UTC(year,11,26)-kst;
 return {active:now>=start&&now<end,end};
}
export type WinterCarolInput={mood:string;sound:boolean;enabled:boolean;paused:boolean;blocked:boolean;volume:number;now:number;duckUntil:number};
export function winterCarolGain(s:WinterCarolInput){
 const season=winterCarolSeason(s.now);
 if(!season.active||s.mood!=='snow'||!s.sound||!s.enabled||s.paused||s.blocked||!Number.isFinite(s.volume))return 0;
 const endFade=Math.min(1,Math.max(0,(season.end-s.now)/4000));
 return Math.max(0,Math.min(1,s.volume))*winterCarolRelativeGain*(s.now<s.duckUntil?.35:1)*endFade;
}
