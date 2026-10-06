import * as THREE from 'three';
import {FURNITURE,FURNITURE_KINDS} from '../shared/furniture.js';

// Furniture with a purpose, built from low-poly boxes and cylinders. Every piece is static:
// meshes share geometry and a small set of materials so batchStatic merges them by material.
const geometries=new Map();
const cached=(key,make)=>geometries.get(key)??geometries.set(key,make()).get(key);
const boxGeo=(w,h,d)=>cached(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d));
const cylGeo=(rt,rb,h,s)=>cached(`c${rt},${rb},${h},${s}`,()=>new THREE.CylinderGeometry(rt,rb,h,s));
function rng(seed){let v=seed>>>0;return ()=>((v=(Math.imul(v,1664525)+1013904223)>>>0)/4294967296);}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;draw(g,w,h);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t;}
const speckle=(g,w,h,r,n,dark=.22,light=.1)=>{for(let i=0;i<n;i++){g.fillStyle=r()<.55?`rgba(12,10,6,${dark*r()})`:`rgba(230,220,180,${light*r()})`;g.fillRect(Math.floor(r()*w),Math.floor(r()*h),1+Math.floor(r()*2),1+Math.floor(r()*2));}};

function makeMaterials({steel,dark,rust}){
 const lambert=(o)=>new THREE.MeshLambertMaterial(o);
 const noise=canvasTexture(16,16,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);speckle(g,w,h,rng(31),70,.3,0);});
 const paint=color=>lambert({map:noise,color});
 const grain=(base,dark,seed)=>canvasTexture(32,32,(g,w,h)=>{const r=rng(seed);g.fillStyle=base;g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2+Math.floor(r()*3)){g.fillStyle=dark;g.globalAlpha=.25+r()*.35;g.fillRect(0,y,w,1);}g.globalAlpha=1;for(let i=0;i<2;i++){g.fillStyle=dark;g.beginPath();g.ellipse(r()*w,r()*h,3,1.5,0,0,7);g.fill();}speckle(g,w,h,r,40);});
 const tex=(w,h,draw)=>lambert({map:canvasTexture(w,h,draw)});
 const M={steel,dark,rust,
  wood:lambert({map:grain('#4b2f1b','#2a170c',11)}),woodTop:lambert({map:grain('#5e3d24','#331d0f',12)}),pine:lambert({map:grain('#8a6a40','#5a4126',13)}),
  olive:paint(0x5d6342),green:paint(0x4c6450),machine:paint(0x76806c),cream:paint(0xa9a184),enamel:paint(0xc4c0aa),bakelite:lambert({color:0x1e1b18}),
  red:paint(0x8e2d1f),brass:lambert({color:0x9b7b3c}),rubber:lambert({color:0x24231f}),suit:paint(0x5c6847),sackCloth:paint(0x9c8a62),paper:lambert({color:0xcfc8a6}),
  glass:lambert({color:0x8a9c8e}),liquid:lambert({color:0x7f8a52}),copper:paint(0x8a5a32),soot:paint(0x24211d),ash:paint(0x6b6860),yellow:paint(0xa8842f),
  coat:paint(0xb9b7a8),maroon:lambert({color:0x5a2a22}),navy:paint(0x2c3550),oxygen:paint(0x3f566e),galvanised:paint(0x7b7f74),pressboard:paint(0x7a6a48),
  fur:paint(0x4a3b2b),typeGrey:paint(0x4d5446),suitcase:paint(0x5a4630),
  bulb:new THREE.MeshBasicMaterial({color:0xf1cf86}),ledRed:new THREE.MeshBasicMaterial({color:0x8a2c1c}),ledGreen:new THREE.MeshBasicMaterial({color:0x5b8a3c}),ledAmber:new THREE.MeshBasicMaterial({color:0xb8862f}),
  scope:new THREE.MeshBasicMaterial({color:0x4f7a3a}),oil:lambert({color:0x1d211c}),
 };
 M.shade=lambert({color:0x2f5a3a,side:THREE.DoubleSide});
 M.clock=tex(64,64,(g,w,h)=>{g.fillStyle='#d9d3bb';g.fillRect(0,0,w,h);g.fillStyle='#1d1a16';for(let i=0;i<12;i++){const a=i*Math.PI/6;g.fillRect(32+Math.cos(a)*26-1,32+Math.sin(a)*26-1,i%3?2:3,i%3?2:4);}
  const hand=(a,l,wd,c)=>{g.strokeStyle=c;g.lineWidth=wd;g.beginPath();g.moveTo(32,32);g.lineTo(32+Math.sin(a)*l,32-Math.cos(a)*l);g.stroke();};
  hand((3+47/60)/12*Math.PI*2,14,3,'#1d1a16');hand(47/60*Math.PI*2,22,2,'#1d1a16');hand(.9,23,1,'#9b2a1e');g.fillStyle='#9b2a1e';g.fillRect(29,42,6,2);g.fillStyle='#1d1a16';g.font='bold 6px monospace';g.fillText('СССР',21,22);});
 M.gauge=tex(32,32,(g,w,h)=>{g.fillStyle='#d4cfb6';g.fillRect(0,0,w,h);g.strokeStyle='#9b2a1e';g.lineWidth=3;g.beginPath();g.arc(16,16,11,-.4,.5);g.stroke();g.fillStyle='#1d1a16';for(let i=0;i<9;i++){const a=Math.PI*.75+i*Math.PI*1.5/8;g.fillRect(16+Math.cos(a)*12,16+Math.sin(a)*12,1,1);}g.strokeStyle='#1d1a16';g.lineWidth=1.5;g.beginPath();g.moveTo(16,16);g.lineTo(24,9);g.stroke();});
 M.portrait=tex(48,64,(g,w,h)=>{const r=rng(5);g.fillStyle='#5f5137';g.fillRect(0,0,w,h);const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#7d6c4b');sky.addColorStop(1,'#4a3f2b');g.fillStyle=sky;g.fillRect(0,0,w,h);
  g.fillStyle='#262420';g.beginPath();g.moveTo(4,h);g.lineTo(8,46);g.quadraticCurveTo(24,38,40,46);g.lineTo(44,h);g.fill();g.fillStyle='#d8d0b0';g.fillRect(21,41,6,7);
  g.fillStyle='#b49a76';g.beginPath();g.ellipse(24,28,9,12,0,0,7);g.fill();g.fillStyle='#2e261c';g.beginPath();g.ellipse(24,19,9.5,5,0,Math.PI,0);g.fill();g.fillRect(15,18,3,6);
  g.fillStyle='#3a2e20';g.fillRect(19,27,3,1);g.fillRect(26,27,3,1);g.fillRect(22,35,5,1);g.fillStyle='#c9a24a';g.fillRect(32,51,4,4);g.fillStyle='#9b2a1e';g.fillRect(33,48,2,3);speckle(g,w,h,r,60,.2,.08);});
 M.pennant=canvasTexture(64,96,(g,w,h)=>{g.fillStyle='#9b2a1e';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=3;g.strokeRect(3,3,w-6,h-6);g.fillStyle='#c9a24a';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?5:12;g.lineTo(32+Math.cos(a)*rr,24+Math.sin(a)*rr);}g.fill();g.font='bold 9px monospace';g.textAlign='center';g.fillText('ЛУЧШАЯ',32,50);g.fillText('СМЕНА',32,61);g.font='bold 8px monospace';g.fillText('1985',32,74);});
 M.pennant=lambert({map:M.pennant,side:THREE.DoubleSide});
 M.warning=tex(64,64,(g,w,h)=>{g.fillStyle='#d8d2bc';g.fillRect(0,0,w,h);g.strokeStyle='#a3291d';g.lineWidth=5;g.strokeRect(3,3,w-6,h-6);g.fillStyle='#a3291d';g.font='bold 11px monospace';g.textAlign='center';g.fillText('СТОЙ!',32,18);
  g.fillStyle='#1d1a16';g.beginPath();g.moveTo(36,22);g.lineTo(24,38);g.lineTo(32,38);g.lineTo(27,52);g.lineTo(41,34);g.lineTo(33,34);g.closePath();g.fill();g.fillStyle='#a3291d';g.font='bold 7px monospace';g.fillText('НАПРЯЖЕНИЕ',32,59);});
 M.hose=tex(64,96,(g,w,h)=>{g.fillStyle='#8e2d1f';g.fillRect(0,0,w,h);g.fillStyle='#7d8274';g.fillRect(7,22,w-14,h-30);g.strokeStyle='#5a2a22';g.lineWidth=3;for(const r of [10,15,20])g.beginPath(),g.arc(32,58,r,0,7),g.stroke();g.fillStyle='#e0d8bc';g.font='bold 16px monospace';g.textAlign='center';g.fillText('ПК',32,17);g.fillStyle='rgba(230,230,210,.25)';g.fillRect(10,24,6,h-36);});
 M.calendar=tex(48,64,(g,w,h)=>{g.fillStyle='#d6cfb3';g.fillRect(0,0,w,h);g.fillStyle='#9b2a1e';g.fillRect(0,0,w,16);g.fillStyle='#e8dfc0';g.font='bold 10px monospace';g.textAlign='center';g.fillText('1986',24,12);g.fillStyle='#1d1a16';g.font='bold 6px monospace';g.fillText('ОКТЯБРЬ',24,24);
  for(let i=0;i<31;i++){const x=4+((i+2)%7)*6,y=30+Math.floor((i+2)/7)*6;g.fillStyle=(i+2)%7===6?'#9b2a1e':'#3a352a';g.fillRect(x,y,3,3);}g.strokeStyle='#9b2a1e';g.strokeRect(27,41,6,6);});
 M.catalogue=tex(64,64,(g,w,h)=>{g.fillStyle='#331d0f';g.fillRect(0,0,w,h);for(let y=0;y<6;y++)for(let x=0;x<4;x++){g.fillStyle='#5e3d24';g.fillRect(x*16+1,y*10+2,14,8);g.fillStyle='#cfc8a6';g.fillRect(x*16+5,y*10+3,6,3);g.fillStyle='#9b7b3c';g.fillRect(x*16+6,y*10+7,4,2);}});
 M.crate=tex(64,64,(g,w,h)=>{const r=rng(9);g.fillStyle='#8a6d43';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#5a4126';g.fillRect(x,0,1,h);}g.fillStyle='#6b5232';g.fillRect(0,0,w,4);g.fillRect(0,h-4,w,4);speckle(g,w,h,r,90);g.fillStyle='#1f1c16';g.font='bold 11px monospace';g.textAlign='center';g.fillText('86-04',32,30);g.font='bold 7px monospace';g.fillText('ВЕРХ',32,44);g.fillRect(29,47,6,8);g.beginPath();g.moveTo(26,49);g.lineTo(32,43);g.lineTo(38,49);g.fill();});
 M.sack=tex(32,32,(g,w,h)=>{const r=rng(4);g.fillStyle='#9c8a62';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2){g.fillStyle='rgba(60,50,30,.18)';g.fillRect(0,y,w,1);}speckle(g,w,h,r,50);g.strokeStyle='#4a3a2a';g.strokeRect(9,10,14,10);g.fillStyle='#4a3a2a';g.fillRect(12,14,8,2);});
 M.trefoil=tex(32,32,(g,w,h)=>{g.fillStyle='#b8952f';g.fillRect(0,0,w,h);g.fillStyle='#1d1a16';for(let i=0;i<3;i++){g.beginPath();g.moveTo(16,16);g.arc(16,16,12,-Math.PI/2+i*2*Math.PI/3-.5,-Math.PI/2+i*2*Math.PI/3+.5);g.fill();}g.fillStyle='#b8952f';g.beginPath();g.arc(16,16,4,0,7);g.fill();g.fillStyle='#1d1a16';g.beginPath();g.arc(16,16,2.5,0,7);g.fill();});
 M.bio=tex(32,32,(g,w,h)=>{g.fillStyle='#c4c0aa';g.fillRect(0,0,w,h);g.strokeStyle='#9b2a1e';g.lineWidth=3;for(let i=0;i<3;i++){const a=-Math.PI/2+i*2*Math.PI/3;g.beginPath();g.arc(16+Math.cos(a)*6,16+Math.sin(a)*6,6,0,7);g.stroke();}g.fillStyle='#9b2a1e';g.beginPath();g.arc(16,16,3,0,7);g.fill();});
 M.globe=tex(64,32,(g,w,h)=>{const r=rng(17);g.fillStyle='#8f8256';g.fillRect(0,0,w,h);g.fillStyle='#5d6a3a';for(let i=0;i<14;i++){g.beginPath();g.ellipse(r()*w,5+r()*22,3+r()*8,2+r()*5,r()*3,0,7);g.fill();}g.fillStyle='#9b2a1e';g.fillRect(40,6,14,6);g.fillStyle='rgba(40,30,20,.35)';for(let x=0;x<w;x+=8)g.fillRect(x,0,1,h);for(let y=0;y<h;y+=8)g.fillRect(0,y,w,1);});
 M.pegboard=tex(64,32,(g,w,h)=>{g.fillStyle='#6b6a4a';g.fillRect(0,0,w,h);g.fillStyle='#2a2a1e';for(let y=2;y<h;y+=4)for(let x=2;x<w;x+=4)g.fillRect(x,y,1,1);});
 M.deconSign=canvasTexture(64,16,(g,w,h)=>{g.fillStyle='#1f2e22';g.fillRect(0,0,w,h);g.fillStyle='#d6cfb3';g.font='bold 8px monospace';g.textAlign='center';g.fillText('ДЕЗАКТИВАЦИЯ',32,11);});
 M.deconSign=lambert({map:M.deconSign});
 M.cabinetLabel=tex(32,8,(g,w,h)=>{g.fillStyle='#cfc8a6';g.fillRect(0,0,w,h);g.fillStyle='#1d1a16';g.font='bold 7px monospace';g.fillText('СУЗ',4,7);g.fillRect(22,2,7,4);});
 M.stripes=tex(16,16,(g,w,h)=>{for(let y=0;y<h;y+=4){g.fillStyle='#d6d2c0';g.fillRect(0,y,w,2);g.fillStyle='#2c3550';g.fillRect(0,y+2,w,2);}});
 M.books=[M.maroon,M.olive,M.navy,paint(0x8a6a3a),M.green,paint(0x6b2c22)];
 return M;
}

export function buildFurniture(scene,materials){
 const M=makeMaterials(materials);
 // Mesh helpers; every helper adds to the given group in its local frame (front faces +z).
 const add=(p,geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);p.add(m);return m;};
 const B=(p,w,h,d,x,y,z,mat,rx,ry,rz)=>add(p,boxGeo(w,h,d),mat,x,y,z,rx,ry,rz);
 const C=(p,rt,rb,h,x,y,z,mat,s=8,rx,ry,rz)=>add(p,cylGeo(rt,rb,h,s),mat,x,y,z,rx,ry,rz);
 const X=(p,r,h,x,y,z,mat,s=8)=>C(p,r,r,h,x,y,z,mat,s,0,0,Math.PI/2);// axis along local x
 const Z=(p,r,h,x,y,z,mat,s=8)=>C(p,r,r,h,x,y,z,mat,s,Math.PI/2,0,0);// axis along local z
 const ring=(p,r,t,x,y,z,mat,rx=0,ry=0,arc=Math.PI*2)=>add(p,cached(`t${r},${t},${arc}`,()=>new THREE.TorusGeometry(r,t,4,10,arc)),mat,x,y,z,rx,ry,0);
 const disc=(p,r,x,y,z,mat)=>add(p,cached(`d${r}`,()=>new THREE.CircleGeometry(r,14)),mat,x,y,z);
 const plane=(p,w,h,x,y,z,mat,rx=0,ry=0)=>add(p,cached(`p${w},${h}`,()=>new THREE.PlaneGeometry(w,h)),mat,x,y,z,rx,ry,0);
 const rod=(p,a,b,r,mat,s=6)=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),len=u.distanceTo(v);const m=new THREE.Mesh(cylGeo(r,r,+len.toFixed(3),s),mat);m.position.copy(u).add(v).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.sub(u).normalize());p.add(m);return m;};
 const sub=(p,x,y,z,ry=0)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);return g;};

 // ---- Things that sit on desks and tables (origin on the surface, user at +z). ----
 const TOP={
  typewriter(g){B(g,.4,.08,.32,0,.04,0,M.bakelite);B(g,.38,.09,.17,0,.12,-.05,M.typeGrey);B(g,.32,.03,.13,0,.09,.1,M.dark,.28);X(g,.026,.46,0,.18,-.1,M.bakelite,6);B(g,.22,.2,.004,0,.28,-.11,M.paper,-.18);for(const s of [-1,1])X(g,.032,.03,s*.245,.18,-.1,M.typeGrey,6);B(g,.08,.012,.02,-.17,.2,-.02,M.steel);},
  phone(g){B(g,.18,.07,.2,0,.035,0,M.bakelite);B(g,.13,.05,.13,0,.09,.0,M.bakelite);C(g,.055,.055,.012,0,.1,.08,M.cream,10,1.05);B(g,.045,.035,.22,0,.135,-.01,M.bakelite);for(const s of [-1,1])B(g,.06,.045,.065,0,.125,s*.1,M.bakelite);rod(g,[.08,.03,-.08],[.16,.01,-.25],.006,M.bakelite,4);},
  lamp(g){C(g,.075,.085,.025,0,.012,0,M.dark);rod(g,[0,.02,0],[0,.34,.04],.012,M.dark);rod(g,[0,.34,.04],[0,.34,.12],.01,M.dark);C(g,.025,.095,.13,0,.31,.15,M.green,8,.35);B(g,.04,.04,.04,0,.26,.16,M.bulb);},
  bankerLamp(g){C(g,.065,.075,.02,0,.01,0,M.brass);C(g,.012,.012,.3,0,.16,-.02,M.brass,6);add(g,cached('shade',()=>new THREE.CylinderGeometry(.07,.07,.34,8,1,true,Math.PI/2,Math.PI)),M.shade,0,.33,.0,0,0,Math.PI/2);B(g,.26,.02,.03,0,.3,.01,M.bulb);B(g,.012,.07,.012,.1,.27,.0,M.brass);},
  papers(g,r){for(let i=0;i<3;i++)B(g,.21,.008,.29,(r()-.5)*.04,.004+i*.009,(r()-.5)*.03,M.paper,0,(r()-.5)*.3);B(g,.23,.016,.31,.03,.032,0,r()<.5?M.olive:M.maroon,0,.15);B(g,.18,.006,.24,.02,.043,0,M.paper,0,.1);},
  ashtray(g){C(g,.065,.05,.028,0,.014,0,M.glass,8);for(let i=0;i<3;i++)B(g,.04,.012,.012,Math.cos(i*2)*.03,.032,Math.sin(i*2)*.03,i?M.paper:M.ash,0,i*1.1);},
  mug(g){C(g,.04,.036,.095,0,.048,0,M.enamel,8);C(g,.041,.041,.012,0,.09,0,M.maroon,8);B(g,.014,.06,.03,.05,.05,0,M.enamel);},
  logbook(g){B(g,.37,.01,.27,0,.005,0,M.maroon);for(const s of [-1,1])B(g,.17,.014,.24,s*.088,.016,0,M.paper,0,0,s*-.05);for(let i=0;i<5;i++)B(g,.12,.003,.006,-.09,.026,-.08+i*.035,M.dark);C(g,.006,.006,.15,.06,.03,.07,M.bakelite,4,0,.5,Math.PI/2);},
  books(g,r){for(let i=0;i<3;i++)B(g,.16,.045,.23,(r()-.5)*.03,.023+i*.046,0,M.books[Math.floor(r()*6)],0,(r()-.5)*.25);B(g,.05,.24,.18,.15,.12,-.03,M.books[Math.floor(r()*6)]);},
  binder(g){B(g,.07,.3,.25,0,.15,0,M.olive);B(g,.002,.06,.1,.036,.2,0,M.paper);B(g,.07,.3,.25,.075,.15,.01,M.maroon,0,.08);},
  dosimeters(g){B(g,.22,.04,.12,0,.02,0,M.woodTop);for(let i=0;i<7;i++)C(g,.008,.008,.11,-.09+i*.03,.08,0,M.steel,5);B(g,.12,.08,.1,.18,.04,.0,M.dark);C(g,.012,.012,.01,.18,.085,.02,M.ledRed,6);},
  fan(g){C(g,.07,.08,.03,0,.015,0,M.dark);C(g,.012,.012,.17,0,.1,0,M.dark,6);Z(g,.045,.09,0,.2,-.02,M.green);ring(g,.11,.006,0,.2,.05,M.steel);for(let i=0;i<3;i++)B(g,.025,.09,.005,0,.2,.04,M.cream,0,0,i*2.1);},
  carafe(g){C(g,.05,.065,.14,0,.07,0,M.glass,8);C(g,.022,.03,.08,0,.18,0,M.glass,6);C(g,.035,.035,.012,0,.22,0,M.glass,8);C(g,.032,.028,.08,.09,.04,.02,M.glass,6);C(g,.045,.045,.006,.0,.003,0,M.dark,8);},
  kettle(g){C(g,.07,.09,.13,0,.065,0,M.enamel,8);C(g,.04,.05,.03,0,.14,0,M.enamel,8);rod(g,[.07,.05,0],[.13,.13,0],.01,M.enamel,4);ring(g,.06,.008,0,.15,0,M.dark,0,0,Math.PI);},
 };
 const SLOTS=[[-.38,-.08],[.4,-.12],[.02,-.14],[-.06,.13],[.47,.15],[-.52,.17]];
 function setTop(g,list,y,r,slots=SLOTS){list.forEach((name,i)=>{const [x,z]=slots[i%slots.length];TOP[name](sub(g,x,y,z,(r()-.5)*.35),r);});}

 // ---- Pallets and other repeated bits. ----
 function pallet(g,y,ox=0,oz=0,ry=0){const p=sub(g,ox,y,oz,ry);for(let i=0;i<5;i++)B(p,1.2,.022,.13,0,.133,-.43+i*.215,M.pine);for(const x of [-.55,0,.55]){B(p,.1,.09,1,x,.077,0,M.pine);for(const z of [-.43,0,.43])B(p,.1,.03,.12,x,.015,z,M.pine);}return p;}

 const BUILD={
  // Office.
  desk(g,f,r){B(g,1.4,.04,.7,0,.76,0,M.woodTop);B(g,.42,.7,.64,.47,.37,-.01,M.wood);for(let i=0;i<3;i++){B(g,.38,.19,.012,.47,.6-i*.22,.316,M.woodTop);B(g,.1,.016,.022,.47,.62-i*.22,.326,M.brass);}
   for(const z of [-.3,.3])B(g,.045,.74,.045,-.65,.37,z,M.wood);B(g,1.3,.4,.02,0,.52,-.33,M.wood);B(g,.045,.04,.6,-.65,.1,0,M.wood);setTop(g,f.top??[],.78,r);},
  smallTable(g,f,r){B(g,.8,.035,.6,0,.722,0,M.woodTop);for(const x of [-.36,.36])for(const z of [-.26,.26])B(g,.04,.705,.04,x,.352,z,M.wood);B(g,.72,.08,.02,0,.66,-.27,M.wood);B(g,.72,.08,.02,0,.66,.27,M.wood);setTop(g,f.top??[],.74,r,[[-.22,-.08],[.2,.02],[-.02,.16]]);},
  chair(g){B(g,.42,.035,.42,0,.45,0,M.woodTop);for(const x of [-.18,.18]){B(g,.035,.45,.035,x,.225,.18,M.wood);B(g,.035,.9,.035,x,.45,-.19,M.wood);B(g,.03,.03,.36,x,.14,0,M.wood);}B(g,.38,.07,.02,0,.62,-.19,M.woodTop);B(g,.38,.09,.02,0,.83,-.19,M.woodTop);},
  stool(g){C(g,.17,.17,.04,0,.6,0,M.wood,10);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(g,[Math.cos(a)*.1,.58,Math.sin(a)*.1],[Math.cos(a)*.18,0,Math.sin(a)*.18],.017,M.dark,5);}ring(g,.13,.008,0,.25,0,M.dark,Math.PI/2);},
  basket(g){C(g,.15,.12,.33,0,.165,0,M.galvanised,8);B(g,.08,.07,.07,.02,.32,.01,M.paper,.4,.3);B(g,.06,.05,.06,-.04,.3,-.03,M.paper,.9);},
  coatRack(g){for(const ry of [0,Math.PI/2])B(g,.46,.04,.06,0,.02,0,M.wood,0,ry);C(g,.025,.03,1.76,0,.9,0,M.wood,6);for(let i=0;i<4;i++)rod(g,[0,1.66,0],[Math.cos(i*1.57)*.14,1.74,Math.sin(i*1.57)*.14],.012,M.brass,4);
   const coat=sub(g,.0,0,.13,0);B(coat,.4,.12,.16,0,1.6,0,M.olive);B(coat,.36,.78,.14,0,1.18,0,M.olive);B(coat,.4,.5,.15,0,.62,.0,M.olive);for(let i=0;i<3;i++)B(coat,.025,.025,.01,.03,1.3-i*.2,.075,M.brass);C(g,.11,.12,.11,.05,1.82,-.04,M.fur,8);},
  standAshtray(g){C(g,.15,.15,.02,0,.01,0,M.dark,10);C(g,.018,.018,.62,0,.32,0,M.steel,6);C(g,.13,.08,.06,0,.66,0,M.steel,10);B(g,.05,.012,.012,.03,.695,.02,M.paper,0,.6);},
  radiator(g){for(let i=0;i<9;i++)B(g,.08,.58,.1,-.44+i*.11,.46,.1,M.cream);for(const y of [.2,.72])X(g,.022,1,0,y,.1,M.cream,6);rod(g,[.52,.2,.1],[.52,.85,.1],.018,M.cream,6);rod(g,[.52,.85,.1],[.52,.85,0],.018,M.cream,6);B(g,.06,.08,.06,.6,.2,.1,M.dark);},
  clock(g){C(g,.18,.18,.05,0,0,.03,M.bakelite,14,Math.PI/2);disc(g,.162,0,0,.057,M.clock);B(g,.03,.03,.03,0,0,.06,M.dark);},
  portrait(g){B(g,.55,.8,.035,0,0,.03,M.wood);plane(g,.44,.66,0,.02,.049,M.portrait);B(g,.28,.06,.008,0,-.36,.05,M.brass);rod(g,[-.2,.38,.04],[0,.6,.02],.004,M.dark,3);rod(g,[.2,.38,.04],[0,.6,.02],.004,M.dark,3);},
  pennant(g){const s=new THREE.Shape();s.moveTo(-.18,.28);s.lineTo(.18,.28);s.lineTo(.18,-.08);s.lineTo(0,-.3);s.lineTo(-.18,-.08);s.closePath();
   const geo=cached('pennant',()=>{const ge=new THREE.ShapeGeometry(s);const uv=ge.attributes.uv,pos=ge.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+.18)/.36,(pos.getY(i)+.3)/.58);return ge;});
   add(g,geo,M.pennant,0,0,.04);X(g,.008,.44,0,.29,.04,M.brass,5);rod(g,[-.2,.29,.04],[0,.42,.02],.003,M.dark,3);rod(g,[.2,.29,.04],[0,.42,.02],.003,M.dark,3);for(const x of [-.12,0,.12])B(g,.012,.07,.006,x*.8,-.3+Math.abs(x)*1.2-.02,.042,M.brass);},
  switch(g){B(g,.08,.12,.012,0,0,.04,M.bakelite);B(g,.016,.035,.02,0,.012,.055,M.cream,-.4);},
  fuseBox(g){B(g,.4,.55,.14,0,0,.105,M.green);B(g,.36,.5,.012,0,0,.18,M.green);B(g,.03,.16,.04,.22,.05,.1,M.dark);B(g,.05,.04,.06,.24,.13,.12,M.red);plane(g,.1,.1,-.08,.14,.187,M.warning);rod(g,[0,.27,.1],[0,.6,.06],.02,M.dark);B(g,.04,.03,.03,.1,-.2,.19,M.dark);},
  intercom(g){B(g,.22,.3,.06,0,0,.065,M.cream);for(let i=0;i<6;i++)B(g,.14,.01,.008,0,.08-i*.025,.097,M.dark);C(g,.018,.018,.02,0,-.1,.1,M.ledRed,8,Math.PI/2);rod(g,[0,.15,.06],[0,.5,.05],.012,M.dark,4);},
  extinguisher(g){B(g,.14,.04,.06,0,.78,.06,M.dark);C(g,.085,.085,.52,0,.5,.13,M.red,10);C(g,.05,.085,.07,0,.795,.13,M.red,10);B(g,.05,.07,.05,0,.86,.13,M.dark);B(g,.13,.018,.03,.03,.91,.13,M.dark,0,0,-.2);rod(g,[.03,.85,.15],[.12,.62,.2],.012,M.rubber,4);C(g,.055,.022,.17,.12,.5,.2,M.bakelite,8);B(g,.12,.05,.004,0,.5,.217,M.paper);},
  wallPhone(g){B(g,.2,.26,.08,0,0,.075,M.bakelite);C(g,.06,.06,.012,0,.03,.12,M.cream,10,Math.PI/2);for(const y of [-.11,.11])B(g,.06,.05,.05,-.14,y,.1,M.bakelite);B(g,.04,.2,.035,-.14,0,.1,M.bakelite);rod(g,[-.13,-.12,.1],[-.04,-.3,.12],.006,M.bakelite,4);rod(g,[-.04,-.3,.12],[.02,-.13,.1],.006,M.bakelite,4);},
  hoseCabinet(g){B(g,.6,.8,.2,0,0,.135,M.red);plane(g,.54,.74,0,0,.236,M.hose);B(g,.03,.08,.02,.24,0,.245,M.dark);},
  firstAid(g){B(g,.45,.55,.16,0,0,.115,M.enamel);B(g,.2,.06,.01,0,.05,.2,M.red);B(g,.06,.2,.01,0,.05,.2,M.red);B(g,.025,.07,.02,.19,-.05,.2,M.dark);B(g,.43,.008,.01,0,-.12,.197,M.dark);},
  toolBoard(g,f,r){B(g,1.4,.8,.03,0,0,.05,M.pegboard);for(const x of [-.66,.66])B(g,.04,.84,.04,x,0,.06,M.wood);
   rod(g,[-.55,.25,.075],[-.55,-.1,.075],.012,M.wood,5);B(g,.13,.04,.04,-.55,.26,.08,M.dark);
   for(let i=0;i<4;i++)B(g,.026,.12+i*.04,.012,-.36+i*.07,.15-i*.02,.075,M.steel);
   B(g,.42,.11,.006,.05,-.2,.075,M.steel);B(g,.12,.08,.03,-.2,-.2,.08,M.wood);
   for(let i=0;i<3;i++){C(g,.008,.008,.14,.36+i*.06,.1,.075,M.steel,4);C(g,.016,.016,.09,.36+i*.06,.21,.075,[M.red,M.yellow,M.bakelite][i],6);}
   B(g,.03,.2,.012,.58,.12,.075,M.steel,0,0,.15);B(g,.03,.2,.012,.6,.12,.075,M.steel,0,0,-.15);ring(g,.08,.01,.42,-.22,.08,M.rubber);void r;},
  specimenShelf(g,f,r){B(g,1,.03,.28,0,-.2,.175,M.enamel);for(const x of [-.42,.42])B(g,.03,.16,.24,x,-.29,.15,M.dark);
   for(let i=0;i<5;i++){const x=-.38+i*.19,h=.14+r()*.08;C(g,.055,.055,h,x,-.185+h/2,.18,i%2?M.liquid:M.glass,8);C(g,.06,.06,.022,x,-.185+h+.011,.18,M.dark,8);B(g,.05,.04,.004,x,-.185+h*.45,.237,M.paper);}},
  coatHooks(g){B(g,.8,.07,.025,0,0,.045,M.wood);for(const x of [-.2,.2]){B(g,.02,.06,.07,x,-.02,.08,M.brass);const c=sub(g,x,0,.12);B(c,.42,.1,.14,0,-.08,0,M.coat);B(c,.38,.85,.12,0,-.55,0,M.coat);for(const s of [-1,1])B(c,.08,.6,.09,s*.24,-.4,0,M.coat);B(c,.1,.12,.01,.1,-.45,.065,M.coat);}},
  tongsRack(g){B(g,1,.04,.06,0,.35,.06,M.dark);for(const x of [-.45,.45])B(g,.04,.12,.06,x,.35,.05,M.dark);
   for(let i=0;i<3;i++){const x=-.3+i*.3;rod(g,[x-.02,.34,.1],[x-.03,-.9,.13],.012,M.dark,4);rod(g,[x+.02,.34,.1],[x+.04,-.9,.13],.012,M.dark,4);B(g,.08,.02,.03,x,.3,.1,M.dark);}
   rod(g,[.45,.3,.1],[.45,-.85,.14],.014,M.dark,4);B(g,.26,.1,.025,.45,-.9,.15,M.soot);},
  ppeBoard(g){B(g,.8,1,.03,0,0,.05,M.olive);plane(g,.24,.24,0,.33,.067,M.warning);for(const x of [-.25,-.08]){B(g,.13,.3,.05,x,-.05,.1,M.yellow);B(g,.05,.12,.04,x+.07,.03,.1,M.yellow);B(g,.02,.04,.04,x,.13,.08,M.brass);}
   rod(g,[.2,-.45,.08],[.24,.45,.09],.02,M.red,5);rod(g,[.24,.45,.09],[.25,.6,.09],.02,M.yellow,5);for(const y of [-.3,.1])B(g,.06,.03,.05,.22,y,.07,M.dark);},
  calendar(g){plane(g,.32,.45,0,0,.04,M.calendar);B(g,.012,.012,.012,0,.23,.04,M.dark);},
  conduit(g,f){const L=f.len;for(const [y,mat] of [[0,M.dark],[-.07,M.rust]])X(g,.022,L,0,y,.07,mat,6);
   for(let x=-L/2+.3;x<L/2;x+=.8)B(g,.04,.12,.05,x,-.035,.06,M.steel);for(let x=-L/2+1.5;x<L/2-.5;x+=3){B(g,.16,.16,.08,x,-.03,.08,M.steel);B(g,.03,.03,.01,x+.05,0,.125,M.ledAmber);}},
  broom(g){rod(g,[0,.06,.34],[0,1.38,.06],.016,M.wood,5);const h=sub(g,0,0,.36);B(h,.3,.05,.08,0,.07,0,M.wood,.2);B(h,.28,.09,.06,0,.025,.01,M.pine,.2);},
  shovel(g){rod(g,[0,.25,.3],[0,1.25,.06],.018,M.wood,5);B(g,.12,.03,.03,0,1.27,.055,M.wood);B(g,.24,.3,.02,0,.13,.33,M.dark,-.2);B(g,.24,.04,.08,0,.0,.33,M.soot);},
  guitar(g){const s=sub(g,0,0,.24);s.rotation.x=-.2;Z(s,.17,.08,0,.24,0,M.pine,10);Z(s,.13,.08,0,.47,0,M.pine,10);disc(s,.045,0,.38,.041,M.bakelite);B(s,.05,.46,.03,0,.82,0,M.wood);B(s,.07,.14,.03,0,1.11,0,M.wood);B(s,.09,.015,.02,0,.16,.045,M.wood);for(let i=0;i<3;i++)B(s,.003,.85,.003,-.012+i*.012,.62,.047,M.steel);},
  washstand(g){C(g,.24,.17,.14,0,.85,.25,M.enamel,10);B(g,.06,.3,.3,0,.66,.17,M.dark);rod(g,[0,.78,.25],[0,.1,.2],.018,M.steel);C(g,.02,.02,.1,0,.98,.06,M.steel,6);rod(g,[0,1.03,.06],[0,1.03,.14],.012,M.steel,4);
   B(g,.42,.52,.02,0,1.48,.045,M.wood);plane(g,.36,.46,0,1.48,.056,M.glass);B(g,.45,.02,.1,0,1.19,.08,M.wood);B(g,.07,.03,.05,-.12,1.215,.08,M.cream);C(g,.015,.015,.12,.1,1.26,.08,M.red,5);B(g,.3,.45,.012,.4,.98,.06,M.coat);},
  // Plant.
  manifold(g,f,r){const L=f.len;for(const [y,mat] of [[.55,M.green],[1.35,M.rust]])X(g,.075,L,0,y,.2,mat,8);
   for(const x of [-L/2+.12,L/2-.12]){B(g,.05,1.55,.05,x,.775,.2,M.dark);B(g,.05,.05,.2,x,1.5,.1,M.dark);}
   for(let x=-L/2+.4,i=0;x<L/2-.2;x+=.7,i++){X(g,.11,.04,x,.55,.2,M.dark,8);X(g,.11,.04,x,1.35,.2,M.dark,8);
    if(i%2===0){Z(g,.02,.2,x+.2,1.35,.32,M.steel,5);ring(g,.12,.016,x+.2,1.35,.43,M.red);B(g,.22,.025,.025,x+.2,1.35,.43,M.steel,0,0,.5);}
    else{rod(g,[x+.2,1.35,.2],[x+.2,1.66,.2],.015,M.steel,5);Z(g,.07,.03,x+.2,1.74,.22,M.dark,10);disc(g,.06,x+.2,1.74,.237,M.gauge);}}
   for(const x of [-L/2+.25,L/2-.25])C(g,.065,.065,1.6,x,2.55,.2,M.green,8);Z(g,.06,.2,0,.55,.1,M.green);ring(g,.09,.014,L/2-.5,.55,.32,M.red);Z(g,.02,.12,L/2-.5,.55,.26,M.steel,5);
   B(g,.2,.28,.01,-L/2+.6,1.0,.27,M.paper);void r;},
  dripTray(g){B(g,.9,.03,.5,0,.015,0,M.steel);for(const s of [-1,1]){B(g,.9,.05,.02,0,.04,s*.24,M.steel);B(g,.02,.05,.5,s*.44,.04,0,M.steel);}B(g,.8,.004,.4,0,.034,0,M.oil);},
  mopBucket(g){C(g,.17,.14,.28,0,.14,0,M.galvanised,10);disc(g,.155,0,.27,0,M.liquid).rotation.x=-Math.PI/2;B(g,.3,.08,.08,0,.31,-.06,M.dark);ring(g,.16,.008,0,.3,0,M.steel,0,0,Math.PI);rod(g,[.02,.12,.02],[.08,1.2,-.24],.015,M.wood,5);B(g,.14,.1,.14,.02,.2,.02,M.ash);},
  deconShower(g){for(const x of [-.52,.52])for(const z of [-.52,.52])C(g,.03,.03,2.28,x,1.14,z,M.steel,6);for(const s of [-.52,.52]){B(g,1.08,.05,.05,0,2.26,s,M.steel);B(g,.05,.05,1.08,s,2.26,0,M.steel);}
   B(g,1.1,.04,1.1,0,.02,0,M.steel);for(let i=0;i<6;i++)B(g,1,.035,.12,0,.065,-.42+i*.17,M.pine);rod(g,[0,2.26,-.52],[0,2.26,0],.025,M.steel);C(g,.025,.025,.2,0,2.16,0,M.steel,6);C(g,.13,.07,.06,0,2.03,0,M.steel,10);
   B(g,1.02,1.7,.012,0,1.15,-.53,M.enamel);B(g,.012,1.6,1.0,-.53,1.2,0,M.suit);ring(g,.08,.012,.52,1.3,.3,M.red,0,Math.PI/2);rod(g,[.15,2.25,.2],[.15,1.65,.22],.005,M.steel,3);B(g,.04,.08,.04,.15,1.62,.22,M.brass);
   B(g,.8,.2,.02,0,2.42,.53,M.deconSign);rod(g,[-.3,2.3,.52],[-.3,2.5,.53],.01,M.dark,3);rod(g,[.3,2.3,.52],[.3,2.5,.53],.01,M.dark,3);},
  bench(g){for(let i=0;i<3;i++)B(g,1.4,.035,.115,0,.45,-.13+i*.13,M.pine);for(const x of [-.58,.58]){B(g,.05,.43,.05,x,.215,-.14,M.dark);B(g,.05,.43,.05,x,.215,.14,M.dark);B(g,.05,.04,.33,x,.38,0,M.dark);}B(g,1.16,.04,.04,0,.12,0,M.dark);},
  hazmatRack(g,f){const L=f.len;B(g,L,.08,.04,0,1.86,.05,M.wood);for(const x of [-L/2+.05,L/2-.05])B(g,.05,1.86,.05,x,.93,.06,M.dark);
   const n=Math.max(2,Math.round(L/.62));for(let i=0;i<n;i++){const x=-L/2+L*(i+.5)/n;B(g,.03,.03,.12,x,1.82,.1,M.brass);
    const s=sub(g,x,0,.22);B(s,.24,.3,.2,0,1.62,0,M.suit);B(s,.15,.13,.02,0,1.58,.1,M.dark);for(const e of [-1,1])C(s,.032,.032,.02,e*.04,1.6,.112,M.glass,8,Math.PI/2);C(s,.035,.04,.08,0,1.52,.1,M.dark,6,1.2);
    B(s,.42,.62,.2,0,1.17,0,M.suit);for(const e of [-1,1]){B(s,.1,.56,.11,e*.26,1.18,0,M.suit);B(s,.09,.1,.09,e*.26,.86,0,M.rubber);B(s,.15,.58,.15,e*.1,.6,0,M.suit);B(s,.11,.26,.24,e*.09,.13,.02,M.rubber);}}},
  bootRack(g){B(g,1,.04,.32,0,.25,.17,M.pine);B(g,1,.04,.32,0,.02,.17,M.pine);for(const x of [-.48,.48])B(g,.04,.3,.32,x,.15,.17,M.pine);for(let i=0;i<3;i++)for(const s of [-1,1])B(g,.1,.24,.22,-.3+i*.3+s*.06,.39,.18,M.rubber);B(g,.11,.2,.25,.1,.12,.2,M.rubber,0,.3);},
  wasteBin(g){C(g,.25,.23,.66,0,.33,0,M.yellow,10);C(g,.262,.262,.05,0,.68,0,M.dark,10);C(g,.255,.255,.07,0,.45,0,M.dark,10);plane(g,.2,.2,0,.25,.237,M.trefoil);B(g,.1,.03,.03,0,.715,0,M.dark);},
  bioBin(g){C(g,.2,.18,.55,0,.275,0,M.enamel,10);C(g,.21,.21,.04,0,.57,0,M.red,10);B(g,.12,.02,.08,0,.025,.22,M.dark);plane(g,.14,.14,0,.32,.196,M.bio);},
  labBenchWall(g,f,r){const L=f.len;B(g,L,.86,.6,0,.43,.31,M.green);for(let x=-L/2+.5;x<L/2;x+=.5)B(g,.01,.72,.006,x,.43,.612,M.dark);for(let x=-L/2+.25;x<L/2;x+=.5)B(g,.06,.02,.02,x+.15,.75,.62,M.steel);
   B(g,L+.02,.04,.66,0,.88,.33,M.enamel);B(g,L,.25,.02,0,1.02,.012,M.enamel);
   const sx=L/2-.35;B(g,.46,.012,.38,sx,.9,.33,M.dark);B(g,.5,.03,.03,sx,.91,.14,M.steel);rod(g,[sx,.9,.06],[sx,1.18,.06],.015,M.steel,5);rod(g,[sx,1.18,.06],[sx,1.18,.24],.012,M.steel,5);rod(g,[sx,1.18,.24],[sx,1.1,.27],.01,M.steel,4);for(const e of [-1,1])B(g,.06,.025,.025,sx+e*.06,1.02,.06,M.red);
   const cx=-L/2+.32;B(g,.34,.22,.34,cx,1.01,.33,M.enamel);C(g,.13,.13,.025,cx,1.13,.33,M.steel,10);C(g,.02,.02,.02,cx+.1,1.0,.505,M.dark,6,Math.PI/2);B(g,.05,.03,.01,cx-.08,1.0,.502,M.ledGreen);
   for(let i=0;i<3;i++){const x=-.2+i*.13;C(g,.02,.07,.14,x,.97,.3,M.glass,8);C(g,.018,.018,.07,x,1.07,.3,M.glass,6);}
   for(let i=0;i<2;i++){C(g,.045,.045,.1,.15+i*.1,.95,.45,M.glass,8);}B(g,.22,.04,.07,.02,.92,.5,M.wood);for(let i=0;i<5;i++)C(g,.01,.01,.12,-.07+i*.04,.97,.5,M.glass,5);
   for(let i=0;i<2;i++){C(g,.065,.065,.2,-.48+i*.15,1.0,.12,M.liquid,8);C(g,.07,.07,.025,-.48+i*.15,1.11,.12,M.dark,8);}void r;},
  fumeHood(g){B(g,1.2,.85,.72,0,.425,.37,M.green);B(g,.01,.7,.006,0,.43,.733,M.dark);B(g,1.22,.04,.74,0,.87,.37,M.dark);for(const s of [-1,1])B(g,.06,1.12,.72,s*.57,1.45,.37,M.green);
   B(g,1.2,.32,.72,0,2.04,.37,M.green);B(g,1.08,1.1,.03,0,1.45,.03,M.enamel);B(g,1.08,.52,.02,0,1.62,.71,M.glass);B(g,1.1,.05,.05,0,1.36,.72,M.steel);for(const s of [-1,1])B(g,.04,.03,.06,s*.35,1.36,.76,M.dark);
   C(g,.12,.12,1.27,0,2.84,.3,M.steel,8);ring(g,.125,.015,0,2.4,.3,M.dark,Math.PI/2);B(g,.6,.02,.04,0,1.93,.45,M.bulb);
   rod(g,[.3,.89,.35],[.3,1.4,.35],.01,M.steel,4);ring(g,.05,.008,.3,1.25,.35,M.steel,Math.PI/2);C(g,.02,.06,.13,.3,1.33,.35,M.glass,8);B(g,.12,.06,.1,-.3,.92,.4,M.dark);},
  rodCabinet(g,f){const v=f.v??0;B(g,.8,2,.58,0,1,.3,M.green);B(g,.72,1.6,.012,0,1.02,.595,M.steel);for(const s of [-1,1]){B(g,.18,.12,.012,s*.17,1.62,.603,M.gauge);B(g,.004,.08,.006,s*.17+.02,1.62,.612,M.red,0,0,.4*s+v*.2);}
   for(let i=0;i<4;i++)B(g,.035,.035,.02,-.18+i*.12,1.4,.606,[M.ledAmber,M.ledGreen,M.ledRed,M.ledGreen][(i+v)%4]);for(let i=0;i<4;i++)B(g,.04,.07,.03,-.18+i*.12,1.25,.61,M.bakelite,(i+v)%2?.4:-.4);
   B(g,.03,.25,.04,.31,1,.62,M.dark);for(let i=0;i<6;i++)B(g,.56,.018,.012,0,.3+i*.05,.605,M.dark);B(g,.3,.075,.005,0,1.78,.603,M.cabinetLabel);C(g,.05,.05,1.5,0,2.74,.2,M.dark,6);},
  instrumentCart(g){for(const y of [.3,.8])B(g,.8,.03,.5,0,y,0,M.steel);for(const x of [-.37,.37])for(const z of [-.22,.22]){B(g,.03,.84,.03,x,.48,z,M.dark);X(g,.04,.03,x,.05,z,M.rubber,8);}rod(g,[-.42,.95,-.2],[-.42,.95,.2],.015,M.dark,5);for(const z of [-.2,.2])rod(g,[-.37,.8,z],[-.42,.95,z],.012,M.dark,4);
   B(g,.36,.26,.4,-.1,.95,0,M.olive);B(g,.16,.12,.01,-.1,.98,.205,M.scope);for(let i=0;i<3;i++)C(g,.018,.018,.02,-.24+i*.06,.86,.21,M.cream,6,Math.PI/2);B(g,.25,.15,.3,.24,.89,0,M.cream);B(g,.12,.07,.01,.24,.92,.155,M.gauge);
   ring(g,.12,.014,-.1,.335,0,M.rubber,Math.PI/2);B(g,.36,.15,.2,.18,.39,0,M.maroon);},
  winchPanel(g){B(g,.8,1.3,.5,0,.65,0,M.olive);B(g,.8,.06,.42,0,1.36,-.02,M.olive,-.5);B(g,.8,.2,.25,0,1.5,-.13,M.olive);B(g,.74,.02,.36,0,1.4,.0,M.dark,-.5);
   for(const [x,mat] of [[-.25,M.ledGreen],[-.1,M.red],[.05,M.bakelite]])C(g,.04,.04,.04,x,1.38,.08,mat,8,1.07);C(g,.065,.06,.06,.25,1.37,.1,M.red,10,1.07);
   rod(g,[.25,1.2,.26],[.33,1.42,.36],.015,M.dark,5);C(g,.03,.03,.04,.33,1.44,.37,M.red,6);B(g,.2,.14,.012,-.18,1.54,.0,M.gauge,-.0);B(g,.3,.06,.005,-.15,.9,.252,M.paper);B(g,.03,.25,.04,.32,.65,.26,M.dark);for(let i=0;i<5;i++)B(g,.5,.02,.012,-.05,.2+i*.05,.255,M.dark);},
  drillPress(g){B(g,.45,.06,.5,0,.03,-.02,M.dark);C(g,.045,.045,1.56,0,.8,-.16,M.steel,8);B(g,.32,.03,.3,0,.75,.06,M.dark);B(g,.08,.06,.22,0,.75,-.08,M.dark);
   B(g,.24,.28,.42,0,1.45,-.02,M.machine);C(g,.09,.09,.24,0,1.66,-.3,M.machine,8);B(g,.27,.12,.5,0,1.65,-.05,M.machine);C(g,.026,.026,.16,0,1.24,.1,M.steel,6);C(g,.032,.02,.07,0,1.13,.1,M.dark,6);C(g,.004,.004,.08,0,1.06,.1,M.steel,4);
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(g,[.13,1.42,-.02],[.13,1.42+Math.cos(a)*.17,-.02+Math.sin(a)*.17],.008,M.steel,4);C(g,.018,.018,.03,.13,1.42+Math.cos(a)*.17,-.02+Math.sin(a)*.17,M.bakelite,6);}B(g,.06,.05,.05,-.14,1.5,.1,M.red);},
  lathe(g){for(const x of [-.55,.55])B(g,.35,.7,.45,x,.35,0,M.machine);B(g,1.6,.14,.3,0,.77,-.02,M.dark);B(g,1.4,.04,.5,0,.71,.05,M.steel);
   B(g,.42,.34,.34,-.58,1.01,-.02,M.machine);X(g,.1,.08,-.33,1.0,-.02,M.steel,10);for(let i=0;i<3;i++)B(g,.03,.05,.03,-.29,1.0+Math.cos(i*2.1)*.07,-.02+Math.sin(i*2.1)*.07,M.dark);
   B(g,.18,.22,.24,.58,.95,-.02,M.machine);X(g,.03,.15,.45,1.0,-.02,M.steel,6);X(g,.035,.62,.08,1.0,-.02,M.steel,8);B(g,.22,.1,.36,.08,.89,0,M.machine);B(g,.07,.08,.07,.08,.98,.04,M.dark);
   ring(g,.06,.01,.0,.86,.2,M.steel);X(g,.012,1.5,0,.74,.15,M.steel,5);B(g,1.2,.26,.02,0,1.05,-.19,M.machine);B(g,.12,.08,.02,-.58,1.15,.16,M.paper);B(g,.05,.05,.03,-.45,.9,.17,M.red);},
  drum(g,f){const v=f.v??0,body=[M.rust,M.olive,M.oxygen,M.soot][v];C(g,.29,.29,.88,0,.44,0,body,10);for(const y of [.29,.59])C(g,.296,.296,.03,0,y,0,M.dark,10);C(g,.27,.27,.012,0,.886,0,M.dark,10);C(g,.03,.03,.02,.15,.9,.08,M.steel,6);
   if(v===0){C(g,.09,.012,.12,-.08,.95,-.03,M.dark,8);B(g,.12,.05,.08,.05,.915,-.12,M.red);}if(v===1)B(g,.26,.012,.2,-.05,.9,.05,M.coat,0,.4);if(v===3)B(g,.3,.004,.3,0,.892,0,M.ash);},
  gasBottles(g){B(g,.6,.04,.35,0,.08,0,M.dark);for(const s of [-1,1]){X(g,.12,.05,s*.33,.12,-.05,M.rubber,10);B(g,.03,1.32,.03,s*.29,.74,-.17,M.dark);}B(g,.62,.03,.03,0,1.4,-.17,M.dark);B(g,.62,.03,.03,0,.5,-.17,M.dark);
   for(const [x,mat,h] of [[-.14,M.oxygen,1.25],[.14,M.enamel,1.18]]){C(g,.11,.11,h,x,.1+h/2,0,mat,10);C(g,.04,.1,.1,x,.15+h,0,mat,8);B(g,.05,.07,.05,x,.24+h,0,M.brass);C(g,.032,.032,.02,x+.04,.26+h,.02,M.gauge,8,0,0,Math.PI/2);}
   B(g,.6,.015,.015,0,1.05,.11,M.steel);ring(g,.13,.012,0,1.18,-.19,M.red);ring(g,.11,.012,0,1.16,-.2,M.rubber);B(g,.2,.03,.01,.14,.7,.111,M.red);},
  sawhorse(g,f,r){B(g,1,.08,.08,0,.7,0,M.pine);for(const x of [-.4,.4])for(const s of [-1,1])rod(g,[x,.68,0],[x+(x>0?.06:-.06),0,s*.2],.022,M.pine,4);B(g,1.15,.03,.24,.05,.755,.02,M.pine,0,.08);B(g,.2,.06,.06,-.2,.8,.05,M.dark);void r;},
  vice(g){B(g,.16,.05,.18,0,.025,0,M.dark);B(g,.12,.1,.14,0,.1,0,M.machine);B(g,.18,.07,.03,0,.15,-.07,M.machine);B(g,.18,.07,.03,0,.15,.06,M.machine);Z(g,.012,.14,0,.1,.13,M.steel,5);X(g,.008,.2,0,.1,.2,M.steel,4);},
  ashCart(g){B(g,.8,.04,.55,0,.33,0,M.soot);for(const s of [-1,1]){B(g,.8,.45,.03,0,.55,s*.27,M.soot);B(g,.03,.45,.55,s*.4,.55,0,M.soot);X(g,.15,.05,s*.43,.15,.05,M.rubber,10);rod(g,[s*.3,.65,-.27],[s*.3,.82,-.42],.016,M.dark,4);}
   B(g,.74,.02,.5,0,.7,0,M.ash);B(g,.2,.08,.16,.15,.73,.08,M.ash,0,.5);X(g,.02,.9,0,.15,.05,M.steel,4);},
  ashBucket(g){C(g,.16,.13,.3,0,.15,0,M.soot,8);disc(g,.15,0,.27,0,M.ash).rotation.x=-Math.PI/2;ring(g,.15,.007,0,.3,0,M.dark,0,0,Math.PI);},
  rubberMat(g,f){B(g,f.len,.014,.7,0,.008,0,M.rubber);for(let i=0;i<4;i++)B(g,f.len-.04,.004,.025,0,.017,-.27+i*.18,M.dark);},
  coil(g){B(g,.8,.06,.8,0,.03,0,M.pine);C(g,.3,.3,.7,0,.45,0,M.copper,10);for(const y of [.1,.8])C(g,.38,.38,.05,0,y,0,M.pressboard,10);for(const y of [.3,.6])C(g,.306,.306,.04,0,y,0,M.dark,10);C(g,.12,.12,.94,0,.47,0,M.steel,8);B(g,.08,.1,.004,.0,.5,.302,M.paper);},
  cableReel(g){for(const s of [-1,1]){X(g,.5,.04,s*.27,.5,0,M.pine,10);B(g,.04,.12,.3,s*.27,.06,.0,M.pine);}X(g,.39,.5,0,.5,0,M.rubber,10);X(g,.08,.62,0,.5,0,M.steel,6);rod(g,[.1,.85,.25],[.2,.02,.6],.02,M.rubber,4);B(g,.12,.08,.06,.25,.04,.62,M.dark);},
  warningStand(g){for(const s of [-1,1]){rod(g,[s*.2,0,.18],[s*.2,1.02,.02],.015,M.dark,4);rod(g,[s*.2,0,-.18],[s*.2,1.02,.0],.015,M.dark,4);}B(g,.44,.04,.04,0,1.02,.01,M.dark);B(g,.42,.42,.012,0,.72,.1,M.warning,-.17);B(g,.4,.08,.012,0,.42,.15,M.yellow,-.17);rod(g,[-.2,.3,.13],[-.2,.3,-.13],.008,M.dark,3);},
  // Living quarters.
  footlocker(g){B(g,.8,.38,.45,0,.19,0,M.olive);B(g,.82,.07,.47,0,.415,0,M.green);for(const x of [-.39,.39])for(const z of [-.21,.21])B(g,.04,.42,.04,x,.21,z,M.steel);B(g,.06,.06,.02,0,.36,.235,M.steel);for(const s of [-1,1])B(g,.02,.03,.12,s*.41,.28,0,M.dark);B(g,.2,.06,.004,-.2,.22,.227,M.paper);},
  wardrobe(g){B(g,1,1.9,.6,0,1.03,0,M.wood);for(const s of [-1,1]){B(g,.48,1.7,.015,s*.245,1.03,.305,M.woodTop);B(g,.02,.14,.025,s*.03,1.1,.32,M.brass);}for(const x of [-.45,.45])for(const z of [-.25,.25])B(g,.06,.08,.06,x,.04,z,M.wood);B(g,1.04,.06,.64,0,2,0,M.wood);B(g,.6,.18,.4,-.05,2.12,0,M.suitcase,0,.1);B(g,.62,.03,.03,-.05,2.12,.0,M.dark,0,.1);},
  stove(g){C(g,.08,.08,.1,0,.05,0,M.brass,8);for(let i=0;i<3;i++){const a=i*2.1;B(g,.012,.14,.012,Math.cos(a)*.07,.12,Math.sin(a)*.07,M.dark);}C(g,.03,.03,.04,0,.12,0,M.dark,6);ring(g,.075,.006,0,.18,0,M.dark,Math.PI/2);
   C(g,.075,.095,.14,0,.26,0,M.enamel,8);C(g,.04,.05,.03,0,.34,0,M.enamel,8);rod(g,[.08,.24,0],[.15,.33,0],.012,M.enamel,4);ring(g,.065,.008,0,.36,0,M.dark,0,Math.PI/2,Math.PI);C(g,.045,.045,.12,-.2,.06,.05,M.galvanised,8);B(g,.12,.06,.1,.2,.03,.08,M.woodTop);},
  radio(g){B(g,.36,.22,.18,0,.11,0,M.wood);B(g,.16,.14,.006,-.08,.12,.092,M.sackCloth);B(g,.12,.05,.006,.09,.16,.092,M.paper);for(const x of [.06,.13])C(g,.02,.02,.02,x,.06,.1,M.cream,6,Math.PI/2);rod(g,[.15,.22,-.05],[.25,.62,-.1],.004,M.steel,3);},
  laundryLine(g,f){const L=f.x2-f.x;rod(g,[0,0,0],[L,0,0],.005,M.paper,3);for(const x of [0,L])B(g,.04,.04,.04,x,0,0,M.dark);
   const items=[[.9,'shirt',M.olive],[1.8,'towel',M.coat],[2.5,'sock',M.dark],[2.75,'sock',M.dark],[3.6,'vest',M.stripes],[4.6,'shirt',M.cream],[5.7,'towel',M.coat],[6.6,'sock',M.olive],[7.5,'vest',M.stripes]];
   for(const [x,kind,mat] of items){if(x>L-.5)continue;const c=sub(g,x,0,0,(x*7%3-1)*.15);
    if(kind==='shirt'){B(c,.44,.5,.02,0,-.27,0,mat);for(const s of [-1,1])B(c,.12,.3,.02,s*.27,-.17,0,mat,0,0,s*.4);}
    if(kind==='towel')B(c,.36,.52,.012,0,-.26,0,mat);if(kind==='sock')B(c,.08,.24,.02,0,-.12,0,mat);if(kind==='vest')B(c,.34,.48,.02,0,-.24,0,mat);
    for(const s of [-1,1])B(c,.015,.05,.02,s*.1,0,0,M.pine);}},
  // Stores.
  palletCrates(g){pallet(g,0);B(g,1.15,.62,.95,0,.455,0,M.crate);B(g,.55,.45,.45,-.28,.99,.2,M.crate,0,.06);B(g,.5,.4,.42,.3,.965,-.22,M.crate,0,-.05);for(const s of [-1,1])B(g,1.17,.03,.012,0,.455,s*.477,M.steel);},
  palletSacks(g,f,r){pallet(g,0);for(let l=0;l<4;l++)for(let i=0;i<4;i++){const along=(l+i)%2;const x=along?(i<2?-.3:.3):(i%2?.3:-.3),z=along?(i%2?.22:-.22):(i<2?-.22:.22);B(g,.56,.17,.4,x+(r()-.5)*.04,.24+l*.17,z,M.sack,0,along?0:(r()-.5)*.1);}},
  palletStack(g,f,r){for(let i=0;i<4;i++)pallet(g,i*.145,(r()-.5)*.06,(r()-.5)*.06,(r()-.5)*.08);},
  palletJack(g){for(const s of [-1,1]){B(g,.16,.07,1.15,s*.18,.05,-.2,M.rust);X(g,.035,.04,s*.18,.035,-.72,M.rubber,6);}B(g,.55,.26,.25,0,.18,.5,M.red);X(g,.09,.3,0,.09,.52,M.rubber,10);rod(g,[0,.3,.55],[0,1.12,.74],.025,M.dark,5);B(g,.36,.045,.045,0,1.15,.75,M.dark);B(g,.12,.04,.04,0,1.08,.73,M.red);},
  scale(g){B(g,.62,.08,.5,0,.06,.04,M.dark);B(g,.56,.012,.46,0,.105,.04,M.steel);B(g,.08,1.0,.08,0,.6,-.22,M.olive);B(g,.55,.13,.08,0,1.12,-.22,M.olive);B(g,.06,.08,.1,.15,1.12,-.22,M.dark);B(g,.5,.02,.004,0,1.16,-.178,M.paper);for(const s of [-1,1])X(g,.05,.04,s*.26,.05,-.26,M.rubber,8);B(g,.08,.1,.08,-.2,.17,.1,M.dark);C(g,.05,.05,.04,-.2,.24,.1,M.dark,8);},
  sack(g,f,r){B(g,.6,.22,.4,0,.11,0,M.sack,0,.3);B(g,.12,.08,.12,.32,.12,.1,M.sack,0,.3);void r;},
  cardCatalogue(g){B(g,1,1.2,.5,0,.65,0,M.wood);plane(g,.94,1.02,0,.66,.252,M.catalogue);B(g,1.04,.04,.54,0,1.27,0,M.woodTop);B(g,1.02,.06,.52,0,.03,0,M.wood);B(g,.2,.11,.35,.24,.88,.33,M.woodTop);for(let i=0;i<6;i++)B(g,.16,.08,.004,.24,.95,.2+i*.05,M.paper);},
  ladder(g){for(const s of [-1,1])rod(g,[s*.2,0,.55],[s*.2,1.56,.06],.022,M.wood,5);for(let i=1;i<7;i++){const t=i/7.2;X(g,.016,.4,0,1.56*t,.55-.49*t,M.wood,5);}X(g,.015,2.4,.0,1.5,.035,M.steel,6);for(const s of [-1,1])B(g,.03,.06,.06,s*.2,1.56,.05,M.steel);},
  globe(g){for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(g,[0,.45,0],[Math.cos(a)*.22,0,Math.sin(a)*.22],.016,M.wood,5);}C(g,.02,.03,.4,0,.62,0,M.wood,6);add(g,cached('sphere',()=>new THREE.SphereGeometry(.2,10,7)),M.globe,0,1.0,0,0,0,.4);ring(g,.225,.008,0,1.0,0,M.brass,0,.5);},
  bookCart(g,f,r){for(const y of [.25,.7])B(g,.76,.02,.46,0,y,0,M.wood);for(const s of [-1,1]){B(g,.02,.75,.46,s*.38,.45,0,M.wood);X(g,.04,.03,s*.32,.04,0,M.rubber,8);}rod(g,[-.4,.9,-.2],[-.4,.9,.2],.012,M.brass,5);
   for(const y of [.26,.71]){let x=-.34;while(x<.32){const w=.03+r()*.03,h=.18+r()*.07;B(g,w,h,.16,x+w/2,y+.01+h/2,(r()-.5)*.04,M.books[Math.floor(r()*6)],0,0,(r()-.5)*.08);x+=w+.004;}}},
  cableSpool(g){for(const s of [-1,1]){rod(g,[s*.38,0,-.45],[s*.38,.62,0],.025,M.dark,4);rod(g,[s*.38,0,.45],[s*.38,.62,0],.025,M.dark,4);X(g,.5,.03,s*.29,.62,0,M.steel,10);}X(g,.03,.84,0,.62,0,M.steel,6);X(g,.4,.54,0,.62,0,M.dark,10);rod(g,[.15,.25,.35],[.25,.02,.55],.02,M.dark,4);},
  trashBin(g){C(g,.19,.17,.56,0,.28,0,M.green,10);ring(g,.19,.012,0,.56,0,M.dark,Math.PI/2);B(g,.08,.07,.07,.02,.58,.02,M.paper,.5,.2);},
  mug(g){TOP.mug(g);},ashtray(g){TOP.ashtray(g);},
 };
 for(const [i,f] of FURNITURE.entries()){
  const kind=FURNITURE_KINDS[f.kind],build=BUILD[f.kind];if(!build)continue;
  const r=rng(i*977+31),g=new THREE.Group();g.name='furniture-'+f.kind;
  // Wall pieces are modelled from 3 cm out, clear of the painted wainscot band.
  const turn=(f.r??0)*Math.PI/2,jitter=['chair','stool','basket','standAshtray','sack','mopBucket','ashBucket','trashBin'].includes(f.kind)?(r()-.5)*.4:0;
  g.position.set(f.x+(kind.wall?Math.sin(turn)*.005:0),f.y??0,f.z+(kind.wall?Math.cos(turn)*.005:0));g.rotation.y=turn+jitter;
  if(f.kind==='laundryLine')g.rotation.y=0;
  build(g,f,r);scene.add(g);
 }
}
