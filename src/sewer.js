import * as THREE from 'three';
import {industrialMetal} from './ceiling.js';
import {buildBasin} from './basin.js';
import {lampVoltage} from './flicker.js';
import {DECKS,RAMPS,RAILS,surfaceY} from '../shared/sewer.js';

// The render geometry and walking surfaces share the same measured layout.
export function buildSewer(scene,{box,pipe,roomSign,wall,floor,rust,steel,dark,hazard,glow,coolant}) {
 const lamps=[];
 const tiled=(material,u,v)=>{const m=material.clone();m.map=material.map.clone();m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.map.repeat.set(u,v);return m;};
 // Four slabs leave a genuine recess for the cooling pool.
 for(const [x1,x2,z1,z2] of [[-18,18,5,24],[-18,18,31,37],[-18,3,24,31],[9,18,24,31]])box(x2-x1,.18,z2-z1,(x1+x2)/2,-3.29,(z1+z2)/2,tiled(floor,(x2-x1)/2.5,(z2-z1)/2.5));
 buildBasin(scene,{box,roomSign,steel,dark,rust,coolant,hazard});
 for(const d of DECKS)box(d.maxX-d.minX,.22,d.maxZ-d.minZ,(d.minX+d.maxX)/2,-.11,(d.minZ+d.maxZ)/2,tiled(floor,(d.maxX-d.minX)/2,(d.maxZ-d.minZ)/2));
 for(const r of RAMPS){
  const depth=(r.maxZ-r.minZ)/r.steps;
  for(let i=0;i<r.steps;i++){
   const z=r.minZ+(i+.5)*depth,y=surfaceY(r,z);
   box(r.maxX-r.minX,.20,depth,(r.minX+r.maxX)/2,y-.10,z,floor);
   box(r.maxX-r.minX-.1,.015,.06,(r.minX+r.maxX)/2,y+.008,r.minZ+i*depth+.04,hazard);
  }
 }
 function beam(a,b,r,material){const direction=new THREE.Vector3().subVectors(b,a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),5),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());scene.add(mesh);}
 for(const r of RAILS){
  for(const h of [.48,1.03])beam(new THREE.Vector3(r.x1,r.y+h,r.z1),new THREE.Vector3(r.x2,r.endY+h,r.z2),.038,rust);
  const n=Math.ceil(Math.hypot(r.x2-r.x1,r.z2-r.z1)/2);
  for(let i=0;i<=n;i++){const t=i/n;box(.07,1.07,.07,r.x1+(r.x2-r.x1)*t,r.y+(r.endY-r.y)*t+.535,r.z1+(r.z2-r.z1)*t,steel);}
 }
 for(const x of [-16,16])for(const z of [13,21,29]){
  box(.7,8.2,.7,x,.9,z,tiled(wall,1,5));
  box(.73,.3,.73,x,1.4,z,hazard);
 }
 // Faceted barrel vault: eleven metres from basin floor to crown.
 const vertices=[],uv=[],indices=[];
 for(let i=0;i<=20;i++){const a=Math.PI*i/20;for(const z of [5,37]){vertices.push(Math.cos(a)*18,4+Math.sin(a)*4,z);uv.push(i/2,(z-5)/3);}}
 for(let i=0;i<20;i++){const n=i*2;indices.push(n,n+1,n+2,n+2,n+1,n+3);}
 const vault=new THREE.BufferGeometry();vault.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));vault.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));vault.setIndex(indices);vault.computeVertexNormals();
 const vaultPaint=industrialMetal(861,1);vaultPaint.side=THREE.DoubleSide;scene.add(new THREE.Mesh(vault,vaultPaint));
 for(const z of [6,13,21,29,36]){
  const rib=new THREE.Mesh(new THREE.TorusGeometry(18,.12,4,20,Math.PI),rust);rib.scale.y=4/18;rib.position.set(0,4,z);scene.add(rib);
  for(const x of [-10,10]){
   const bulb=glow.clone();box(.04,2.8,.04,x,5,z,steel);box(1.2,.16,.6,x,3.6,z,dark);box(1,.06,.42,x,3.50,z,(z===13&&x>0)||(z===29&&x<0)?dark:bulb);
   if(!((z===13&&x>0)||(z===29&&x<0))){
    const light=new THREE.PointLight(0xd6a965,11,12,1.65);light.position.set(x,3.2,z);scene.add(light);lamps.push({light,bulb,base:11,seed:z+x,damaged:z===21||z===6});
   }
  }
 }
 for(const x of [-13,13]){
  pipe(.24,31,x,4.8,21,coolant);pipe(.12,31,x+.65,4.8,21,rust);
  for(const z of [8,16,24,32]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.29,.05,4,8),steel);ring.position.set(x,4.8,z);scene.add(ring);}
 }
 // Shallow drainage channel stays walkable; it is visual water, not a fall pit.
 const waterMap=floor.map.clone();waterMap.wrapS=waterMap.wrapT=THREE.RepeatWrapping;waterMap.repeat.set(2,9);
 const water=new THREE.MeshLambertMaterial({map:waterMap,color:0x4c8471,transparent:true,opacity:.85});
 box(4.5,.015,23,0,-3.18,21,water);
 for(const x of [-6,6])for(const z of [13,25,34]){
  box(.32,.2,.25,x,-2.4,z,new THREE.MeshBasicMaterial({color:0x527f66}));
  const light=new THREE.PointLight(0x638c70,6,8,1.7);light.position.set(x,-1.7,z);scene.add(light);
 }
 for(const x of [-5]){
  box(2,.3,3,x,-3.05,21,dark);
  const pump=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,2,8),coolant);pump.rotation.x=Math.PI/2;pump.position.set(x,-1.95,21);scene.add(pump);
  box(.8,1,.7,x,-1.2,21,steel);
  for(const z of [20.1,21.9]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.92,.08,4,8),rust);ring.position.set(x,-1.95,z);scene.add(ring);}
 }
 // Close the chamber ends around its circular drain mouths.
 box(30,4.5,.22,0,5.75,5,tiled(wall,12,2));
 box(30,3.2,.22,0,-1.6,5,tiled(wall,12,2));
 for(const x of [-8,8]){
  const archVertices=[],archIndices=[];
  for(let i=0;i<=16;i++){const local=-3+i*6/16;const y=-1+Math.sqrt(Math.max(0,2.8*2.8-local*local));archVertices.push(x+local,y,37,x+local,8,37);if(i<16){const n=i*2;archIndices.push(n,n+1,n+2,n+2,n+1,n+3);}}
  const arch=new THREE.BufferGeometry();arch.setAttribute('position',new THREE.Float32BufferAttribute(archVertices,3));arch.setIndex(archIndices);arch.computeVertexNormals();
  const fill=new THREE.MeshLambertMaterial({color:0x545949,side:THREE.DoubleSide});scene.add(new THREE.Mesh(arch,fill));
  const paint=tiled(wall,5,4);paint.side=THREE.BackSide;
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,9,12,1,true),paint);shell.rotation.x=Math.PI/2;shell.position.set(x,-1,41.5);scene.add(shell);
  box(3.1,.15,9,x,-3.275,41.5,tiled(floor,2,5));
  for(const z of [37.1,40,43,45.9]){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.78,.09,4,12),rust);ring.position.set(x,-1,z);scene.add(ring);}
  const end=new THREE.Mesh(new THREE.CircleGeometry(2.78,12),dark);end.position.set(x,-1,46);end.rotation.y=Math.PI;scene.add(end);
  for(let i=-2;i<=2;i++)box(.10,4.5,.15,x+i*.6,-1,45.8,steel);
  const light=new THREE.PointLight(0x648c70,7,9,1.7);light.position.set(x,-.8,41);scene.add(light);
  roomSign(x<0?'DRAIN 01':'DRAIN 02',x,2.4,36.8,Math.PI);
 }
 for(const x of [-10,0,10]){
  for(const side of [-1,1])box(.18,2.8,.28,x+side*1.19,1.4,5,steel);
  box(2.55,.2,.28,x,2.9,5,steel);
  roomSign('SEWER / UPPER',x,3.15,4.82,Math.PI);
  roomSign(x<0?'WORKSHOP':x>0?'EXTRACTION':'CONTROL',x,3.15,5.2,0);
 }
 roomSign('STAIRS / DOWN',-10.5,1.65,8.9,Math.PI,'#dfb772');
 roomSign('STAIRS / UP',10.5,-1.4,15.8,Math.PI,'#dfb772');
 roomSign('COLLECTOR / 86',0,4.1,36.8,Math.PI,'#dfb772');
 // Torn rails and caution plates advertise exposed drops before a player steps off.
 for(const [x,z,angle] of [[-14,17,0],[-14,20,0],[1.5,25,0],[1.5,28,0],[-6,32,Math.PI/2],[-3,32,Math.PI/2]]){
  const broken=box(.08,.65,.08,x,.32,z,rust);broken.rotation.z=.45;
  const plate=box(.48,.015,.22,x,0.012,z,hazard);plate.rotation.y=angle;
 }
 const mist=[];
 const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d');
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){const alpha=Math.max(0,1-Math.hypot(x-7.5,y-7.5)/8)*.20;ctx.fillStyle=`rgba(115,140,119,${alpha})`;ctx.fillRect(x,y,1,1);}
 const map=new THREE.CanvasTexture(c);map.magFilter=THREE.NearestFilter;
 for(let i=0;i<18;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));scene.add(sprite);mist.push(sprite);}
 return {update(time,blackout=false){for(const l of lamps){const voltage=blackout?.07:lampVoltage(time,l.seed,l.damaged);l.light.intensity=l.base*voltage;l.bulb.color.copy(glow.color).multiplyScalar(voltage);}waterMap.offset.y=time*.014;for(let i=0;i<mist.length;i++){const t=(time*.12+i/18)%1;mist[i].position.set((i%2?1:-1)*(9+Math.sin(i*4)*3),-2.6+t*2.4,10+(i%7)*3.7);mist[i].scale.setScalar(1.8+t*2.1);mist[i].material.opacity=Math.sin(t*Math.PI)*.7;}}};
}
