import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const REQUIRED = ['Hips', 'Spine', 'Chest', 'Neck', 'Head',
  'UpperArm.L', 'UpperArm.R', 'LowerArm.L', 'LowerArm.R',
  'UpperLeg.L', 'UpperLeg.R', 'LowerLeg.L', 'LowerLeg.R', 'Foot.L', 'Foot.R'];

export function checkRig(gltf) {
  const bones = new Set();
  gltf.scene.traverse(o => { if (o.isBone) bones.add(o.name); });
  const missing = REQUIRED.filter(b => ![...bones].some(n => n.toLowerCase() === b.toLowerCase()));
  let skinned = 0, unweighted = 0;
  gltf.scene.traverse(o => {
    if (o.isSkinnedMesh) {
      skinned++;
      const j = o.geometry.getAttribute('skinIndex');
      const w = o.geometry.getAttribute('skinWeight');
      if (!j || !w) unweighted++;
    }
  });
  const anims = gltf.animations?.length || 0;
  return { bones: bones.size, missing, skinned, unweighted, anims,
    ok: missing.length === 0 && skinned > 0 && unweighted === 0 };
}

// Loads /assets/<name>.glb, returns {group, mixer} or null (caller keeps capsule).
export async function loadRigged(name, onStatus) {
  try {
    const gltf = await new GLTFLoader().loadAsync(`/assets/${name}.glb`);
    const r = checkRig(gltf);
    onStatus?.(`${name}: bones=${r.bones} anims=${r.anims} ${r.ok ? 'RIG-OK' : 'RIG-BAD:' + r.missing.join(',')}`);
    if (!r.ok) return null;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const idle = gltf.animations.find(a => /idle/i.test(a.name)) || gltf.animations[0];
    if (idle) mixer.clipAction(idle).play();
    return { group: gltf.scene, mixer };
  } catch (e) {
    onStatus?.(`${name}: missing, capsule fallback`);
    return null;
  }
}
