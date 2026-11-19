/** Free NOAA/AWC airport observations; no browser location or paid provider. */
export const weatherRegions=[
 {id:'seoul',name:'서울',station:'RKSS',stationName:'김포공항',lat:37.56,lon:126.79},
 {id:'incheon',name:'인천',station:'RKSI',stationName:'인천공항',lat:37.46,lon:126.44},
 {id:'busan',name:'부산',station:'RKPK',stationName:'김해공항',lat:35.18,lon:128.94},
 {id:'jeju',name:'제주',station:'RKPC',stationName:'제주공항',lat:33.51,lon:126.49},
 {id:'daegu',name:'대구',station:'RKTN',stationName:'대구공항',lat:35.89,lon:128.66},
 {id:'gwangju',name:'광주',station:'RKJJ',stationName:'광주공항',lat:35.13,lon:126.81},
 {id:'cheongju',name:'청주',station:'RKTU',stationName:'청주공항',lat:36.72,lon:127.50},
 {id:'yangyang',name:'양양',station:'RKNY',stationName:'양양공항',lat:38.06,lon:128.67},
] as const;
export type WeatherRegion=typeof weatherRegions[number]['id'];
export type ObservedWeather='clear'|'cloudy'|'rain'|'snow'|'thunder';
export type SeaObservation={station:string;observedAt:number;condition:ObservedWeather;windMs:number|null;temperature:number|null};
export type WeatherSnapshot={fetchedAt:number;observations:SeaObservation[]};
export const weatherFreshMs=90*60000,weatherCacheSeconds=1800;
export function parseObservations(input:unknown,now:number):SeaObservation[]{
 if(!Array.isArray(input))throw Error('invalid_weather');const result=new Map<string,SeaObservation>();
 for(const raw of input){if(!raw||typeof raw!=='object')continue;const d=raw as Record<string,unknown>;if(!weatherRegions.some(r=>r.station===d.icaoId)||typeof d.rawOb!=='string'||/\b(?:NIL|AUTO\s+NIL)\b/.test(d.rawOb)||!new RegExp('^\\s*(?:METAR\\s+|SPECI\\s+)?'+d.icaoId+'\\s+\\d{6}Z\\b').test(d.rawOb))continue;
 const observedAt=typeof d.obsTime==='number'?d.obsTime*1000:typeof d.obsTime==='string'?Date.parse(d.obsTime):NaN;
 if(!Number.isFinite(observedAt)||observedAt>now+5*60000||now-observedAt>weatherFreshMs)continue;
 const main=d.rawOb.split(' RMK ')[0];const rawWx=main.split(/\s+/).filter(t=>/^[+-]?(?:VC)?(?:(?:MI|PR|BC|DR|BL|SH|TS|FZ)?(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS){1,3}|TS)$/.test(t)).join(' ');const wx=typeof d.wxString==='string'&&d.wxString?d.wxString:rawWx;const tokens=wx.split(/\s+/);const has=(re:RegExp)=>tokens.some(t=>!t.startsWith('VC')&&re.test(t));
 const cloudy=Array.isArray(d.clouds)&&d.clouds.some(c=>c&&['BKN','OVC','VV'].includes(c.cover));
 const condition:ObservedWeather=has(/TS/)?'thunder':has(/SN|SG|PL/)?'snow':has(/RA|DZ/)?'rain':cloudy?'cloudy':'clear';
 const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
 const wind=finite(d.wspd);const item:SeaObservation={station:d.icaoId as string,observedAt,condition,windMs:wind!==null&&wind>=0&&wind<250?Math.round(wind*.514444*10)/10:null,temperature:finite(d.temp)};
 if(!result.has(item.station)||result.get(item.station)!.observedAt<observedAt)result.set(item.station,item);
 }return [...result.values()];
}
export function currentObservation(snapshot:WeatherSnapshot|null,region:WeatherRegion,now:number){const station=weatherRegions.find(r=>r.id===region)?.station;return snapshot?.observations.find(o=>o.station===station&&o.observedAt<=now+5*60000&&now-o.observedAt<=weatherFreshMs)??null}
/** Approximate sunrise/sunset from date and selected coordinates; no ephemeris API. */
export function solarTimes(now:number,region:WeatherRegion){
 const r=weatherRegions.find(r=>r.id===region)??weatherRegions[0],local=new Date(now+9*3600000),year=local.getUTCFullYear(),month=local.getUTCMonth(),day=local.getUTCDate();
 const midnight=Date.UTC(year,month,day)-9*3600000,n=Math.floor((Date.UTC(year,month,day)-Date.UTC(year,0,0))/86400000),rad=Math.PI/180,g=2*Math.PI/365*(n-1);
 const eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
 const dec=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g),lat=r.lat*rad;
 const cosHour=Math.cos(90.833*rad)/(Math.cos(lat)*Math.cos(dec))-Math.tan(lat)*Math.tan(dec);
 const ha=Math.acos(Math.max(-1,Math.min(1,cosHour)))/rad,noon=720-4*r.lon-eq+540;
 return{sunrise:midnight+(noon-4*ha)*60000,sunset:midnight+(noon+4*ha)*60000};
}
export function clockMood(now:number,region:WeatherRegion):'day'|'sunset'|'night'{const t=solarTimes(now,region);if(now<t.sunrise-25*60000||now>t.sunset+30*60000)return'night';if(now<t.sunrise+20*60000||now>t.sunset-45*60000)return'sunset';return'day'}
export function observationMood(o:SeaObservation|null,now:number,region:WeatherRegion){return o&&['rain','snow','thunder'].includes(o.condition)?o.condition as 'rain'|'snow'|'thunder':clockMood(now,region)}
/** Continuous palette: day=0, dusk=1, night=2. */
export function solarPalette(now:number,region:WeatherRegion){const {sunrise,sunset}=solarTimes(now,region),minute=60000;if(now<sunrise-25*minute||now>=sunset+30*minute)return 2;if(now<sunrise)return 2-(now-(sunrise-25*minute))/(25*minute);if(now<sunrise+20*minute)return 1-(now-sunrise)/(20*minute);if(now<sunset-45*minute)return 0;if(now<sunset)return(now-(sunset-45*minute))/(45*minute);return 1+(now-sunset)/(30*minute)}
