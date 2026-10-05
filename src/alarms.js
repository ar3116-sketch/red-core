import * as THREE from 'three';
export function buildAlarms(scene){
 const beacons=[];
 for(const [x,y,z] of [[0,2.6,-10],[2.5,2.8,-4.8],[-10,2.8,-14.7],[0,3.2,6],[21,2.8,-14.7]]){
  const material=new THREE.MeshBasicMaterial({color:0x342d1b});const dome=new THREE.Mesh(new THREE.CylinderGeometry(.07,.16,.24,8),material);dome.position.set(x,y,z);scene.add(dome);
  const cage=new THREE.Mesh(new THREE.TorusGeometry(.16,.025,4,8),new THREE.MeshLambertMaterial({color:0x343c2f}));cage.rotation.x=Math.PI/2;cage.position.set(x,y-.08,z);scene.add(cage);
  const light=new THREE.PointLight(0xc88c32,0,7,1.7);light.position.set(x,y-.1,z);scene.add(light);beacons.push({material,light});
 }
 return {update(time,alarm){const active=alarm.id!=='normal',pulse=Math.sin(time*5)>0;for(const b of beacons){b.material.color.setHex(alarm.color).multiplyScalar(active?(pulse?1:.18):.25);b.light.color.setHex(alarm.color);b.light.intensity=active&&pulse?9:0;}}};
}
