import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Combine static geometry by material, preserving animated doors, fans and glass.
export function batchStatic(scene){
 scene.updateMatrixWorld(true);const groups=new Map();
 scene.traverse(mesh=>{
  if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.transparent)return;
  for(let node=mesh;node&&node!==scene;node=node.parent)if(node.userData.dynamic)return;
  const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(key))geometry.deleteAttribute(key);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
  if(!groups.has(mesh.material))groups.set(mesh.material,[]);groups.get(mesh.material).push({mesh,geometry});
 });
 for(const [material,entries] of groups){
  if(entries.length<2){entries[0].geometry.dispose();continue;}
  const geometry=mergeGeometries(entries.map(e=>e.geometry));
  const batch=new THREE.Mesh(geometry,material);batch.name='static-batch';scene.add(batch);
  for(const {mesh,geometry} of entries){mesh.removeFromParent();geometry.dispose();}
 }
}
export function lightSelector(scene,limit=10){
 const lights=[];scene.traverse(node=>{if(node.isPointLight)lights.push(node);});
 return position=>{
  const ranked=lights.map(light=>({light,score:light.intensity/(1+light.position.distanceToSquared(position))})).sort((a,b)=>b.score-a.score);
  for(let i=0;i<ranked.length;i++)ranked[i].light.visible=i<limit;
 };
}
