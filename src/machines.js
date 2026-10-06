import * as THREE from 'three';
import {MACHINES,puzzle,sabPuzzle,machineSeed,crossings} from '../shared/machines.js';
import {SABOTAGE,CAMERAS} from '../shared/stations.js';
import {isWalkable,SOLIDS} from '../shared/world.js';

// Tactile machines worked in 3D. Lean in (camera eases to the machine), then drag real parts:
// wheels and knobs turn with a circular drag, levers and fuses with a vertical drag, wires and slots click.
const TAU=Math.PI*2;
const mat=(c,o={})=>new THREE.MeshLambertMaterial({color:c,...o});
const M={steel:mat(0x6a7062),dark:mat(0x22271f),bakelite:mat(0x151513),brass:mat(0xa88a4a),red:mat(0x9a2e22),cream:mat(0xd8cfaa),wood:mat(0x5a3a22),olive:mat(0x4f5a3c),glass:new THREE.MeshBasicMaterial({color:0x1a2219})};
function screen(w,h,px=128,py=96){
 const c=document.createElement('canvas');c.width=px;c.height=py;const ctx=c.getContext('2d');const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));return {mesh,ctx,draw(fn){fn(ctx,px,py);t.needsUpdate=true;}};
}
const box=(w,h,d,m,x=0,y=0,z=0,parent)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent?.add(o);return o;};
const cyl=(r1,r2,h,m,seg=10)=>new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),m);
// A handwheel: rim, spokes and a knob; faces local +z.
function handwheel(r,m=M.red){const g=new THREE.Group();const rim=new THREE.Mesh(new THREE.TorusGeometry(r,r*.11,5,14),m);g.add(rim);for(let i=0;i<3;i++){const s=box(r*2,r*.12,r*.12,M.steel);s.rotation.z=i*Math.PI/3;g.add(s);}const hub=cyl(r*.2,r*.2,r*.3,M.steel);hub.rotation.x=Math.PI/2;g.add(hub);const knob=cyl(r*.09,r*.09,r*.5,M.bakelite,6);knob.rotation.x=Math.PI/2;knob.position.set(r*.85,0,r*.25);g.add(knob);return g;}
function knob(r,m=M.bakelite){const g=new THREE.Group();const k=cyl(r,r*1.1,r*.8,m,12);k.rotation.x=Math.PI/2;g.add(k);const mark=box(r*.18,r*.8,r*.1,M.cream,0,r*.5,r*.42);g.add(mark);return g;}
function label(text,w=.6,h=.12,bg='#121b14',fg='#d6c68f'){const s=screen(w,h,256,Math.round(256*h/w));s.draw((g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.fillStyle=fg;g.font=`bold ${Math.floor(H*.55)}px monospace`;g.textAlign='center';g.fillText(text,W/2,H*.7);});return s.mesh;}
function gaugeFace(s,value,max,lo,hi,title){s.draw((g,W,H)=>{g.fillStyle='#d9d2b3';g.fillRect(0,0,W,H);const cx=W/2,cy=H*.62,r=H*.48;g.strokeStyle='#2a2a22';g.lineWidth=2;g.beginPath();g.arc(cx,cy,r,Math.PI,0);g.stroke();
 const a=v=>Math.PI+Math.max(0,Math.min(1,v/max))*Math.PI;g.strokeStyle='#5f8a3a';g.lineWidth=6;g.beginPath();g.arc(cx,cy,r-5,a(lo),a(hi));g.stroke();
 for(let i=0;i<=10;i++){const t=Math.PI+i/10*Math.PI;g.strokeStyle='#2a2a22';g.lineWidth=1;g.beginPath();g.moveTo(cx+Math.cos(t)*(r-2),cy+Math.sin(t)*(r-2));g.lineTo(cx+Math.cos(t)*(r-8),cy+Math.sin(t)*(r-8));g.stroke();}
 g.strokeStyle='#9a2e22';g.lineWidth=2.5;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a(value))*(r-6),cy+Math.sin(a(value))*(r-6));g.stroke();g.fillStyle='#2a2a22';g.font='bold 9px monospace';g.textAlign='center';g.fillText(title,cx,H-4);});}
// Wall points: mount a rig on the nearest wall to a stand point.
function wallward(x,z){let best=null;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])for(let d=.4;d<=1.6;d+=.1){if(!isWalkable(x+dx*d,z+dz*d,SOLIDS,.05,0)){if(!best||d<best.d)best={dx,dz,d};break;}}return best||{dx:0,dz:-1,d:.6};}

export function createMachines(scene,{camera,canvas,onAnswer,onSabAnswer,onSound,onExit}){
 const machines=new Map();
 const place=(group,anchor,face)=>{group.position.set(anchor.x,anchor.y,anchor.z);group.rotation.y=Math.atan2(face.x,face.z);scene.add(group);group.userData.dynamic=true;};
 // ---------- crew machines ----------
 const builders={
  harness(def){
   // A junction cabinet beside the reactor console: pegs on a board, cables sagging between them.
   const g=new THREE.Group();box(1.05,1.9,.3,M.olive,0,-.1,-.2,g);
   const boardTex=screen(.98,.62,196,124);boardTex.draw((c,W,H)=>{c.fillStyle='#3b3f31';c.fillRect(0,0,W,H);c.fillStyle='#22251c';for(let y=6;y<H;y+=10)for(let x=6;x<W;x+=10)c.fillRect(x,y,2,2);c.fillStyle='#d6a14e';c.font='bold 8px monospace';c.fillText('ЖГУТ / HARNESS / NO CROSSED LINES',6,H-4);});
   boardTex.mesh.material=new THREE.MeshLambertMaterial({map:boardTex.mesh.material.map});g.add(boardTex.mesh);
   g.add(label('ВСПОМОГАТЕЛЬНАЯ ЦЕПЬ / AUX CIRCUIT',.9,.07));g.children.at(-1).position.set(0,.38,.01);
   const pegs=[],cables=[],colours=[0xc9a032,0x9a2e22,0x2f4f2f,0x2a2a2a,0xd8d5c4,0x3a5a7a,0x7a4a2a,0xa06a3a,0x5a6a3a,0x8a7a6a];
   const red=new THREE.MeshLambertMaterial({color:0xd03a22,emissive:0x5a0a00});
   const st={pos:[],done:false,hold:0,dirty:true};let p;
   const plane=new THREE.Plane(),tmpM=new THREE.Matrix4();
   function rebuild(){
    for(const c of cables){g.remove(c.mesh);c.mesh.geometry.dispose();}cables.length=0;
    const bad=crossings(p.edges,st.pos);
    p.edges.forEach(([a,b],i)=>{
     const A=new THREE.Vector3(st.pos[a][0],st.pos[a][1],.05),B=new THREE.Vector3(st.pos[b][0],st.pos[b][1],.05);
     const mid=A.clone().add(B).multiplyScalar(.5);mid.y-=.04+A.distanceTo(B)*.12;mid.z+=.05+i*.006;
     const curve=new THREE.CatmullRomCurve3([A,mid,B]);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,14,.011,5,false),bad.has(i)?red:mat(colours[i%colours.length]));g.add(mesh);cables.push({mesh});
    });
    st.crossed=bad.size;st.dirty=false;
   }
   for(let i=0;i<7;i++){const peg=new THREE.Group();g.add(peg);const post=cyl(.022,.022,.07,M.brass,8);post.rotation.x=Math.PI/2;post.position.z=.035;peg.add(post);const cap=cyl(.034,.034,.03,M.bakelite,10);cap.rotation.x=Math.PI/2;cap.position.z=.075;peg.add(cap);pegs.push(peg);}
   return {g,load(q){p=q;st.pos=q.start.map(v=>v.slice());st.done=false;st.hold=0;st.dirty=true;},
    parts:pegs.map((peg,i)=>({mesh:peg,type:'plane',
     down:()=>{g.updateMatrixWorld();const n=new THREE.Vector3(0,0,1).transformDirection(g.matrixWorld);const o=new THREE.Vector3(0,0,.05).applyMatrix4(g.matrixWorld);plane.setFromNormalAndCoplanarPoint(n,o);onSound('cable');return true;},
     move:ray=>{const hitP=new THREE.Vector3();if(!ray.intersectPlane(plane,hitP))return;tmpM.copy(g.matrixWorld).invert();hitP.applyMatrix4(tmpM);
      st.pos[i]=[Math.max(-.44,Math.min(.44,hitP.x)),Math.max(-.27,Math.min(.27,hitP.y))];st.dirty=true;},
     up:()=>onSound('peg')})),
    update(dt){if(!p)return;if(st.dirty)rebuild();pegs.forEach((peg,i)=>peg.position.set(st.pos[i][0],st.pos[i][1],0));
     st.hold=st.crossed===0?st.hold+dt:0;if(st.crossed>0&&Math.random()<dt*3)onSound('buzz');
     if(st.hold>.8&&!st.done){st.done=true;onAnswer({pos:st.pos.map(v=>[+v[0].toFixed(3),+v[1].toFixed(3)])});}},
    status(){return st.crossed?`${st.crossed} CABLES CROSSING`:'CLEAR / CLOSING CIRCUIT';},
    fail(){st.done=false;st.hold=0;},
    hint:'DRAG THE PEGS TO UNTANGLE THE HARNESS. NO CABLE MAY CROSS ANOTHER: CROSSED CABLES GLOW RED. WHEN NONE CROSS, THE CIRCUIT CLOSES.'};
  },
  valves(def){
   const g=new THREE.Group();box(2.1,1.3,.08,M.olive,0,0,-.04,g);
   g.add(label('ГЛАВНЫЙ КОЛЛЕКТОР / MAIN MANIFOLD',1.6,.1));g.children.at(-1).position.set(0,.56,.01);
   const wheels=[],gauges=[];
   for(let i=0;i<3;i++){const x=(i-1)*.62;const pipe=cyl(.06,.06,1.2,M.steel,8);pipe.position.set(x,-.05,.08);g.add(pipe);
    const w=handwheel(.2);w.position.set(x,-.28,.2);g.add(w);wheels.push(w);
    const s=screen(.32,.24,96,72);s.mesh.position.set(x,.25,.02);g.add(s.mesh);gauges.push(s);box(.36,.28,.04,M.dark,x,.25,-.005,g);}
   const st={w:[0,0,0],hold:0,done:false};let p;
   return {g,load(q){p=q;st.w=[0,0,0];st.hold=0;st.done=false;},
    parts:wheels.map((w,i)=>({mesh:w,type:'wheel',drag:d=>{st.w[i]=Math.max(0,Math.min(p.max,st.w[i]+d));onSound('turn');}})),
    update(dt){if(!p)return;const gv=p.M.map(row=>row.reduce((s,v,j)=>s+v*st.w[j],0));const max=p.M.map(row=>row.reduce((a,b)=>a+b)*p.max);
     wheels.forEach((w,i)=>w.rotation.z=-st.w[i]*TAU);gauges.forEach((s,i)=>gaugeFace(s,gv[i],max[i],p.targets[i]-.75,p.targets[i]+.75,'G'+(i+1)));
     const ok=gv.every((v,i)=>Math.abs(v-p.targets[i])<=.75);st.hold=ok?st.hold+dt:0;if(st.hold>1.2&&!st.done){st.done=true;onAnswer({w:st.w.slice()});}},
    hint:'DRAG IN CIRCLES TO TURN A WHEEL. EACH WHEEL MOVES MORE THAN ONE GAUGE. GET ALL THREE NEEDLES INTO THE GREEN.'};
  },
  phone(def){
   const g=new THREE.Group();const base=box(.26,.1,.2,M.bakelite,0,.05,0,g);void base;
   const handset=new THREE.Group();handset.position.set(0,.15,-.05);g.add(handset);const bar=cyl(.025,.025,.26,M.bakelite,6);bar.rotation.z=Math.PI/2;handset.add(bar);for(const s of [-1,1]){const cup=cyl(.045,.04,.05,M.bakelite,8);cup.position.set(s*.12,-.02,0);handset.add(cup);}
   const dial=new THREE.Group();dial.position.set(0,.105,.04);dial.rotation.x=-Math.PI/2+.35;g.add(dial);
   const disc=cyl(.085,.085,.012,M.cream,20);disc.rotation.x=Math.PI/2;dial.add(disc);
   const holes=[];for(let d=0;d<10;d++){const a=Math.PI/3+d*(TAU*.8/10);const h=cyl(.011,.011,.016,M.dark,8);h.rotation.x=Math.PI/2;h.position.set(Math.cos(a)*.06,Math.sin(a)*.06,.004);dial.add(h);holes.push(a);}
   const stop=box(.01,.03,.01,M.steel,Math.cos(-Math.PI/6)*.085,Math.sin(-Math.PI/6)*.085,.01,dial);void stop;
   const card=screen(.3,.22,240,176);card.mesh.rotation.x=-Math.PI/2+.25;card.mesh.position.set(-.34,.01,.02);g.add(card.mesh);
   const note=screen(.12,.12,96,96);note.mesh.rotation.x=-Math.PI/2+.25;note.mesh.rotation.z=.15;note.mesh.position.set(.2,.012,.08);g.add(note.mesh);
   const st={digits:'',spin:0,active:-1,need:0,done:false};let p,order;
   const digitAt=angle=>{let best=-1,bd=1;holes.forEach((a,d)=>{const diff=Math.abs(((angle-a-st.spin)%TAU+TAU+Math.PI)%TAU-Math.PI);if(diff<bd){bd=diff;best=d;}});return bd<.3?best:-1;};
   return {g,load(q){p=q;st.digits='';st.spin=0;st.done=false;order=[...q.entries.keys()].sort((a,b)=>q.entries[a].num.localeCompare(q.entries[b].num));
     card.draw((c,W,H)=>{c.fillStyle='#e8dfbf';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 12px monospace';c.fillText('ТЕЛЕФОННЫЙ СПРАВОЧНИК / DIRECTORY',6,16);c.font='10px monospace';order.forEach((i,k)=>{c.fillText(q.entries[i].name,6,40+k*22);c.fillText(q.entries[i].num,196,40+k*22);});});
     note.draw((c,W,H)=>{c.fillStyle='#d9c36a';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 11px monospace';['ЗВОНИТЬ','ДЕЖУРНОМУ','РЕАКТОРА!','CALL THE','REACTOR','DUTY'].forEach((t,i)=>c.fillText(t,6,16+i*14));});},
    parts:[{mesh:disc,type:'dial',down:(angle)=>{st.active=digitAt(angle);if(st.active<0)return false;const a=holes[st.active]+st.spin;st.need=((a-(-Math.PI/6))%TAU+TAU)%TAU;return true;},
     drag:d=>{if(st.active<0)return;st.spin=Math.max(0,Math.min(st.need,st.spin+d*TAU));},
     up:()=>{if(st.active<0)return;if(st.spin>=st.need-.12){st.digits+=String((st.active+1)%10);onSound('turn');if(st.digits.length===4&&!st.done){const num=st.digits;st.done=true;setTimeout(()=>{onAnswer({number:num});},400);}}st.active=-1;}}],
    update(dt){if(st.active<0&&st.spin>0){st.spin=Math.max(0,st.spin-dt*5);if(Math.floor(st.spin*4)!==Math.floor((st.spin+dt*5)*4))onSound('tick');}dial.rotation.z=-st.spin;},
    status(){return `DIALLED: ${st.digits.padEnd(4,'_')}`;},
    fail(){st.digits='';st.done=false;},
    hint:'FIND THE NUMBER IN THE DIRECTORY. GRAB A FINGER HOLE AND DRAG IT ROUND TO THE METAL STOP, THEN LET GO.'};
  },
  radio(def){
   const g=new THREE.Group();box(.55,.32,.26,M.wood,0,.16,-.06,g);box(.5,.27,.01,M.dark,0,.17,.075,g);
   const dial=screen(.3,.1,192,64);dial.mesh.position.set(-.05,.24,.082);g.add(dial.mesh);const meter=screen(.1,.08,64,48);meter.mesh.position.set(.18,.24,.082);g.add(meter.mesh);
   for(let i=0;i<5;i++)box(.24,.008,.006,M.dark,-.05,.08+i*.022,.082,g);
   const coarse=knob(.04);coarse.position.set(.1,.11,.09);g.add(coarse);const fine=knob(.026);fine.position.set(.2,.11,.09);g.add(fine);
   const st={c:.1,f:0,hold:0,done:false};let p;
   return {g,load(q){p=q;Object.assign(st,{c:Math.random()*.9,f:0,hold:0,done:false});},
    parts:[{mesh:coarse,type:'wheel',drag:d=>{st.c=Math.max(0,Math.min(1,st.c+d/3));}},{mesh:fine,type:'wheel',drag:d=>{st.f=Math.max(-.06,Math.min(.06,st.f+d*.03));}}],
    update(dt){if(!p)return;const f=6+st.c*3+st.f,sig=Math.exp(-Math.pow((f-p.target)/.035,2));coarse.rotation.z=-st.c*3*TAU;fine.rotation.z=-st.f/.03*TAU;
     dial.draw((c,W,H)=>{c.fillStyle='#d8c58a';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='9px monospace';for(let m=6;m<=9;m+=.5){const x=(m-6)/3*W;c.fillRect(x,H-16,1,8);c.fillText(m.toFixed(1),x+2,H-20);}c.fillStyle='#9a2e22';c.fillRect((f-6)/3*W,4,2,H-8);c.fillStyle='#2a261c';c.fillText(`${f.toFixed(3)} MHz`,4,12);});
     meter.draw((c,W,H)=>{c.fillStyle='#d9d2b3';c.fillRect(0,0,W,H);c.strokeStyle='#9a2e22';c.lineWidth=2;c.beginPath();c.moveTo(W/2,H-4);const a=Math.PI*(1-sig)+.0;c.lineTo(W/2+Math.cos(Math.PI+(1-sig)*0+sig*Math.PI)*W*.4*-1,H-4-Math.sin(sig*Math.PI*.9+.1)*H*.8);c.stroke();});
     onSound(sig>.6?'radio-clear':'static',1-sig);
     st.hold=Math.abs(f-p.target)<=.012?st.hold+dt:0;if(st.hold>1.5&&!st.done){st.done=true;onAnswer({freq:+f.toFixed(4)});}},
    hint:'BIG KNOB SWEEPS THE BAND, SMALL KNOB FINE-TUNES. WATCH THE SIGNAL NEEDLE. THE FREQUENCY IS ON THE BARRACKS CALENDAR.'};
  },
  centrifuge(def){
   const g=new THREE.Group();const tub=cyl(.22,.24,.22,mat(0x55705a),20);tub.position.y=.11;g.add(tub);const rotor=new THREE.Group();rotor.position.y=.23;g.add(rotor);
   const plate=cyl(.18,.18,.02,mat(0xb8bca8),20);rotor.add(plate);const slots=[],tubes=[];
   for(let i=0;i<8;i++){const a=i*TAU/8;const s=cyl(.028,.028,.025,M.dark,8);s.position.set(Math.cos(a)*.13,.01,Math.sin(a)*.13);rotor.add(s);slots.push(s);const t=cyl(.018,.018,.12,mat(0xc8d4b0),8);t.position.set(Math.cos(a)*.13,.06,Math.sin(a)*.13);t.visible=false;rotor.add(t);tubes.push(t);}
   const crack=box(.05,.005,.01,M.red);rotor.add(crack);
   const speed=knob(.035);speed.position.set(.2,.1,.2);speed.rotation.y=.4;g.add(speed);const readout=screen(.16,.08,96,48);readout.mesh.position.set(-.12,.1,.245);g.add(readout.mesh);
   const st={on:new Set(),spin:0,v:0,done:false,wobble:0};let p;
   return {g,load(q){p=q;st.on=new Set([q.pre]);st.v=0;st.done=false;const a=q.cracked*TAU/8;crack.position.set(Math.cos(a)*.13,.025,Math.sin(a)*.13);crack.rotation.y=-a;},
    parts:[...slots.map((s,i)=>({mesh:s,type:'click',click:()=>{if(st.v>.05||i===p.cracked||i===p.pre)return;if(st.on.has(i))st.on.delete(i);else if(st.on.size<4)st.on.add(i);onSound('turn');}})),
     {mesh:speed,type:'wheel',drag:d=>{st.v=Math.max(0,Math.min(1,st.v+d*.5));}}],
    update(dt){if(!p)return;tubes.forEach((t,i)=>t.visible=st.on.has(i));const bal=[...st.on].reduce((a,i)=>[a[0]+Math.cos(i*TAU/8),a[1]+Math.sin(i*TAU/8)],[0,0]);const unbal=Math.hypot(...bal)>.01||st.on.size!==4;
     st.spin+=st.v*dt*30;rotor.rotation.y=st.spin;onSound('whine',st.v*.05);speed.rotation.z=-st.v*TAU;st.wobble=unbal?st.v:0;g.position.x=(Math.random()-.5)*st.wobble*.02;
     if(unbal&&st.v>.6){st.v=0;onSound('reject');}
     readout.draw((c,W,H)=>{c.fillStyle='#071810';c.fillRect(0,0,W,H);c.fillStyle=unbal?'#de9671':'#89bf8d';c.font='bold 10px monospace';c.fillText(`${Math.round(st.v*4000)} RPM`,4,16);c.fillText(unbal?'UNBALANCED':'BALANCED',4,34);});
     if(!unbal&&st.v>.95&&!st.done){st.done=true;onAnswer({slots:[...st.on]});}},
    hint:'CLICK SLOTS TO LOAD TUBES. FOUR TUBES, EVENLY SPACED, NOT THE CRACKED SLOT. THEN TURN THE SPEED KNOB ALL THE WAY UP.'};
  },
  lathe(def){
   const g=new THREE.Group();box(.7,.36,.05,M.olive,0,0,-.04,g);const crank=handwheel(.13,M.steel);crank.position.set(-.18,-.05,.08);g.add(crank);const fine=knob(.04,M.brass);fine.position.set(.12,-.08,.04);g.add(fine);
   const read=screen(.26,.12,160,72);read.mesh.position.set(.14,.08,.0);g.add(read.mesh);const ticket=screen(.16,.12,96,72);ticket.mesh.position.set(-.2,.24,.0);ticket.mesh.rotation.z=.08;g.add(ticket.mesh);
   const lever=new THREE.Group();lever.position.set(.3,-.05,.04);g.add(lever);const arm=box(.03,.22,.03,M.red,0,.1,0);lever.add(arm);
   const st={v:0,done:false,pull:0};let p;
   return {g,load(q){p=q;st.v=Math.round(Math.random()*40*10)/10;st.done=false;st.pull=0;ticket.draw((c,W,H)=>{c.fillStyle='#e8dfbf';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 10px monospace';c.fillText('НАРЯД / JOB',4,14);c.fillText('ШТОК КЛАПАНА',4,32);c.font='bold 14px monospace';c.fillText(`${q.target.toFixed(1)} MM`,4,56);});},
    parts:[{mesh:crank,type:'wheel',drag:d=>{st.v=Math.max(0,Math.min(40,st.v+d*2));}},{mesh:fine,type:'wheel',drag:d=>{st.v=Math.max(0,Math.min(40,st.v+d*.2));}},
     {mesh:arm,type:'lever',drag:d=>{st.pull=Math.max(0,Math.min(1,st.pull+d));if(st.pull>.9&&!st.done){st.done=true;onAnswer({value:+st.v.toFixed(2)});}}}],
    update(){if(!p)return;crank.rotation.z=-st.v/2*TAU;fine.rotation.z=-st.v/.2*TAU;lever.rotation.x=-st.pull*1.2;if(!st.done&&st.pull>0)st.pull=Math.max(0,st.pull-.02);
     read.draw((c,W,H)=>{c.fillStyle='#cfc7a2';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';for(let i=-8;i<=8;i++){const x=W/2+i*9-(st.v*10%1)*9;c.fillRect(x,8,1,(Math.round(st.v*10)+i)%5?8:14);}c.font='bold 16px monospace';c.textAlign='center';c.fillText(st.v.toFixed(1),W/2,H-12);c.fillStyle='#9a2e22';c.fillRect(W/2,4,2,22);});},
    hint:'CRANK FOR WHOLE MILLIMETRES, BRASS KNOB FOR TENTHS. MATCH THE JOB TICKET EXACTLY, THEN PULL THE RED FEED LEVER DOWN.'};
  },
  synchro(def){
   const g=new THREE.Group();box(.5,.42,.2,M.olive,0,.21,-.02,g);const dialS=screen(.28,.28,128,128);dialS.mesh.position.set(-.06,.25,.081);g.add(dialS.mesh);
   const sp=knob(.045);sp.position.set(.17,.32,.09);g.add(sp);const lever=new THREE.Group();lever.position.set(.17,.12,.09);g.add(lever);const t=box(.12,.03,.03,M.red,0,.1,0);lever.add(t);box(.025,.1,.025,M.steel,0,.05,0,lever);
   g.add(label('СИНХРОНИЗАЦИЯ / SYNC',.44,.06));g.children.at(-1).position.set(0,.45,.081);
   const st={s:0,theta:0,pull:0,done:false};let p;
   return {g,load(q){p=q;st.s=Math.random();st.theta=0;st.pull=0;st.done=false;},
    parts:[{mesh:sp,type:'wheel',drag:d=>{st.s=Math.max(0,Math.min(1,st.s+d*.25));}},{mesh:t,type:'lever',drag:d=>{st.pull=Math.max(0,Math.min(1,st.pull+d));if(st.pull>.9&&!st.done){st.done=true;const a=((st.theta%360)+540)%360-180;onAnswer({speed:+st.s.toFixed(3),angle:+a.toFixed(1)});}}}],
    update(dt){if(!p)return;st.theta+=(st.s-p.speed)*720*dt;sp.rotation.z=-st.s*4*TAU;lever.rotation.x=-st.pull*1.3;if(!st.done&&st.pull>0)st.pull=Math.max(0,st.pull-.02);
     dialS.draw((c,W,H)=>{c.fillStyle='#d9d2b3';c.fillRect(0,0,W,H);c.strokeStyle='#2a2a22';c.lineWidth=2;c.beginPath();c.arc(W/2,H/2,W*.42,0,TAU);c.stroke();c.fillStyle='#5f8a3a';c.beginPath();c.moveTo(W/2,H/2);c.arc(W/2,H/2,W*.4,-Math.PI/2-.31,-Math.PI/2+.31);c.fill();
      c.font='bold 9px monospace';c.fillStyle='#2a2a22';c.textAlign='center';c.fillText('SLOW',W*.22,H*.85);c.fillText('FAST',W*.78,H*.85);const a=st.theta*Math.PI/180-Math.PI/2;c.strokeStyle='#9a2e22';c.lineWidth=3;c.beginPath();c.moveTo(W/2,H/2);c.lineTo(W/2+Math.cos(a)*W*.38,H/2+Math.sin(a)*W*.38);c.stroke();});},
    fail(){st.done=false;st.pull=0;},
    hint:'TURN THE KNOB UNTIL THE NEEDLE CREEPS SLOWLY, THEN THROW THE RED BREAKER DOWN AS IT PASSES THE GREEN WEDGE AT THE TOP.'};
  },
  rods(def){
   const g=new THREE.Group();box(.8,.08,.5,M.dark,0,0,0,g);const levers=[],bars=[];
   for(let i=0;i<2;i++){const x=(i?.2:-.2);const piv=new THREE.Group();piv.position.set(x,.05,0);g.add(piv);const arm=box(.04,.45,.04,M.steel,0,.22,0);piv.add(arm);const grip=cyl(.04,.04,.1,M.red,8);grip.position.y=.46;piv.add(grip);levers.push({piv,grip});
    const s=screen(.12,.3,48,120);s.mesh.position.set(x*1.9,.2,.2);g.add(s.mesh);bars.push(s);box(.15,.34,.03,M.dark,x*1.9,.2,.18,g);}
   const st={v:[.9,.9],hold:0,done:false};let p;
   return {g,load(q){p=q;st.v=[.9,.9];st.hold=0;st.done=false;},
    parts:levers.map((l,i)=>({mesh:l.grip,type:'lever',drag:d=>{st.v[i]=Math.max(0,Math.min(1,st.v[i]-d));}})),
    update(dt){if(!p)return;st.v=st.v.map(v=>Math.min(1,v+dt*.025));levers.forEach((l,i)=>l.piv.rotation.x=(st.v[i]-.5)*1.1);
     bars.forEach((s,i)=>s.draw((c,W,H)=>{c.fillStyle='#071810';c.fillRect(0,0,W,H);const tgt=i?p.b:p.a;c.fillStyle='#5f8a3a';c.fillRect(4,(1-tgt)*H-6,W-8,12);c.fillStyle='#89bf8d';c.fillRect(W/2-6,0,12,(1-st.v[i])*H);c.fillStyle='#d6c68f';c.font='9px monospace';c.fillText(i?'B':'A',2,10);}));
     const ok=Math.abs(st.v[0]-p.a)<=.04&&Math.abs(st.v[1]-p.b)<=.04;st.hold=ok?st.hold+dt:0;if(st.hold>1.8&&!st.done){st.done=true;onAnswer({a:+st.v[0].toFixed(3),b:+st.v[1].toFixed(3)});}},
    hint:'DRAG BOTH RED GRIPS SO EACH ROD SITS IN ITS GREEN BAND. THEY CREEP BACK UP. HOLD BOTH IN PLACE FOR TWO SECONDS.'};
  },
  fuel(def){
   const g=new THREE.Group();box(1.4,1.1,.12,M.olive,0,.2,-.06,g);const wheels=[],letters=['А','Б','В'];
   for(let i=0;i<3;i++){const w=handwheel(.16,M.red);w.position.set((i-1)*.45,0,.12);g.add(w);wheels.push(w);g.add(label(letters[i],.12,.1));g.children.at(-1).position.set((i-1)*.45,.24,.01);}
   const plac=screen(.5,.18,200,72);plac.mesh.position.set(0,.6,.01);g.add(plac.mesh);
   const st={turns:[0,0,0],opened:[],done:false};let p;
   return {g,load(q){p=q;st.turns=[0,0,0];st.opened=[];st.done=false;plac.draw((c,W,H)=>{c.fillStyle='#d6c68f';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 14px monospace';c.textAlign='center';c.fillText('ПОРЯДОК ОТКРЫТИЯ',W/2,22);c.font='bold 20px monospace';c.fillText(q.order.map(i=>letters[i]).join(' → '),W/2,52);});},
    parts:wheels.map((w,i)=>({mesh:w,type:'wheel',drag:d=>{if(st.opened.includes(i)||st.done)return;st.turns[i]=Math.max(0,st.turns[i]+d);onSound('turn');
     if(st.turns[i]>=2){st.opened.push(i);if(st.opened.some((v,k)=>v!==p.order[k])){onSound('reject');st.turns=[0,0,0];st.opened=[];}else if(st.opened.length===3){st.done=true;onAnswer({order:st.opened.slice()});}}}})),
    update(){wheels.forEach((w,i)=>w.rotation.z=-st.turns[i]*TAU);},
    status(){return `OPEN: ${st.opened.map(i=>letters[i]).join(' ')||'—'}`;},
    hint:'OPEN THE VALVES IN THE ORDER ON THE PLACARD. TWO FULL TURNS EACH. WRONG ORDER SPIKES THE LINE AND SHUTS THEM ALL.'};
  },
 };
 for(const def of MACHINES){const b=builders[def.kind](def);place(b.g,def.anchor,def.face);machines.set(def.id,{def,...b,seed:null});}
 // ---------- sabotage rigs ----------
 const rigs=new Map();
 function rigAt(id,stand,build){const w=wallward(stand.x,stand.z);const anchor={x:stand.x+w.dx*(w.d-.12),y:1.25,z:stand.z+w.dz*(w.d-.12)};const face={x:-w.dx,z:-w.dz};const b=build();place(b.g,anchor,face);rigs.set(id,{id,anchor,face,...b});}
 const stationOf=id=>SABOTAGE.find(s=>s.id===id);
 rigAt('valve',stationOf('valve'),()=>{
  const g=new THREE.Group();const w=handwheel(.36,M.red);w.position.z=.1;g.add(w);const st={turns:0,dragging:false,done:false};
  return {g,load(){st.turns=0;st.done=false;},parts:[{mesh:w,type:'wheel',down:()=>{st.dragging=true;return true;},up:()=>{st.dragging=false;},drag:d=>{st.turns=Math.max(0,st.turns-d);onSound('squeal');if(st.turns>=5&&!st.done){st.done=true;onSabAnswer({turns:st.turns});}}}],
   update(dt,state){if(!st.dragging&&!st.done)st.turns=Math.max(0,st.turns-dt*.6);w.rotation.z=(state?.valve?10*TAU:0)+st.turns*TAU;},status(){return `REVERSED ${st.turns.toFixed(1)} / 5 TURNS`;},
   hint:'SPIN THE WHEEL BACKWARDS (ANTICLOCKWISE) FIVE FULL TURNS. IT FIGHTS YOU: STOP AND IT CREEPS BACK. EVERYONE NEARBY HEARS IT.'};
 });
 rigAt('breaker',{x:36,z:-12.6},()=>{
  const g=new THREE.Group();box(.9,.42,.06,M.dark,0,0,-.02,g);const card=screen(.3,.3,128,128);card.mesh.position.set(.32,.0,.02);g.add(card.mesh);const fuses=[];const names=['A','B','C','N','PE'];
  for(let i=0;i<5;i++){const f=new THREE.Group();f.position.set(-.34+i*.13,0,.04);g.add(f);const body=cyl(.03,.03,.16,M.cream,8);f.add(body);const cap=cyl(.034,.034,.03,M.steel,8);cap.position.y=.09;f.add(cap);fuses.push({f,body});g.add(label(names[i],.08,.05));g.children.at(-1).position.set(-.34+i*.13,-.15,.02);}
  const st={pulled:[],pull:[0,0,0,0,0],done:false};let p;
  return {g,load(q){p=q;st.pulled=[];st.pull=[0,0,0,0,0];st.done=false;card.draw((c,W,H)=>{c.fillStyle='#e8dfbf';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 10px monospace';c.fillText('ПОРЯДОК ИЗОЛЯЦИИ',4,14);c.fillText('ISOLATION ORDER',4,28);c.font='bold 18px monospace';c.fillText(q.order.map(i=>q.phases[i]).join(' '),6,60);c.fillStyle='#9a2e22';c.font='bold 10px monospace';c.fillText(`${q.phases[q.live]}: LIVE`,4,96);c.fillText('НЕ ТРОГАТЬ!',4,112);});},
   parts:fuses.map((fz,i)=>({mesh:fz.body,type:'lever',drag:d=>{if(st.pulled.includes(i)||st.done)return;st.pull[i]=Math.max(0,Math.min(1,st.pull[i]+d*.8));onSound('spark',.3);if(st.pull[i]>=1){st.pulled.push(i);if(st.pulled.length===3||i===p.live||st.pulled.some((v,k)=>v!==p.order[k])){st.done=true;onSabAnswer({order:st.pulled.slice()});}}}})),
   update(dt,state){fuses.forEach((fz,i)=>{const out=state?.blackout&&p?.order.includes(i)?1:st.pull[i];fz.f.position.z=.04+out*.12;});if(!st.done)st.pull=st.pull.map((v,i)=>st.pulled.includes(i)?1:Math.max(0,v-dt*.4));},
   fail(){st.pulled=[];st.pull=[0,0,0,0,0];st.done=false;},
   hint:'DRAG FUSES OUT IN THE ISOLATION ORDER ON THE CARD. EACH ONE IS STIFF. TOUCH THE LIVE ONE AND YOU GET A SHOCK EVERYONE HEARS.'};
 });
 rigAt('doors',stationOf('doors'),()=>{
  const g=new THREE.Group();box(.5,.3,.06,M.dark,-.32,0,-.02,g);const dials=[];for(let i=0;i<3;i++){const k=knob(.05,M.cream);k.position.set(-.48+i*.16,0,.04);g.add(k);dials.push(k);}
  const pull=new THREE.Group();pull.position.set(.08,-.12,.06);g.add(pull);const grip=box(.07,.36,.07,M.red,0,.18,0);pull.add(grip);const ball=cyl(.06,.06,.12,M.bakelite,8);ball.position.y=.38;pull.add(ball);g.add(label('ПЕРЕКРЫТИЕ / OVERRIDE',.5,.07));g.children.at(-1).position.set(-.32,.2,.01);
  const st={code:[0,0,0],acc:[0,0,0],pull:0,done:false};
  return {g,load(){st.code=[0,0,0];st.acc=[0,0,0];st.pull=0;st.done=false;},
   parts:[...dials.map((k,i)=>({mesh:k,type:'wheel',drag:d=>{st.acc[i]+=d*10;const n=((Math.round(st.acc[i])%10)+10)%10;if(n!==st.code[i]){st.code[i]=n;onSound('tick');}}})),
    {mesh:grip,type:'lever',drag:d=>{st.pull=Math.max(0,Math.min(1,st.pull+d));if(st.pull>.9&&!st.done){st.done=true;onSabAnswer({code:st.code.slice()});}}}],
   update(dt,state){dials.forEach((k,i)=>k.rotation.z=-st.code[i]/10*TAU);pull.rotation.x=state?.sealed?-1:-st.pull;if(!st.done&&st.pull>0)st.pull=Math.max(0,st.pull-.02);},
   status(){return `CODE ${st.code.join('-')}`;},fail(){st.done=false;st.pull=0;},
   hint:'SET THE THREE DIALS TO YOUR HANDLER\'S OVERRIDE CODE, THEN PULL THE RED LEVER.'};
 });
 for(const cam of CAMERAS){rigAt('coax-'+cam.id,cam.box,()=>{
  const g=new THREE.Group();box(.36,.3,.06,M.steel,0,-.25,-.02,g);const card=screen(.3,.06,192,40);card.mesh.position.set(0,-.08,.02);g.add(card.mesh);const wires=[];const colours={RED:0x9a2e22,BLACK:0x151513,WHITE:0xd8d5c4,GREEN:0x3d6a3a,YELLOW:0xc9a032};
  const st={cut:-1,done:false};let p;
  return {g,load(q){p=q;st.cut=-1;st.done=false;for(const w of wires)g.remove(w.grp);wires.length=0;q.colours.forEach((c,i)=>{const grp=new THREE.Group();grp.position.set(-.12+i*.06,-.25,.03);g.add(grp);const wire=cyl(.012,.012,.24,mat(colours[c]),6);grp.add(wire);for(let s=0;s<q.stripes[i];s++){const r=cyl(.014,.014,.012,M.bakelite,6);r.position.y=-.05+s*.04;grp.add(r);}wires.push({grp,wire});});
    card.draw((c,W,H)=>{c.fillStyle='#e8dfbf';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 13px monospace';c.fillText('ФИДЕР: '+q.rule,4,26);});},
   parts:[],partsFn(){return wires.map((w,i)=>({mesh:w.wire,type:'click',click:()=>{if(st.done)return;st.cut=i;st.done=true;onSound('snip');onSabAnswer({wire:i});}}));},
   update(dt,state){wires.forEach((w,i)=>{const cut=(st.cut===i)||(state?.cut?.includes(cam.id)&&p&&i===p.wire);w.wire.scale.y=cut?.4:1;w.wire.position.y=cut?-.07:0;});},
   fail(){st.done=false;},
   hint:'CUT THE CAMERA FEED: CLICK THE ONE WIRE THE CARD DESCRIBES. COUNT THE BLACK STRIPES. THE WRONG WIRE TRIPS A TAMPER ALERT IN THE SCIF.'};
 });}

 // ---------- lean-in camera and pointer ----------
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),tmp=new THREE.Vector3(),goalQ=new THREE.Quaternion(),look=new THREE.Matrix4();
 let active=null,from=null,blend=0,dragPart=null,lastAngle=0,lastY=0;
 const hint=document.getElementById('machine-hint');
 function partsOf(m){return m.partsFn?m.partsFn():m.parts;}
 function screenPos(obj){obj.getWorldPosition(tmp);tmp.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(tmp.x+1)/2*r.width,y:r.top+(1-tmp.y)/2*r.height};}
 function hit(e){const r=canvas.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const parts=partsOf(active.m);const hits=ray.intersectObjects(parts.map(p=>p.mesh),true);if(!hits.length)return null;
  return parts.find(p=>{let o=hits[0].object;while(o){if(o===p.mesh)return true;o=o.parent;}return false;});}
 canvas.addEventListener('pointerdown',e=>{if(!active)return;e.preventDefault();e.stopPropagation();const part=hit(e);if(!part)return;
  if(part.type==='click'){part.click();return;}
  const c=screenPos(part.mesh);lastAngle=Math.atan2(e.clientY-c.y,e.clientX-c.x);lastY=e.clientY;
  if(part.type==='dial'){const local=Math.atan2(-(e.clientY-c.y),e.clientX-c.x);if(part.down&&!part.down(local))return;}
  else if(part.type==='plane'){part.down();}
  else part.down?.();
  dragPart=part;canvas.setPointerCapture(e.pointerId);},true);
 canvas.addEventListener('pointermove',e=>{if(!active||!dragPart)return;e.stopPropagation();
  if(dragPart.type==='plane'){const r=canvas.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);dragPart.move(ray.ray);return;}
  if(dragPart.type==='lever'){const d=(e.clientY-lastY)/160;lastY=e.clientY;dragPart.drag(d);return;}
  const c=screenPos(dragPart.mesh),a=Math.atan2(e.clientY-c.y,e.clientX-c.x);let d=a-lastAngle;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;lastAngle=a;dragPart.drag(d/TAU);},true);
 const release=()=>{if(dragPart){dragPart.up?.();dragPart=null;}};
 canvas.addEventListener('pointerup',release,true);canvas.addEventListener('pointercancel',release,true);
 const api={
  get active(){return active;},
  open(kind,id,params){
   const m=kind==='machine'?machines.get(id):rigs.get(id);if(!m)return;
   m.load(params);active={kind,id,m};from={pos:camera.position.clone(),quat:camera.quaternion.clone()};blend=0;
   document.body.classList.add('leaning');hint.hidden=false;hint.querySelector('p').textContent=m.hint;hint.querySelector('b').textContent=(m.def?.label||id.toUpperCase());
  },
  close(){if(!active)return;active=null;dragPart=null;document.body.classList.remove('leaning');hint.hidden=true;onExit?.();},
  fail(reason){if(!active)return;active.m.fail?.();hint.querySelector('small').textContent=reason||'';onSound('reject');},
  // Per frame: animate every machine (so others see wheels turn and fuses out), and drive the camera when leaning.
  update(dt,now,state){
   for(const m of machines.values())m.update(dt,now,state);
   for(const r of rigs.values())r.update(dt,state);
   if(!active)return false;
   if(active.m.status)hint.querySelector('small').textContent=active.m.status();
   const def=active.m.def,anchor=def?def.anchor:active.m.anchor,face=def?def.face:active.m.face;
   const close=def?{harness:1.05,phone:.55,radio:.55,centrifuge:.65,lathe:.85,synchro:.8,rods:1.0,valves:1.45,fuel:1.6}[def.kind]:active.id.startsWith('coax')?.6:active.id==='valve'?1.2:.9;
   const up=def?{phone:.45,radio:.35,centrifuge:.45,rods:.45,synchro:.15,valves:.05}[def.kind]??.05:0;
   tmp.set(anchor.x+face.x*close,anchor.y+up+(def?.kind==='phone'?.0:0),anchor.z+face.z*close);
   look.lookAt(tmp,new THREE.Vector3(anchor.x,anchor.y+(def?.kind==='rods'?.25:0),anchor.z),camera.up);goalQ.setFromRotationMatrix(look);
   blend=Math.min(1,blend+dt*3.5);const k=1-Math.pow(1-blend,3);camera.position.lerpVectors(from.pos,tmp,k);camera.quaternion.slerpQuaternions(from.quat,goalQ,k);
   return true;
  },
 };
 return api;
}
export {puzzle,sabPuzzle,machineSeed};
