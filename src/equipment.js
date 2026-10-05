import * as THREE from 'three';
import {ROOMS} from '../shared/world.js';
export function addMicroscope(scene,x,y,z,{steel,dark,rust}){
 const group=new THREE.Group();group.position.set(x,y,z);scene.add(group);
 function box(w,h,d,x,y,z,m){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 function cylinder(r,h,x,y,z,m,axis='y'){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),m);if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 const enamel=new THREE.MeshLambertMaterial({color:0x8d937c});
 box(.43,.065,.48,0,.04,0,dark);box(.37,.04,.42,0,.085,0,enamel);
 for(const side of [-1,1])box(.065,.035,.3,side*.15,.01,0,dark);
 box(.075,.34,.1,0,.27,.16,enamel);const shoulder=box(.09,.24,.09,0,.51,.10,enamel);shoulder.rotation.x=-.55;
 cylinder(.085,.11,0,.60,-.015,steel);const barrel=cylinder(.052,.25,0,.76,-.07,enamel);barrel.rotation.x=-.28;
 const eye=cylinder(.06,.055,0,.9,-.11,dark);eye.rotation.x=-.28;
 cylinder(.085,.045,0,.56,-.08,dark);for(let i=0;i<3;i++){const a=i*2*Math.PI/3;cylinder(.026,.11,Math.cos(a)*.055,.485,-.08+Math.sin(a)*.055,steel);}
 box(.35,.035,.30,0,.36,-.04,dark);
 box(.16,.008,.07,0,.385,-.07,new THREE.MeshLambertMaterial({color:0x94ac96,transparent:true,opacity:.65}));
 for(const side of [-1,1])box(.025,.012,.13,side*.085,.391,-.04,steel);
 for(const side of [-1,1]){cylinder(.065,.05,side*.10,.40,.14,dark,'x');cylinder(.035,.025,side*.139,.40,.14,rust,'x');}
 cylinder(.055,.04,0,.24,-.06,steel);cylinder(.042,.018,0,.265,-.06,new THREE.MeshBasicMaterial({color:0x8c9e74}));
 return group;
}
export function detailEquipment(scene,{box,pipe,steel,dark,rust,coolant,roomSign}){
 const cream=new THREE.MeshLambertMaterial({color:0x9a987a});
 function cylinder(r,h,x,y,z,m,axis='z'){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),m);if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
 // Field radio: recessed speaker, tuning scale, two knobs, switches and whip aerial.
 box(.78,.43,.33,-10,1.32,2.91,coolant);box(.71,.35,.035,-10,1.32,2.73,dark);
 for(let i=0;i<11;i++)box(.29,.01,.012,-10.17,1.17+i*.026,2.704,steel);
 for(const x of [-9.97,-9.77]){cylinder(.057,.045,x,1.25,2.70,dark);box(.008,.05,.012,x,1.265,2.67,cream);}
 box(.30,.09,.025,-9.85,1.45,2.705,cream);for(let i=0;i<11;i++)box(.006,i%5?.025:.045,.01,-9.99+i*.028,1.45,2.688,dark);box(.008,.074,.015,-9.83,1.45,2.68,rust);
 for(const x of [-10.32,-9.68])for(const y of [1.17,1.48])cylinder(.012,.012,x,y,2.699,steel);
 const aerial=cylinder(.011,.73,-9.72,1.91,3.0,steel,'y');aerial.rotation.z=-.12;box(.06,.08,.06,-9.68,1.58,3,dark);
 for(const x of [-10.3,-9.7])box(.09,.045,.26,x,1.08,2.91,dark);
 // CRT front bezels, separate brightness dials, grille slots and cable tails.
 for(const z of [-3,-1,1]){
  for(const side of [-1,1])box(.08,.85,.035,-21.09,1.5,z+side*.58,steel);
  for(const y of [1.10,1.9])box(.08,.035,1.19,-21.09,y,z,steel);
  for(const y of [1.26,1.52]){cylinder(.047,.065,-21.03,y,z+.48,cream,'x');box(.012,.038,.007,-20.99,y,z+.48,dark);}
  for(let i=0;i<8;i++)box(.03,.015,.20,-21.11,1.22+i*.066,z-.46,dark);
  for(const a of [-1,1])for(const b of [-1,1])cylinder(.015,.015,-21.04,1.5+a*.36,z+b*.54,cream,'x');
  pipe(.018,1,-21.78,.68,z, dark);
 }
 const fans=[];
 for(const [i,room] of ROOMS.entries()){
  // High-mounted fan box with a cage, louvers and conduit; never blocks a doorway.
  const x=room.x+4.78,z=room.z+2.7;
  box(.23,.72,.9,x,2.45,z,dark);
  for(let k=0;k<7;k++)box(.08,.045,.77,x-.14,2.18+k*.086,z,steel);
  for(const a of [-1,1])for(const b of [-1,1])cylinder(.025,.06,x-.18,2.45+a*.3,z+b*.37,rust,'x');
  const fan=new THREE.Group();fan.position.set(x-.135,2.45,z);fan.userData.dynamic=true;scene.add(fan);
  for(let k=0;k<3;k++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.025,.14,.37),rust);blade.rotation.x=k*Math.PI*2/3;fan.add(blade);}fans.push(fan);
  roomSign('VENT / 0'+(i+1),x-.19,3.02,z,-Math.PI/2);
  // Cable tray, suspended brackets and bundles over each working bay.
  box(4,.08,.42,room.x,3.10,room.z+3.8,steel);
  for(let k=0;k<4;k++)box(3.9,.035,.035,room.x,3.18,room.z+3.65+k*.10,k%2?dark:rust);
  for(const side of [-1,1])box(.065,.33,.54,room.x+side*1.5,3.26,room.z+3.8,dark);
  box(.36,.55,.13,room.x+3.4,1.85,room.z+4.8,coolant);
  for(let k=0;k<3;k++)box(.10,.055,.04,room.x+3.4,1.7+k*.14,room.z+4.71,k===0?rust:steel);
  for(let k=0;k<4;k++)cylinder(.012,.015,room.x+3.28+(k%2)*.24,1.63+Math.floor(k/2)*.43,room.z+4.72,cream);
 }
 return {update(dt){for(let i=0;i<fans.length;i++)fans[i].rotation.x+=dt*(i===3?2:4);}};
}
