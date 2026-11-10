export type SeaMood='day'|'sunset'|'night'|'rain'|'thunder';
export function hasThunder(mood:string,rainThunder:boolean){return mood==='thunder'||(mood==='rain'&&rainThunder)}
export function thunderDelay(first:boolean,random=Math.random()){return first?4500:45000+Math.max(0,Math.min(1,random))*30000}
