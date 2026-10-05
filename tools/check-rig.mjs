// node tools/check-rig.mjs assets/ozk.glb — validates rig without Blender.
import { readFileSync, existsSync } from 'fs';
const f = process.argv[2];
if (!f || !existsSync(f)) { console.log('RIG-CHECK: file missing -> capsule fallback will be used'); process.exit(2); }
const buf = readFileSync(f);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
const skins = json.skins || [];
const joints = skins.reduce((n, s) => n + (s.joints?.length || 0), 0);
const meshes = json.meshes || [];
let skinIdx = 0, skinWt = 0;
for (const m of meshes) for (const p of m.primitives || []) {
  if (p.attributes?.JOINTS_0 !== undefined) skinIdx++;
  if (p.attributes?.WEIGHTS_0 !== undefined) skinWt++;
}
const anims = (json.animations || []).length;
const ok = skins.length > 0 && joints >= 15 && skinIdx > 0 && skinWt > 0;
console.log(`RIG-CHECK ${f}: skins=${skins.length} joints=${joints} prims(J/W)=${skinIdx}/${skinWt} anims=${anims} -> ${ok ? 'PASS' : 'FAIL'}`);
if (anims === 0) console.log('WARN: no animations (T-pose only, ok for M0)');
process.exit(ok ? 0 : 1);
