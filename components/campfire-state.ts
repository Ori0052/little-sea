export type CampfireAction='watch'|'wood'|'aurora'|'roast'|'collect'|'roast-fish'|'collect-fish';
export type FireEffects={woodUntil:number;auroraUntil:number;potatoReadyAt:number|null;clockOffset:number};
export const potatoRoastMs=20000;

export type AnglingState={fishCount:number;castReadyAt:number|null;castX:number|null;castZ:number|null;fishReadyAt:number|null};
export type SharedCooking={potatoes:number;fish:number;potatoReadyAts?:number[];fishReadyAts?:number[]};
export const fishRoastMs=15000;
