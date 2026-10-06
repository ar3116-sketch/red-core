import * as THREE from 'three';
import {BURAN,BURAN_STAIR,BURAN_PLATFORM} from '../shared/hangar.js';
import {surfaceY} from '../shared/sewer.js';

// 11F35 «Буран». The fuselage is lofted from stations so the nose droops, the cockpit hump rises
// and the belly is flat. Each skin panel gets its own shade: white felt on top, mottled black tiles below.
// The port hatch is open; a stair truck leads up to the flight deck, which you can walk into.
const CY=-5.2; // fuselage centre line, world y
const STATIONS=[ // local z (nose −10 → tail +10), half-width, top height, belly depth, centre drop
 [-10,.05,.05,.05,-.35],[-9.9,.45,.38,.38,-.35],[-9.7,.8,.66,.62,-.32],[-9.4,1.12,.92,.88,-.27],[-9,1.42,1.14,1.06,-.2],
 [-8.5,1.68,1.36,1.2,-.12],[-7.9,1.85,1.52,1.26,-.05],[-7.2,1.96,1.8,1.3,0],[-6.3,2,1.86,1.3,0],[-5.2,2,1.8,1.3,0],
 [-3.6,2,1.75,1.3,0],[9.4,2,1.75,1.3,0],[10,1.92,1.66,1.3,0],
];
const HATCH={z0:-5.4,z1:-4.2,y0:-1.0,y1:.9};
function section(z){
 let i=0;while(i<STATIONS.length-2&&STATIONS[i+1][0]<z)i++;
 const a=STATIONS[i],b=STATIONS[i+1],t=Math.max(0,Math.min(1,(z-a[0])/(b[0]-a[0])));
 return a.map((v,k)=>v+(b[k]-v)*t);
}
// Superellipse section: rounded shoulders, a near-flat belly.
function rim(sec,phi){const [,w,ht,hb,dy]=sec,c=Math.cos(phi),s=Math.sin(phi);
 const x=w*Math.sign(c)*Math.pow(Math.abs(c),2/2.6),y=s>=0?ht*Math.pow(s,2/2.6):-hb*Math.pow(-s,2/4.5);return [x,y+dy];}
function hash(a,b){let h=Math.imul(a*73856093^b*19349663,2654435761)>>>0;return (h%1000)/1000;}

export function buildBuran(scene,{box,steel,dark,yellow,deckMat}){
 const g=new THREE.Group();g.position.set(BURAN.x,CY,BURAN.z);g.userData.dynamic=true;scene.add(g);
 const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);g.add(m);return m;};
 const lam=(c,o={})=>new THREE.MeshLambertMaterial({color:c,...o});
 const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t;};
 // Tile seams: each skin quad maps one tile.
 const seam=tex(16,16,(c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);c.fillStyle='#9a978a';c.fillRect(0,0,w,1);c.fillRect(0,0,1,h);});
 const skinMat=new THREE.MeshLambertMaterial({map:seam,vertexColors:true});
 // ---------- fuselage skin ----------
 const zs=new Set();for(let z=-10;z<=-8.5;z+=.15)zs.add(+z.toFixed(2));for(let z=-8.5;z<=10.001;z+=.3)zs.add(+z.toFixed(2));[HATCH.z0,HATCH.z1,10].forEach(z=>zs.add(z));
 const Z=[...zs].sort((a,b)=>a-b),SEG=36,pos=[],col=[],uv=[];
 const shade=(x,y,z,i,j)=>{
  const sec=section(z),yn=(y-sec[4])/(y>sec[4]?sec[2]:sec[3]),r=hash(i,j);
  const black=z<-9.55||(y<sec[4]&&yn< -.22)||(z>-8.7&&z<-6.6&&y-sec[4]>sec[2]*.52&&Math.abs(x)<1.7);
  if(black){const v=[0x141513,0x1d1e1b,0x262723,0x2e2f2a][Math.floor(r*4)];return new THREE.Color(v);}
  return new THREE.Color([0xdcd8c6,0xd2cebb,0xe2dfcf,0xc8c4b0][Math.floor(r*4)]);
 };
 for(let i=0;i<Z.length-1;i++){const s0=section(Z[i]),s1=section(Z[i+1]);
  for(let j=0;j<SEG;j++){const p0=j/SEG*Math.PI*2,p1=(j+1)/SEG*Math.PI*2;
   const a=rim(s0,p0),b=rim(s0,p1),c=rim(s1,p1),d=rim(s1,p0);
   const mx=(a[0]+b[0]+c[0]+d[0])/4,my=(a[1]+b[1]+c[1]+d[1])/4,mz=(Z[i]+Z[i+1])/2;
   if(mx<-1.5&&mz>HATCH.z0&&mz<HATCH.z1&&my>HATCH.y0&&my<HATCH.y1)continue;
   const cl=shade(mx,my,mz,i,j);
   // Outward winding: φ runs counter-clockwise and the loft runs nose→tail, so (a,c,d) and (a,b,c) face out.
   for(const [v,u] of [[[a[0],a[1],Z[i]],[0,0]],[[c[0],c[1],Z[i+1]],[1,1]],[[d[0],d[1],Z[i+1]],[1,0]],[[a[0],a[1],Z[i]],[0,0]],[[b[0],b[1],Z[i]],[0,1]],[[c[0],c[1],Z[i+1]],[1,1]]]){pos.push(...v);col.push(cl.r,cl.g,cl.b);uv.push(...u);}
  }}
 const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));skin.setAttribute('color',new THREE.Float32BufferAttribute(col,3));skin.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));skin.computeVertexNormals();
 g.add(new THREE.Mesh(skin,skinMat));
 // Aft bulkhead: a dark heat shield with the two orbital-manoeuvring nozzles and the body flap.
 {const sec=section(10),sh=new THREE.Shape();for(let j=0;j<=SEG;j++){const [x,y]=rim(sec,j/SEG*Math.PI*2);j?sh.lineTo(x,y):sh.moveTo(x,y);}add(new THREE.ShapeGeometry(sh),lam(0x2a2a26),0,0,10.001);}
 for(const x of [-.75,.75]){const n=add(new THREE.CylinderGeometry(.28,.42,.7,10,1,true),lam(0x3b3a35,{side:THREE.DoubleSide}),x,1.05,10.3,Math.PI/2);void n;}
 for(const [x,y] of [[-1.4,.2],[1.4,.2],[-1.2,-.6],[1.2,-.6]])add(new THREE.CylinderGeometry(.08,.12,.25,6),lam(0x1d1e1b),x,y,10.1,Math.PI/2);
 add(new THREE.BoxGeometry(3.4,.14,1.1),lam(0x1d1e1b),0,-1.22,10.45);
 // OMS pods astride the fin root.
 for(const x of [-1.15,1.15]){add(new THREE.CylinderGeometry(.5,.5,3.2,10),lam(0xd8d4c2),x,1.2,8.4,Math.PI/2);}
 // Payload-bay door seams and hinge lines.
 const seamMat=lam(0x6e6b5e);
 add(new THREE.BoxGeometry(.04,.03,12.6),seamMat,0,1.76,2.9);
 for(const x of [-1.6,1.6])add(new THREE.BoxGeometry(.04,.03,12.6),seamMat,x,1.24,2.9);
 for(let z=-3.3;z<=9.2;z+=3.1)add(new THREE.BoxGeometry(3.1,.03,.04),seamMat,0,1.66,z);
 // ---------- cockpit windows ----------
 const glass=new THREE.MeshBasicMaterial({color:0x10181c}),glassIn=new THREE.MeshBasicMaterial({color:0x2c3a40});
 const topAt=(z,x)=>{const sec=section(z);let best=sec[2]+sec[4];for(let k=0;k<=40;k++){const [rx,ry]=rim(sec,k/40*Math.PI);if(Math.abs(rx-x)<.1)best=ry;}return best;};
 for(const x of [-1.15,-.7,-.23,.23,.7,1.15]){const z=-8.15,y=topAt(z,x)+.02;add(new THREE.PlaneGeometry(.38,.3),glass,x,y,z,-1.05,0,-x*.18);}
 for(const x of [-.45,.45]){const z=-7.35,y=topAt(z,x)+.02;add(new THREE.PlaneGeometry(.4,.34),glass,x,y,z,-1.5,0,-x*.1);}
 // ---------- double-delta wings ----------
 const wing=s=>{const sh=new THREE.Shape();const pts=[[1.85,-3.4],[2.9,1.0],[7.0,5.1],[7.35,6.1],[7.05,8.2],[1.85,8.5]];pts.forEach(([x,z],k)=>k?sh.lineTo(s*x,z):sh.moveTo(s*x,z));return sh;};
 for(const s of [-1,1]){
  const top=add(new THREE.ExtrudeGeometry(wing(s),{depth:.26,bevelEnabled:false}),lam(0xd8d4c2,{side:THREE.DoubleSide}),0,-.74,0,Math.PI/2);void top;
  const belly=add(new THREE.ShapeGeometry(wing(s)),lam(0x1b1c19,{side:THREE.DoubleSide}),0,-1.01,0,Math.PI/2);void belly;
  // Black reinforced-carbon leading edges.
  const le=(x1,z1,x2,z2)=>{const l=Math.hypot(x2-x1,z2-z1);add(new THREE.BoxGeometry(.2,.3,l),lam(0x1b1c19),s*(x1+x2)/2,-.87,(z1+z2)/2,0,Math.atan2(s*(x2-x1),z2-z1));};
  le(1.85,-3.4,2.9,1.0);le(2.9,1.0,7.0,5.1);le(7.0,5.1,7.35,6.1);
  for(const [a,b] of [[2.3,4.5],[4.7,6.8]])add(new THREE.BoxGeometry(b-a,.12,.75),lam(0x8d8a7c),s*(a+b)/2,-.85,8.12);
  // Main gear under each wing.
  add(new THREE.CylinderGeometry(.09,.09,1.3,6),steel,s*2.7,-1.75,5.6);
  for(const dz of [-.25,.25])add(new THREE.CylinderGeometry(.36,.36,.26,10),lam(0x161614),s*2.7,-2.44,5.6+dz,0,0,Math.PI/2);
 }
 // Nose gear.
 add(new THREE.CylinderGeometry(.08,.08,1.2,6),steel,0,-1.85,-7.6);
 for(const dx of [-.18,.18])add(new THREE.CylinderGeometry(.3,.3,.2,10),lam(0x161614),dx,-2.5,-7.6,0,0,Math.PI/2);
 // ---------- fin with split rudder ----------
 const fin=new THREE.Shape();[[3.4,1.6],[7.9,4.75],[9.55,4.75],[10.1,1.6]].forEach(([z,y],k)=>k?fin.lineTo(z,y):fin.moveTo(z,y));
 add(new THREE.ExtrudeGeometry(fin,{depth:.3,bevelEnabled:false}),lam(0xd8d4c2,{side:THREE.DoubleSide}),.15,0,0,0,-Math.PI/2,0);
 {const l=Math.hypot(4.5,3.15);add(new THREE.BoxGeometry(.34,.18,l),lam(0x1b1c19),0,3.17,5.65,-Math.atan2(3.15,4.5));}
 add(new THREE.BoxGeometry(.33,3.0,.04),seamMat,0,3.2,9.25,0,0,0);
 // ---------- markings ----------
 const name=tex(256,48,(c,w,h)=>{c.fillStyle='#dcd8c6';c.fillRect(0,0,w,h);c.fillStyle='#161614';c.font='bold 40px "Arial Black",Arial,sans-serif';c.textAlign='center';c.fillText('БУРАН',w/2,40);});
 const flag=tex(128,64,(c,w,h)=>{c.fillStyle='#dcd8c6';c.fillRect(0,0,w,h);c.fillStyle='#b3261e';c.fillRect(4,6,52,34);c.fillStyle='#e8c35a';c.fillRect(9,10,8,8);c.fillStyle='#161614';c.font='bold 26px Arial,sans-serif';c.fillText('СССР',60,36);});
 const ink=(t,w,h,x,y,z,ry,rx=0)=>add(new THREE.PlaneGeometry(w,h),lam(0xffffff,{map:t,transparent:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}),x,y,z,rx,ry,0);
 for(const s of [-1,1]){ink(name,2.5,.48,s*1.985,.55,-1.7,s*Math.PI/2);ink(flag,1.6,.8,s*1.985,.55,1.6,s*Math.PI/2);}
 ink(flag,2.2,1.1,-4.6,-.72,4.8,0,-Math.PI/2);
 // ---------- open hatch and stair truck ----------
 const frame=lam(0x2a2b27);
 add(new THREE.BoxGeometry(.12,.1,1.36),frame,-1.98,HATCH.y1,(HATCH.z0+HATCH.z1)/2);add(new THREE.BoxGeometry(.12,.1,1.36),frame,-2.0,HATCH.y0,(HATCH.z0+HATCH.z1)/2);
 for(const z of [HATCH.z0,HATCH.z1])add(new THREE.BoxGeometry(.12,1.98,.1),frame,-1.99,(HATCH.y0+HATCH.y1)/2,z);
 add(new THREE.BoxGeometry(.08,1.85,1.15),lam(0xd8d4c2),-2.06,(HATCH.y0+HATCH.y1)/2,HATCH.z0-.62);
 const ws=v=>v-CY,wx=v=>v-BURAN.x,wz=v=>v-BURAN.z;
 {const s=BURAN_STAIR,depth=(s.maxZ-s.minZ)/s.steps;
  for(let i=0;i<s.steps;i++){const z=s.minZ+(i+.5)*depth,y=surfaceY(s,z);add(new THREE.BoxGeometry(s.maxX-s.minX,.1,depth*.9),deckMat,wx((s.minX+s.maxX)/2),ws(y-.05),wz(z));}
  const p=BURAN_PLATFORM;add(new THREE.BoxGeometry(p.maxX-p.minX,.12,p.maxZ-p.minZ),deckMat,wx((p.minX+p.maxX)/2),ws(p.y-.06),wz((p.minZ+p.maxZ)/2));
  // Truck chassis and legs under the platform, handrails up the stair.
  add(new THREE.BoxGeometry(1.4,.6,7.8),yellow,wx(38.2),ws(-7.55),wz(22.9));
  for(const [x,z] of [[37.7,25.5],[38.7,25.5],[37.7,26.9],[38.7,26.9],[39.9,25.5],[39.9,26.9]])add(new THREE.BoxGeometry(.1,1.8,.1),yellow,wx(x),ws(-7.1),wz(z));
  const rail=(x1,y1,z1,x2,y2,z2)=>{const a=new THREE.Vector3(wx(x1),ws(y1),wz(z1)),b=new THREE.Vector3(wx(x2),ws(y2),wz(z2)),d=b.clone().sub(a);const m=add(new THREE.CylinderGeometry(.03,.03,d.length(),5),yellow,0,0,0);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());};
  rail(37.55,-7,19.4,37.55,-5.2,25.4);rail(37.55,-5.2,25.4,37.55,-5.2,27);rail(37.55,-5.2,27,40,-5.2,27);
  for(const [x,z,y] of [[37.55,19.4,-8],[37.55,22.4,-7.1],[37.55,25.4,-6.2],[37.55,27,-6.2],[39.2,27,-6.2]])add(new THREE.CylinderGeometry(.03,.03,1,5),yellow,wx(x),ws(y+.5),wz(z));
 }
 // ---------- flight deck ----------
 const lining=lam(0x7d8676),panelDark=lam(0x2f342c),olive=lam(0x48503c),orange=lam(0xb8692a);
 const F=-1.0,CEIL=1.4,Z0=-7.4,Z1=-3.6,ZM=(Z0+Z1)/2,L=Z1-Z0;
 add(new THREE.BoxGeometry(3.6,.05,L),lam(0x3a3f36),0,F-.025,ZM);
 add(new THREE.BoxGeometry(.04,1.8,HATCH.z0-Z0),lining,-1.77,F+.9,(Z0+HATCH.z0)/2);add(new THREE.BoxGeometry(.04,1.8,Z1-HATCH.z1),lining,-1.77,F+.9,(HATCH.z1+Z1)/2);
 add(new THREE.BoxGeometry(.04,1.8,L),lining,1.77,F+.9,ZM);
 for(const s of [-1,1]){const ch=add(new THREE.BoxGeometry(.04,.95,L),lining,s*1.45,1.1,ZM);ch.rotation.z=s*.83;}
 add(new THREE.BoxGeometry(2.3,.04,L),lining,0,CEIL,ZM);
 // Aft bulkhead: lockers and the hatch to the mid-deck.
 const lockers=tex(128,64,(c,w,h)=>{c.fillStyle='#7d8676';c.fillRect(0,0,w,h);c.strokeStyle='#4c5248';c.lineWidth=2;for(let x=4;x<w;x+=24)for(let y=4;y<h-4;y+=28)c.strokeRect(x,y,20,24);c.fillStyle='#b8692a';for(let x=4;x<w;x+=24)c.fillRect(x+14,16,3,6);});
 add(new THREE.PlaneGeometry(3.5,2.4),lam(0xffffff,{map:lockers}),0,.2,Z1-.02,0,Math.PI,0);
 add(new THREE.BoxGeometry(.9,.02,.9),panelDark,0,F+.01,-4.2);
 // Main instrument panel: three CRT indicators, push-button banks, round gauges.
 const panel=tex(256,96,(c,w,h)=>{c.fillStyle='#3d4438';c.fillRect(0,0,w,h);
  for(const x of [70,108,146]){c.fillStyle='#0d1510';c.fillRect(x,10,32,26);c.fillStyle='#7fcf8f';for(let k=0;k<5;k++)c.fillRect(x+4,14+k*4,8+((x+k*7)%17),1);}
  for(let k=0;k<14;k++)for(let r=0;r<3;r++){c.fillStyle=(k*r+k)%5===0?'#d99b44':(k+r)%7===0?'#8fbf6a':'#22261f';c.fillRect(66+k*9,46+r*9,6,6);}
  for(const [x,y] of [[16,22],[42,22],[16,56],[42,56],[214,22],[240,22],[214,56],[240,56]]){c.fillStyle='#0f100e';c.beginPath();c.arc(x,y,11,0,7);c.fill();c.strokeStyle='#d8d2b0';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+7*Math.cos(x+y),y+7*Math.sin(x*y));c.stroke();}
  c.fillStyle='#d8d2b0';c.font='7px monospace';c.fillText('ИНДИКАТОР',96,44);c.fillText('ПУСК / СБРОС',100,88);});
 const mp=add(new THREE.PlaneGeometry(3.0,1.1),lam(0xffffff,{map:panel}),0,.25,Z0+.06,-.22);void mp;
 add(new THREE.BoxGeometry(3.1,.06,.5),panelDark,0,-.32,Z0+.25);
 // Overhead switch panel.
 const over=tex(128,48,(c,w,h)=>{c.fillStyle='#3d4438';c.fillRect(0,0,w,h);for(let x=6;x<w;x+=10)for(let y=6;y<h;y+=14){c.fillStyle='#c8c2a6';c.fillRect(x,y,3,8);c.fillStyle='#161714';c.fillRect(x-1,y+7,5,3);}});
 add(new THREE.PlaneGeometry(1.6,.7),lam(0xffffff,{map:over}),0,CEIL-.03,-6.2,Math.PI/2);
 // Centre console (the chronometer sits on the panel above it).
 add(new THREE.BoxGeometry(.6,.7,.8),panelDark,0,F+.35,-7.1);
 // Two K-36RB ejection seats.
 for(const x of [-1.05,1.05]){
  add(new THREE.BoxGeometry(.6,.14,.6),olive,x,F+.45,-6.25);add(new THREE.BoxGeometry(.62,1.2,.14),olive,x,F+1.0,-5.9);add(new THREE.BoxGeometry(.4,.28,.16),olive,x,F+1.72,-5.88);
  for(const dx of [-.15,.15])add(new THREE.BoxGeometry(.06,.9,.02),orange,x+dx,F+1.0,-5.98);
  add(new THREE.BoxGeometry(.7,.44,.7),panelDark,x,F+.2,-6.25);
  add(new THREE.CylinderGeometry(.03,.03,.28,6),orange,x+.36,F+.55,-6.45);
 }
 // Inside the windows.
 for(const x of [-1.0,-.35,.35,1.0])add(new THREE.PlaneGeometry(.45,.25),glassIn,x,1.05,Z0+.25,-.6);
 const glow=new THREE.PointLight(0xffd6a0,5,5.5,1.6);glow.position.set(0,1.1,-5.6);g.add(glow);
 const crtGlow=new THREE.PointLight(0x8fd09a,2,2.4,1.8);crtGlow.position.set(0,.3,-6.8);g.add(crtGlow);
 return g;
}
