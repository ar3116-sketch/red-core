import * as THREE from 'three';
let materials;
export function toolMaterials(){
 if(materials)return materials;
 function paint(color,seed){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,32,32);let n=seed;for(let i=0;i<180;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;g.fillStyle=i%3?'#080d0833':'#e7dab433';g.fillRect(n%32,(n>>>9)%32,1+(n%3),1);}const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshLambertMaterial({map:t,flatShading:true});}
 return materials={steel:paint('#7a8170',86),red:paint('#824a34',9),rope:paint('#a09769',17),dark:paint('#303c2e',11),paper:paint('#b4b08c',28)};
}
export function makeTool(kind){
 const g=new THREE.Group(),m=toolMaterials();
 const box=(w,h,d,x,y,z,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);g.add(mesh);return mesh;};
 if(kind==='wrench'){
  box(.055,.30,.035,0,0,0,m.red);box(.045,.18,.04,0,.17,0,m.steel);
  for(let i=0;i<5;i++)box(.058,.012,.04,0,-.1+i*.037,0,m.dark);
  box(.12,.048,.055,-.028,.27,0,m.steel);box(.04,.10,.055,.045,.30,0,m.steel);box(.09,.035,.055,-.008,.355,0,m.steel);
  for(let i=0;i<5;i++){box(.016,.009,.06,-.05+i*.018,.29,0,m.dark);box(.014,.009,.06,-.035+i*.018,.337,0,m.dark);}
  const screw=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.075,8),m.dark);screw.rotation.z=Math.PI/2;screw.position.set(0,.20,0);g.add(screw);
  for(let i=0;i<4;i++)box(.014,.049,.054,-.03+i*.02,.20,0,m.steel);
  box(.06,.06,.042,0,-.07,0,m.paper);
 }else{
  for(let i=0;i<6;i++){const loop=new THREE.Mesh(new THREE.TorusGeometry(.115+i*.008,.012,4,16),m.rope);loop.position.z=(i%2)*.022;g.add(loop);}
  for(const x of [-.10,.10])box(.025,.10,.095,x,0,.01,m.dark);
  const end=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.18,5),m.rope);end.position.set(.13,-.15,0);end.rotation.z=-.4;g.add(end);
  const hook=new THREE.Mesh(new THREE.TorusGeometry(.038,.009,4,8,Math.PI*1.7),m.steel);hook.position.set(.16,-.26,0);g.add(hook);
  box(.075,.055,.018,0,.14,.04,m.paper);
 }
 return g;
}
