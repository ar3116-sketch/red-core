import * as THREE from 'three';
import {WALLS,ROOMS,roomAt,groundHeight,isWalkable,SOLIDS} from '../shared/world.js';
import {WING_SPACES} from '../shared/wings.js';

const rnd=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function tex(w,h,draw,repeat=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t;}
const grime=(g,w,h,r,n=60,a=.18)=>{for(let i=0;i<n;i++){g.fillStyle=`rgba(${r()<.5?'20,18,12':'90,70,40'},${a*r()})`;g.fillRect(r()*w,r()*h,1+r()*3,1+r()*6);}};

// ---- Propaganda: flat constructivist shapes, bold Cyrillic, aged paper. ----
const RED='#b3352a',CREAM='#e6d8ad',INK='#1c1a16',GOLD='#d6a14e';
function star(g,x,y,r,color){g.fillStyle=color;g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.42:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fill();}
function words(g,lines,y,size,color,w){g.fillStyle=color;g.textAlign='center';lines.forEach((t,i)=>{g.font=`bold ${size}px monospace`;g.fillText(t,w/2,y+i*(size+2));});}
const POSTERS=[
 (g,w,h)=>{g.fillStyle=CREAM;g.fillRect(0,0,w,h);g.fillStyle=RED;g.beginPath();g.moveTo(0,0);g.lineTo(w,0);g.lineTo(w,h*.25);g.lineTo(0,h*.55);g.fill();g.fillStyle=INK;g.beginPath();g.arc(w*.5,h*.48,18,0,7);g.fill();g.fillRect(w*.5-13,h*.48,26,40);g.fillStyle=CREAM;g.fillRect(w*.5-1,h*.48-8,3,16);words(g,['НЕ БОЛТАЙ!'],h*.88,14,RED,w);},
 (g,w,h)=>{g.fillStyle='#1f3b4a';g.fillRect(0,0,w,h);g.strokeStyle=CREAM;g.lineWidth=2;for(let i=0;i<3;i++){g.save();g.translate(w/2,h*.38);g.rotate(i*Math.PI/3);g.beginPath();g.ellipse(0,0,30,10,0,0,7);g.stroke();g.restore();}g.fillStyle=GOLD;g.beginPath();g.arc(w/2,h*.38,5,0,7);g.fill();words(g,['МИРНЫЙ АТОМ','В КАЖДЫЙ ДОМ!'],h*.75,11,CREAM,w);},
 (g,w,h)=>{g.fillStyle=RED;g.fillRect(0,0,w,h);star(g,w/2,h*.33,30,GOLD);g.strokeStyle=GOLD;g.lineWidth=5;g.beginPath();g.arc(w/2,h*.62,22,Math.PI*.15,Math.PI*1.05);g.stroke();g.fillStyle=GOLD;g.fillRect(w/2-3,h*.5,6,34);words(g,['СЛАВА ТРУДУ!'],h*.9,12,CREAM,w);},
 (g,w,h)=>{g.fillStyle=INK;g.fillRect(0,0,w,h);g.fillStyle=CREAM;g.beginPath();g.ellipse(w/2,h*.4,34,16,0,0,7);g.fill();g.fillStyle=RED;g.beginPath();g.arc(w/2,h*.4,11,0,7);g.fill();g.fillStyle=INK;g.beginPath();g.arc(w/2,h*.4,5,0,7);g.fill();words(g,['БДИТЕЛЬНОСТЬ —','НАШЕ ОРУЖИЕ'],h*.74,10,RED,w);},
 (g,w,h)=>{g.fillStyle='#d8b440';g.fillRect(0,0,w,h);g.fillStyle=INK;for(let i=0;i<3;i++){g.beginPath();g.moveTo(w/2,h*.38);g.arc(w/2,h*.38,30,-Math.PI/2+i*2*Math.PI/3-.5,-Math.PI/2+i*2*Math.PI/3+.5);g.fill();}g.fillStyle='#d8b440';g.beginPath();g.arc(w/2,h*.38,8,0,7);g.fill();g.fillStyle=INK;g.beginPath();g.arc(w/2,h*.38,5,0,7);g.fill();words(g,['ОСТОРОЖНО!','РАДИАЦИЯ'],h*.76,12,INK,w);},
 (g,w,h)=>{g.fillStyle='#16233a';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle=CREAM;g.fillRect((i*37)%w,(i*53)%h*.6,1,1);}g.fillStyle=CREAM;g.beginPath();g.moveTo(w*.62,h*.12);g.lineTo(w*.74,h*.5);g.lineTo(w*.5,h*.5);g.fill();g.fillStyle=RED;g.fillRect(w*.53,h*.5,18,6);g.fillStyle=GOLD;g.beginPath();g.moveTo(w*.56,h*.56);g.lineTo(w*.62,h*.7);g.lineTo(w*.68,h*.56);g.fill();star(g,w*.25,h*.25,10,RED);words(g,['КОСМОС — НАШ!'],h*.88,12,GOLD,w);},
 (g,w,h)=>{g.fillStyle=CREAM;g.fillRect(0,0,w,h);g.fillStyle=RED;g.fillRect(0,h*.72,w,h*.28);g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.moveTo(10,h*.6);g.lineTo(w*.35,h*.45);g.lineTo(w*.55,h*.5);g.lineTo(w-12,h*.18);g.stroke();g.fillStyle=INK;g.beginPath();g.moveTo(w-12,h*.12);g.lineTo(w-4,h*.24);g.lineTo(w-20,h*.22);g.fill();words(g,['ПЯТИЛЕТКУ —','ДОСРОЧНО!'],h*.82,11,CREAM,w);},
 (g,w,h)=>{g.fillStyle=RED;g.fillRect(0,0,w,h);g.fillStyle=CREAM;g.beginPath();g.arc(w/2,h*.4,26,0,7);g.fill();g.fillStyle='#2b2f2a';g.beginPath();g.arc(w/2,h*.42,17,0,7);g.fill();g.fillStyle=GOLD;g.font='bold 9px monospace';g.textAlign='center';g.fillText('СССР',w/2,h*.4-14);words(g,['ПОЕХАЛИ!'],h*.85,15,CREAM,w);},
 (g,w,h)=>{g.fillStyle='#2e4a32';g.fillRect(0,0,w,h);g.fillStyle=CREAM;g.fillRect(w*.3,h*.2,w*.4,h*.06);g.fillRect(w*.47,h*.2,w*.06,h*.32);g.fillStyle=RED;g.beginPath();g.moveTo(w*.3,h*.55);g.lineTo(w*.5,h*.48);g.lineTo(w*.7,h*.55);g.fill();words(g,['ТИШЕ!','ИДЁТ РАБОТА'],h*.75,12,CREAM,w);},
 (g,w,h)=>{g.fillStyle='#d8b440';g.fillRect(0,0,w,h);g.fillStyle=INK;g.fillRect(8,h*.42,w-16,4);g.beginPath();g.arc(w*.55,h*.25,6,0,7);g.fill();g.save();g.translate(w*.55,h*.48);g.rotate(.5);g.fillRect(-3,0,6,26);g.restore();g.fillRect(w*.3,h*.62,w*.4,3);words(g,['ОСТОРОЖНО:','ВЫСОТА!'],h*.8,12,INK,w);},
];
function posterTexture(i,seed){
 const r=rnd(seed);
 return tex(96,136,(g,w,h)=>{POSTERS[i](g,w,h);
  // Age: stains, fold lines, a torn corner.
  g.fillStyle='rgba(120,90,40,.18)';for(let k=0;k<4;k++){g.beginPath();g.arc(r()*w,r()*h,6+r()*14,0,7);g.fill();}
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(w/2,0,1,h);g.fillRect(0,h/2,w,1);grime(g,w,h,r,80,.25);
  if(r()<.6){g.fillStyle='#1b1d16';g.beginPath();const c=r()<.5?0:w;g.moveTo(c,0);g.lineTo(c+(c?-1:1)*(8+r()*14),0);g.lineTo(c,8+r()*18);g.fill();}
  g.strokeStyle='#00000055';g.strokeRect(.5,.5,w-1,h-1);
 });
}

// ---- Room materials ----
const STYLE={
 control:{band:'wood',floor:'terrazzo',rug:'runner'},cameras:{band:'wood',floor:'carpet'},archive:{band:'wood',floor:'parquet',rug:'runner'},
 workshop:{band:'green',floor:'oily'},pumps:{band:'tile-green',floor:'wet'},reactor:{band:'plate',floor:'diamond'},
 containment:{band:'tile-white',floor:'lino'},extraction:{band:'blue',floor:'oily'},incinerator:{band:'soot'},
 'e-tunnel':{band:'green'},'w-tunnel':{band:'green'},'e-hall':{band:'green'},'w-hall':{band:'green'},'e-passage':{band:'green'},
 substation:{band:'plate',floor:'diamond'},barracks:{band:'wood',floor:'lino',rug:'persian'},storage:{band:'green',floor:'oily'},lift:{band:'plate',floor:'diamond'},
};
function bandTexture(kind){
 const r=rnd(kind.length*977);
 if(kind==='wood')return tex(64,32,(g,w,h)=>{g.fillStyle='#4b2f1b';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#3a2414';g.fillRect(x,0,1,h);g.fillStyle='#5b3a22';g.fillRect(x+3,4,10,h-8);}for(let i=0;i<40;i++){g.fillStyle='rgba(25,12,5,.3)';g.fillRect(r()*w,r()*h,4+r()*8,1);}},[2,1]);
 if(kind.startsWith('tile'))return tex(32,32,(g,w,h)=>{g.fillStyle=kind==='tile-white'?'#b8bba9':'#6f8c78';g.fillRect(0,0,w,h);g.fillStyle=kind==='tile-white'?'#8d9183':'#4d6655';for(let i=0;i<w;i+=8){g.fillRect(i,0,1,h);g.fillRect(0,i,w,1);}grime(g,w,h,r,30,.3);},[4,2]);
 if(kind==='plate')return tex(32,32,(g,w,h)=>{g.fillStyle='#585e52';g.fillRect(0,0,w,h);g.fillStyle='#3c4139';g.fillRect(0,15,w,1);g.fillRect(15,0,1,h);g.fillStyle='#7c816f';for(const [x,y] of [[3,3],[27,3],[3,27],[27,27]])g.fillRect(x,y,2,2);grime(g,w,h,r,20);},[4,2]);
 if(kind==='soot')return tex(32,32,(g,w,h)=>{g.fillStyle='#2a2520';g.fillRect(0,0,w,h);grime(g,w,h,r,60,.5);},[4,2]);
 const base=kind==='blue'?'#3c5466':'#3f5e45';
 return tex(32,32,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<14;i++){g.fillStyle='#7c7a68';g.fillRect(r()*w,r()*h,1+r()*3,1+r()*2);}grime(g,w,h,r,30,.25);},[4,2]);
}
function floorTexture(kind){
 const r=rnd(kind.length*311);
 if(kind==='terrazzo')return tex(32,32,(g,w,h)=>{for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.fillStyle=(x+y)%2?'#8f8a72':'#5d5f4c';g.fillRect(x*16,y*16,16,16);}for(let i=0;i<120;i++){g.fillStyle=['#b9b294','#3c3e33','#a0663d'][i%3];g.fillRect(r()*w,r()*h,1,1);}},[10,10]);
 if(kind==='parquet')return tex(32,32,(g,w,h)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#5a3a20':'#6c4727';g.fillRect(x*8,y*8,8,8);g.fillStyle='#3a2414';if((x+y)%2)g.fillRect(x*8,y*8+3,8,1);else g.fillRect(x*8+3,y*8,1,8);}grime(g,w,h,r,20);},[14,14]);
 if(kind==='lino')return tex(32,32,(g,w,h)=>{g.fillStyle='#55624f';g.fillRect(0,0,w,h);g.fillStyle='#6c7660';for(let y=0;y<4;y++)for(let x=0;x<4;x++)if((x+y)%2)g.fillRect(x*8,y*8,8,8);grime(g,w,h,r,30);},[12,12]);
 if(kind==='diamond')return tex(16,16,(g,w,h)=>{g.fillStyle='#4f544a';g.fillRect(0,0,w,h);g.fillStyle='#6d7264';for(let y=0;y<h;y+=4)for(let x=(y/4)%2*2;x<w;x+=4)g.fillRect(x,y,2,1);},[20,20]);
 if(kind==='carpet')return tex(32,32,(g,w,h)=>{g.fillStyle='#6b221b';g.fillRect(0,0,w,h);g.fillStyle='#8a3a28';for(let i=0;i<w;i+=8)g.fillRect(i,0,4,h);grime(g,w,h,r,40);},[8,8]);
 if(kind==='wet')return tex(32,32,(g,w,h)=>{g.fillStyle='#3a3f35';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){g.fillStyle='rgba(120,140,130,.18)';g.beginPath();g.ellipse(r()*w,r()*h,3+r()*7,2+r()*4,0,0,7);g.fill();}grime(g,w,h,r,30);},[10,10]);
 return tex(32,32,(g,w,h)=>{g.fillStyle='#45463b';g.fillRect(0,0,w,h);for(let i=0;i<5;i++){g.fillStyle='rgba(10,10,6,.35)';g.beginPath();g.arc(r()*w,r()*h,2+r()*6,0,7);g.fill();}g.fillStyle='#8a7a3a';g.fillRect(0,14,w,2);grime(g,w,h,r,40);},[10,10]);
}
function rugTexture(kind){
 if(kind==='runner')return tex(16,64,(g,w,h)=>{g.fillStyle='#7a2219';g.fillRect(0,0,w,h);g.fillStyle='#c9a24a';g.fillRect(1,0,1,h);g.fillRect(w-2,0,1,h);g.fillStyle='#4d1510';for(let y=4;y<h;y+=10){g.fillRect(5,y,6,4);}},[1,4]);
 return tex(64,48,(g,w,h)=>{g.fillStyle='#7a2219';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=2;g.strokeRect(3,3,w-6,h-6);g.fillStyle='#2c3a5a';g.beginPath();g.moveTo(w/2,8);g.lineTo(w-14,h/2);g.lineTo(w/2,h-8);g.lineTo(14,h/2);g.fill();g.fillStyle='#d9c086';g.beginPath();g.arc(w/2,h/2,5,0,7);g.fill();for(let x=6;x<w;x+=8){g.fillStyle='#d9c086';g.fillRect(x,6,2,2);g.fillRect(x,h-8,2,2);}});
}

export function decorate(scene){
 const bandMats={},floorMats={};
 const bandMat=k=>bandMats[k]??=new THREE.MeshLambertMaterial({map:bandTexture(k)});
 const rail=new THREE.MeshLambertMaterial({color:0x2b2419});
 // Lower-wall band on each face of every full-height wall, styled by the room it faces.
 for(const w of WALLS){
  const top=w.maxY??3.5,bottom=w.minY??-.15;if(bottom<-1||top<2.5)continue;
  const alongX=w.w>w.d,len=alongX?w.w:w.d,thick=alongX?w.d:w.w;if(len<.5)continue;
  for(const side of [-1,1]){
   const nx=alongX?0:side,nz=alongX?side:0,px=w.x+nx*(thick/2+.3),pz=w.z+nz*(thick/2+.3);
   if(groundHeight(px,pz,0)!==0)continue;
   const style=STYLE[roomAt(px,pz)?.id];if(!style?.band)continue;
   const m=new THREE.Mesh(new THREE.BoxGeometry(alongX?len:.03,1.25,alongX?.03:len),bandMat(style.band));
   m.position.set(w.x+nx*(thick/2+.015),.625,w.z+nz*(thick/2+.015));scene.add(m);
   const cap=new THREE.Mesh(new THREE.BoxGeometry(alongX?len:.06,.06,alongX?.06:len),rail);cap.position.set(w.x+nx*(thick/2+.03),1.26,w.z+nz*(thick/2+.03));scene.add(cap);
  }
 }
 // Floors and rugs.
 const spaces=[...ROOMS.map(r=>({id:r.id,minX:r.x-5,maxX:r.x+5,minZ:r.z-5,maxZ:r.z+5})),...WING_SPACES,{id:'cameras',minX:-23,maxX:-15,minZ:-5,maxZ:3}];
 for(const s of spaces){
  const style=STYLE[s.id];if(!style?.floor)continue;
  const mat=floorMats[style.floor]??=new THREE.MeshLambertMaterial({map:floorTexture(style.floor)});
  const w=s.maxX-s.minX,d=s.maxZ-s.minZ,plane=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);plane.rotation.x=-Math.PI/2;plane.position.set((s.minX+s.maxX)/2,.004,(s.minZ+s.maxZ)/2);scene.add(plane);
  if(style.rug){
   const map=rugTexture(style.rug),long=w>d,rw=style.rug==='runner'?(long?w*.8:1.6):3.4,rd=style.rug==='runner'?(long?1.6:d*.8):2.4;
   const rug=new THREE.Mesh(new THREE.PlaneGeometry(rw,rd),new THREE.MeshLambertMaterial({map}));rug.rotation.x=-Math.PI/2;if(style.rug==='runner'&&long)rug.rotation.z=Math.PI/2;
   rug.position.set((s.minX+s.maxX)/2,.008,(s.minZ+s.maxZ)/2+(s.id==='barracks'?-1.8:0));if(style.rug==='runner'&&long){rug.geometry=new THREE.PlaneGeometry(rd,rw);}scene.add(rug);
  }
 }
 // Posters: on wall faces with clear floor in front, away from the ends of each segment.
 const r=rnd(1986),posterMats=POSTERS.map((_,i)=>new THREE.MeshLambertMaterial({map:posterTexture(i,i*91+7)}));
 const perRoom=new Map();let index=0;
 for(const w of WALLS){
  const top=w.maxY??3.5,bottom=w.minY??-.15;if(bottom<-1||top<2.5)continue;
  const alongX=w.w>w.d,len=alongX?w.w:w.d,thick=alongX?w.d:w.w;
  for(let t=-len/2+.9;t<=len/2-.9;t+=2.3){
   for(const side of [-1,1]){
    if(r()>.42)continue;
    const nx=alongX?0:side,nz=alongX?side:0,fx=w.x+(alongX?t:0),fz=w.z+(alongX?0:t),px=fx+nx*(thick/2+.35),pz=fz+nz*(thick/2+.35);
    if(groundHeight(px,pz,0)!==0||!isWalkable(px,pz,SOLIDS,.3,0))continue;
    const room=roomAt(px,pz)?.id;if(!room||room==='sewer'||(perRoom.get(room)??0)>=4)continue;perRoom.set(room,(perRoom.get(room)??0)+1);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(.62,.88),posterMats[(index++)%posterMats.length]);
    p.position.set(fx+nx*(thick/2+.02),1.72+(r()-.5)*.12,fz+nz*(thick/2+.02));p.rotation.y=Math.atan2(nx,nz);p.rotation.z=(r()-.5)*.06;scene.add(p);
   }
  }
 }
 // Control room mural: a cosmonaut in mosaic over the console doorway.
 const mural=tex(96,48,(g,w,h)=>{const rr=rnd(5);for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){const dx=x-w*.3,dy=y-h*.5,inHelmet=dx*dx+dy*dy<180,inVisor=dx*dx+dy*dy<70;const sky=y<h*.5;g.fillStyle=inVisor?'#2b2f2a':inHelmet?'#d8d0b0':x>w*.55&&Math.abs(y-h*.3-(x-w*.55)*.4)<4?'#d6a14e':sky?(rr()<.5?'#2a3c5a':'#33486a'):(rr()<.5?'#9b2f24':'#b3352a');g.fillRect(x,y,2,2);}g.fillStyle='#e6d8ad';g.font='bold 7px monospace';g.fillText('СЛАВА ПОКОРИТЕЛЯМ КОСМОСА',4,h-4);});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.6*.62),new THREE.MeshLambertMaterial({map:mural}));m.position.set(3.1,2.3,-4.86);scene.add(m);
}
