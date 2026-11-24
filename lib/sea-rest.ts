import type {SleepSound} from './sea-sleep';

export const restPreferencesKey='little-sea-rest-preferences-v1';
export const entryPreferencesKey='little-sea-entry-v1';
export const sleepDiaryKey='little-sea-sleep-diary-v1';
export const restSessionsKey='little-sea-rest-sessions-v1';
export type RestMinutes=0|15|30|60;
export type RestPreferences={choice:SleepSound;minutes:RestMinutes;night:boolean};
export type EntryPreferences={lastMode:'game'|'asmr';restoreLastMode:boolean};
export type MorningFeeling='refreshed'|'neutral'|'tired';
export type SleepDiary={day:string;bedAt:number;wakeAt:number;feeling:MorningFeeling;latencyMinutes?:number;awakenings?:number;updatedAt:number};
export type RestSession={id:string;startedAt:number;lastObservedAt:number;endedAt?:number;sounds:SleepSound[];minutes:RestMinutes;reason?:'pause'|'timer'|'interrupted'|'left'};
const dayMs=86400000,kst=9*3600000;
const sounds:SleepSound[]=['waves','rain','fire'];
export const restTimers:readonly RestMinutes[]=[15,30,60,0];
export const restSoundTitles:Record<SleepSound,string>={waves:'잔잔한 파도',rain:'잔잔한 비',fire:'따뜻한 모닥불'};
function object(raw:string|null):Record<string,unknown>{try{const d=JSON.parse(raw||'null');return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}catch{return{}}}
export function restDay(now=Date.now()){return new Date(now+kst).toISOString().slice(0,10)}
export function daySerial(day:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;const n=Date.parse(day+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===day?n:null}
export function defaultRestPreferences(now=Date.now()):RestPreferences{const h=new Date(now+kst).getUTCHours();return{choice:'waves',minutes:30,night:h>=18||h<7}}
export function parseRestPreferences(raw:string|null,now=Date.now()):RestPreferences{const d=object(raw),defaults=defaultRestPreferences(now);return{choice:sounds.includes(d.choice as SleepSound)?d.choice as SleepSound:defaults.choice,minutes:restTimers.includes(d.minutes as RestMinutes)?d.minutes as RestMinutes:30,night:typeof d.night==='boolean'?d.night:defaults.night}}
export function parseEntryPreferences(raw:string|null):EntryPreferences{const d=object(raw);return{lastMode:d.lastMode==='asmr'?'asmr':'game',restoreLastMode:d.restoreLastMode!==false}}
export function initialSeaMode(hash:string,entry:EntryPreferences,onboarded:boolean){if(hash==='#asmr')return'asmr';if(hash==='#game')return'game';return onboarded&&entry.restoreLastMode?entry.lastMode:'game'}
export function restBackgroundPolicy(native:boolean,requested:'pause'|'continue'){return native?'pause':requested}
export function clockText(at:number){return new Date(at+kst).toISOString().slice(11,16)}
export function inBedMinutes(entry:SleepDiary){return Math.round((entry.wakeAt-entry.bedAt)/60000)}

export function makeSleepDiary(input:{day:string;bed:string;wake:string;feeling:string;latency:string;awakenings:string},now=Date.now()):{entry:SleepDiary}|{error:string}{
 const serial=daySerial(input.day);
 if(serial===null||input.day<'2000-01-01'||input.day>restDay(now))return{error:'기상한 날짜를 다시 확인해주세요.'};
 const parseClock=(s:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
 const bed=parseClock(input.bed),wake=parseClock(input.wake);
 if(bed===null||wake===null||bed===wake)return{error:'잠자리에 든 시각과 일어난 시각을 다시 확인해주세요.'};
 if(!['refreshed','neutral','tired'].includes(input.feeling))return{error:'일어났을 때의 기분을 골라주세요.'};
 const wakeAt=serial-kst+wake*60000,bedAt=serial-kst+bed*60000-(bed>wake?dayMs:0);
 if(wakeAt>now+5*60000)return{error:'아직 지나지 않은 기상 시각이에요. 날짜와 시각을 확인해주세요.'};
 const entry:SleepDiary={day:input.day,bedAt,wakeAt,feeling:input.feeling as MorningFeeling,updatedAt:now};
 for(const [key,text,max]of [['latencyMinutes',input.latency,inBedMinutes(entry)],['awakenings',input.awakenings,30]] as const){if(text.trim()==='')continue;const n=Number(text);if(!Number.isInteger(n)||n<0||n>max)return{error:key==='latencyMinutes'?'잠들기까지 걸린 시간을 다시 확인해주세요.':'밤중에 깬 횟수를 0~30 사이로 적어주세요.'};entry[key]=n}
 return{entry};
}
export function parseSleepDiary(raw:string|null,now=Date.now()):SleepDiary[]{
 let values:unknown;try{values=JSON.parse(raw||'[]')}catch{return[]};if(!Array.isArray(values))return[];
 const byDay=new Map<string,SleepDiary>();
 for(const v of values.slice(0,1000)){
  if(!v||typeof v!=='object'||typeof v.day!=='string'||daySerial(v.day)===null||v.day<'2000-01-01'||v.day>restDay(now)||!Number.isFinite(v.bedAt)||!Number.isFinite(v.wakeAt)||!Number.isFinite(v.updatedAt)||v.updatedAt<0||v.updatedAt>now+5*60000||v.wakeAt>now+5*60000||v.wakeAt<=v.bedAt||v.wakeAt-v.bedAt>=dayMs||restDay(v.wakeAt)!==v.day||!['refreshed','neutral','tired'].includes(v.feeling))continue;
  if(v.latencyMinutes!==undefined&&(!Number.isInteger(v.latencyMinutes)||v.latencyMinutes<0||v.latencyMinutes>(v.wakeAt-v.bedAt)/60000))continue;
  if(v.awakenings!==undefined&&(!Number.isInteger(v.awakenings)||v.awakenings<0||v.awakenings>30))continue;
  const item:SleepDiary={day:v.day,bedAt:v.bedAt,wakeAt:v.wakeAt,feeling:v.feeling,updatedAt:v.updatedAt};
  if(v.latencyMinutes!==undefined)item.latencyMinutes=v.latencyMinutes;if(v.awakenings!==undefined)item.awakenings=v.awakenings;
  if(!byDay.has(item.day)||byDay.get(item.day)!.updatedAt<item.updatedAt)byDay.set(item.day,item);
 }
 return [...byDay.values()].sort((a,b)=>b.day.localeCompare(a.day)).slice(0,90);
}
export function saveDiaryEntry(entries:SleepDiary[],entry:SleepDiary){return[entry,...entries.filter(v=>v.day!==entry.day)].sort((a,b)=>b.day.localeCompare(a.day)).slice(0,90)}
export function summarizeDiary(entries:SleepDiary[],now=Date.now()){
 const today=daySerial(restDay(now))!,week=entries.filter(e=>{const d=daySerial(e.day);return d!==null&&d>=today-6*dayMs&&d<=today});
 const bedClocks=week.map(e=>{const d=new Date(e.bedAt+kst);return d.getUTCHours()*60+d.getUTCMinutes()}).sort((a,b)=>a-b);
 let spread:number|null=null;
 if(bedClocks.length>=3){let largestGap=0;for(let i=0;i<bedClocks.length;i++)largestGap=Math.max(largestGap,(bedClocks[(i+1)%bedClocks.length]+(i===bedClocks.length-1?1440:0))-bedClocks[i]);spread=1440-largestGap}
 return{count:week.length,averageInBed:week.length?Math.round(week.reduce((n,e)=>n+inBedMinutes(e),0)/week.length):null,bedtimeRange:spread,feelings:{refreshed:week.filter(e=>e.feeling==='refreshed').length,neutral:week.filter(e=>e.feeling==='neutral').length,tired:week.filter(e=>e.feeling==='tired').length},entries:week};
}
export function parseRestSessions(raw:string|null,now=Date.now()):RestSession[]{
 let values:unknown;try{values=JSON.parse(raw||'[]')}catch{return[]};if(!Array.isArray(values))return[];const ids=new Set<string>(),result:RestSession[]=[];
 for(const v of values.slice(0,500)){
  if(!v||typeof v!=='object'||typeof v.id!=='string'||v.id.length>80||ids.has(v.id)||!Number.isFinite(v.startedAt)||!Number.isFinite(v.lastObservedAt)||v.startedAt<0||v.lastObservedAt<v.startedAt||v.lastObservedAt>now+5*60000||!Array.isArray(v.sounds)||!v.sounds.length||!v.sounds.every((s:unknown)=>sounds.includes(s as SleepSound))||!restTimers.includes(v.minutes))continue;
  const item:RestSession={id:v.id,startedAt:v.startedAt,lastObservedAt:v.lastObservedAt,sounds:[...new Set(v.sounds)] as SleepSound[],minutes:v.minutes};
  if(v.endedAt!==undefined){if(!Number.isFinite(v.endedAt)||v.endedAt<item.startedAt||v.endedAt>item.lastObservedAt||!['pause','timer','interrupted','left'].includes(v.reason))continue;item.endedAt=v.endedAt;item.reason=v.reason}
  ids.add(v.id);result.push(item);
 }
 return result.sort((a,b)=>b.startedAt-a.startedAt).slice(0,60);
}
export function durationLabel(minutes:number){const h=Math.floor(minutes/60),m=minutes%60;return h?`${h}시간${m?` ${m}분`:''}`:`${m}분`}

export const restMessages=[
 '오늘 어떤 하루를 보냈든, 지금은 쉬어도 괜찮아요.',
 '남은 생각은 해변에 잠시 놓아두어요.',
 '지금 이 순간은, 나를 쉬게 하는 시간.',
 '파도 사이의 조용한 틈을 함께 들어요.',
 '오늘도 여기까지, 충분히 애썼어요.',
 '아주 작은 편안함 하나를 곁에 두어요.',
 '내일의 일은 내일의 해변에서 만나요.',
];
export const sleepLearning=[
 {text:'충분한 수면은 다음 날의 기분과 집중력을 돌보는 데 도움이 돼요.',source:'CDC 수면 안내',url:'https://www.cdc.gov/sleep/about/'},
 {text:'비슷한 시각에 잠자리에 들고 일어나는 습관을 살펴봐요.',source:'CDC 수면 안내',url:'https://www.cdc.gov/sleep/about/'},
 {text:'몇 시간을 잤는지와 함께, 아침에 얼마나 개운한지도 돌아봐요.',source:'NIH 수면일지 안내',url:'https://www.nhlbi.nih.gov/resources/sleep-diary'},
];
