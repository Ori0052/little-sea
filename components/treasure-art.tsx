'use client';
import atlas from '../public/treasure-art/manifest.json';
import {deepTreasures,type CrownId} from './deepsea-catalog';
type Sprite={file:string;width:number;height:number;frame:number[]};
function sprite(id:CrownId,kind:'treasure'|'crown'):Sprite{return atlas[id][kind]}
function image(s:Sprite){return <image href={`/treasure-art/${s.file}?v=pearl-1`} width={s.width} height={s.height}/>}
export function CrownArt({id}:{id:CrownId}){const s=sprite(id,'crown');return <g data-crown={id}><svg x="15" y="-12" width="50" height="29" style={{width:50,height:29,overflow:'hidden'}} viewBox={s.frame.join(' ')} preserveAspectRatio="xMidYMax meet" aria-hidden="true">{image(s)}</svg></g>}
export function CrownPreview({id}:{id:CrownId}){const s=sprite(id,'crown');return <svg className="crown-preview" viewBox={s.frame.join(' ')} data-crown-preview={id} aria-label="이 보물의 왕관" role="img">{image(s)}</svg>}
export function TreasureArt({index,revealed=false}:{index:number;revealed?:boolean}){const t=deepTreasures[index];if(!t)return null;const s=sprite(t.id,'treasure');if(revealed)return <svg data-treasure-art={t.id} className="pearl-treasure-art" viewBox={s.frame.join(' ')} aria-hidden="true">{image(s)}</svg>;
 return <svg data-treasure-art={t.id} viewBox="0 0 120 130" aria-hidden="true"><ellipse cx="60" cy="107" rx="40" ry="7" fill="#253e6720"/><path d="m20 62 40-13 40 13v35l-40 14-40-14Z" fill="#b8afe3" stroke="#8275ad" strokeWidth="2"/><path d="m20 62 40 14 40-14-40-16Z" fill="#e5def6"/><path d="M60 76v35m-27-54v44m54-44v44" stroke="#f1dca9" strokeWidth="5"/><rect x="53" y="79" width="15" height="16" rx="4" fill="#fff1cb"/><circle cx="60" cy="85" r="3" fill="#9b8dc4"/><path d="m60 18 4 10 10 4-10 4-4 10-4-10-10-4 10-4zM90 25l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff6d7"/></svg>}
