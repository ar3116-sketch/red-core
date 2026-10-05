import bpy, math, os, random, json
from mathutils import Vector
OUT='/Users/advaith/Documents/Codex/2026-10-02/so-x20/outputs/red-core-evolution'
os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('RED CORE — Hazmat and Mutations')
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
  im=bpy.data.images.new(name+' pixels',width=64,height=64)
  pixels=[]
  for y in range(64):
   for x in range(64):
    f=random.uniform(.78,1.13) * (.83 if (x//16+y//16)%5==0 else 1); pixels.extend([min(1,c*f) for c in color]+[1])
  im.pixels=pixels;im.pack()
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest'
  m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
 if emission:
  p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=.65
 return m
olive=mat('Worn olive rubber',(.20,.29,.13),True); dark=mat('Black rubber',(.055,.07,.065),True)
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


# Tailored ring meshes retain a chunky silhouette without stacked box limbs.
def cloth(name,rings,m,bone):
 verts=[];faces=[];n=10
 for x,y,z,rx,ry in rings:
  for i in range(n):
   a=2*math.pi*i/n;verts.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
 for j in range(len(rings)-1):
  for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o)
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project();bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 return finish(o,name,m,bone)
cloth('Loose sealed suit',[(0,0,.83,.29,.23),(0,0,.98,.38,.29),(0,0,1.19,.40,.30),(0,0,1.42,.35,.25),(0,0,1.51,.25,.21)],olive,'Chest')
cloth('Hood',[(0,0,1.46,.22,.21),(0,0,1.64,.26,.24),(0,0,1.85,.23,.22),(0,0,1.94,.13,.14)],olive,'Head')
visor=mat('Dark smoked visor',(.018,.025,.027))
def faceplate(name,loc,size,material,radius):
 o=box(name,loc,size,material,'Head')
 bpy.context.view_layer.objects.active=o
 bevel=o.modifiers.new('Rounded moulded corners','BEVEL');bevel.width=radius;bevel.segments=3
 bpy.ops.object.modifier_apply(modifier=bevel.name)
 for polygon in o.data.polygons:polygon.use_smooth=True
 normals=o.modifiers.new('Even face normals','WEIGHTED_NORMAL');normals.keep_sharp=True;normals.weight=50
 bpy.ops.object.modifier_apply(modifier=normals.name)
 return o
faceplate('Recessed rubber visor seal',(0,-.213,1.735),(.35,.07,.285),dark,.035)
faceplate('Smooth smoked faceplate',(0,-.231,1.735),(.30,.045,.231),visor,.03)

for x in [-.092,.092]:tube('Respirator cartridge',(x,-.235,1.57),(x,-.315,1.55),.058,dark,'Head')
box('Sealed front zip',(0,-.30,1.19),(.025,.022,.45),dark,'Chest')
box('Zipper pull',(0,-.32,1.32),(.035,.02,.055),cream,'Chest')
cloth('Waist gather',[(0,0,.91,.31,.24),(0,0,.96,.33,.25)],dark,'Hips')
for side,s in [('L',1),('R',-1)]:
 cloth('Balloon sleeve '+side,[(s*.53,0,.92,.092,.10),(s*.51,0,1.02,.14,.14),(s*.47,0,1.15,.17,.16),(s*.39,0,1.35,.185,.18),(s*.30,0,1.44,.15,.16)],olive,'UpperArm.'+side)
 tube('Gathered cuff',(s*.53,0,.9),(s*.54,0,.96),.10,dark,'LowerArm.'+side)
 ico('Glove palm',(s*.55,-.01,.882),(.052,.037,.060),dark,'Hand.'+side)
 for finger,length in enumerate([.054,.063,.058,.044]):
  dx=(finger-1.5)*.022
  a=(s*.55+dx,-.012,.849);b=(s*.55+dx,-.014,.849-length*.55);c=(s*.55+dx,-.001,.849-length)
  tube('Gloved finger proximal',a,b,.010,dark,'Hand.'+side,.009)
  tube('Gloved finger curled tip',b,c,.009,dark,'Hand.'+side,.006)
 tube('Glove thumb base',(s*.55-s*.037,-.01,.895),(s*.55-s*.060,-.016,.871),.015,dark,'Hand.'+side,.012)
 tube('Glove thumb tip',(s*.55-s*.060,-.016,.871),(s*.55-s*.056,-.029,.845),.012,dark,'Hand.'+side,.008)
 cloth('Baggy trouser '+side,[(s*.17,0,.30,.12,.14),(s*.17,0,.39,.17,.185),(s*.17,.015,.49,.15,.16),(s*.17,0,.66,.20,.21),(s*.17,0,.89,.21,.22)],olive,'UpperLeg.'+side)
 for z,r in [(.38,.17),(.55,.185)]:tube('Fabric fold',(s*.17,0,z),(s*.17,0,z+.025),r,olive,'LowerLeg.'+side,r*.89)
 ico('Soft knee patch',(s*.17,-.174,.51),(.11,.033,.085),dark,'LowerLeg.'+side)
 tube('Rubber boot',(s*.17,0,.08),(s*.17,0,.32),.123,dark,'LowerLeg.'+side,.12)
 ico('Boot toe',(s*.17,-.08,.08),(.125,.205,.09),dark,'Foot.'+side)
for o in current:
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.select_set(False)
 factor=.97 if o.get('bone')=='Head' else .84
 o.location.x*=.90
 for v in o.data.vertices:v.co.x*=factor;v.co.y*=.91
arm=rig();export('ozk-v3',arm)
# Original radial jaw / arthropod hybrid. Four jaws, recessed throat, six articulated limbs.
hide=mat('Chitin grey olive',(.28,.30,.22),True)
inner=mat('Mouth membrane',(.25,.075,.067),True)
bone=mat('Old ivory',(.57,.55,.36),True)
throat=mat('Throat shadow',(.012,.016,.014))
cloth('Segmented thorax',[(0,.08,.82,.14,.18),(0,.10,1.03,.22,.22),(0,.08,1.30,.31,.24),(0,.04,1.49,.28,.22)],hide,'Chest')
for z in [1.02,1.15,1.28,1.41]:
 ico('Rib shield',(0,-.10,z),(.32,.14,.095),bone,'Chest')
ico('Abdomen',(0,.25,.88),(.23,.35,.32),hide,'Hips')
tube('Throat cavity',(0,-.14,1.76),(0,-.29,1.76),.23,throat,'Head')
for i in range(4):
 a=math.pi/4+i*math.pi/2;ux,uz=math.cos(a),math.sin(a)
 # Broad triangular hinged jaw with folded central ridge.
 verts=[(ux*.13,-.15,1.76+uz*.13),(ux*.42-uz*.17,-.20,1.76+uz*.42+ux*.17),(ux*.58,-.13,1.76+uz*.58),(ux*.42+uz*.17,-.20,1.76+uz*.42-ux*.17),(ux*.36,-.33,1.76+uz*.36)]
 mesh=bpy.data.meshes.new('Jaw');mesh.from_pydata(verts,[],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(0,3,2,1)]);mesh.update();o=bpy.data.objects.new('Radial jaw',mesh);scene.collection.objects.link(o);finish(o,'Radial jaw',inner,'Head')
 tube('Jaw spine',(ux*.15,-.13,1.76+uz*.15),(ux*.57,-.12,1.76+uz*.57),.043,bone,'Head',.01)
 for j in range(4):
  r=.23+j*.065
  for edge in [-1,1]:
   x=ux*r-uz*.08*edge;z=1.76+uz*r+ux*.08*edge
   tube('Inward tooth',(x,-.25,z),(x-ux*.075,-.36,z-uz*.075),.025,bone,'Head',0)
for side,s in [('L',1),('R',-1)]:
 tube('Long upper arm',(s*.27,0,1.45),(s*.63,.04,1.16),.09,hide,'UpperArm.'+side,.065)
 tube('Blade forearm',(s*.63,.04,1.16),(s*.52,-.18,.67),.075,bone,'LowerArm.'+side,.032)
 for j in [-1,0,1]:tube('Hook fingers',(s*.52+j*.04,-.18,.7),(s*.55+j*.065,-.30,.50),.028,bone,'Hand.'+side,0)
 tube('Rear insect femur',(s*.21,.13,1.2),(s*.64,.46,1.5),.07,hide,'Chest',.045)
 tube('Rear insect tibia',(s*.64,.46,1.5),(s*.87,.15,.86),.045,bone,'Chest',.012)
 tube('Digitigrade thigh',(s*.16,.07,.91),(s*.29,.23,.53),.10,hide,'UpperLeg.'+side,.055)
 tube('Digitigrade shin',(s*.29,.23,.53),(s*.24,-.06,.12),.055,bone,'LowerLeg.'+side,.03)
 for j in [-1,1]:tube('Splayed toes',(s*.24,-.06,.12),(s*.24+j*.085,-.26,.025),.035,bone,'Foot.'+side,0)
# Mutation mesh prefixes are the runtime visibility groups.
def tag(start,key):
 for o in current[start:]:o.name='mutation_'+key+'__'+o.name
for key in ['crusher','tentacles','mantis','thermal','antennae','echo','plates','veil','sacs','leaper','scent','insulation']:
 start=len(current)
 if key=='leaper':
  for side,s in [('L',1),('R',-1)]:
   ico('Coiled spring haunch',(s*.25,.18,.64),(.21,.25,.31),hide,'UpperLeg.'+side)
   tube('Heel spur',(s*.25,.16,.25),(s*.25,.48,.12),.055,bone,'LowerLeg.'+side,0)
 elif key=='scent':
  for s in [-1,1]:tube('Chemosensory feeler',(s*.12,-.16,1.57),(s*.25,-.53,1.45),.055,inner,'Head',.015)
 elif key=='insulation':
  for z in [.98,1.16,1.34]:ico('Heat resistant mantle',(0,.22,z),(.32,.25,.18),rust,'Chest')
 elif key=='crusher':
  for side,s in [('L',1),('R',-1)]:
   ico('Hypertrophic shoulder',(s*.39,0,1.39),(.25,.22,.25),hide,'UpperArm.'+side)
   ico('Pry claw',(s*.57,-.13,.88),(.19,.17,.28),bone,'LowerArm.'+side)
 elif key=='tentacles':
  for i in range(4):
   s=-1 if i<2 else 1;y=.06+(i%2)*.23
   points=[(s*.13,y,.92),(s*.35,y,.61),(s*.56,y-.08,.32),(s*.65,y-.3,.15),(s*.54,y-.4,.23)]
   for j in range(4):tube('Flexible vent tendril',points[j],points[j+1],.095-j*.018,hide,'Hips',.077-j*.018)
   for j in range(3):ico('Sucker',(s*(.35+j*.10),y-.13,.61-j*.15),(.048,.025,.045),inner,'Hips')
 elif key=='mantis':
  for s in [-1,1]:
   tube('Ceiling hook strut',(s*.25,.19,1.39),(s*.61,.3,1.94),.065,hide,'Chest',.04)
   tube('Ceiling hook',(s*.61,.3,1.94),(s*.81,-.11,1.70),.04,bone,'Chest',0)
 elif key=='thermal':
  for s in [-1,1]:ico('Heat pit',(s*.24,-.19,1.67),(.11,.045,.07),glass,'Head')
 elif key=='antennae':
  for s in [-1,1]:
   tube('Antenna stalk',(s*.12,.09,1.86),(s*.28,.1,2.32),.025,hide,'Head',.01)
   for j in range(5):tube('Sensory comb',(s*(.15+j*.025),.1,1.94+j*.07),(s*(.26+j*.025),.1,1.97+j*.07),.012,bone,'Head',0)
 elif key=='echo':
  for s in [-1,1]:ico('Resonating fan',(s*.34,.09,1.66),(.18,.10,.29),inner,'Head')
 elif key=='plates':
  for z in [1.05,1.25,1.45]:ico('Armour shield',(0,.29,z),(.37,.17,.18),bone,'Chest')
 elif key=='veil':
  for s in [-1,1]:ico('Chromatophore membrane',(s*.22,.16,1.32),(.15,.19,.40),flesh,'Chest')
 elif key=='sacs':
  for s in [-1,1]:
   for z in [1.02,1.21,1.40]:ico('Pressure bladder',(s*.24,.26,z),(.15,.18,.14),inner,'Chest')
 tag(start,key)
arm=rig(True);export('specimen-v3',arm)
# Two-character art review.
for name,objects in assets.items():
 for o in objects:
  o.hide_render=o.name.startswith('mutation_');o.hide_set(False)
  if not o.parent:o.location.x+=(-1 if name=='ozk-v3' else .9)
box('Floor',(0,0,-.1),(6,4,.15),mat('Studio charcoal',(.045,.052,.045)))
for loc,energy,size in [((-3,-4,6),950,4),((3,-2,4),650,3),((0,3,5),1100,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-8,3.2));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.05))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.4;scene.camera=cam
scene.render.filepath=os.path.join(OUT,'character-review.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'red-core-characters-v3.blend'),copy=True)
print('Exported bulky hazmat engineer and radial-jaw insect specimen with nine mutation groups.')
