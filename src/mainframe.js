import * as THREE from 'three';
// ЕС ЭВМ-1066 in the archive: a wall of tape drives and lamp panels, an operator console
// with a scrolling screen, and a line printer spilling paper. Reels and lamps animate.
export function buildMainframe(scene){
 const g=new THREE.Group();g.userData.dynamic=true;scene.add(g);
 const mat=c=>new THREE.MeshLambertMaterial({color:c});
 const cream=mat(0xc9c1a0),grey=mat(0x8a8b7c),dark=mat(0x24261f),smoke=new THREE.MeshLambertMaterial({color:0x2b3330,transparent:true,opacity:.65});
 const box=(w,h,d,m,x,y,z,p=g)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
 const reels=[],lamps=[],front=-40.0;
 for(let i=0;i<5;i++){
  const z=-23.4+i*1.4,cab=new THREE.Group();cab.position.set(front,0,z);g.add(cab);
  box(.78,2.2,1.32,i===2?grey:cream,-.39,1.1,0,cab);box(.02,.12,1.3,dark,.005,2.1,0,cab);
  const plate=box(.01,.08,.5,mat(0x3a3f33),.01,1.98,0,cab);void plate;
  if(i!==2){
   // Tape drive: two reels behind a smoked window, a vacuum column below.
   box(.02,.7,1.0,dark,.01,1.45,0,cab);box(.025,.68,.98,smoke,.03,1.45,0,cab);
   for(const dz of [-.26,.26]){const reel=new THREE.Group();reel.position.set(.04,1.5,dz);cab.add(reel);
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.02,16),mat(0x9da098));disc.rotation.z=Math.PI/2;reel.add(disc);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.03,8),dark);hub.rotation.z=Math.PI/2;hub.position.x=.01;reel.add(hub);
    for(let k=0;k<3;k++){const spoke=box(.025,.02,.32,dark,.012,0,0,reel);spoke.rotation.x=k*Math.PI/3;}
    reels.push({reel,speed:.5+Math.random()*2,phase:Math.random()*10});}
   box(.02,.5,.3,dark,.01,.75,0,cab);for(let k=0;k<6;k++)box(.025,.02,.84,mat(0x5a5c50),.012,.3+k*.05,0,cab);
  }else{
   // Operator console: lamp field, switch row, a CRT.
   for(let r=0;r<6;r++)for(let c=0;c<10;c++){const lamp=new THREE.Mesh(new THREE.BoxGeometry(.02,.035,.035),new THREE.MeshBasicMaterial({color:0x332a18}));lamp.position.set(.015,1.95-r*.07,-.4+c*.088);cab.add(lamp);lamps.push({lamp,colour:[0xd99b44,0xc0402a,0x8fbf6a][(r+c)%3],rate:.5+Math.random()*3,phase:Math.random()*10});}
   for(let c=0;c<12;c++){const sw=box(.05,.06,.02,c%4===0?mat(0x9a2e22):grey,.03,1.42,-.48+c*.087,cab);sw.rotation.z=(c%3?.4:-.4);}
   box(.5,.06,1.2,grey,.2,1.0,0,cab);
  }
 }
 // CRT terminal on the console shelf, scrolling job output.
 const crtCanvas=document.createElement('canvas');crtCanvas.width=128;crtCanvas.height=96;const crt=crtCanvas.getContext('2d');const crtTex=new THREE.CanvasTexture(crtCanvas);crtTex.magFilter=crtTex.minFilter=THREE.NearestFilter;
 const term=new THREE.Group();term.position.set(front+.3,1.03,-20.6+.0);g.add(term);box(.42,.36,.42,cream,0,.18,0,term);
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(.3,.22),new THREE.MeshBasicMaterial({map:crtTex}));scr.position.set(.215,.2,0);scr.rotation.y=Math.PI/2;term.add(scr);
 // Line printer with a paper tongue to the floor.
 const pr=new THREE.Group();pr.position.set(-39.7,0,-16.1);g.add(pr);box(.6,.8,.5,cream,0,.4,0,pr);box(.62,.12,.52,grey,0,.86,0,pr);
 const paper=new THREE.Mesh(new THREE.PlaneGeometry(.42,1.1),new THREE.MeshLambertMaterial({color:0xddd6b8,side:THREE.DoubleSide}));paper.position.set(.3,.5,0);paper.rotation.set(0,Math.PI/2,.35);pr.add(paper);
 for(let k=0;k<8;k++){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.42,.04),new THREE.MeshLambertMaterial({color:0xa9c49a,side:THREE.DoubleSide}));stripe.position.set(.301,.1+k*.12,0);stripe.rotation.set(0,Math.PI/2,.35);pr.add(stripe);}
 const lines=['ЕС ЭВМ-1066 / ОС 6.1','JOB 4471 PAYROLL... OK','JOB 4472 DOSIMETRY ..','READ TAPE 07 ......','*** ПАРИТЕТ ОШИБКА ***','RETRY 1 ... OK','JOB 4473 INVENTORY ..','CORE TEMP LOG -> T09','SPEC-09 OBS. FILE ..','ACCESS DENIED / 3'];let row=0,lastScroll=0;
 const log=[];
 return {update(t){
  for(const r of reels){const run=Math.sin(t*.3+r.phase)>-.2;r.reel.rotation.x+=run?r.speed*.05:0;}
  for(const l of lamps){const on=Math.sin(t*l.rate+l.phase)>.2;l.lamp.material.color.setHex(on?l.colour:0x332a18);}
  if(t-lastScroll>.6){lastScroll=t;log.push(lines[row++%lines.length]);if(log.length>8)log.shift();
   crt.fillStyle='#071810';crt.fillRect(0,0,128,96);crt.fillStyle='#8fe0a0';crt.font='8px monospace';log.forEach((ln,i)=>crt.fillText(ln,3,11+i*11));if(Math.floor(t*2)%2)crt.fillRect(3+log.at(-1).length*4.8,84,4,7);crtTex.needsUpdate=true;}
 }};
}
