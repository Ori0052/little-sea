export const campCapacity=80;
export const campColumns=40;
export const campPosition=(seat:number)=>({x:(seat%campColumns-(campColumns-1)/2)*2.05,z:-1.15-Math.floor(seat/campColumns)*1.3});
