export const campPosition=(seat:number)=>({x:(seat%50-25)*1.6+.8,z:-1.15-Math.floor(seat/50)*1.05});
