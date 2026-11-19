'use client';
export function SnowWeather(){return <div className="snow-weather" aria-hidden="true">{Array.from({length:48},(_,i)=><i key={i} style={{left:`${i*37%100}%`,width:2+i%4,height:2+i%4,opacity:.25+i%4*.14,animationDelay:`${-i*.61}s`,animationDuration:`${9+i%7}s`}}/>)}</div>}
