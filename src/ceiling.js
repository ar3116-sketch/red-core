import * as THREE from 'three';
export function industrialMetal(seed=86,repeat=4){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const g=canvas.getContext('2d');let value=seed;
 const random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
 g.fillStyle='#515748';g.fillRect(0,0,64,64);
 for(let x=0;x<64;x+=8){g.fillStyle='#353d33';g.fillRect(x,0,2,64);g.fillStyle='#737969';g.fillRect(x+3,0,2,64);}
 for(let i=0;i<650;i++){g.fillStyle=random()<.5?'rgba(10,18,12,.23)':'rgba(201,197,159,.18)';g.fillRect(Math.floor(random()*64),Math.floor(random()*64),1+Math.floor(random()*3),1);}
 for(let i=0;i<8;i++){g.fillStyle=i%2?'#3a352889':'#22372980';g.fillRect(Math.floor(random()*64),Math.floor(random()*40),3+Math.floor(random()*8),15+Math.floor(random()*26));}
 g.fillStyle='#252d25';g.fillRect(0,0,64,2);g.fillRect(0,62,64,2);
 const map=new THREE.CanvasTexture(canvas);map.magFilter=map.minFilter=THREE.NearestFilter;map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(repeat,repeat);
 return new THREE.MeshLambertMaterial({map});
}
export function dressCeiling(scene,{box,steel,rust,dark},x,z,w=10,d=10,y=3.5){
 const foil=industrialMetal(194+x*31+z,2);
 function pipe(a,b,r){const direction=new THREE.Vector3().subVectors(b,a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),8),foil);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());scene.add(mesh);}
 // Structural bays remain above head height; beams carry the equipment beneath.
 for(let i=-1;i<=1;i++){box(w-.25,.17,.12,x,y-.18,z+i*d*.3,rust);box(.12,.17,d-.25,x+i*w*.3,y-.18,z,steel);}
 for(const side of [-1,1]){
  const px=x+side*w*.28,py=y-.48,r=w>10?.40:.24;
  pipe(new THREE.Vector3(px,py,z-d*.46),new THREE.Vector3(px,py,z+d*.46),r);
  for(let dz=-d*.4;dz<d*.46;dz+=1.8){
   const band=new THREE.Mesh(new THREE.TorusGeometry(r+.018,.022,4,8),steel);band.position.set(px,py,z+dz);scene.add(band);
   box(.045,.4,.045,px,py+.3,z+dz,dark);
   box(r*2+.15,.055,.09,px,py-r-.035,z+dz,rust);
  }
 }
 const elbow=new THREE.CatmullRomCurve3([new THREE.Vector3(x-w*.28,y-.48,z+d*.27),new THREE.Vector3(x-w*.18,y-.48,z+d*.37),new THREE.Vector3(x,y-.48,z+d*.37),new THREE.Vector3(x+w*.28,y-.48,z+d*.37)]);
 scene.add(new THREE.Mesh(new THREE.TubeGeometry(elbow,10,w>10?.32:.19,6,false),foil));
 // Narrow conduit bundles and junction boxes break up the overhead silhouette.
 for(let i=0;i<3;i++)box(w*.45,.035,.035,x,y-.31,z-d*.35+i*.1,i%2?dark:rust);
 box(.46,.16,.52,x+w*.16,y-.3,z-d*.35,steel);
}
