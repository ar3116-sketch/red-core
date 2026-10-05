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
// Only the strongest nearby lights are switched on (shader cost). Swaps fade instead of snapping,
// and a light already on keeps its slot until it drops well down the ranking.
export function lightSelector(scene,limit=12){
 const lights=[];scene.traverse(node=>{if(node.isPointLight)lights.push(node);});
 const fade=new Map(lights.map(l=>[l,0])),base=new Map();let last=performance.now();
 return position=>{
  const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
  const ranked=lights.map(light=>({light,score:light.intensity/(1+light.position.distanceToSquared(position))*(light.visible?1.6:1)})).sort((a,b)=>b.score-a.score);
  for(let i=0;i<ranked.length;i++){
   const l=ranked[i].light,want=i<limit;
   // Remember the intensity animation code set this frame before we scale it.
   if(!base.has(l)||l.userData.scaled!==l.intensity)base.set(l,l.intensity);
   const f=Math.max(0,Math.min(1,fade.get(l)+(want?dt*3:-dt*3)));fade.set(l,f);
   l.visible=f>0;l.intensity=base.get(l)*f;l.userData.scaled=l.intensity;
  }
 };
}
