import * as THREE from 'three';
import {HANGAR,HANGAR_GALLERIES,HANGAR_FLOOR,HANGAR_STAIR,HANGAR_RAILS,HANGAR_RAIL_GAPS,HANGAR_FIXTURES,BURAN,HANGAR_LEAK} from '../shared/hangar.js';
import {surfaceY} from '../shared/sewer.js';
import {buildBuran} from './buran.js';

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
 // The gantry crane is live: its bridge, trolley, cable, hook and load move with the operator.
 const crane=new THREE.Group();crane.userData.dynamic=true;scene.add(crane);
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(W-1,.8,.8),yellow);bridge.position.set(cx,top-2,0);crane.add(bridge);
 const trolley=new THREE.Mesh(new THREE.BoxGeometry(1.4,1,1.2),yellow);crane.add(trolley);
 const cable=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,5),new THREE.MeshLambertMaterial({color:0x9a9480}));crane.add(cable);
 const hook=new THREE.Mesh(new THREE.BoxGeometry(.5,.4,.3),yellow);crane.add(hook);
 // A work lamp rides on the hook block so the operator can find it from the gallery.
 const hookLamp=new THREE.Mesh(new THREE.BoxGeometry(.18,.1,.18),new THREE.MeshBasicMaterial({color:0xffc070}));hookLamp.position.y=-.25;hook.add(hookLamp);
 const hookLight=new THREE.PointLight(0xffb060,14,9,1.4);hookLight.position.y=-.6;hook.add(hookLight);
 const load=new THREE.Group();load.userData.dynamic=true;scene.add(load);
 const pallet=new THREE.Mesh(new THREE.BoxGeometry(1.4,.15,1.1),rust);pallet.position.y=.075;load.add(pallet);const crate=new THREE.Mesh(new THREE.BoxGeometry(1.1,.9,.9),new THREE.MeshLambertMaterial({color:0xa58450}));crate.position.y=.6;load.add(crate);
 const lbl=document.createElement('canvas');lbl.width=64;lbl.height=32;const lg=lbl.getContext('2d');lg.fillStyle='#a58450';lg.fillRect(0,0,64,32);lg.fillStyle='#1b1a14';lg.font='bold 14px monospace';lg.fillText('ВСУ',14,21);const lt=new THREE.CanvasTexture(lbl);lt.magFilter=lt.minFilter=THREE.NearestFilter;
 for(const sx of [-1,1]){const pl=new THREE.Mesh(new THREE.PlaneGeometry(.6,.3),new THREE.MeshLambertMaterial({map:lt}));pl.position.set(sx*.56,.6,0);pl.rotation.y=sx*Math.PI/2;load.add(pl);}
 // Floor pads: numbered squares the work orders refer to.
 const padTex=n=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#1c1a14';g.fillRect(0,0,64,64);g.strokeStyle='#c9a032';g.lineWidth=6;g.strokeRect(4,4,56,56);g.fillStyle='#c9a032';g.font='bold 30px monospace';g.textAlign='center';g.fillText(n,32,43);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;return t;};
 [[34,30],[50,30],[30,26],[30,36],[47,18]].forEach(([x,z],i)=>{const pad=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshLambertMaterial({map:padTex(String(i+1)),polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}));pad.rotation.x=-Math.PI/2;pad.position.set(x,floor+.02,z);scene.add(pad);});
 {const pk=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshLambertMaterial({map:padTex('П'),polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}));pk.rotation.x=-Math.PI/2;pk.position.set(56,floor+.02,40);scene.add(pk);}
 const craneApi={set(c){const x=c.x,z=c.z,L=c.L;bridge.position.z=z;trolley.position.set(x,top-2.8,z);
  const hx=x+Math.sin(c.ax||0)*L,hz=z+Math.sin(c.az||0)*L,hy=top-3.3-L*Math.cos(c.ax||0)*Math.cos(c.az||0);
  cable.position.set((x+hx)/2,(top-3.3+hy)/2,(z+hz)/2);cable.scale.y=Math.max(.1,Math.hypot(hx-x,hy-(top-3.3),hz-z));cable.lookAt(hx,hy,hz);cable.rotateX(Math.PI/2);
  hook.position.set(hx,hy-.2,hz);
  if(c.latched)load.position.set(hx,hy-1.45,hz);else if(c.load)load.position.set(c.load[0],floor,c.load[2]);}};
 craneApi.set({x:56,z:40,L:12,ax:0,az:0,latched:false,load:[56,floor,40]});
 for(const [x,z] of [[31,20],[53,20],[31,40],[53,40],[42,24],[42,38]]){
  box(1.2,.3,1.2,x,top-1.6,z,dark);const bulb=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,.2,8),new THREE.MeshBasicMaterial({color:0xe0b56a}));bulb.position.set(x,top-1.85,z);scene.add(bulb);
  const light=new THREE.PointLight(0xe0a75e,70,34,1.3);light.position.set(x,top-2.3,z);scene.add(light);
 }
 buildBuran(scene,{box,steel,dark,yellow,deckMat});
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
 roomSign('АНГАР 2 / HANGAR 2',26.8,2.6,12.2,0,'#d6a14e');roomSign('АНГАР 2 / BURAN HANGAR',26.8,2.6,11.8,Math.PI);
 roomSign('ОСТОРОЖНО / ВЫСОТА 8 M',24,1.7,15.4,Math.PI,'#d6a14e');
 return {crane:craneApi};
}
