import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {PLAYER_RADIUS,SOLIDS,PROP_LAYOUT,ROOMS,DOORS,isWalkable,moveWithCollisions} from '../shared/world.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} != ${b}`);
const stopped=moveWithCollisions({x:0,z:2},0,-20);near(stopped.z,-8+.61+PLAYER_RADIUS);assert.ok(isWalkable(stopped.x,stopped.z));
const along=moveWithCollisions(stopped,2,-2);assert.ok(along.x>1.9);assert.ok(along.z<stopped.z-.2);
const doorway=moveWithCollisions({x:0,z:2},0,-8);near(doorway.z,-6);
const around=moveWithCollisions(moveWithCollisions(doorway,2,0),0,-7);assert.ok(around.z<-12.9);
const wall=moveWithCollisions({x:4,z:2},3,0);near(wall.x,5-.11-PLAYER_RADIUS);
const through=moveWithCollisions({x:4,z:0},2,0);near(through.x,6);
const recovered=moveWithCollisions({x:0,z:-8},0,0);assert.ok(isWalkable(recovered.x,recovered.z));
// Physical flood fill includes player radius, furniture and door clearance.
const queue=[{x:0,z:2}],visited=new Set(['0,2']);
for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]) {
 const p={x:queue[i].x+dx,z:queue[i].z+dz},key=`${p.x},${p.z}`;
 if(!visited.has(key)&&isWalkable(p.x,p.z)){visited.add(key);queue.push(p);}
}
for(const room of ROOMS)assert.ok(visited.has(`${room.x},${room.z}`),`${room.name} unreachable`);
for(const removed of DOORS){const reached=new Set(['control']);for(let i=0;i<6;i++)for(const d of DOORS.filter(d=>d!==removed)){if(reached.has(d.a))reached.add(d.b);if(reached.has(d.b))reached.add(d.a);}assert.equal(reached.size,6,'Layout must have alternate routes');}
// Every rendered prop fits inside its shared collision footprint, including rotation.
for(const [i,p] of PROP_LAYOUT.entries()) {
 const file={door:'blast-door',filter:'filter-canister'}[p.type]||p.type;
 const buffer=readFileSync(new URL(`../assets/${file}.glb`,import.meta.url));
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 const bounds=new THREE.Box3();
 const placement=new THREE.Matrix4().compose(new THREE.Vector3(p.x,0,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.yaw),new THREE.Vector3(1,1,1));
 function visit(id,parent) {
  const node=gltf.nodes[id];const local=node.matrix?new THREE.Matrix4().fromArray(node.matrix):new THREE.Matrix4().compose(new THREE.Vector3(...(node.translation||[0,0,0])),new THREE.Quaternion(...(node.rotation||[0,0,0,1])),new THREE.Vector3(...(node.scale||[1,1,1])));
  const world=parent.clone().multiply(local);
  if(node.mesh!==undefined)for(const primitive of gltf.meshes[node.mesh].primitives){const a=gltf.accessors[primitive.attributes.POSITION];bounds.union(new THREE.Box3(new THREE.Vector3(...a.min),new THREE.Vector3(...a.max)).applyMatrix4(world));}
  for(const child of node.children||[])visit(child,world);
 }
 for(const node of gltf.scenes[gltf.scene||0].nodes)visit(node,placement);
 const collider=SOLIDS.find(s=>s.id===`${p.type}-${i}`);
 for(const axis of ['X','Z']){const key=axis.toLowerCase();assert.ok(collider['min'+axis]<=bounds.min[key]+.015,`${collider.id} min${axis}: collider ${collider['min'+axis]} model ${bounds.min[key]}`);assert.ok(collider['max'+axis]>=bounds.max[key]-.015,`${collider.id} max${axis}: collider ${collider['max'+axis]} model ${bounds.max[key]}`);}
}
let seed=86;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
// Falls through intentional openings are valid; advance gravity and validate airspace too.
let point={x:0,z:2};
for(let i=0;i<10000;i++){point=moveWithCollisions(point,(random()-.5)*1.8,(random()-.5)*1.8,undefined,undefined,.1);assert.ok(isWalkable(point.x,point.z,undefined,undefined,point.y,true),JSON.stringify(point));}
console.log('Passed: all six rooms reachable, two connected loops, interior walls and doorways, console stop, edge sliding, route around console, pipes, overlap recovery, all rendered prop bounds, 10,000 collision-free movements.');
