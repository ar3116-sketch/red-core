import {dressShelves} from './shelf-dressing.js';
import * as THREE from 'three';
import {ROOMS} from '../shared/world.js';
import {toolMaterials} from './tool-models.js';
export function addWorldDetail(scene){
 const m=toolMaterials();
 function box(w,h,d,x,y,z,mat=m.steel){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);a.position.set(x,y,z);scene.add(a);return a;}
 function tube(a,b,r=.02,mat=m.dark){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),mat);o.position.copy(start).add(end).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());scene.add(o);return o;}
 function label(text,x,y,z,w=.6){const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');g.fillStyle='#b8ae86';g.fillRect(0,0,128,32);g.fillStyle='#343b2b';g.font='bold 12px monospace';g.fillText(text,5,20);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshLambertMaterial({map:t}));o.position.set(x,y,z);scene.add(o);}
 dressShelves(scene);
 for(const [i,r] of ROOMS.entries()){
  // Wall conduits connect to junction boxes, with clipped cables and dirty drain pans.
  const x=r.x-3.4,z=r.z+4.76;
  box(.60,.72,.12,x,1.6,z,m.dark);box(.50,.62,.025,x,1.6,z-.08,m.steel);
  for(let k=0;k<4;k++){box(.035,.035,.02,x-.20+(k%2)*.4,1.35+Math.floor(k/2)*.50,z-.10,m.red);}
  label('86 / '+(i+1),x,1.66,z-.102,.39);
  for(let k=0;k<3;k++){tube([x-.18+k*.18,1.98,z],[x-.18+k*.18,2.85,z],.016,m.dark);tube([x-.18+k*.18,2.85,z],[r.x+2.1,2.85+k*.045,z],.014,k===1?m.red:m.dark);}
  for(let k=0;k<4;k++)box(.09,.13,.10,x+.7+k*.85,2.9,z,m.steel);
  // Floor grime and repair tape stay flat and cannot obstruct movement.
  for(let k=0;k<5;k++){const patch=box(.2+(k%3)*.18,.003,.09+(k%2)*.09,r.x-3.3+k*.38,.005,r.z+3.25+(i%2)*.35,m.dark);patch.rotation.y=k*.7;}
  box(.55,.006,.032,r.x+3,.009,r.z+2.8,m.paper);box(.032,.006,.5,r.x+3.25,.01,r.z+3,m.paper);
 }
 // Dense service conduits follow the tall core walls and sewer galleries.
 for(const x of [-7.7,7.7])for(let k=0;k<4;k++)tube([x,2.8+k*.28,-16],[x,2.8+k*.28,-28],.045,k%2?m.red:m.steel);
 for(const x of [-17.72,17.72])for(let k=0;k<3;k++){
  tube([x,.5+k*.3,10],[x,.5+k*.3,35],.08,k===1?m.red:m.dark);
  for(const z of [11,17,24,30,35]){const collar=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.10,8),m.steel);collar.rotation.x=Math.PI/2;collar.position.set(x,.5+k*.3,z);scene.add(collar);}
 }
 // Camera tape reels and incinerator ash tiles provide local landmarks.
 for(const z of [-2.7,-1.8,-.9]){const reel=new THREE.Mesh(new THREE.TorusGeometry(.14,.025,4,12),m.paper);reel.position.set(-22.75,1.6,z);reel.rotation.y=Math.PI/2;scene.add(reel);}
 for(let i=0;i<8;i++)box(.1,.012,.16,20.1+(i%4)*.32,.014,-8.8+Math.floor(i/4)*.14,m.dark);
}
