"""Original mobile-friendly diorama kit. Run Blender 4.3+: --background --python this-file.
Each export root is centered at the origin, Blender +Z up / -Y front (glTF +Y up/+Z front).
No textures or downloaded assets. All forms and materials are authored here.
"""
import bpy, math, random, os, json, hashlib
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=Path('/workspace/outputs/little-sea-cozy-3d');OUT.mkdir(parents=True,exist_ok=True)
random.seed(31)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4

def mat(name,hex_color,rough=.65,metallic=0,emission=0):
 h=hex_color.lstrip('#');rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)];rgba=(*[linear(v) for v in rgb],1)
 m=bpy.data.materials.new(name);m.diffuse_color=rgba;m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba;bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metallic
 if emission:bs.inputs['Emission Color'].default_value=rgba;bs.inputs['Emission Strength'].default_value=emission
 return m
M={
 'wood':mat('Cozy honey wood','#AC733E'), 'woodlight':mat('Cozy fresh wood','#D6A768'),'wooddark':mat('Cozy bark shadow','#775133'),
 'leaf':mat('Cozy sage leaves','#6B9445'), 'leaflight':mat('Cozy sunlight leaves','#91AF55'),'leafdark':mat('Cozy olive shade','#456A39'),
 'pine':mat('Cozy evergreen','#4D7851'),'pinesoft':mat('Cozy evergreen tips','#6B9663'),
 'stone':mat('Cozy river stone','#909589'),'stonelight':mat('Cozy warm stone','#B2AD9D'),'stonedark':mat('Cozy slate shade','#6D786E'),
 'char':mat('Cozy charred wood','#423A32'),'ember':mat('Cozy glowing embers','#F49F42',.9,0,2.6),'emberdark':mat('Cozy red coals','#C3532F',.9,0,.6),
 'teal':mat('Cozy muted teal enamel','#4B8D86',.4),'cream':mat('Cozy sail cream','#F3DEB1',.8),'canvas':mat('Cozy linen canvas','#F0D8AD',.95),
 'coral':mat('Cozy tent coral','#CC8D70',.95),'gold':mat('Cozy old brass','#C79647',.35,.25),'metal':mat('Cozy lantern dark bronze','#596357',.4,.4),
 'glass':mat('Cozy lantern warm glass','#FFE4A3',.28,0,1.9),'paper':mat('Cozy ivory paper','#FFF2D5',.9),'paperfold':mat('Cozy paper folds','#DFCCAD',.9),
 'grass':mat('Cozy grass green','#739747',.9),'grasslight':mat('Cozy grass sun tips','#A4B86A',.9),'petal':mat('Cozy meadow daisies','#FFF3DC',.7),'pollen':mat('Cozy daisy centers','#E9B552',.75),
 'rope':mat('Cozy woven rope','#CEB891',.9), 'interior':mat('Cozy inner shadow','#A57855',.9),
}
roots=[]

def empty(name,parent=None,loc=(0,0,0)):
 ob=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.location=loc;return ob

def mesh(name,verts,faces,material,parent,smooth=True):
 me=bpy.data.meshes.new(name+' geometry');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(material)
 if smooth:
  for p in me.polygons:p.use_smooth=True
 return ob

def uv(name,loc,scale,material,parent,segments=16,rings=8):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=(0,0,0));ob=bpy.context.object;ob.name=name;ob.parent=parent;ob.location=loc;ob.scale=scale;ob.data.materials.append(material)
 for p in ob.data.polygons:p.use_smooth=True
 return ob

def cube(name,loc,scale,material,parent,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1);ob=bpy.context.object;ob.name=name;ob.parent=parent;ob.location=loc;ob.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(material)
 if bevel:
  mod=ob.modifiers.new('Hand softened corners','BEVEL');mod.width=bevel;mod.segments=3;ob.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return ob

def beam(name,a,b,r,material,parent,verts=12):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=(b-a).length);ob=bpy.context.object;ob.name=name;ob.parent=parent;ob.location=(a+b)/2;ob.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();ob.data.materials.append(material)
 bevel=ob.modifiers.new('Rounded ends','BEVEL');bevel.width=min(r*.22,.025);bevel.segments=2;ob.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for p in ob.data.polygons:p.use_smooth=True
 return ob

def tube(name,points,radii,material,parent,sides=7):
 vertices=[];faces=[]
 for i,p in enumerate(points):
  tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])
  tangent.normalize();basis=tangent.cross(Vector((0,0,1)))
  if basis.length<.02:basis=tangent.cross(Vector((1,0,0)))
  basis.normalize();other=tangent.cross(basis).normalized()
  for k in range(sides):
   a=math.tau*k/sides;q=Vector(p)+(basis*math.cos(a)+other*math.sin(a))*radii[i];vertices.append(tuple(q))
 for i in range(len(points)-1):
  for k in range(sides):faces.append((i*sides+k,i*sides+(k+1)%sides,(i+1)*sides+(k+1)%sides,(i+1)*sides+k))
 faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+k for k in range(sides))]);return mesh(name,vertices,faces,material,parent)

def ring(name,center,radius,tube_radius,material,parent,segments=24,sides=6,vertical=False):
 points=[]
 for k in range(segments+1):
  a=math.tau*k/segments
  points.append((center[0]+radius*math.cos(a),center[1]+(0 if vertical else radius*math.sin(a)),center[2]+(radius*math.sin(a) if vertical else 0)))
 return tube(name,points,[tube_radius]*len(points),material,parent,sides)

# Palm tree: a naturally bent trunk with rings and a crown of sculpted flowing fronds.
r=empty('CozyPalm');roots.append(r)
trunk=[(0,0,0),(.02,0,.4),(.10,.02,.9),(.24,.04,1.45),(.38,.05,2.05),(.40,.04,2.7)]
tube('Palm curved trunk',trunk,[.15,.145,.13,.115,.095,.07],M['wood'],r,12)
for j in range(14):
 t=(j+.4)/14;z=t*2.65;x=.40*(math.sin(t*1.5)**1.6);ring('Palm old leaf scar',(x,.04*t,z),.151*(1-t*.60),.009,M['woodlight'] if j%3==0 else M['wooddark'],r,12,5)
for k in range(10):
 angle=math.tau*k/10+.20;length=1.15+(k%3)*.12;points=[];vertices=[];faces=[]
 for j in range(11):
  t=j/10;rad=length*t;z=2.72+.34*math.sin(t*math.pi*.9)-.40*t*t;cx=.4+math.cos(angle)*rad;cy=.04+math.sin(angle)*rad;w=.255*math.sin(math.pi*t)**.65*(1-.25*t)
  vertices.extend([(cx-math.sin(angle)*w,cy+math.cos(angle)*w,z-.025),(cx,cy,z+.055*math.sin(math.pi*t)),(cx+math.sin(angle)*w,cy-math.cos(angle)*w,z-.025)])
  points.append((cx,cy,z+.013))
 for j in range(10):
  for side in range(2):faces.append((j*3+side,(j+1)*3+side,(j+1)*3+side+1,j*3+side+1))
 leaf=mesh('Palm sculpted frond',vertices,faces,M[['leaf','leaflight','leafdark'][k%3]],r)
 sol=leaf.modifiers.new('Plump leaf edge','SOLIDIFY');sol.thickness=.024
 tube('Palm frond midrib',points,[.019*(1-i/12) for i in range(11)],M['leafdark'],r,5)
for a in [0,2.1,4.2]:uv('Palm coconut',(.40+math.cos(a)*.13,.04+math.sin(a)*.13,2.57),(.105,.10,.12),M['wooddark'],r,12,8)
# Broadleaf tree with an actual branching silhouette and clustered leaf surfaces.
r=empty('CozyOak');roots.append(r)
tube('Oak softly twisting trunk',[(0,0,0),(.03,0,.6),(.02,.01,1.3),(-.1,.05,1.95),(-.08,.03,2.45)],[.22,.20,.145,.10,.04],M['wood'],r,12)
branches=[((-0.03,0,1.1),(-.85,.05,2.00)),((0,.02,1.4),(.78,-.18,2.3)),((-.08,.04,1.8),(-.3,.67,2.6)),((-.05,0,1.7),(.14,-.62,2.65))]
for a,b in branches:
 mid=Vector(a).lerp(Vector(b),.52)+Vector((0,0,.12));tube('Oak bough',[a,tuple(mid),b],[.12,.085,.025],M['wood'],r,10)
# Irregular smooth lobes, rather than unmodified round spheres.
clusters=[(-.65,.00,2.12,.73),(.60,-.12,2.4,.72),(-.23,.48,2.65,.76),(.10,-.55,2.67,.67),(-.20,-.03,2.98,.75),(.30,.40,2.85,.58),(-.72,.32,2.63,.55)]
for i,(cx,cy,cz,size) in enumerate(clusters):
 ob=uv('Oak sculpted canopy',(cx,cy,cz),(size,size*.86,size*.74),M[['leaf','leaflight','leafdark'][i%3]],r,20,10)
 for v in ob.data.vertices:
  co=v.co;rad=1+.055*math.sin(co.x*13+i)*math.sin(co.y*9+i*.5)+.025*math.cos(co.z*17);co*=rad
 # Small leaves at the silhouette give the foliage a hand-sculpted finish.
 for n in range(5):
  a=math.tau*n/5+i*.57;h=cz+.04+(n%2)*.15;loc=(cx+math.cos(a)*size*.77,cy+math.sin(a)*size*.72,h)
  leaf=uv('Oak individual soft leaf',loc,(.20,.095,.055),M['leaflight'] if n%3==0 else M['leaf'],r,10,6);leaf.rotation_euler=(.2*math.cos(a),.2*math.sin(a),a)
# Fine leaf silhouettes are cupped meshes on the canopy surface, not texture decals.
for i,(cx,cy,cz,size) in enumerate(clusters):
 for n in range(12):
  az=n*2.399+i*.73;nz=-.18+.92*((n*5%12)/11);xy=math.sqrt(1-nz*nz)
  normal=Vector((math.cos(az)*xy,math.sin(az)*xy,nz)).normalized()
  center=Vector((cx,cy,cz))+Vector((normal.x*size*.97,normal.y*size*.86*.97,normal.z*size*.74*.97))
  rotation=Vector((0,0,1)).rotation_difference(normal)
  shape=[(0,-.14,0),(-.065,-.07,.016),(-.073,.035,.020),(0,.145,.002),(.073,.035,.020),(.065,-.07,.016),(0,-.02,.033)]
  verts=[tuple(center+rotation@Vector(v)) for v in shape]
  faces=[(k,(k+1)%6,6) for k in range(6)]
  leaf=mesh('Oak cupped surface leaf',verts,faces,M['leaflight'] if n%4==0 else M['leaf'] if n%3 else M['leafdark'],r)
  leaf.modifiers.new('Soft leaf thickness','SOLIDIFY').thickness=.008
for k in range(6):
 a=math.tau*k/6;tube('Oak exposed root',[(math.cos(a)*.50,math.sin(a)*.40,.015),(math.cos(a)*.2,math.sin(a)*.18,.10),(0,0,.35)],[.035,.065,.10],M['wood'],r,7)
# Conifer with rounded scalloped tiers, graceful sloping branch edges.
r=empty('CozyPine');roots.append(r);beam('Pine trunk',(0,0,0),(0,0,2.6),.14,M['wood'],r)
for level in range(6):
 base=.45+level*.37;radius=.95-level*.125;vertices=[];faces=[];n=28
 for j in range(7):
  t=j/6;rad=radius*(1-t*.84)**1.1;z=base+t*.84
  for k in range(n):
   a=math.tau*k/n;wave=(.05*math.cos(a*7+level*.8))*(1-t)**2;vertices.append((math.cos(a)*(rad+wave),math.sin(a)*(rad+wave),z+.06*math.cos(a*7+level)*(1-t)))
 for j in range(6):
  for k in range(n):faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
 faces.extend([tuple(range(n-1,-1,-1)),tuple(6*n+k for k in range(n))]);mesh('Pine sculpted branches',vertices,faces,M['pine'] if level%2==0 else M['pinesoft'],r)
# A single useful rounded rock with an organic silhouette.
r=empty('CozyRock');roots.append(r);rock=uv('Weathered beach rock',(0,0,.25),(.52,.42,.30),M['stone'],r,16,10)
for v in rock.data.vertices:
 c=v.co;c*=1+.06*math.sin(c.x*11+c.y*5)+.03*math.cos(c.z*13+c.y*3)
# Campfire center, sized for up-close quiet moments.
r=empty('CozyCampfire');roots.append(r)
for i in range(11):
 a=math.tau*i/11;stone=uv('Campfire ring stone',(.49*math.cos(a),.49*math.sin(a),.085),(.14,.105,.115),M[['stone','stonelight','stonedark'][i%3]],r,12,8);stone.rotation_euler=(.12*math.sin(a),.12*math.cos(a),a)
for layer in range(2):
 for k in range(3):
  a=math.tau*k/3+layer*math.pi/3;v=Vector((math.cos(a),math.sin(a),0));center=Vector((0,0,.16+layer*.13));start=center-v*.37;end=center+v*.37
  log=beam('Campfire bark log',start,end,.085,M['wooddark'],r,12)
  for side in [-1,1]:
   p=center+v*(.375*side);beam('Campfire cut log end',p-v*.003,p+v*.005,.072,M['woodlight'],r,12)
   # Dark charred center.
   if side==1:beam('Campfire dark heart',p+v*.005,p+v*.008,.035,M['char'],r,10)
  sidevec=Vector((-v.y,v.x,0))
  for q in [-.7,0,.7]:
   zoff=Vector((0,0,.078*math.cos(q)));off=sidevec*(.06*math.sin(q))+zoff;tube('Campfire bark groove',[tuple(start+off+v*.04),tuple(center+off+Vector((0,0,.003))),tuple(end+off-v*.04)],[.005,.006,.004],M['wood'],r,5)
for i in range(14):
 a=math.tau*i/14;rad=.07+.24*((i*7%13)/13);uv('Campfire glowing coal',(math.cos(a)*rad,math.sin(a)*rad,.105),(.032,.024,.018),M['ember'] if i%3==0 else M['emberdark'],r,8,5)
# Lantern, solid warm glass avoids realtime transparent sorting and keeps the glow warm.
r=empty('CozyLantern');roots.append(r)
cube('Lantern plinth',(0,0,.045),(.28,.25,.09),M['metal'],r,.025);cube('Lantern warm light',(0,0,.22),(.19,.17,.27),M['glass'],r,.025)
for x in [-.117,.117]:
 for y in [-.102,.102]:beam('Lantern corner frame',(x,y,.06),(x,y,.39),.014,M['metal'],r,8)
cube('Lantern cap',(0,0,.405),(.31,.28,.085),M['metal'],r,.025);uv('Lantern top dome',(0,0,.455),(.11,.10,.045),M['gold'],r,14,6);ring('Lantern handle',(0,0,.55),.09,.012,M['metal'],r,20,6,True)
# A small patch with plump grass and one daisy.
r=empty('CozyGrass');roots.append(r)
for i in range(11):
 a=i*2.399;rad=.1*((i%4)/3);h=.18+(i%4)*.045;start=(math.cos(a)*rad,math.sin(a)*rad,0);points=[start,(start[0]+math.cos(a)*.035,start[1]+math.sin(a)*.035,h*.66),(start[0]+math.cos(a)*.10,start[1]+math.sin(a)*.10,h)]
 tube('Grass curved blade',points,[.014,.016,.001],M['grasslight'] if i%3==0 else M['grass'],r,5)
beam('Daisy stem',(.1,.05,0),(.08,.06,.30),.008,M['leafdark'],r,6)
for i in range(7):
 a=math.tau*i/7;ob=uv('Daisy petal',(.08+math.cos(a)*.043,.06+math.sin(a)*.043,.305),(.04,.018,.011),M['petal'],r,8,5);ob.rotation_euler.z=a
uv('Daisy sunny center',(.08,.06,.315),(.025,.025,.014),M['pollen'],r,12,6)
# A real hollow rowboat, curved hull, rim, floor boards, benches and named oar pivots.
r=empty('CozyBoat');r.scale=(1.7,1.7,1.2);roots.append(r);n=48;vertices=[];faces=[]
levels=[(-.08,.20,.82),(.10,.37,1.06),(.24,.49,1.23),(.43,.56,1.30),(.49,.57,1.31)]
for z,w,l in levels:
 for k in range(n):
  a=math.tau*k/n;vertices.append((w*math.sin(a),l*math.cos(a),z+.04*abs(math.cos(a))**4))
for j in range(len(levels)-1):
 for k in range(n):faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
faces.append(tuple(range(n-1,-1,-1)));hull=mesh('Boat cream planked hull',vertices,faces,M['cream'],r);hull.modifiers.new('Solid boat thickness','SOLIDIFY').thickness=.045;bev=hull.modifiers.new('Soft hull edges','BEVEL');bev.width=.018;bev.segments=2
rim=[]
for k in range(n+1):
 a=math.tau*k/n;rim.append((.572*math.sin(a),1.312*math.cos(a),.50+.04*abs(math.cos(a))**4))
tube('Boat teal rounded gunwale',rim,[.035]*len(rim),M['teal'],r,8)
for x in [-.29,-.145,0,.145,.29]:cube('Boat honey floorboard',(x,0,.14),(.137,1.78,.055),M['woodlight'] if x==0 else M['wood'],r,.018)
for y in [-.63,0,.63]:
 width=.88 if y else 1.0
 cube('Boat rounded bench',(0,y,.40),(width,.21,.085),M['wood'],r,.026)
 for x in [-width*.38,width*.38]:cube('Boat bench support',(x,y,.27),(.06,.15,.22),M['wooddark'],r,.014)
for y in [-1.02,1.02]:cube('Boat end seat',(0,y,.48),(.48,.30,.06),M['wood'],r,.025)
for side in [-1,1]:
 root=empty('BoatOarLeft' if side<0 else'BoatOarRight',r,(side*.55,.01,.46));beam('Boat oar honey shaft',(side*-.22,0,0),(side*.99,0,-.08),.019,M['wood'],root,10)
 blade=cube('Boat oar carved blade',(side*1.13,0,-.10),(.37,.13,.05),M['woodlight'],root,.052);blade.rotation_euler.y=side*.06
 uv('Boat brass oarlock',(side*.55,.01,.47),(.055,.055,.035),M['gold'],r,12,6)
# Small brass nail heads on the bow, and subtly darker seams between real boards.
for side in [-1,1]:
 for j in range(5):uv('Boat brass fastening',(side*.525, -.68+j*.34,.42),(.013,.013,.013),M['gold'],r,8,5)
# Linen A-frame tent, with a gently billowing canvas and open entrance.
r=empty('CozyTent');roots.append(r);L=.95;W=.77;H=1.13
for side in [-1,1]:
 vertices=[];faces=[]
 for j in range(11):
  y=-L+2*L*j/10
  for k in range(7):
   t=k/6;x=side*W*t;z=H*(1-t)+.045-.035*math.sin(math.pi*t)*math.cos(y/L*.8);vertices.append((x,y,z))
 for j in range(10):
  for k in range(6):faces.append((j*7+k,j*7+k+1,(j+1)*7+k+1,(j+1)*7+k))
 panel=mesh('Tent soft canvas side',vertices,faces,M['canvas'],r);panel.modifiers.new('Fabric thickness','SOLIDIFY').thickness=.02
 # Rounded seams along both eaves.
 tube('Tent warm coral seam',[(side*W,-L,.045),(side*W,0,.045),(side*W,L,.045)],[.018]*3,M['coral'],r,6)
for y in [-L,L]:
 beam('Tent A-frame pole left',(-W,y,.03),(0,y,H+.045),.025,M['wood'],r,10);beam('Tent A-frame pole right',(W,y,.03),(0,y,H+.045),.025,M['wood'],r,10)
beam('Tent top ridge',(0,-L-.04,H+.045),(0,L+.04,H+.045),.026,M['woodlight'],r,10)
mesh('Tent back wall',[(-W,L,.03),(W,L,.03),(0,L,H)],[(0,1,2)],M['coral'],r,False)
# Front tied curtains frame a proper dark triangular entrance.
mesh('Tent left tied door',[(-W,-L-.005,.03),(-.47,-L-.015,.03),(-.18,-L-.018,.76),(0,-L,H)],[(0,1,2,3)],M['coral'],r)
mesh('Tent right tied door',[(W,-L-.005,.03),(.47,-L-.015,.03),(.18,-L-.018,.76),(0,-L,H)],[(0,3,2,1)],M['coral'],r)
cube('Tent interior groundsheet',(0,0,.026),(1.37,1.77,.035),M['interior'],r,.035)
for side in [-1,1]:
 for y in [-.74,.74]:
  tube('Tent guy rope',[(side*.75,y,.12),(side*1.04,y+.08,.035)],[.007,.007],M['rope'],r,5);beam('Tent rounded peg',(side*1.04,y+.08,0),(side*1.04,y+.08,.12),.018,M['wooddark'],r,8)
# A folded paper boat, miniature in the same physical world.
r=empty('CozyPaperboat');roots.append(r)
mesh('Paperboat outer folded hull',[(-.18,-.06,.045),(.18,-.06,.045),(.12,.06,.005),(-.12,.06,.005),(0,-.055,.105)],[(0,1,2,3),(0,4,1),(1,4,2),(2,4,3),(3,4,0)],M['paper'],r,False)
mesh('Paperboat cream sail',[(-.125,0,.055),(0,0,.185),(0,0,.055)],[(0,1,2)],M['paper'],r,False)
mesh('Paperboat shadow fold',[(0,0,.055),(0,0,.185),(.125,0,.055)],[(0,1,2)],M['paperfold'],r,False)

# Export all kit roots, with modifiers applied by the glTF exporter.
bpy.ops.object.select_all(action='DESELECT')
for r in roots:
 r.select_set(True)
 for child in r.children_recursive:child.select_set(True)
export_path=ROOT/'public/models/cozy-world.glb';export_path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(export_path),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
deps=bpy.context.evaluated_depsgraph_get();manifest={'generator':'Blender '+bpy.app.version_string,'style':'Original soft coastal diorama kit','front':'Three +Z','up':'Three +Y','origins':'ground center; every kit root at local 0,0,0','nodes':[]}
for r in roots:
 all=[c for c in r.children_recursive if c.type=='MESH'];tris=0;mn=Vector((1e5,)*3);mx=Vector((-1e5,)*3)
 for c in all:
  ev=c.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles();tris+=len(me.loop_triangles)
  for v in me.vertices:
   p=ev.matrix_world@v.co;mn=Vector(tuple(min(mn[i],p[i]) for i in range(3)));mx=Vector(tuple(max(mx[i],p[i]) for i in range(3)))
  ev.to_mesh_clear()
 manifest['nodes'].append({'name':r.name,'meshes':len(all),'triangles':tris,'sizeThree':[round(mx.x-mn.x,3),round(mx.z-mn.z,3),round(mx.y-mn.y,3)]})
manifest['triangles']=sum(n['triangles'] for n in manifest['nodes']);manifest['bytes']=export_path.stat().st_size;manifest['sha256']=hashlib.sha256(export_path.read_bytes()).hexdigest();manifest['source']='scripts/blender/build_cozy_world.py';manifest['license']='Original authored geometry and materials; no external textures or downloads'
(ROOT/'public/models/cozy-world-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# The editable project retains pristine kit roots at origin, hidden only for preview.
for r in roots:
 r.hide_render=True
 for c in r.children_recursive:c.hide_render=True
preview=empty('Preview kit arrangement')
placements={'CozyPalm':(-2.9,1.7,0,.9),'CozyOak':(2.4,1.9,0,.9),'CozyPine':(.1,2.7,0,.83),'CozyRock':(-3,-1.6,0,.8),'CozyCampfire':(-.5,-.2,0,1.4),'CozyLantern':(-1.65,-.55,0,1.6),'CozyGrass':(-2.6,.1,0,1.7),'CozyBoat':(1.95,-1.55,0,.65),'CozyTent':(-.7,1.05,0,.75),'CozyPaperboat':(.5,-2.2,.03,2.4)}
for root in roots:
 x,y,z,s=placements[root.name];copies={}
 for source in [root]+list(root.children_recursive):
  ob=source.copy();ob.data=source.data;bpy.context.collection.objects.link(ob);ob.hide_render=False;copies[source]=ob
  if source==root:ob.parent=preview;ob.location=(x,y,z);ob.scale=(source.scale.x*s,source.scale.y*s,source.scale.z*s)
  else:ob.parent=copies[source.parent]
# Studio staging is not in exported GLB.
groundmat=mat('Preview warm ivory backdrop','#E9E8DA',.9)
cube('Preview ground',(0,0,-.10),(200,200,.15),groundmat,preview,.06)
bpy.context.scene.render.engine='CYCLES';scene=bpy.context.scene;scene.cycles.samples=128;scene.cycles.use_denoising=False
scene.render.resolution_x=900;scene.render.resolution_y=780;scene.render.resolution_percentage=100
scene.world.color=(.25,.25,.25);scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.60,.71,.78,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.42
for name,loc,power,size,col in [('Warm softbox',(-4,-5,9),1100,5,(1,.87,.66)),('Sky fill',(4,0,7),550,6,(.74,.85,1))]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.name=name;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.data.color=col;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7.6,-10.7,8.4));cam=bpy.context.object;cam.name='Kit review camera';cam.rotation_euler=(Vector((0,.25,1.0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=9.3;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'cozy-world-kit.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cozy-world.blend'))
print('COZY KIT MANIFEST',json.dumps(manifest))
bpy.ops.render.render(write_still=True)
