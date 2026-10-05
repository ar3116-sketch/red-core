import * as THREE from 'three';
import {HANGAR,HANGAR_GALLERIES,HANGAR_FLOOR,HANGAR_STAIR,HANGAR_RAILS,HANGAR_RAIL_GAPS,HANGAR_FIXTURES,BURAN,HANGAR_LEAK} from '../shared/hangar.js';
import {surfaceY} from '../shared/sewer.js';

function canvasTexture(w,h,draw,repeat=[1,1]){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t;
}
const rnd=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
// Hangar 2. Tiers of dead office windows, a truss roof and the orbiter under work lamps.
export function buildHangar(scene,{box,roomSign,steel,dark,rust,hazard}){
 const r=rnd(1988);
 const tiers=canvasTexture(128,128,(g,w,h)=>{
  g.fillStyle='#3a3d33';g.fillRect(0,0,w,h);
  for(let y=0;y<4;y++){g.fillStyle='#24271f';g.fillRect(0,y*32+26,w,6);for(let x=0;x<4;x++){const lit=r()<.12;g.fillStyle=lit?'#8a7a4c':r()<.5?'#1d2420':'#2b3430';g.fillRect(x*32+3,y*32+4,26,20);g.fillStyle='#4a4f43';g.fillRect(x*32+15,y*32+4,2,20);g.fillRect(x*32+3,y*32+13,26,2);if(r()<.25){g.fillStyle='#14181488';g.fillRect(x*32+3+r()*20,y*32+4,6,20);}}}
  for(let i=0;i<60;i++){g.fillStyle=`rgba(20,24,18,${.1+r()*.2})`;g.fillRect(r()*w,r()*h,1+r()*3,4+r()*20);}
 },[10,5]);
 const concrete=canvasTexture(64,64,(g,w,h)=>{g.fillStyle='#4a4b42';g.fillRect(0,0,w,h);for(let i=0;i<400;i++){g.fillStyle=r()<.5?'rgba(20,22,18,.18)':'rgba(190,180,140,.08)';g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);}for(let i=0;i<6;i++){g.fillStyle='rgba(15,14,10,.35)';g.beginPath();g.arc(r()*w,r()*h,3+r()*8,0,7);g.fill();}g.fillStyle='#8a7a3a';g.fillRect(0,30,w,3);},[8,8]);
 const wallMat=new THREE.MeshLambertMaterial({map:tiers});
 const floorMat=new THREE.MeshLambertMaterial({map:concrete});
 const deckMat=new THREE.MeshLambertMaterial({map:canvasTexture(32,32,(g,w,h)=>{g.fillStyle='#545a4b';g.fillRect(0,0,w,h);g.fillStyle='#2c3029';for(let i=0;i<w;i+=4)g.fillRect(i,0,1,h);for(let i=0;i<h;i+=8)g.fillRect(0,i,w,1);},[6,6])});
 const yellow=new THREE.MeshLambertMaterial({color:0xc9a032}),white=new THREE.MeshLambertMaterial({color:0xd8d5c4}),black=new THREE.MeshLambertMaterial({color:0x1b1c1a}),tile=new THREE.MeshLambertMaterial({color:0x2a2b28});
 const {minX,maxX,minZ,maxZ,floor,top}=HANGAR,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,W=maxX-minX,D=maxZ-minZ,H=top-floor;
 // Shell.
 box(W-.6,H,.1,cx,floor+H/2,maxZ-.2,wallMat);
 for(const x of [minX+.2,maxX-.2]){const m=box(.1,H,D,x,floor+H/2,cz,wallMat);m.material=wallMat;}
 // North wall leaves the doorway from the east hall open at gallery level.
 box(W,8,.1,cx,floor+4,minZ+.18,wallMat);box(W,top-3.2,.1,cx,3.2+(top-3.2)/2,minZ+.18,wallMat);
 box(25.2-minX,3.2,.1,(minX+25.2)/2,1.6,minZ+.18,wallMat);box(maxX-28.4,3.2,.1,(28.4+maxX)/2,1.6,minZ+.18,wallMat);
 box(HANGAR_FLOOR.maxX-HANGAR_FLOOR.minX,.2,HANGAR_FLOOR.maxZ-HANGAR_FLOOR.minZ,cx,floor-.1,(HANGAR_FLOOR.minZ+HANGAR_FLOOR.maxZ)/2,floorMat);
 for(const gal of HANGAR_GALLERIES){const w=gal.maxX-gal.minX,d=gal.maxZ-gal.minZ;box(w,.18,d,(gal.minX+gal.maxX)/2,-.09,(gal.minZ+gal.maxZ)/2,deckMat);
  // Columns hold the galleries up off the hangar floor.
  if(gal.id!=='g-bridge')for(let t=3;t<Math.max(w,d)-1;t+=6){const x=w>d?gal.minX+t:(gal.minX+gal.maxX)/2,z=w>d?(gal.minZ+gal.maxZ)/2:gal.minZ+t;box(.45,8,.45,x,floor+4,z,tile);}
  box(w>d?w:.25,.4,w>d?.25:d,w>d?(gal.minX+gal.maxX)/2:(gal.id==='g-west'?gal.maxX:gal.id==='g-east'?gal.minX:(gal.minX+gal.maxX)/2),-.4,w>d?(gal.id==='g-north'?gal.maxZ:gal.minZ):(gal.minZ+gal.maxZ)/2,steel);
 }
 // The bridge hangs from the roof on rods.
 for(let z=18;z<44;z+=4)for(const x of [40.6,43.4])box(.05,top-.3,.05,x,top/2,z,dark);
 // Stair down the west side.
 const s=HANGAR_STAIR,depth=(s.maxZ-s.minZ)/s.steps;
 for(let i=0;i<s.steps;i++){const z=s.minZ+(i+.5)*depth,y=surfaceY(s,z);box(s.maxX-s.minX,.16,depth,(s.minX+s.maxX)/2,y-.08,z,deckMat);if(i%4===0)box(s.maxX-s.minX-.1,.012,.05,(s.minX+s.maxX)/2,y+.005,z-depth/2+.03,hazard);}
 box(.12,.5,s.maxZ-s.minZ+.4,s.maxX,-4,(s.minZ+s.maxZ)/2,steel).rotation.x=Math.atan2(8,20);
 // Rails with torn gaps.
 const beam=(a,b,rad,m)=>{const d=new THREE.Vector3().subVectors(b,a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,d.length(),5),m);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());scene.add(mesh);};
 for(const rl of HANGAR_RAILS){
  const stair=rl.x1===28,y1=stair?surfaceY(s,rl.z1):0,y2=stair?surfaceY(s,rl.z2):0;
  for(const h of [.55,1.05])beam(new THREE.Vector3(rl.x1,y1+h,rl.z1),new THREE.Vector3(rl.x2,y2+h,rl.z2),.035,rust);
  const n=Math.max(1,Math.ceil(Math.hypot(rl.x2-rl.x1,rl.z2-rl.z1)/1.8));for(let i=0;i<=n;i++){const t=i/n;box(.06,1.08,.06,rl.x1+(rl.x2-rl.x1)*t,y1+(y2-y1)*t+.54,rl.z1+(rl.z2-rl.z1)*t,steel);}
 }
 for(const g of HANGAR_RAIL_GAPS){for(const [x,z] of [[g.x1,g.z1],[g.x2,g.z2]]){const stub=box(.06,.7,.06,x,.6,z,rust);stub.rotation.z=.6;}box(Math.abs(g.x2-g.x1)||.3,.012,Math.abs(g.z2-g.z1)||.3,(g.x1+g.x2)/2,.01,(g.z1+g.z2)/2,hazard);}
 // Roof trusses, a gantry crane and the work lamps.
 for(let x=minX+4;x<maxX;x+=6){box(.3,.6,D,x,top-.5,cz,steel);for(let z=minZ+2;z<maxZ;z+=4)box(.08,.08,2.6,x,top-.9,z,dark).rotation.x=.6;}
 box(W-1,.8,.8,cx,top-2,24,yellow);box(1.4,1,1.2,36,top-2.8,24,yellow);beam(new THREE.Vector3(36,top-3.3,24),new THREE.Vector3(36,-1,24),.03,dark);box(.5,.4,.3,36,-1.2,24,steel);
 for(const [x,z] of [[31,20],[53,20],[31,40],[53,40],[42,24],[42,38]]){
  box(1.2,.3,1.2,x,top-1.6,z,dark);const bulb=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,.2,8),new THREE.MeshBasicMaterial({color:0xe0b56a}));bulb.position.set(x,top-1.85,z);scene.add(bulb);
  const light=new THREE.PointLight(0xe0a75e,70,34,1.3);light.position.set(x,top-2.3,z);scene.add(light);
 }
 // The orbiter: white fuselage, black belly and leading edges, delta wings, tail fin.
 const buran=new THREE.Group();buran.position.set(BURAN.x,floor+3.1,BURAN.z);scene.add(buran);
 const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);buran.add(m);return m;};
 add(new THREE.CylinderGeometry(1.7,1.7,15,12),white,0,0,1,Math.PI/2);
 add(new THREE.CylinderGeometry(1.72,1.72,15,12,1,true,Math.PI*1.65,Math.PI*.7),black,0,-.02,1,Math.PI/2);
 add(new THREE.SphereGeometry(1.7,12,8,0,Math.PI*2,0,Math.PI/2),white,0,0,-6.5,-Math.PI/2).scale.set(1,2.4,1);
 for(const x of [-.7,0,.7])add(new THREE.BoxGeometry(.45,.3,.05),black,x,1.25,-7.4,-.5);
  for(const side of [-1,1]){
  // Each wing is its own mirrored outline so neither ends up with inside-out faces.
  const wing=new THREE.Shape();wing.moveTo(0,-4);wing.lineTo(side*6.6,4.2);wing.lineTo(side*6.6,6.4);wing.lineTo(0,6.6);wing.closePath();
  const geo=new THREE.ExtrudeGeometry(wing,{depth:.28,bevelEnabled:false});add(geo,new THREE.MeshLambertMaterial({color:0xd8d5c4,side:THREE.DoubleSide}),side*1.2,-.9,0,Math.PI/2,0,0);
  add(new THREE.BoxGeometry(.25,.32,9.4),black,side*(1.2+3.3),-1.05,1.6,0,side*Math.atan2(6.6,8.2));
 }
 const fin=new THREE.Shape();fin.moveTo(0,0);fin.lineTo(4.2,0);fin.lineTo(4.4,4.6);fin.lineTo(2.6,4.6);fin.closePath();
 add(new THREE.ExtrudeGeometry(fin,{depth:.25,bevelEnabled:false}),white,-.12,1.4,4.4,0,-Math.PI/2,0);
 add(new THREE.BoxGeometry(3,2.6,1.4),white,0,0,8.6);for(const [x,y] of [[-.8,.5],[.8,.5],[0,-.5]])add(new THREE.CylinderGeometry(.35,.5,.8,8),black,x,y,9.5,Math.PI/2);
 const decal=canvasTexture(128,32,(g)=>{g.fillStyle='#d8d5c4';g.fillRect(0,0,128,32);g.fillStyle='#b3352a';g.fillRect(4,6,30,20);g.fillStyle='#e8c35a';g.fillRect(8,9,5,5);g.fillStyle='#1b1c1a';g.font='bold 20px monospace';g.fillText('СССР',42,24);});
 for(const side of [-1,1]){const p=add(new THREE.PlaneGeometry(3.2,.8),new THREE.MeshLambertMaterial({map:decal}),side*1.72,.4,-1,0,side*Math.PI/2,0);void p;}
 const name=canvasTexture(128,32,(g)=>{g.fillStyle='#d8d5c4';g.fillRect(0,0,128,32);g.fillStyle='#1b1c1a';g.font='bold 22px monospace';g.fillText('БУРАН',18,24);});
 for(const side of [-1,1])add(new THREE.PlaneGeometry(2.6,.65),new THREE.MeshLambertMaterial({map:name}),side*1.72,-.5,4,0,side*Math.PI/2,0);
 for(const [x,z] of [[0,-5],[-2.2,3],[2.2,3]]){add(new THREE.CylinderGeometry(.12,.12,1.6,6),steel,x,-2.2,z);add(new THREE.CylinderGeometry(.35,.35,.3,8),black,x,-2.9,z,0,0,Math.PI/2);}
 // Scaffolding towers in signal yellow.
 for(const f of HANGAR_FIXTURES.filter(f=>f.id.startsWith('scaffold'))){
  const h=f.maxY-f.minY;for(const sx of [-1,1])for(const sz of [-1,1])box(.1,h,.1,f.x+sx*(f.w/2-.05),f.minY+h/2,f.z+sz*(f.d/2-.05),yellow);
  for(let y=f.minY+1.5;y<f.maxY;y+=1.5){box(f.w,.08,.08,f.x,y,f.z-f.d/2+.05,yellow);box(f.w,.08,.08,f.x,y,f.z+f.d/2-.05,yellow);box(.08,.08,f.d,f.x-f.w/2+.05,y,f.z,yellow);box(.08,.08,f.d,f.x+f.w/2-.05,y,f.z,yellow);}
  box(f.w,.08,f.d,f.x,f.maxY,f.z,deckMat);
 }
 for(const id of ['hangar-crates-a','hangar-crates-b']){const f=HANGAR_FIXTURES.find(x=>x.id===id);box(f.w,f.maxY-f.minY,f.d,f.x,(f.minY+f.maxY)/2,f.z,rust);}
 const tug=HANGAR_FIXTURES.find(x=>x.id==='hangar-tug');box(tug.w,.9,tug.d,tug.x,floor+.75,tug.z,yellow);box(tug.w-.2,.9,1.2,tug.x,floor+1.6,tug.z-1,new THREE.MeshLambertMaterial({color:0x3d4a3b}));
 for(const [x,z] of [[tug.x-.9,tug.z-1.3],[tug.x+.9,tug.z-1.3],[tug.x-.9,tug.z+1.3],[tug.x+.9,tug.z+1.3]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.3,8),black);w.rotation.z=Math.PI/2;w.position.set(x,floor+.35,z);scene.add(w);}
 // Fuel line to the leaking flange the crew must seal.
 beam(new THREE.Vector3(HANGAR_LEAK.x,floor+.15,HANGAR_LEAK.z),new THREE.Vector3(HANGAR_LEAK.x+2,floor+.15,HANGAR_LEAK.z+5),.12,steel);
 beam(new THREE.Vector3(HANGAR_LEAK.x,floor+.15,HANGAR_LEAK.z),new THREE.Vector3(25.8,floor+.15,HANGAR_LEAK.z),.12,steel);
 // A banner across the far wall.
 const banner=canvasTexture(256,40,(g)=>{g.fillStyle='#8e2a21';g.fillRect(0,0,256,40);g.fillStyle='#e9d9a6';g.font='bold 15px monospace';g.textAlign='center';g.fillText('СЛАВА СОВЕТСКОЙ КОСМОНАВТИКЕ!',128,26);for(let i=0;i<80;i++){g.fillStyle='rgba(0,0,0,.15)';g.fillRect(Math.random()*256,Math.random()*40,2,6);}});
 const b=new THREE.Mesh(new THREE.PlaneGeometry(24,3.8),new THREE.MeshLambertMaterial({map:banner}));b.position.set(cx,5.2,maxZ-.35);b.rotation.y=Math.PI;scene.add(b);
 roomSign('АНГАР 2 / HANGAR 2',26.8,2.6,12.2,0,'#d6a14e');roomSign('EAST HALL',26.8,2.6,11.8,Math.PI);
 roomSign('ОСТОРОЖНО / ВЫСОТА 8 M',24,1.7,15.4,Math.PI,'#d6a14e');
}
