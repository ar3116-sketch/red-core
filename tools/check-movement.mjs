import assert from 'node:assert/strict';
import * as THREE from 'three';
import {movementVector} from '../src/movement.js';
// WASD must match the camera's own forward/right axes at every heading.
const camera=new THREE.PerspectiveCamera();camera.rotation.order='YXZ';
for(let yaw=-Math.PI;yaw<=Math.PI;yaw+=Math.PI/12){
 camera.rotation.set(0,yaw,0);camera.updateMatrixWorld();
 const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
 const f=movementVector(yaw,1,0),r=movementVector(yaw,0,1);
 assert.ok(Math.abs(f.x-forward.x)<1e-9&&Math.abs(f.z-forward.z)<1e-9,`W wrong at yaw ${yaw}`);
 assert.ok(Math.abs(r.x-right.x)<1e-9&&Math.abs(r.z-right.z)<1e-9,`D wrong at yaw ${yaw}`);
}
console.log('Passed: W/S and A/D follow the camera axes at 25 headings.');
