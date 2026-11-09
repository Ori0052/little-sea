"""Run: blender --background --python scripts/blender/build_sea_boat.py -- public/models/sea-boat.glb"""
import bpy, math, os, sys
from mathutils import Vector
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*(c**2.2 for c in color),1);bs.inputs['Roughness'].default_value=.42
 return m
cream=mat('warm ivory',(.83,.76,.57));wood=mat('honey wood',(.48,.28,.12));rim=mat('sea blue',(.11,.29,.38));skin=mat('warm skin',(.93,.70,.52));hat=mat('straw hat',(.86,.74,.44));white=mat('hat ribbon',(.91,.9,.83));dark=mat('hair',(.17,.12,.16))
blush=mat('soft peach cheeks',(.98,.58,.60))
shirts=[mat('shirt '+str(i),c) for i,c in enumerate([(.58,.49,.76),(.45,.68,.65),(.83,.54,.53),(.44,.61,.79),(.78,.67,.43),(.71,.55,.69)])]
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
def cube(name,loc,scale,material,parent=None,bevel=.06):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('soft edges','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('normals','WEIGHTED_NORMAL')
 return o
def sphere(name,loc,scale,material,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16 if name in ['Head','Body','Hat brim','Hat top'] else (6 if name=='Smile' else 10),ring_count=10 if name in ['Head','Body','Hat brim','Hat top'] else (4 if name=='Smile' else 6));o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 return o
def beam(name,a,b,radius,material,parent=None):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=radius,depth=(b-a).length);o=bpy.context.object;o.name=name;o.parent=parent;o.location=(a+b)/2;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(material);return o
root=empty('BoatRoot')
# Blender X=right, Y=forward, Z=up. glTF export converts to Y-up.
N=48
rings=[(.27,.73,2.05),(.48,.93,2.30),(.87,1.08,2.48)]
verts=[]
for h,w,l in rings:
 for i in range(N):
  t=2*math.pi*i/N;verts.append((w*math.sin(t),l*math.cos(t),h))
faces=[]
for j in range(len(rings)-1):
 for i in range(N):faces.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
mesh=bpy.data.meshes.new('hull mesh');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Hull',mesh);bpy.context.collection.objects.link(obj);obj.parent=root;obj.data.materials.append(cream);sol=obj.modifiers.new('real hull thickness','SOLIDIFY');sol.thickness=.065;bev=obj.modifiers.new('soft hull','BEVEL');bev.width=.025;bev.segments=2
for i in range(N):
 t=2*math.pi*i/N;u=2*math.pi*(i+1)/N;beam('Gunwale', (1.08*math.sin(t),2.48*math.cos(t),.87),(1.08*math.sin(u),2.48*math.cos(u),.87),.065,rim,root)
for x in [-.48,-.24,0,.24,.48]:cube('Floor plank',(x,0,.29),(.225,3.25,.08),wood,root,.025)
for y in [-1.1,0,1.1]:cube('Bench',(0,y,.60),(1.65,.29,.14),wood,root,.04)
for y in [-2.0,2.0]:cube('End deck',(0,y,.7),(.65,.40,.14),wood,root,.04)
for i in range(6):
 side=-1 if i%2==0 else 1;y=1.1-(i//2)*1.1
 passenger=empty('Passenger_'+str(i),(side*.55,y,.64),root)
 # Soft chibi proportions: large round head, plump torso, short rounded limbs.
 sphere('Body',(0,0,.20),(.235,.20,.235),shirts[i],passenger)
 sphere('Head',(0,-.015,.65),(.285,.255,.275),skin,passenger)
 sphere('Eye left',(-.09,-.254,.67),(.027,.026,.035),dark,passenger);sphere('Eye right',(.09,-.254,.67),(.027,.026,.035),dark,passenger)
 for x in [-.17,.17]:sphere('Blush',(x,-.218,.59),(.055,.018,.032),blush,passenger)
 # A tiny rounded smile sits on the front of the face.
 for j in range(5):
  x=(j-2)*.014;z=.588+.014*(abs(j-2)/2)**2
  sphere('Smile',(x,-.263,z),(.010,.010,.010),dark,passenger)
 sphere('Hair',(0,.09,.78),(.264,.185,.18),dark,passenger)
 sphere('Hat brim',(0,0,.91),(.35,.32,.052),hat,passenger);sphere('Hat top',(0,0,.982),(.235,.22,.12),hat,passenger);sphere('Ribbon',(0,0,.936),(.241,.226,.038),white,passenger)
 for leg in [-1,1]:
  sphere('Thigh',(leg*.105,-.10,.065),(.095,.20,.095),shirts[i],passenger)
  sphere('Lower leg',(leg*.105,-.25,-.04),(.072,.075,.125),skin,passenger)
  sphere('Little foot',(leg*.105,-.29,-.135),(.083,.115,.06),skin,passenger)
 for arm in [-1,1]:
  p=empty('Arm_'+str(i)+'_'+str(arm),(arm*.205,0,.32),passenger)
  sphere('Round sleeve',(arm*.02,-.07,-.045),(.085,.13,.10),shirts[i],p)
  beam('Forearm',(arm*.02,-.14,-.10),(-side*.16-arm*.205,-.24,-.07),.06,skin,p)
  sphere('Little hand',(-side*.16-arm*.205,-.24,-.07),(.075,.07,.07),skin,p)
 pivot=empty('Oar_'+str(i),(side*.91,y,.82),root)
 beam('Oar shaft',(-side*.52,-.24,-.12),(side*1.04,-.24,-.30),.035,wood,pivot)
 blade=cube('Oar blade',(side*1.22,-.24,-.32),(.42,.22,.065),wood,pivot,.08)
# A small island is a separate switchable object in the same asset.
island=empty('Island',(4,4,0))
sphere('Sand',(0,0,-.05),(2.6,2.0,.32),hat,island);sphere('Grass',(0,.25,.09),(1.8,1.35,.25),shirts[1],island)
for x,y in [(-.8,.4),(.8,.8)]:
 beam('Palm trunk',(x,y,.1),(x+.13,y,2.1),.11,wood,island)
 for j in range(6):
  t=j*math.pi/3;leaf=sphere('Palm leaf',(x+.13+math.cos(t)*.47,y+math.sin(t)*.47,2.12),(.70,.17,.08),shirts[1],island);leaf.rotation_euler.z=t
# Tent as a simple triangle prism.
v=[(-.65,-.55,.15),(.65,-.55,.15),(0,-.55,1.1),(-.65,.55,.15),(.65,.55,.15),(0,.55,1.1)];m=bpy.data.meshes.new('tent mesh');m.from_pydata(v,[],[(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)]);o=bpy.data.objects.new('Tent',m);bpy.context.collection.objects.link(o);o.parent=island;o.location=(0,-.6,.15);o.data.materials.append(cream)
# Batch static meshes by parent and material while retaining all animated pivots.
for ob in list(bpy.data.objects):
 if ob.type=='MESH':
  bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
groups={}
for ob in list(bpy.data.objects):
 if ob.type=='MESH':groups.setdefault((ob.parent,tuple(m.name for m in ob.data.materials)),[]).append(ob)
for objects in groups.values():
 if len(objects)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
path=os.path.abspath(sys.argv[sys.argv.index('--')+1]);os.makedirs(os.path.dirname(path),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(__file__),'sea-boat.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',export_yup=True,export_apply=True)
print('Exported',path)
