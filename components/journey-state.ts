// Intent is data, not a Korean display-label convention.
export type JourneyKind='point'|'destination'|'boat'|'tent'|'landmark';
export type Journey={name:string;x:number;z:number;kind:JourneyKind};
export function boatAction({aboard,near,moving,full,busy,approaching}:{aboard:boolean;near:boolean;moving:boolean;full:boolean;busy:boolean;approaching:boolean}){
 if(aboard)return 'none';
 if(busy)return 'boarding';
 if(moving)return 'sailing';
 if(full)return 'full';
 if(near)return 'board';
 return approaching?'approaching':'approach';
}
