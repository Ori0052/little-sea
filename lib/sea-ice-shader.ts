/** Static world-space ice: it remains attached to the sea as the camera moves. */
export const seaIceGLSL=`
vec3 frozenSea(vec2 world,float night){
 vec2 p=world*.62,b=floor(p),f=fract(p);float first=9.,second=9.;
 for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 seed=vec2(hash(b+o),hash(b+o+17.2));vec2 q=o+.2+seed*.6-f;float d=dot(q,q);if(d<first){second=first;first=d;}else if(d<second){second=d;}}}
 float edge=sqrt(second)-sqrt(first);float seam=1.-smoothstep(.012,.055,edge);float rim=1.-smoothstep(.055,.12,edge);
 float frost=fbm(world*2.8),snow=smoothstep(.43,.71,fbm(world*.34+9.));
 vec3 ice=mix(vec3(.39,.64,.75),vec3(.75,.88,.93),frost);ice=mix(ice,vec3(.9,.95,.97),snow*.68);ice=mix(ice,vec3(.33,.57,.69),rim*.32);ice+=vec3(.56,.69,.73)*seam*.43;
 return ice*mix(vec3(1.),vec3(.39,.51,.69),night*.8);
}`;
