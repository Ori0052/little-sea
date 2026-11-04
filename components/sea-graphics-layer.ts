export type SeaGraphicsFrame={gl:WebGLRenderingContext;canvas:HTMLCanvasElement;view:'dream'|'shore'};
let terrainLayer:((frame:SeaGraphicsFrame)=>void)|null=null;
export function registerSeaTerrain(layer:(frame:SeaGraphicsFrame)=>void){terrainLayer=layer;return()=>{if(terrainLayer===layer)terrainLayer=null}}
export function drawSeaTerrain(frame:SeaGraphicsFrame){terrainLayer?.(frame)}
