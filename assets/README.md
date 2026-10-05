# assets/ — rigged GLB drops

Put Blender exports here (Y-up, applied transforms):
- `ozk.glb` — identical OZK suit, single humanoid armature (Crew + Saboteur share it)
- `specimen.glb` — Specimen-09 (humanoid armature, same bone names + jaw/spine extras ok)

Spec: `../docs/RIG_SPEC.md`. Validator: `../tools/check-rig.mjs`.
Loader `../src/rig.js` falls back to capsule proxy when missing/invalid.
