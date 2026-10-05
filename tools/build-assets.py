import bpy, math, os, random, json
from mathutils import Vector
OUT='/Users/advaith/Documents/Codex/2026-10-02/so-x20/outputs/red-core-assets'
os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('RED CORE — Asset Workshop')
bpy.context.window.scene=scene
scene.render.engine='BLENDER_EEVEE_NEXT'
scene.render.resolution_x=1200;scene.render.resolution_y=760;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Workshop world');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.09,.105,.085,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
scene.view_settings.view_transform='Standard'
random.seed(86)
def mat(name,color,noise=False,emission=False):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.85
 if noise:
  im=bpy.data.images.new(name+' pixels',width=32,height=32)
  pixels=[]
  for y in range(32):
   for x in range(32):
    f=random.choice([.72,.86,1,1,1,1.12]); pixels.extend([min(1,c*f) for c in color]+[1])
  im.pixels=pixels;im.pack()
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest'
  m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
 if emission:
  p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=.65
 return m
olive=mat('Worn olive rubber',(.31,.36,.20),True); dark=mat('Black rubber',(.055,.07,.065),True)
metal=mat('Oxidized machine enamel',(.30,.39,.36),True);rust=mat('Rust and leather',(.32,.17,.09),True)
cream=mat('Bone and stenciling',(.65,.66,.43),True);glass=mat('Amber lenses',(.63,.39,.10),False,True)
cyan=mat('Irradiated cyan',(.10,.68,.65),False,True);flesh=mat('Specimen hide',(.20,.28,.28),True)
red=mat('Warning red',(.49,.12,.065),True);green=mat('Phosphor',(.23,.74,.43),False,True)
assets={}; current=[]
def finish(o,name,m,bone=None):
 o.name=name;o.data.materials.append(m); current.append(o)
 if bone:o['bone']=bone
 return o
def box(name,loc,scale,m,bone=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(o,name,m,bone)
def ico(name,loc,scale,m,bone=None):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=loc);o=bpy.context.object;o.scale=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(o,name,m,bone)
def tube(name,a,b,r,m,bone=None,r2=None):
 a=Vector(a);b=Vector(b);d=b-a
 bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(a+b)/2)
 o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 return finish(o,name,m,bone)
def ring(name,loc,r,m):
 bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=4,location=loc,major_radius=r,minor_radius=.028)
 o=bpy.context.object;o.rotation_euler[0]=math.pi/2
 return finish(o,name,m)
def rig(specimen=False):
 bpy.ops.object.armature_add(enter_editmode=True);arm=bpy.context.object;arm.name='SpecimenRig' if specimen else 'OZKRig'
 eb=arm.data.edit_bones;eb.remove(eb[0])
 defs=[('Hips',(0,0,.83),(0,0,1.02),None),('Spine',(0,0,1.02),(0,0,1.25),'Hips'),('Chest',(0,0,1.25),(0,0,1.48),'Spine'),('Neck',(0,0,1.48),(0,0,1.58),'Chest'),('Head',(0,0,1.58),(0,0,1.82),'Neck')]
 for side,s in [('L',1),('R',-1)]:
  defs += [(f'UpperArm.{side}',(.23*s,0,1.44),(.34*s,0,1.12),'Chest'),(f'LowerArm.{side}',(.34*s,0,1.12),(.38*s,-.05,.88),f'UpperArm.{side}'),(f'Hand.{side}',(.38*s,-.05,.88),(.38*s,-.08,.77),f'LowerArm.{side}'),(f'UpperLeg.{side}',(.115*s,0,.87),(.13*s,0,.48),'Hips'),(f'LowerLeg.{side}',(.13*s,0,.48),(.13*s,0,.13),f'UpperLeg.{side}'),(f'Foot.{side}',(.13*s,0,.13),(.13*s,-.16,.08),f'LowerLeg.{side}')]
 for name,a,b,parent in defs:
  bone=eb.new(name);bone.head=a;bone.tail=b
  if parent:bone.parent=eb[parent]
 bpy.ops.object.mode_set(mode='OBJECT')
 for o in current:
  if 'bone' not in o:continue
  group=o.vertex_groups.new(name=o['bone']);group.add(list(range(len(o.data.vertices))),1,'REPLACE')
  mod=o.modifiers.new('Rig','ARMATURE');mod.object=arm;o.parent=arm
 for name,frames,amplitude in [('idle',60,.035),('walk',30,.42)]:
  arm.animation_data_create();action=bpy.data.actions.new(name);arm.animation_data.action=action
  for f in [1,frames//4,frames//2,3*frames//4,frames]:
   phase=2*math.pi*(f-1)/(frames-1)
   for pb in arm.pose.bones:
    pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0)
    if name=='walk' and ('UpperLeg' in pb.name or 'UpperArm' in pb.name):pb.rotation_euler.x=math.sin(phase)*amplitude*(1 if pb.name.endswith('L') else -1)*(-1 if 'Arm' in pb.name else 1)
    if pb.name=='Chest':pb.rotation_euler.x=math.sin(phase)*.025
    pb.keyframe_insert(data_path='rotation_euler',frame=f)
  track=arm.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action)
  arm.animation_data.action=None
 scene.frame_set(1)
 return arm

def export(name,arm=None):
 bpy.ops.object.select_all(action='DESELECT')
 for o in current:o.select_set(True)
 if arm:arm.select_set(True)
 bpy.context.view_layer.objects.active=arm or current[0]
 kwargs=dict(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_animations=True,export_skins=True)
 props=bpy.ops.export_scene.gltf.get_rna_type().properties
 if 'export_animation_mode' in props:kwargs['export_animation_mode']='NLA_TRACKS'
 bpy.ops.export_scene.gltf(**kwargs)
 assets[name]=list(current)+([arm] if arm else [])
 for o in assets[name]:o.hide_render=True;o.hide_set(True)
 current.clear()

# Engineer: thick hood, round lenses, filter, harness, equipment and heavy boots.
tube('Rubber tunic',(0,0,.90),(0,0,1.44),.22,olive,'Chest',.26)
box('Apron',(0,-.185,1.15),(.34,.055,.36),olive,'Spine')
ico('Hood',(0,0,1.64),(.21,.19,.25),olive,'Head')
ico('Mask',(0,-.15,1.63),(.165,.10,.17),dark,'Head')
for x in [-.078,.078]:tube('Lens',(x,-.205,1.69),(x,-.255,1.69),.062,glass,'Head')
tube('Respirator',(0,-.22,1.57),(0,-.35,1.54),.067,dark,'Head')
for z in [1.51,1.54,1.57]:box('Filter grill',(0,-.354,z),(.10,.013,.012),cream,'Head')
for x in [-.155,.155]:box('Harness',(x,-.23,1.26),(.045,.022,.36),rust,'Chest')
box('Belt',(0,0,.97),(.47,.38,.07),dark,'Hips')
for x in [-.12,.12]:box('Tool pouch',(x,-.23,1.01),(.13,.09,.15),rust,'Hips')
box('Air pack',(0,.21,1.25),(.27,.14,.33),metal,'Chest')
for side,s in [('L',1),('R',-1)]:
 tube('Sleeve',(.23*s,0,1.43),(.34*s,0,1.11),.105,olive,f'UpperArm.{side}',.085)
 tube('Forearm',(.34*s,0,1.11),(.38*s,-.05,.89),.085,olive,f'LowerArm.{side}',.065)
 ico('Glove',(.38*s,-.055,.85),(.078,.075,.11),dark,f'Hand.{side}')
 tube('Trouser',(.115*s,0,.87),(.13*s,0,.48),.115,olive,f'UpperLeg.{side}',.095)
 tube('Boot shaft',(.13*s,0,.48),(.13*s,0,.12),.095,dark,f'LowerLeg.{side}',.105)
 box('Boot',(.13*s,-.07,.075),(.22,.35,.15),dark,f'Foot.{side}')
arm=rig();export('ozk-v2',arm)
# Creature: angular carapace, elongated claws, asymmetry and cyan sensory organs.
tube('Carapace',(0,.07,.9),(0,0,1.55),.18,flesh,'Chest',.32)
ico('Cranium',(0,-.02,1.73),(.18,.22,.27),flesh,'Head')
for x in [-.09,0,.09]:ico('Sensory node',(x,-.225,1.79),(.035,.04,.045),cyan,'Head')
for i in range(5):tube('Spinal barb',(0,.16,1.1+i*.12),(.08 if i%2 else -.08,.40,1.26+i*.12),.065,cream,'Chest',0)
for side,s in [('L',1),('R',-1)]:
 tube('Upper limb',(.25*s,0,1.47),(.40*s,-.01,1.12),.09,flesh,f'UpperArm.{side}',.065)
 tube('Lower limb',(.40*s,-.01,1.12),(.46*s,-.10,.76),.065,flesh,f'LowerArm.{side}',.045)
 for i in range(3):tube('Claw',(.46*s+(i-1)*.035,-.10,.79),(.48*s+(i-1)*.055,-.19,.53),.023,cream,f'Hand.{side}',0)
 tube('Thigh',(.115*s,0,.87),(.16*s,.05,.48),.1,flesh,f'UpperLeg.{side}',.075)
 tube('Shin',(.16*s,.05,.48),(.16*s,-.05,.12),.075,flesh,f'LowerLeg.{side}',.04)
 box('Clawed foot',(.16*s,-.10,.065),(.15,.31,.13),flesh,f'Foot.{side}')
arm=rig(True);export('specimen-v2',arm)
# Locker
box('Locker shell',(0,0,.9),(.72,.5,1.8),metal)
for x in [-.18,.18]:
 box('Locker door',(x,-.27,.92),(.335,.055,1.65),olive)
 for z in [1.38,1.44,1.50]:box('Vent slot',(x,-.302,z),(.20,.01,.019),dark)
 box('Handle',(x+.1,-.32,.88),(.025,.035,.16),cream)
 box('Number plate',(x,-.303,1.20),(.10,.01,.06),cream)
export('locker')
# Pump and valve
box('Pump skid',(0,0,.09),(.9,.65,.18),dark)
tube('Pump barrel',(-.30,0,.4),(.30,0,.4),.25,metal)
tube('Upright pipe',(0,0,.42),(0,0,1.2),.12,rust)
tube('Outlet',(0,0,1.16),(.5,0,1.16),.12,rust)
ring('Handwheel',(0,-.25,.83),.23,red)
box('Wheel spoke',(0,-.25,.83),(.44,.04,.04),red);box('Wheel spoke',(0,-.25,.83),(.04,.04,.44),red)
tube('Gauge rim',(.24,-.13,.6),(.24,-.20,.6),.11,dark)
tube('Gauge face',(.24,-.20,.6),(.24,-.205,.6),.088,cream)
box('Needle',(.25,-.21,.62),(.016,.01,.095),red)
export('pump')
# CRT cabinet
box('Terminal base',(0,0,.38),(.70,.55,.76),metal)
box('Monitor housing',(0,-.01,1.03),(.82,.60,.56),dark)
box('Screen bezel',(0,-.325,1.04),(.70,.07,.45),olive)
box('Screen',(0,-.368,1.04),(.59,.018,.34),green)
for i in range(5):box('Display line',(-.13,-.380,1.13-i*.045),(.25+(i%2)*.16,.007,.012),dark)
box('Keyboard tray',(0,-.37,.72),(.78,.33,.06),metal)
for row in range(3):
 for col in range(8):box('Key',(-.28+col*.08,-.47+row*.08,.758),(.055,.055,.018),cream)
export('terminal')
# Blast door
box('Door frame',(0,.06,1.3),(1.8,.30,2.6),dark)
for x in [-.40,.40]:
 box('Door leaf',(x,-.12,1.28),(.77,.18,2.38),metal)
 for z in [.45,1.25,2.05]:box('Door brace',(x,-.24,z),(.7,.06,.10),olive)
box('Window',(0,-.225,1.8),(.35,.05,.2),glass)
ring('Door wheel',(.38,-.29,1.15),.19,rust)
export('blast-door')
# Filter canister
for x in [-.15,.15]:
 tube('Canister',(x,0,.12),(x,0,.68),.12,olive)
 tube('Canister cap',(x,0,.68),(x,0,.73),.13,dark)
 box('Warning band',(x,-.115,.39),(.15,.012,.13),cream)
box('Carrier',(0,.05,.33),(.55,.10,.52),rust)
export('filter-canister')
# Arrange a lit asset board; source meshes and rigs remain individually exportable.
placements={'ozk-v2':(-3,0,0),'specimen-v2':(-1.8,0,0),'locker':(-.5,.15,0),'terminal':(.65,0,0),'pump':(1.8,-.05,0),'blast-door':(3.25,.35,0),'filter-canister':(.7,-1,0)}
for name,objects in assets.items():
 offset=Vector(placements[name])
 roots=[o for o in objects if not o.parent]
 for o in objects:o.hide_render=False;o.hide_set(False)
 for o in roots:o.location+=offset
floor=box('Presentation floor',(0,0,-.08),(9,4,.12),mat('Board floor',(.055,.075,.065)))
for loc,energy,size in [((-4,-4,7),1500,5),((4,-1,5),1100,4),((0,3,5),1700,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5,-11,5));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=9.5;scene.camera=cam
scene.render.filepath=os.path.join(OUT,'asset-board.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'red-core-assets.blend'),copy=True)
report={name:{'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects if o.type=='MESH'),'objects':len(objects)} for name,objects in assets.items()}
open(os.path.join(OUT,'asset-report.json'),'w').write(json.dumps(report,indent=2))
print(json.dumps(report))
