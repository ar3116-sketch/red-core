# RIG SPEC — RED CORE humanoids (OZK suit + Specimen-09)

Goal: every human model reuses one animation set. Anonymity requires Crew =
Saboteur skeleton.

## Armature (Blender, minimum 15 bones, Mixamo-compatible names)
Hips > Spine > Chest > Neck > Head
Chest > UpperArm.L > LowerArm.L > Hand.L (mirror .R)
Hips > UpperLeg.L > LowerLeg.L > Foot.L (mirror .R)

Specimen-09 may add: Jaw, SpineExtra, Claw.L/R — loader ignores extras.

## Skinning
- Every mesh has Armature modifier, vertex groups match bone names.
- Normalize All Weights, max 4 influences/vert (mobile + 320x240 perf).
- No unweighted verts. Origin at feet, ~1.8m tall, facing -Z, Y-up.

## Export (Blender 4.5 → glTF 2.0 .glb)
- Apply Location/Rotation/Scale (Ctrl+A).
- Export: Y-up, -Z forward, Apply Modifiers, Include Skin + Animations.
- Clips: `idle`, `walk`, `run` (or at least T-pose + idle). 30fps.
- Budget: <5k tris, 1 material, 1024px texture max.

## Validation
`node tools/check-rig.mjs assets/ozk.glb` must print PASS:
joints>=15, JOINTS_0+WEIGHTS_0 present, animations>=1 (warn ok).
`src/rig.js` re-validates at runtime and keeps capsule fallback.
