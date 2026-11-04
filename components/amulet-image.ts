import {amuletStyle} from './amulet-catalog';
export function amuletImageUrl(id:string){return `/amulets/${amuletStyle(id).id}.png?v=paper-v1`}
export async function getAmuletFile(id:string){const response=await fetch(amuletImageUrl(id));if(!response.ok)throw Error('이미지를 불러오지 못했어요. 아래 이미지 열기를 이용해 주세요.');const blob=await response.blob();return new File([blob],`little-sea-${amuletStyle(id).id}.png`,{type:'image/png'})}
