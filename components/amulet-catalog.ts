import catalog from '../public/amulets/catalog.json';
export const amuletStyles=catalog;
export type AmuletId=string;
export function isAmuletId(id:unknown):id is string{return typeof id==='string'&&amuletStyles.some(a=>a.id===id)}
export function amuletStyle(id:string){return amuletStyles.find(a=>a.id===id)||amuletStyles[0]}
