export type BoatQualityMode='auto'|'light'|'detail';
export function shouldUseDetailedPassenger({aboard,distance,ready,previous,mode,limited}:{aboard:boolean;distance:number;ready:boolean;previous:boolean;mode:BoatQualityMode;limited:boolean}){return ready&&aboard&&mode!=='light'&&!(mode==='auto'&&limited)&&Number.isFinite(distance)&&distance<(previous?6:4.5)}
export function shouldWarmDetail({aboard,distance,mode,limited}:{aboard:boolean;distance:number;mode:BoatQualityMode;limited:boolean}){return mode!=='light'&&!(mode==='auto'&&limited)&&(aboard||distance<8)}
