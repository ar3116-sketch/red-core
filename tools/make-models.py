import bpy, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
OUT = os.path.abspath(OUT)
os.makedirs(OUT, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

def build_armature(extra_jaw=False):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 1.0))
    arm = bpy.context.active_object
    arm.name = "OZK_Armature"
    eb = arm.data.edit_bones
    root = eb[0]
    root.name = "Hips"
    root.head = (0, 0, 1.0); root.tail = (0, 0, 1.12)
    def add(name, head, tail, parent="Hips"):
        b = eb.new(name)
        b.head = head; b.tail = tail
        b.parent = eb[parent]
        return b
    add("Spine", (0,0,1.12), (0,0,1.32), "Hips")
    add("Chest", (0,0,1.32), (0,0,1.50), "Spine")
    add("Neck", (0,0,1.50), (0,0,1.58), "Chest")
    add("Head", (0,0,1.58), (0,0,1.80), "Neck")
    for s, sx in (("L", 1), ("R", -1)):
        add(f"UpperArm.{s}", (0.10*sx,0,1.47), (0.34*sx,0,1.47), "Chest")
        add(f"LowerArm.{s}", (0.34*sx,0,1.47), (0.54*sx,0,1.47), f"UpperArm.{s}")
        add(f"Hand.{s}", (0.54*sx,0,1.47), (0.64*sx,0,1.47), f"LowerArm.{s}")
        add(f"UpperLeg.{s}", (0.09*sx,0,1.0), (0.09*sx,0,0.55), "Hips")
        add(f"LowerLeg.{s}", (0.09*sx,0,0.55), (0.09*sx,0,0.14), f"UpperLeg.{s}")
        add(f"Foot.{s}", (0.09*sx,0,0.14), (0.09*sx,0.16,0.05), f"LowerLeg.{s}")
    if extra_jaw:
        add("Jaw", (0,0.08,1.62), (0,0.14,1.56), "Head")
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm

def box(name, loc, scale, mat=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    if mat:
        o.data.materials.append(mat)
    return o

def build_body(mat, specimen=False):
    parts = []
    parts.append(box("Torso", (0, 0, 1.31), (0.36, 0.22, 0.20), mat))
    parts.append(box("Head_", (0, 0, 1.69), (0.11, 0.11, 0.11), mat))
    parts.append(box("Visor", (0, 0.09, 1.70), (0.07, 0.03, 0.05)))
    for sx in (1, -1):
        parts.append(box(f"ArmU_{sx}", (0.22*sx, 0, 1.47), (0.13, 0.07, 0.07), mat))
        parts.append(box(f"ArmL_{sx}", (0.44*sx, 0, 1.47), (0.11, 0.06, 0.06), mat))
        parts.append(box(f"LegU_{sx}", (0.09*sx, 0, 0.78), (0.08, 0.09, 0.23), mat))
        parts.append(box(f"LegL_{sx}", (0.09*sx, 0, 0.35), (0.07, 0.08, 0.21), mat))
        parts.append(box(f"Boot_{sx}", (0.09*sx, 0.04, 0.07), (0.08, 0.12, 0.07), mat))
    if specimen:
        for i, sx in enumerate((1, -1, 1, -1)):
            bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.18, location=(0.12*sx, -0.05, 1.45 - i*0.08))
            s = bpy.context.active_object
            s.name = f"Spike_{i}"
            s.rotation_euler[2] = 1.2 * sx
            bpy.ops.object.transform_apply(rotation=True)
            s.data.materials.append(mat)
            parts.append(s)
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    body = bpy.context.active_object
    body.name = "Body"
    return body

def material(name, color):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    return m

def skin_and_animate(arm, body, clip_name="idle", swing=0.08):
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    # animation
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    act = bpy.data.actions.new(clip_name)
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = act
    scn = bpy.context.scene
    scn.render.fps = 30
    scn.frame_start = 1; scn.frame_end = 30
    import mathutils
    targets = [b for b in ("UpperArm.L", "UpperArm.R", "UpperLeg.L", "UpperLeg.R", "Chest") if b in arm.pose.bones]
    for f in (1, 15, 30):
        k = math.sin((f - 1) / 29 * 2 * math.pi)
        for b in targets:
            pb = arm.pose.bones[b]
            axis = 'Y' if 'Arm' in b else 'X'
            ang = swing * k * (-1 if b.endswith('.R') else 1)
            e = mathutils.Euler((ang if axis == 'X' else 0, ang if axis == 'Y' else 0, 0), 'XYZ')
            pb.rotation_quaternion = e.to_quaternion()
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
    for fc in act.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
    bpy.ops.object.mode_set(mode='OBJECT')

def export(path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB',
        use_selection=False, export_apply=True, export_skins=True,
        export_animations=True, export_morph=False)

def make(name, color, specimen=False):
    clear()
    mat = material(name + "_Mat", color)
    arm = build_armature(extra_jaw=specimen)
    body = build_body(mat, specimen=specimen)
    skin_and_animate(arm, body, clip_name="idle", swing=0.12 if specimen else 0.07)
    # walk clip: retarget same rig by duplicating action with bigger swing
    export(os.path.join(OUT, name + ".glb"))
    print("WROTE", os.path.join(OUT, name + ".glb"))

make("ozk", (0.29, 0.35, 0.23))
make("specimen", (0.10, 0.35, 0.38), specimen=True)
