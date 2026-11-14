export type SleepSound='waves'|'rain'|'fire';
export function sleepEnvelope(deadline:number|null,now:number){if(deadline===null)return{remaining:null,gain:1,finished:false};const remaining=Math.max(0,deadline-now);return{remaining,gain:Math.min(1,remaining/30000),finished:remaining===0}}
export const seaLetters=[
 {title:'도착한 밤',text:'오늘의 당신은 여기까지 잘 도착했어요. 남은 생각은 해변에 잠시 놓아두어도 괜찮아요.'},
 {title:'파도의 간격',text:'파도 사이에도 조용한 틈이 있어요. 모든 순간을 무언가로 채우지 않아도 괜찮아요.'},
 {title:'꺼지지 않는 작은 불',text:'멀리 가지 않아도 따뜻한 자리가 있어요. 오늘 당신에게도 그런 자리가 되었으면 해요.'},
 {title:'느린 항해',text:'바람이 없는 날에는 노를 쉬어도 괜찮아요. 바다는 서두르는 법을 모르거든요.'},
 {title:'주머니 속 조개',text:'작은 조개 하나처럼, 오늘 좋았던 순간 하나를 조용히 간직해봐요. 아주 작은 것이어도 좋아요.'},
 {title:'달이 기운 자리',text:'달은 매일 같은 모양이 아니어도 여전히 달이에요. 당신도 매일 같지 않아도 괜찮아요.'},
 {title:'내일의 해변',text:'내일의 일은 내일의 해변에서 만나기로 해요. 지금은 파도가 오고 가는 소리만 곁에 두어요.'},
];
export type SavedLetter={date:string;index:number};
export function koreanDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function letterIndex(day:string){return Array.from(day).reduce((n,c)=>n+c.charCodeAt(0),0)%seaLetters.length}
export function readLetters(raw:string|null):SavedLetter[]{try{const a:unknown=JSON.parse(raw||'[]');if(!Array.isArray(a))return[];const dates=new Set<string>();return a.filter((v):v is SavedLetter=>!!v&&typeof v==='object'&&'date'in v&&typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&'index'in v&&Number.isInteger(v.index)&&Number(v.index)>=0&&Number(v.index)<seaLetters.length).filter(v=>{if(dates.has(v.date))return false;dates.add(v.date);return true}).slice(0,30)}catch{return[]}}

export function nextKoreanMidnight(now=Date.now()){const day=86400000,offset=9*3600000;return(Math.floor((now+offset)/day)+1)*day-offset}
