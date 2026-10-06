import * as THREE from 'three';
import {WASTE_RACK,WASTE_HOPPER,WASTE} from '../shared/waste.js';

// Radwaste canisters: yellow drums with a trefoil, a rack of them by the reactor core, and the
// hopper on the incinerator's flank. Dropped canisters lie where they fell until someone lifts them.
const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t;};
const trefoil=(g,cx,cy,r,fg)=>{g.fillStyle=fg;for(let k=0;k<3;k++){const a=-Math.PI/2+k*Math.PI*2/3;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,r,a-.5,a+.5);g.closePath();g.fill();}g.beginPath();g.arc(cx,cy,r*.22,0,7);g.fill();};
const drumTex=tex(64,32,(g,w,h)=>{g.fillStyle='#c9a032';g.fillRect(0,0,w,h);g.fillStyle='#1b1a14';g.fillRect(0,3,w,2);g.fillRect(0,h-5,w,2);g.fillStyle='#d9c48a';g.fillRect(18,8,28,16);trefoil(g,32,16,7,'#1b1a14');for(let i=0;i<30;i++){g.fillStyle=`rgba(60,40,10,${Math.random()*.25})`;g.fillRect(Math.random()*w,Math.random()*h,2,1+Math.random()*3);}});
const drumMat=new THREE.MeshLambertMaterial({map:drumTex}),capMat=new THREE.MeshLambertMaterial({color:0x8a7428});
export function makeCanister(scale=1){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.5,12),[drumMat,capMat,capMat]);body.position.y=.25;g.add(body);
 for(const y of [.06,.44]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.172,.012,4,12),capMat);rim.rotation.x=Math.PI/2;rim.position.y=y;g.add(rim);}
 const lid=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.03,8),new THREE.MeshLambertMaterial({color:0x2a2a22}));lid.position.y=.515;g.add(lid);
 g.scale.setScalar(scale);return g;
}
export function createWasteView(scene){
 const steel=new THREE.MeshLambertMaterial({color:0x5d6356}),dark=new THREE.MeshLambertMaterial({color:0x24261f});
 const box=(w,h,d,m,x,y,z,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
 // Rack on the core's east wall, three canisters standing in a row.
 const rack=new THREE.Group();rack.position.set(WASTE_RACK.x,0,WASTE_RACK.z);rack.userData.dynamic=true;scene.add(rack);
 for(const dz of [-1.0,1.0])box(.06,1.5,.06,steel,-.35,.75,dz,rack);
 box(.5,.06,2.1,steel,-.2,.03,0,rack);box(.5,.05,2.1,steel,-.2,.62,0,rack);box(.06,.06,2.1,steel,-.42,1.45,0,rack);
 const plate=new THREE.Mesh(new THREE.PlaneGeometry(.9,.32),new THREE.MeshLambertMaterial({map:tex(96,32,(g,w,h)=>{g.fillStyle='#c9a032';g.fillRect(0,0,w,h);trefoil(g,16,16,11,'#1b1a14');g.fillStyle='#1b1a14';g.font='bold 9px monospace';g.fillText('РАДИОАКТИВНЫЕ',32,13);g.fillText('ОТХОДЫ',32,25);})}));
 plate.position.set(-.04,1.25,0);plate.rotation.y=-Math.PI/2;rack.add(plate);
 const slots=[-.65,0,.65].map(dz=>{const c=makeCanister();c.position.set(-.2,.06,dz);rack.add(c);return c;});
 // Hopper bolted to the furnace's west flank: a steel mouth with a hazard rim and an open lid.
 const hop=new THREE.Group();hop.position.set(WASTE_HOPPER.x,0,WASTE_HOPPER.z);hop.rotation.y=WASTE_HOPPER.rot||0;hop.userData.dynamic=true;scene.add(hop);
 box(.7,.9,.9,steel,0,.45,0,hop);box(.72,.08,.92,new THREE.MeshLambertMaterial({map:tex(32,8,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#1b1a14':'#c9a032';g.fillRect(i*4,0,4,h);}})}),0,.92,0,hop);
 box(.5,.04,.7,dark,-.02,.93,0,hop);
 const lid=box(.05,.7,.88,steel,.33,1.28,0,hop);lid.rotation.z=-.25;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(.6,.2),new THREE.MeshLambertMaterial({map:tex(96,32,(g,w,h)=>{g.fillStyle='#1b1a14';g.fillRect(0,0,w,h);trefoil(g,14,16,9,'#c9a032');g.fillStyle='#c9a032';g.font='bold 9px monospace';g.fillText('ОТХОДЫ /',28,13);g.fillText('RADWASTE',28,25);})}));
 sign.position.set(-.352,.6,0);sign.rotation.y=-Math.PI/2;hop.add(sign);
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(.45,.6),new THREE.MeshBasicMaterial({color:0x6a2a10}));glow.rotation.x=-Math.PI/2;glow.position.set(-.02,.935,0);hop.add(glow);
 // Dropped canisters, pooled.
 const drops=[];
 return {update(s,now){
  const n=s?.waste?.rack??WASTE.batch;slots.forEach((c,i)=>c.visible=i<n);
  glow.material.color.setHex(Math.sin(now*.004)>0?0x7a3212:0x5a220c);
  const list=s?.waste?.drops||[];
  while(drops.length<list.length){const c=makeCanister();c.userData.dynamic=true;scene.add(c);drops.push(c);}
  drops.forEach((c,i)=>{const d=list[i];c.visible=!!d;if(d){c.position.set(d.x,d.y,d.z);
   // Lying on its side where it landed, a little turned.
   const h=[...d.id].reduce((a,ch)=>a*31+ch.charCodeAt(0),7);c.rotation.set(Math.PI/2,0,h%6);c.position.y=d.y+.17;}});
 }};
}
