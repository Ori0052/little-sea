"""Build the original, editable My Little Sea rounded human character.

blender --background --python scripts/blender/build_cozy_character.py
Only authored geometry/materials; no downloaded meshes or textures.
Blender -Y is the face direction; glTF export turns it into Three.js +Z.
"""
import bpy, json, math, os, struct
from pathlib import Path
from mathutils import Vector

def compact_vertex_colors(path):
    """Core glTF supports normalized u8 COLOR_0; compact float color buffers into the normalized u8 layout."""
    raw=path.read_bytes()
    json_length=struct.unpack_from('<I',raw,12)[0]
    document=json.loads(raw[20:20+json_length])
    bin_start=20+json_length+8
    binary=raw[bin_start:]
    color_indices={primitive['attributes']['COLOR_0'] for mesh in document.get('meshes',[]) for primitive in mesh['primitives'] if 'COLOR_0' in primitive['attributes']}
    replacements={}
    for index in color_indices:
        accessor=document['accessors'][index]
        if accessor['componentType']!=5126: continue
        view_index=accessor['bufferView']
        # Exported color views are dedicated to exactly one accessor.
        if sum(a.get('bufferView')==view_index for a in document['accessors'])!=1: continue
        view=document['bufferViews'][view_index]
        channels=3 if accessor['type']=='VEC3' else 4
        stride=view.get('byteStride',channels*4)
        start=view.get('byteOffset',0)+accessor.get('byteOffset',0)
        packed=bytearray()
        for vertex in range(accessor['count']):
            color=struct.unpack_from('<'+str(channels)+'f',binary,start+vertex*stride)
            if channels==3: color=(*color,1.)
            packed.extend(max(0,min(255,round(channel*255))) for channel in color)
        replacements[view_index]=bytes(packed)
        accessor.update(componentType=5121,type='VEC4',normalized=True,byteOffset=0)
        accessor.pop('min',None)
        accessor.pop('max',None)
    rebuilt=bytearray()
    for index,view in enumerate(document['bufferViews']):
        while len(rebuilt)%4: rebuilt.append(0)
        part=replacements.get(index,binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])
        view['byteOffset']=len(rebuilt)
        view['byteLength']=len(part)
        if index in replacements: view.pop('byteStride',None)
        rebuilt.extend(part)
    document['buffers'][0]['byteLength']=len(rebuilt)
    while len(rebuilt)%4:rebuilt.append(0)
    text=json.dumps(document,separators=(',',':')).encode()
    text+=b' '*((-len(text))%4)
    total=12+8+len(text)+8+len(rebuilt)
    path.write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(rebuilt),0x004e4942)+rebuilt)

ROOT = Path(__file__).resolve().parents[2]
OUT = Path('/workspace/outputs/little-sea-cozy-3d')
OUT.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def linear(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

def material(name, hex_color, roughness=.72, sheen=.14):
    rgb = tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*(linear(c) for c in rgb), 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Specular IOR Level'].default_value = .25
    p.inputs['Sheen Weight'].default_value = sheen
    p.inputs['Coat Weight'].default_value = .025
    return m

skin = material('Cozy warm porcelain skin', 'F5D4B7', .67, .10)
shirt = material('Cozy shirt tint', 'B5A4D8', .80, .27)
cream = material('Cozy oatmeal cotton', 'F6ECDD', .82, .30)
sole = material('Cozy cream soles', 'DCCEB6', .87)
hair = material('Cozy chestnut bob', '684534', .73, .18)
hair_light = material('Cozy subtle hair strand', '79503B', .78)
eye = material('Cozy cocoa eyes', '38291F', .33, .0)
glint = material('Cozy eye glints', 'FFFBED', .30, .0)
blush = material('Cozy rosy cheeks', 'EAA59A', .84, .14)
straw = material('Cozy butter straw', 'E6CF9C', .85, .25)
ribbon = material('Cozy hat lavender ribbon', 'A59ABE', .84, .28)
gold = material('Cozy warm button', 'D7BA71', .48)
leaf = material('Cozy mint accent', '88AF8C', .8)
food_mat = material('Cozy little roasted sweet potato', 'BE8C55', .86)
wood = material('Cozy fishing rod wood', '916548', .78)

def group(name, position=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ob)
    ob.parent = parent
    ob.location = position
    return ob

def sphere(name, position, scale, mat, parent, segments=20, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings)
    ob = bpy.context.object
    ob.name = name
    ob.parent = parent
    ob.location = position
    ob.scale = scale
    ob.data.materials.append(mat)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

def path(name, points, radius, mat, parent, resolution=3):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 8
    curve.bevel_depth = radius
    curve.bevel_resolution = resolution
    curve.resolution_u = 8
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = 'AUTO'
        p.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(ob)
    ob.parent = parent
    ob.data.materials.append(mat)
    return ob

root = group('CozyCharacter')
root['authored_by'] = 'My Little Sea · original Blender geometry'
root['rig_schema'] = 'cozy-human-1'
root['front'] = '+Z after glTF export'
root['seat_hip_height'] = .305
motion = group('CozyMotion', parent=root)
body = group('CozyBody', parent=motion)

# The cotton silhouette is fuller toward the hem, rather than a spherical torso.
sphere('Rounded cotton body', (0, .006, .405), (.174, .133, .192), shirt, body, 28, 18)
sphere('Soft rounded shirt hem', (0, .004, .296), (.177, .134, .062), shirt, body, 24, 12)
sphere('Little cotton neckline', (0, -.003, .567), (.087, .079, .032), cream, body, 24, 10)
sphere('Bare warm neck', (0, -.002, .595), (.061, .062, .052), skin, body, 20, 10)
sphere('Rounded shorts', (0, .003, .269), (.141, .110, .062), cream, body, 24, 12)

# A tiny wave stitched on the pocket gives a sea identity without floating labels.
sphere('Cotton chest pocket', (.067, -.121, .435), (.048, .010, .047), cream, body, 16, 10)
path('Pocket wave embroidery', [(.038,-.133,.432),(.052,-.138,.438),(.068,-.140,.432),(.083,-.137,.438),(.095,-.133,.432)], .0034, ribbon, body, 2)
for z in (.487, .448):
    sphere('Small shirt button', (-.024, -.133, z), (.009, .006, .009), gold, body, 12, 8)

head = group('CozyHead', (0, 0, .780), motion)
sphere('Soft round face', (0, -.008, 0), (.249, .231, .250), skin, head, 36, 20)
sphere('Rounded chin', (0, -.059, -.126), (.183, .177, .116), skin, head, 28, 16)

# Eyes follow the face curvature and stay readable at game-camera distances.
for sign, label in [(-1, 'L'), (1, 'R')]:
    sphere('Little ear '+label, (sign*.247, -.001, -.030), (.043, .046, .061), skin, head, 20, 12)
    sphere('Ear warmth '+label, (sign*.260, -.033, -.027), (.014, .012, .027), blush, head, 14, 8)
    eye_root = group('CozyEye'+label, (sign*.081,-.226,.014), head)
    eye_ob = sphere('Cocoa eye '+label, (0,0,0), (.022, .014, .032), eye, eye_root, 24, 14)
    eye_ob.rotation_euler.z = sign*.025
    sphere('Bright eye catchlight '+label, (-.006,-.0135,.010), (.0062, .0035, .0082), glint, eye_root, 12, 8)
    sphere('Tiny eye catchlight '+label, (.006,-.013,-.010), (.0025, .0020, .0033), glint, eye_root, 10, 6)
    cheek = sphere('Peach blush '+label, (sign*.146, -.204, -.060), (.041, .009, .023), blush, head, 20, 10)
    cheek.rotation_euler.z = -sign*.10
    path('Gentle brow '+label, [(sign*.109,-.215,.074),(sign*.084,-.226,.080),(sign*.063,-.229,.076)], .0052, hair, head, 2)
sphere('Tiny button nose', (0, -.241, -.023), (.018, .017, .017), skin, head, 20, 12)
path('Quiet smile', [(-.030,-.222,-.065),(-.020,-.229,-.080),(0,-.231,-.085),(.020,-.229,-.080),(.030,-.222,-.065)], .0058, eye, head, 3)

# A continuous, thick bob shell. Front hair is high enough to keep the face open.
hair_root = group('CozyBob', parent=head)
verts, faces = [], []
sectors, levels = 56, 14
for j in range(levels+1):
    for k in range(sectors):
        phi = k/sectors*math.tau
        front = max(0., -math.sin(phi))
        back = max(0., math.sin(phi))
        edge = 1.72 - .57*front + .40*back
        edge += front*.09*math.cos(6*(phi+math.pi/2))
        edge += (1-front)*.032*math.cos(phi*8)
        theta = .002 + (edge-.002)*j/levels
        verts.append((.263*math.sin(theta)*math.cos(phi), .019+.245*math.sin(theta)*math.sin(phi), .012+.264*math.cos(theta)))
for j in range(levels):
    for k in range(sectors):
        a=j*sectors+k
        b=j*sectors+(k+1)%sectors
        faces.append((a,a+sectors,b+sectors,b))
mesh=bpy.data.meshes.new('Continuous rounded bob shell')
mesh.from_pydata(verts, [], faces)
mesh.update()
ob=bpy.data.objects.new('Chestnut bob cap', mesh)
bpy.context.collection.objects.link(ob)
ob.parent=hair_root
ob.data.materials.append(hair)
for p in ob.data.polygons: p.use_smooth=True
solid=ob.modifiers.new('Soft bob edge thickness', 'SOLIDIFY')
solid.thickness=.013
solid.offset=-1
bevel=ob.modifiers.new('Rounded bob hem', 'BEVEL')
bevel.width=.004
bevel.segments=2

# Three sculpted fringe locks, and a small sweep on top. No texture dependence.
for x, y, z, sx, sy, sz, angle in [(-.124,-.182,.166,.105,.043,.065,-.22),(-.025,-.218,.170,.098,.037,.057,.06),(.087,-.196,.176,.101,.040,.060,.31)]:
    lock=sphere('Rounded fringe lock', (x,y,z), (sx,sy,sz), hair, hair_root, 24, 12)
    lock.rotation_euler.y=angle
path('Bob top sweep', [(-.045,.012,.253),(-.009,.020,.273),(.027,.018,.276),(.052,.018,.258)], .015, hair, hair_root, 3)
# Soft groove highlights are sparse so the hairstyle reads as one sculpted volume.
for sign in (-1,1):
    path('Bob side strand', [(sign*.218,.045,.155),(sign*.258,.066,.036),(sign*.235,.080,-.092)], .0035, hair_light, hair_root, 2)

hat = group('CozyHat', parent=head)
sphere('Soft straw hat brim', (0,.012,.260), (.315,.285,.022), straw, hat, 40, 12)
sphere('Rounded straw crown', (0,.016,.314), (.211,.192,.073), straw, hat, 36, 16)
sphere('Lavender hat band', (0,.016,.283), (.216,.197,.024), ribbon, hat, 36, 12)
# Bow loops and a tiny daisy subtly soften the sunhat.
for sign in (-1,1):
    loop=sphere('Hat ribbon bow loop', (sign*.033,.194,.288), (.039,.014,.024), ribbon, hat, 16, 10)
    loop.rotation_euler.y=sign*.32
sphere('Hat ribbon bow knot', (0,.198,.286), (.016,.016,.018), cream, hat, 16, 10)
for i in range(5):
    a=i/5*math.tau
    petal=sphere('Hat little daisy petal', (-.168+math.cos(a)*.022,-.116+math.sin(a)*.016,.289), (.016,.012,.010), cream, hat, 12, 8)
sphere('Hat daisy center', (-.168,-.116,.300), (.011,.011,.007), gold, hat, 14, 8)

arms={}
for side,label in [(-1,'L'),(1,'R')]:
    arm=group('CozyArm'+label, (side*.172,.005,.540), motion)
    arms[label]=arm
    sphere('Rounded shoulder sleeve '+label, (side*.009,0,-.055), (.070,.073,.103), shirt, arm, 24, 14)
    sphere('Cream sleeve cuff '+label, (side*.013,0,-.125), (.055,.059,.021), cream, arm, 20, 10)
    fore=group('CozyForearm'+label, (0,0,-.145), arm)
    sphere('Soft forearm '+label, (0,0,-.067), (.039,.041,.082), skin, fore, 20, 12)
    hand=group('CozyHand'+label, (0,0,-.140), fore)
    sphere('Rounded palm '+label, (0,-.002,-.008), (.041,.032,.044), skin, hand, 20, 12)
    thumb=sphere('Little thumb '+label, (-side*.034,-.009,.001), (.018,.024,.026), skin, hand, 16, 10)
    thumb.rotation_euler.y=-side*.48
    for f in range(3):
        sphere('Soft finger '+label, ((f-1)*.019,-.006,-.034), (.013,.024,.018), skin, hand, 12, 8)
    leg=group('CozyLeg'+label, (side*.077,.003,.305), motion)
    sphere('Cotton shorts leg '+label, (0,0,-.050), (.065,.072,.078), cream, leg, 20, 12)
    sphere('Warm small leg '+label, (0,0,-.117), (.041,.045,.062), skin, leg, 20, 12)
    shin=group('CozyShin'+label, (0,0,-.145), leg)
    sphere('Oatmeal sock '+label, (0,-.002,-.049), (.043,.046,.061), cream, shin, 20, 12)
    shoe=group('CozyShoe'+label, (0,-.016,-.116), shin)
    sphere('Soft rounded shoe '+label, (0,-.027,.012), (.059,.088,.045), cream, shoe, 24, 14)
    sphere('Rounded shoe sole '+label, (0,-.027,-.012), (.060,.089,.018), sole, shoe, 24, 10)
    path('Tiny shoe seam '+label, [(-.033,-.067,.024),(0,-.079,.028),(.033,-.067,.024)], .003, sole, shoe, 2)

food=group('CozyFood', (0,-.040,-.012), bpy.data.objects['CozyHandR'])
sphere('Tiny baked sweet potato', (0,0,0), (.029,.042,.024), food_mat, food, 20, 12)
path('Sweet potato soft seam', [(-.008,-.034,.018),(0,-.012,.023),(.004,.021,.021)], .002, cream, food, 2)
rod=group('CozyFishingRod', (0,-.005,0), bpy.data.objects['CozyHandR'])
path('Little bamboo fishing rod', [(0,0,0),(0,-.11,.06),(0,-.23,.17),(0,-.34,.33)], .0055, wood, rod, 2)

# Apply curves/modifiers once, and batch rigid meshes sharing a pivot and material.
for ob in list(bpy.data.objects):
    if ob.type in {'MESH','CURVE'}:
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active=ob
        bpy.ops.object.convert(target='MESH')
# Bake authored static colors into vertex paint, reducing avatar draw calls without
# flattening the sculpted face or requiring a texture download. Shirt stays tintable.
def vertex_material(name, roughness):
    result=material(name, 'FFFFFF', roughness)
    node=result.node_tree.nodes.new('ShaderNodeVertexColor')
    node.layer_name='CozyPaint'
    result.node_tree.links.new(node.outputs['Color'],result.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    result.use_backface_culling=True
    return result
paint=vertex_material('Cozy soft vertex paint', .75)
eye_paint=vertex_material('Cozy glass eye vertex paint', .34)
bpy.context.view_layer.update()
for child in list(hair_root.children):
    matrix=child.matrix_world.copy()
    child.parent=head
    child.matrix_world=matrix
for ob in list(bpy.data.objects):
    if ob.type!='MESH' or not ob.data.materials or ob.data.materials[0]==shirt: continue
    old=ob.data.materials[0]
    rgba=old.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:]
    attr=ob.data.color_attributes.new(name='CozyPaint',type='BYTE_COLOR',domain='CORNER')
    for value in attr.data: value.color=rgba
    ob.data.materials.clear()
    ob.data.materials.append(eye_paint if old in (eye,glint) else paint)
groups={}
for ob in list(bpy.data.objects):
    if ob.type=='MESH':
        groups.setdefault((ob.parent, tuple(m.name for m in ob.data.materials)), []).append(ob)
for objects in groups.values():
    if len(objects)<2: continue
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects: ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()

bpy.context.view_layer.update()
def descendants(ob):
    yield ob
    for child in ob.children:
        yield from descendants(child)
model_objects=list(descendants(root))
vertices=sum(len(ob.data.vertices) for ob in model_objects if ob.type=='MESH')
triangles=sum(len(p.vertices)-2 for ob in model_objects if ob.type=='MESH' for p in ob.data.polygons)
mesh_count=sum(ob.type=='MESH' for ob in model_objects)

model_path=ROOT/'public/models/cozy-character.glb'
model_path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for ob in model_objects: ob.select_set(True)
bpy.context.view_layer.objects.active=root
export_path=model_path.with_name('cozy-character.next.glb')
bpy.ops.export_scene.gltf(filepath=str(export_path), export_format='GLB', export_yup=True, export_apply=True, use_selection=True, export_extras=True, export_animations=False, export_cameras=False, export_lights=False)
compact_vertex_colors(export_path)
os.replace(export_path,model_path)

# Set preview pose in the .blend; the exported neutral rig keeps straight-down limbs.
for label,side in [('L',-1),('R',1)]:
    arms[label].rotation_euler.y=-side*.12

scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=128
scene.cycles.use_denoising=False
scene.render.resolution_x=640
scene.render.resolution_y=640
scene.render.resolution_percentage=100
scene.world.color=(.43,.43,.43)
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
background=material('Preview pale oat studio', 'E9E3D9', .93)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.008))
floor=bpy.context.object
floor.name='Preview studio ground'
floor.data.materials.append(background)

def area(name, position, energy, color, size):
    data=bpy.data.lights.new(name, 'AREA')
    data.energy=energy
    data.color=color
    data.shape='DISK'
    data.size=size
    ob=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(ob)
    ob.location=position
    ob.rotation_euler=(Vector((0,0,.58))-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob
area('Large warm window', (-2.3,-3.4,4.5), 350, (1,.89,.74), 3.6)
area('Sky fill', (2.6,-1.8,2.2), 180, (.76,.86,1), 3.0)
area('Warm edge of sun', (1.6,2.7,3.7), 280, (1,.90,.74), 2.3)
camera_data=bpy.data.cameras.new('Portrait camera')
camera=bpy.data.objects.new('Portrait camera',camera_data)
bpy.context.collection.objects.link(camera)
camera.location=(1.45,-3.1,1.65)
camera.rotation_euler=(Vector((0,0,.565))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO'
camera_data.ortho_scale=1.55
camera_data.lens=50
scene.camera=camera
for hidden_root in (food,rod):
    for child in descendants(hidden_root): child.hide_render=True
scene.render.filepath=str(OUT/'cozy-character-hat.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cozy-character.blend'),compress=True)
bpy.ops.render.render(write_still=True)
for child in descendants(hat): child.hide_render=True
for hidden_root in (food,rod):
    for child in descendants(hidden_root): child.hide_render=True
scene.render.filepath=str(OUT/'cozy-character-bob.png')
bpy.ops.render.render(write_still=True)

stats={'vertices':vertices,'triangles':triangles,'meshNodes':mesh_count,'materials':3,'vertexColors':'normalized u8 COLOR_0','fileBytes':model_path.stat().st_size,'front':'+Z','seatHipHeight':.305,'heightWithHat':1.167,'script':'scripts/blender/build_cozy_character.py','asset':'public/models/cozy-character.glb','editableBlend':str(OUT/'cozy-character.blend')}
(OUT/'cozy-character-stats.json').write_text(json.dumps(stats,indent=2))
print('COZY_CHARACTER_STATS', json.dumps(stats))
