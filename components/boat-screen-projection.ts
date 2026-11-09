import {fromWorld,projectMap,type SeaCamera} from './sea-space';
export function projectBoatPoint(point:{x:number;y:number;z:number},c:SeaCamera,aspect:number,view:'dream'|'shore'){
 if(view==='shore'){const p=fromWorld(point.x,point.z,view),q=projectMap(p.x,p.y,c,aspect);return{x:q.x,y:q.y-point.y*.035,depth:point.x*.001-point.y}}
 const dx=point.x-c.x,dz=point.z-c.z,depth=dx*Math.sin(c.yaw)+dz*Math.cos(c.yaw),right=dx*Math.cos(c.yaw)-dz*Math.sin(c.yaw),h=.5-c.pitch*.55,spread=c.spread??1;
 return{x:.5+right/(aspect*(depth*.6+4*c.eye)*spread),y:1-h+h*((6*c.eye+1.5*((c.ground??0)-point.y)/spread)/(depth+6*c.eye)-.12),depth};
}
export const boatProjectionGLSL=`
uniform vec4 boatCamera;
uniform vec4 boatLens;
uniform float boatMap;
vec4 boatClip(vec3 p){
 float eye=boatLens.x, ground=boatLens.y, spread=boatLens.z, aspect=boatLens.w;
 if(boatMap>.5){float my=.55+p.x/12.;float coast=.22+.04*sin((my-.5)*.8)+.023*sin(my*10.)+.012*sin(my*24.+.6);float mx=coast+p.z/12.;float sx=mx-boatCamera.x;float sy=.5+(my-boatCamera.y-.5)*aspect-p.y*.035;return vec4(sx*2.-1.,1.-sy*2.,.5-p.y*.01+p.x*.00001,1.);}
 float dx=p.x-boatCamera.x,dz=p.z-boatCamera.y,c=cos(boatCamera.z),s=sin(boatCamera.z),d=dx*s+dz*c,r=dx*c-dz*s,h=.5-boatCamera.w*.55;
 float sx=r/(aspect*max(.1,d*.6+4.*eye)*spread),sy=1.-h+h*((6.*eye+1.5*(ground-p.y)/spread)/max(.1,d+6.*eye)-.12);
 float w=max(.1,d+6.*eye),sortDepth=max(.1,d+6.*eye-.65*(p.y-ground));
 return vec4(sx*2.*w,(1.-2.*sy)*w,(1.-.2/sortDepth)*w,w);
}`;
