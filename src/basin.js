import * as THREE from 'three';
export function buildBasin(scene,{box,roomSign,steel,dark,rust,coolant,hazard}){
 const concrete=new THREE.MeshLambertMaterial({color:0x414c40});
 box(6,.25,7,6,-5.5,27.5,concrete);
 for(const x of [3,9])box(.3,2.9,7.3,x,-4,27.5,concrete);
 for(const z of [24,31])box(6.3,2.9,.3,6,-4,z,concrete);
 for(const x of [3,9])box(.34,.08,7.3,x,-2.52,27.5,hazard);
 for(const z of [24,31])box(6.3,.08,.34,6,-2.52,z,hazard);
 const water=new THREE.MeshLambertMaterial({color:0x335f54,transparent:true,opacity:.62,depthWrite:false});box(5.65,.025,6.65,6,-3.35,27.5,water);
 for(let i=0;i<4;i++)for(let j=0;j<5;j++){
  box(.55,1.15,.55,4.2+i*1.2,-4.65,25.1+j*1.2,dark);
  for(let k=0;k<3;k++){const rod=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.8,5),steel);rod.position.set(4.03+i*1.2+k*.17,-3.85,25.1+j*1.2);scene.add(rod);}
 }
 const light=new THREE.PointLight(0x548b70,10,9,1.6);light.position.set(6,-2.9,27.5);scene.add(light);
 // Wall-mounted crane projects over the pool, leaving walking routes unobstructed.
 box(13,.4,.55,11.5,4.2,28,rust);box(.8,.35,.85,6,3.85,28,steel);box(.05,4.4,.05,6,1.5,28,dark);
 const hook=new THREE.Mesh(new THREE.TorusGeometry(.19,.045,4,8,Math.PI*1.5),steel);hook.position.set(6,-.74,28);scene.add(hook);
 roomSign('FUEL STORAGE / KEEP CLEAR',6,-1.9,23.8,Math.PI,'#cdb67b');
 // Lower-basin coolant station has a solid cabinet and front-facing controls.
 box(1.6,1.2,.8,-6,-2.6,28.5,coolant);box(1.75,.15,.9,-6,-1.92,28.5,dark);
 box(1.1,.42,.045,-6,-2.25,28.08,new THREE.MeshBasicMaterial({color:0x617e59}));
 for(const x of [-6.42,-5.58]){const valve=new THREE.Mesh(new THREE.TorusGeometry(.13,.03,4,10),rust);valve.position.set(x,-2.7,28.04);scene.add(valve);}
 roomSign('E / COOLANT FLOW',-6,-1.5,28.05,Math.PI);
}
