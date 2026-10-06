import * as THREE from 'three';
import {MACHINES,puzzle,sabPuzzle,machineSeed,crossings,CRANE} from '../shared/machines.js';
import {HANGAR,HANGAR_FIXTURES} from '../shared/hangar.js';
const HANGAR_TOP=HANGAR.top,CRANE_OBSTACLES=HANGAR_FIXTURES.filter(f=>/scaffold|crates|tug/.test(f.id));
import {SABOTAGE,CAMERAS} from '../shared/stations.js';
import {isWalkable,SOLIDS} from '../shared/world.js';
import {incineratorHeat} from '../shared/facility.js';
import {readings,coolantTarget} from '../shared/coolant.js';
import {tubeContact} from '../shared/tubes.js';

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

export function createMachines(scene,{camera,canvas,onAnswer,onSabAnswer,onSound,onExit,onAction,crane}){
 const machines=new Map();let lastState=null;
 const place=(group,anchor,face)=>{group.position.set(anchor.x,anchor.y,anchor.z);group.rotation.y=Math.atan2(face.x,face.z);scene.add(group);group.userData.dynamic=true;};
 // ---------- crew machines ----------
 const builders={
  radar(def){
   // PPI radar: four surface air-defence nodes drift out of phase with the sweep. Pull them back fast.
   const g=new THREE.Group();box(.62,.5,.42,M.olive,0,.25,-.05,g);const scr=screen(.36,.36,192,192);scr.mesh.position.set(-.08,.29,.165);g.add(scr.mesh);box(.42,.42,.02,M.dark,-.08,.29,.15,g);
   g.add(label('РЛС / ВОЗДУШНАЯ ОБОРОНА',.5,.06));g.children.at(-1).position.set(0,.52,.165);
   const knobs=[];for(let i=0;i<4;i++){const k=knob(.03,M.bakelite);k.position.set(.2,.44-i*.09,.17);g.add(k);knobs.push(k);g.add(label(String(i+1),.04,.04));g.children.at(-1).position.set(.255,.44-i*.09,.165);}
   const st={ph:[0,0,0,0],drift:[0,0,0,0],sweep:0,hold:0,done:false,t:0};let p;const bearing=[.6,2.1,3.7,5.2];
   return {g,load(q){p=q;st.ph=st.ph.map(()=>(Math.random()<.5?-1:1)*(40+Math.random()*100));st.drift=st.drift.map(()=>(Math.random()-.5)*20);st.hold=0;st.done=false;st.t=0;},
    parts:knobs.map((k,i)=>({mesh:k,type:'wheel',drag:d=>{st.ph[i]=Math.max(-180,Math.min(180,st.ph[i]-d*120));onSound('tick');}})),
    update(dt){if(!p)return;st.t+=dt;st.sweep=(st.sweep+dt*3)%(Math.PI*2);
     // Drift grows the longer you take: leave it and the nodes walk away.
     st.drift=st.drift.map(v=>v+(Math.random()-.5)*dt*30*p.drift*(1+st.t/20));st.ph=st.ph.map((v,i)=>Math.max(-180,Math.min(180,v+st.drift[i]*dt)));
     knobs.forEach((k,i)=>k.rotation.z=st.ph[i]/60);
     const ok=st.ph.map(v=>Math.abs(v)<8);
     scr.draw((c,W,H)=>{c.fillStyle='rgba(4,16,8,.35)';c.fillRect(0,0,W,H);const cx=W/2,cy=H/2,R=W*.46;c.strokeStyle='#1c5a2c';c.lineWidth=1;for(const r of [.33,.66,1]){c.beginPath();c.arc(cx,cy,R*r,0,TAU);c.stroke();}
      c.strokeStyle='#7fe08f';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(st.sweep)*R,cy+Math.sin(st.sweep)*R);c.stroke();
      bearing.forEach((b,i)=>{const a=b+st.ph[i]*Math.PI/180,near=Math.abs(((st.sweep-a)%TAU+TAU)%TAU);const glow=Math.max(.15,1-near/1.5);c.fillStyle=ok[i]?`rgba(150,255,160,${glow})`:`rgba(220,180,90,${glow})`;const x=cx+Math.cos(a)*R*.7,y=cy+Math.sin(a)*R*.7;c.fillRect(x-4,y-4,8,8);c.fillStyle='#7fe08f';c.font='9px monospace';c.fillText(String(i+1),cx+Math.cos(b)*R*.86-3,cy+Math.sin(b)*R*.86+3);
       c.strokeStyle='#2c6a3c';c.beginPath();c.moveTo(cx+Math.cos(b)*R*.6,cy+Math.sin(b)*R*.6);c.lineTo(cx+Math.cos(b)*R*.8,cy+Math.sin(b)*R*.8);c.stroke();});});
     st.hold=ok.every(Boolean)?st.hold+dt:0;if(st.hold>1.2&&!st.done){st.done=true;onAnswer({phases:st.ph.map(v=>+v.toFixed(1))});}},
    status(){return `IN SYNC: ${st.ph.filter(v=>Math.abs(v)<8).length} / 4`;},fail(){st.done=false;st.hold=0;},
    hint:'EACH KNOB SHIFTS ONE NODE. PUT EVERY BLIP BACK ON ITS TICK MARK SO IT LIGHTS GREEN. THEY KEEP DRIFTING, FASTER THE LONGER YOU TAKE.'};
  },
  furnace(def){
   // Drag a filter cartridge off the rack into the chute while the needle sits in the amber band.
   const g=new THREE.Group();box(1.2,.9,.06,M.dark,0,.25,-.03,g);const glow=new THREE.MeshBasicMaterial({color:0xb87932});box(.5,.3,.02,glow,0,.45,.01,g);for(let i=0;i<6;i++)box(.03,.3,.03,M.bakelite,-.22+i*.088,.45,.025,g);
   const chute=box(.34,.18,.12,M.bakelite,0,.02,.06,g);const dial=screen(.26,.16,128,80);dial.mesh.position.set(.42,.48,.01);g.add(dial.mesh);
   const rack=box(.22,.5,.1,M.steel,-.48,.15,.06,g);void rack;const carts=[];
   for(let i=0;i<3;i++){const c=cyl(.05,.05,.16,mat(0x6a7a5a),10);c.position.set(-.48,.32-i*.17,.13);g.add(c);carts.push(c);}
   const st={drag:-1,fed:0};let state,plane=new THREE.Plane(),inv=new THREE.Matrix4();const home=carts.map(c=>c.position.clone());
   return {g,load(){carts.forEach((c,i)=>c.position.copy(home[i]));st.drag=-1;},
    parts:carts.map((c,i)=>({mesh:c,type:'plane',down:()=>{g.updateMatrixWorld();plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0,1).transformDirection(g.matrixWorld),new THREE.Vector3(0,0,.13).applyMatrix4(g.matrixWorld));st.drag=i;onSound('cable');},
     move:ray=>{const h=new THREE.Vector3();if(!ray.intersectPlane(plane,h))return;inv.copy(g.matrixWorld).invert();h.applyMatrix4(inv);c.position.set(Math.max(-.55,Math.min(.55,h.x)),Math.max(-.15,Math.min(.6,h.y)),.13);},
     up:()=>{const pos=c.position;if(Math.abs(pos.x)<.2&&pos.y<.15){onAction?.({t:'feedFilter'});onSound('peg');c.visible=false;setTimeout(()=>{c.visible=true;c.position.copy(home[i]);},900);}else{c.position.copy(home[i]);}st.drag=-1;}})),
    update(dt,now,s){state=s;const heat=incineratorHeat(Date.now());glow.color.setHex(0xb87932).multiplyScalar(.6+heat/120+Math.sin(now*.02)*.08);const cool=s?.coolant;
     carts.forEach((c,i)=>{if(st.drag!==i)c.visible=!cool||i>=(cool.filterProgress||0)&&!cool.filterReady;});
     dial.draw((c,W,H)=>{c.fillStyle='#d9d2b3';c.fillRect(0,0,W,H);c.fillStyle='#c9a032';c.fillRect(W*.4,8,W*.3,H-30);c.fillStyle='#2a261c';c.font='bold 9px monospace';c.fillText(cool?.filterReady?'CLEARED':`ФИЛЬТРЫ ${cool?.filterProgress||0}/3`,4,H-6);c.fillStyle='#9a2e22';c.fillRect(heat/100*W-1,4,3,H-26);});},
    status(){return state?.coolant?.filterReady?'FILTER BANK CLEARED / GO BALANCE THE COOLANT LOOP':'DROP A CARTRIDGE IN THE CHUTE WHILE THE NEEDLE IS IN THE AMBER BAND';},
    hint:'DRAG A FILTER CARTRIDGE FROM THE RACK INTO THE CHUTE. ONLY FEED WHEN THE RED NEEDLE IS IN THE AMBER BAND, OR IT BLOWS BACK AND UNDOES ONE.'};
  },
  coolant(def){
   const g=new THREE.Group();box(1.3,.8,.08,M.olive,0,.1,-.04,g);const wheels={},gauges={};const st={v:{intake:25,bypass:75},dragging:null,sent:0};let state;
   [['intake',-.36],['bypass',.36]].forEach(([k,x])=>{const w=handwheel(.17,k==='intake'?M.red:mat(0x3a5a7a));w.position.set(x,-.12,.12);g.add(w);wheels[k]=w;g.add(label(k==='intake'?'ВПУСК / INTAKE':'ОБХОД / BYPASS',.36,.06));g.children.at(-1).position.set(x,.1,.01);});
   [['flow',-.24],['pressure',.24]].forEach(([k,x])=>{const s=screen(.3,.2,96,64);s.mesh.position.set(x,.36,.01);g.add(s.mesh);gauges[k]=s;});
   const lamp=new THREE.MeshBasicMaterial({color:0x332a18});box(.06,.06,.03,lamp,0,.36,.02,g);
   return {g,load(){st.dragging=null;},
    parts:['intake','bypass'].map(k=>({mesh:wheels[k],type:'wheel',down:()=>{st.dragging=k;},up:()=>{st.dragging=null;},drag:d=>{st.v[k]=Math.max(0,Math.min(100,st.v[k]+d*25));const q=Math.round(st.v[k]/5)*5;const cur=state?.coolant?.[k];if(q!==cur&&performance.now()-st.sent>120){st.sent=performance.now();onAction?.({t:'coolantSet',intake:k==='intake'?q:state?.coolant?.intake??25,bypass:k==='bypass'?q:state?.coolant?.bypass??75});}onSound('turn');}})),
    update(dt,now,s){state=s;const c=s?.coolant;if(!c)return;for(const k of ['intake','bypass']){if(st.dragging!==k)st.v[k]=c[k];wheels[k].rotation.z=-st.v[k]/25*TAU;}
     const val=readings(c.intake,c.bypass),tgt=coolantTarget(c);gaugeFace(gauges.flow,val.flow,100,tgt.flow-2,tgt.flow+2,'FLOW');gaugeFace(gauges.pressure,val.pressure,100,tgt.pressure-2,tgt.pressure+2,'PRESSURE');
     lamp.color.setHex(c.cooldown>0?0x8fbf6a:c.progress>0?(Math.floor(now/200)%2?0xd99b44:0x332a18):0x332a18);},
    status(){const c=state?.coolant;return !c?'':c.cooldown>0?`FLUSH DONE / READY IN ${Math.ceil(c.cooldown)}S`:!c.filterReady?'BLOCKED / PURGE 3 FILTERS AT THE INCINERATOR FIRST':c.progress>0?`HOLD IT / ${c.progress.toFixed(1)} OF 3S`:'PUT BOTH NEEDLES IN THEIR GREEN BANDS';},
    hint:'INTAKE PUSHES FLOW AND PRESSURE UP; BYPASS DROPS FLOW BUT ADDS BACK-PRESSURE. GET BOTH NEEDLES INTO THE GREEN AND HOLD THEM THERE FOR THREE SECONDS.'};
  },
  keypad(def){
   const g=new THREE.Group();box(.34,.46,.08,M.steel,0,0,-.04,g);const disp=screen(.26,.07,128,32);disp.mesh.position.set(0,.17,.005);g.add(disp.mesh);
   const note=screen(.26,.34,128,168);note.mesh.position.set(-.36,0,.0);note.mesh.rotation.z=.04;g.add(note.mesh);
   const keys=[],labels=['1','2','3','4','5','6','7','8','9','C','0','↵'];const st={pin:'',msg:''};let state,drawn='';
   labels.forEach((l,i)=>{const k=box(.07,.055,.03,i===9?M.red:i===11?mat(0x3a5a3a):M.bakelite,-.09+(i%3)*.09,.07-Math.floor(i/3)*.07,.015,g);const t=label(l,.05,.04,'#151513','#e8e2c8');t.position.set(-.09+(i%3)*.09,.07-Math.floor(i/3)*.07,.032);g.add(t);keys.push({k,l,t});});
   return {g,load(){st.pin='';st.msg='';},
    parts:keys.map(({k,l,t})=>({mesh:k,type:'click',click:()=>{k.position.z=.005;t.position.z=.022;setTimeout(()=>{k.position.z=.015;t.position.z=.032;},120);onSound('tick');
     if(l==='C')st.pin='';else if(l==='↵'){if(st.pin.length===4)onAction?.({t:'cameraPin',pin:st.pin});st.pin='';}else if(st.pin.length<4)st.pin+=l;}})),
    update(dt,now,s){state=s;disp.draw((c,W,H)=>{c.fillStyle='#120806';c.fillRect(0,0,W,H);c.fillStyle=s?.cameraOpened?'#8fbf6a':'#e0402a';c.font='bold 20px monospace';c.fillText(s?.cameraOpened?'OPEN':st.pin.padEnd(4,'-'),18,24);});
     const pz=s?.cameraPuzzle;const sig=JSON.stringify(pz);if(pz&&sig!==drawn){drawn=sig;note.draw((c,W,H)=>{c.fillStyle='#e8dfbf';c.fillRect(0,0,W,H);c.fillStyle='#2a261c';c.font='bold 9px monospace';c.fillText('КОД ДОСТУПА / ACCESS',4,12);c.font='9px monospace';Object.entries(pz.readings).forEach(([k,v],i)=>c.fillText(`${k}: ${v}`,6,30+i*12));pz.clues.forEach((t,i)=>{const words=t.split(' ');let line='',y=88+i*26;for(const w of words){if((line+w).length>22){c.fillText(line,4,y);y+=10;line='';}line+=w+' ';}c.fillText(line,4,y);});c.fillStyle='#7a2a1e';c.fillText('LAST DIGIT OF EACH, IN ORDER',4,H-6);});}},
    status(){return state?.cameraOpened?'DOOR RELEASED':'';},
    hint:'READ THE NOTE: PUT THE FOUR READINGS IN THE ORDER THE CLUES DESCRIBE, TAKE THE LAST DIGIT OF EACH, KEY IT IN, PRESS ↵.'};
  },
  tubes(def){
   const g=new THREE.Group();box(.18,.5,.9,M.dark,-.09,0,0,g);const tubes=[];
   for(let i=0;i<3;i++){const z=(i-1)*.28;const glass=cyl(.055,.055,.22,new THREE.MeshLambertMaterial({color:0x9aa89a,transparent:true,opacity:.35}),10);glass.rotation.z=Math.PI/2;glass.position.set(.12,.05,z);g.add(glass);
    const fil=new THREE.MeshBasicMaterial({color:0x27372b});const f=box(.14,.02,.02,fil,.12,.05,z,g);void f;const collar=handwheel(.07,M.brass);collar.position.set(.02,.05,z);collar.rotation.y=Math.PI/2;g.add(collar);tubes.push({collar,fil});}
   const st={v:[0,0,0],sent:0};let state;
   return {g,load(){},
    parts:tubes.map((t,i)=>({mesh:t.collar,type:'wheel',drag:d=>{st.v[i]=Math.max(0,Math.min(100,st.v[i]+d*20));if(performance.now()-st.sent>90){st.sent=performance.now();onAction?.({t:'tubeTurn',index:i,value:Math.round(st.v[i])});}onSound('turn');}})),
    update(dt,now,s){state=s;const tb=s?.tubes;if(!tb)return;tubes.forEach((t,i)=>{if(Math.abs(st.v[i]-tb.values[i])>6&&performance.now()-st.sent>400)st.v[i]=tb.values[i];t.collar.rotation.x=st.v[i]/20*TAU;const c=tubeContact(tb,i);t.fil.color.setHex(c==='lit'?0xe7a247:c==='weak'?(Math.floor(now/90)%2?0x9a6a30:0x3a2a18):0x27372b);});},
    status(){return state?.tubes?.powered?'ALL TUBES STABLE / CAMERAS ONLINE':state?.cameraOpened?'SCREW EACH COLLAR UNTIL ITS FILAMENT HOLDS A STEADY GLOW':'';},
    hint:'TURN EACH BRASS COLLAR. TOO LOOSE OR TOO TIGHT AND THE FILAMENT FLICKERS OR DIES. READ THE GLOW, NOT THE NUMBERS.'};
  },
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
   const g=new THREE.Group();box(2.1,1.6,.08,M.olive,0,.15,-.04,g);
   g.add(label('ГЛАВНЫЙ КОЛЛЕКТОР / MAIN MANIFOLD',1.6,.1));g.children.at(-1).position.set(0,.7,.01);
   const wheels=[],gauges=[];
   // Pipes stop below the gauges so nothing hides the needles; a lamp over each gauge lights in band.
   const lamps=[];
   for(let i=0;i<3;i++){const x=(i-1)*.62;const pipe=cyl(.06,.06,.6,M.steel,8);pipe.position.set(x,-.35,.08);g.add(pipe);
    const w=handwheel(.2);w.position.set(x,-.32,.2);g.add(w);wheels.push(w);
    const s=screen(.42,.3,128,92);s.mesh.position.set(x,.36,.07);g.add(s.mesh);gauges.push(s);box(.46,.34,.1,M.dark,x,.36,.015,g);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.04),new THREE.MeshBasicMaterial({color:0x3a1a12}));lamp.position.set(x,.575,.07);g.add(lamp);lamps.push(lamp);}
   const st={w:[0,0,0],hold:0,done:false};let p;
   return {g,load(q){p=q;st.w=[0,0,0];st.hold=0;st.done=false;},
    parts:wheels.map((w,i)=>({mesh:w,type:'wheel',drag:d=>{st.w[i]=Math.max(0,Math.min(p.max,st.w[i]+d));onSound('turn');}})),
    update(dt){if(!p)return;const gv=p.M.map(row=>row.reduce((s,v,j)=>s+v*st.w[j],0));const max=p.M.map(row=>row.reduce((a,b)=>a+b)*p.max);
     wheels.forEach((w,i)=>w.rotation.z=-st.w[i]*TAU);gauges.forEach((s,i)=>gaugeFace(s,gv[i],max[i],p.targets[i]-.75,p.targets[i]+.75,'G'+(i+1)));
     lamps.forEach((l,i)=>l.material.color.setHex(Math.abs(gv[i]-p.targets[i])<=.75?0x7ee06a:0x3a1a12));
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
  crane(def){
   // Pendant control on a cable off the crane rail. Drive the real overhead crane (WASD, R/F hoist,
   // SPACE latch), fly the APU crate to the pad the work order names, and kill the swing before set-down.
   const g=new THREE.Group();box(.015,1.1,.015,M.dark,0,.85,0,g);
   const body=box(.17,.36,.11,mat(0xc9a032),0,.12,0,g);void body;
   const btn=(c,x,y,txt)=>{const b=cyl(.02,.02,.025,c,8);b.rotation.x=Math.PI/2;b.position.set(x,y,.06);g.add(b);const l=label(txt,.06,.025,'#c9a032','#161613');l.position.set(x,y-.032,.0561);g.add(l);return b;};
   const keys={x:0,z:0,h:0},held=new Set();
   const bx=[btn(M.bakelite,-.04,.24,'W'),btn(M.bakelite,-.04,.16,'S'),btn(M.bakelite,-.075,.2,'A'),btn(M.bakelite,-.005,.2,'D'),btn(M.steel,.05,.24,'R'),btn(M.steel,.05,.16,'F')];
   const latchBtn=btn(M.red,0,.05,'SPACE');
   const top=HANGAR_TOP-3.3,FLOOR=-8,PADS=CRANE.pads;
   const st={x:56,z:40,L:12,vx:0,vz:0,ax:0,az:0,wx:0,wz:0,latched:false,load:[56,FLOOR,40],done:false,on:false,warn:'',warnUntil:0,sent:0,lastTop:FLOOR};
   let p;
   const hookAt=()=>{const hx=st.x+Math.sin(st.ax)*st.L,hz=st.z+Math.sin(st.az)*st.L,hy=top-st.L*Math.cos(st.ax)*Math.cos(st.az);return [hx,hy,hz];};
   const lowest=hy=>st.latched?hy-1.45:hy-.4;
   // Highest thing under a point: catwalk, orbiter, wings, scaffolds, crates, the floor.
   const under=(x,z)=>{let t=FLOOR;const inb=(a,b,c,d)=>x>a&&x<b&&z>c&&z<d;
    if(inb(40.1,43.9,15,45))t=Math.max(t,1.25);
    if(inb(39.7,44.3,20.6,41.6))t=Math.max(t,z>34?-.3:-3.3);
    if(inb(34.4,49.6,28,40))t=Math.max(t,-5.8);
    for(const f of CRANE_OBSTACLES)if(inb(f.x-f.w/2-.5,f.x+f.w/2+.5,f.z-f.d/2-.5,f.z+f.d/2+.5))t=Math.max(t,f.maxY);
    return t;};
   const warn=(t)=>{st.warn=t;st.warnUntil=performance.now()+2200;};
   const sync=()=>{const c={x:st.x,z:st.z,L:st.L,ax:st.ax,az:st.az,latched:st.latched,load:st.load};crane?.set(c);return c;};
   const latch=()=>{if(st.done)return;const [hx,hy,hz]=hookAt();
    if(!st.latched){if(Math.hypot(hx-st.load[0],hz-st.load[2])<.75&&Math.abs(hy-1.45-st.load[1])<.45){st.latched=true;onSound('latch');}else{warn('HOOK IS NOT ON THE SLINGS');onSound('reject');}return;}
    const t=under(hx,hz),amp=Math.hypot(st.ax,st.az)*st.L;
    if(lowest(hy)-t>.2){warn('LOWER IT ALL THE WAY DOWN FIRST');onSound('reject');return;}
    if(amp>.3){warn('LOAD SWINGING / STEADY IT');onSound('reject');return;}
    st.latched=false;st.load=[hx,t,hz];onSound('clank');
    if(t===FLOOR){st.done=true;onAnswer({x:+hx.toFixed(2),z:+hz.toFixed(2)});}else warn('THAT IS NOT THE FLOOR');};
   const hold=(mesh,k,v)=>({mesh,type:'hold',down(){held.add(k+v);keys[k]=v;onSound('tick');},up(){held.delete(k+v);keys[k]=0;},drag(){}});
   return {g,load(q){p=q;st.on=true;st.done=false;keys.x=keys.z=keys.h=0;const c=lastState?.crane;if(c)Object.assign(st,{x:c.x,z:c.z,L:c.L,latched:c.latched,load:[...c.load]});},
    closed(){st.on=false;keys.x=keys.z=keys.h=0;onSound('whine',0);},
    key(code,down){const v=down?1:0;
     if(code==='KeyW')keys.z=v;else if(code==='KeyS')keys.z=-v;else if(code==='KeyA')keys.x=v;else if(code==='KeyD')keys.x=-v;
     else if(code==='KeyR')keys.h=v;else if(code==='KeyF')keys.h=-v;else if(code==='Space'){if(down)latch();}else return false;return true;},
    parts:[hold(bx[0],'z',1),hold(bx[1],'z',-1),hold(bx[2],'x',1),hold(bx[3],'x',-1),hold(bx[4],'h',1),hold(bx[5],'h',-1),{mesh:latchBtn,type:'click',click:latch}],
    view(){const [hx,hy,hz]=hookAt();// Bridge camera: rides the crane bridge behind the trolley and watches the hook.
     return {pos:[st.x,6.4,Math.max(13,st.z-8)],look:[hx,Math.max(hy-1.4,-7.6),hz],fov:58};},
    update(dt,now,s){lastState=s;
     if(!st.on){if(s?.crane)crane?.set(s.crane);return;}
     dt=Math.min(dt,.05);
     // Trolley and bridge accelerate gently; the hook lags behind as a pendulum.
     const tvx=keys.x*2.2,tvz=keys.z*2.2,acc=1.0;
     let axr=Math.max(-acc,Math.min(acc,(tvx-st.vx)/dt)),azr=Math.max(-acc,Math.min(acc,(tvz-st.vz)/dt));
     let nx=st.x+(st.vx+axr*dt)*dt,nz=st.z+(st.vz+azr*dt)*dt;
     nx=Math.max(CRANE.minX,Math.min(CRANE.maxX,nx));nz=Math.max(CRANE.minZ,Math.min(CRANE.maxZ,nz));
     const [hx,hy]=hookAt(),low=lowest(hy),dx=nx-st.x,dz=nz-st.z;
     if(under(hx+dx,(st.z+Math.sin(st.az)*st.L)+dz)>low+.02&&under(hx,st.z+Math.sin(st.az)*st.L)<=low+.02){
      // Bump: the load hits something. Stop dead and let it swing.
      axr=-st.vx/dt*.5;azr=-st.vz/dt*.5;st.wx+=st.vx*.25/Math.max(2,st.L);st.wz+=st.vz*.25/Math.max(2,st.L);st.vx=st.vz=0;nx=st.x;nz=st.z;
      if(performance.now()-(st.lastBump||0)>600){st.lastBump=performance.now();onSound('clank');warn(low<1.3&&hx>39&&hx<45?'CATWALK / HOIST UP TO CLEAR IT':'OBSTRUCTION / HOIST UP');}
     }else{st.vx+=axr*dt;st.vz+=azr*dt;}
     if(nx===CRANE.minX||nx===CRANE.maxX)st.vx=0;if(nz===CRANE.minZ||nz===CRANE.maxZ)st.vz=0;
     st.x=nx;st.z=nz;
     // Hoist, stopping at whatever is underneath.
     const Lp=st.L+(st.latched?1:.2);
     if(keys.h){const nl=Math.max(CRANE.minL,Math.min(CRANE.maxL,st.L-keys.h*1.6*dt));const nhy=top-nl*Math.cos(st.ax)*Math.cos(st.az),[hx2,,hz2]=hookAt();if(lowest(nhy)>=under(hx2,hz2)-.001||nl<st.L)st.L=nl;}
     const g0=9.8,damp=.11;
     st.wx+=(-(g0/Lp)*Math.sin(st.ax)-(axr/Lp)*Math.cos(st.ax)-damp*st.wx)*dt;st.wz+=(-(g0/Lp)*Math.sin(st.az)-(azr/Lp)*Math.cos(st.az)-damp*st.wz)*dt;
     st.ax+=st.wx*dt;st.az+=st.wz*dt;
     const [fx,fy,fz]=hookAt();if(lowest(fy)<=under(fx,fz)+.05){st.wx*=.85;st.wz*=.85;}
     const moving=Math.hypot(st.vx,st.vz)>.05||keys.h;onSound('whine',moving?.03:0);
     const c=sync();if(now-st.sent>100){st.sent=now;onAction({t:'crane',...c});}},
    fail(){st.done=false;},
    status(){const [hx,hy,hz]=hookAt();const amp=Math.hypot(st.ax,st.az)*st.L;const w=performance.now()<st.warnUntil?` / ${st.warn}`:'';
     return `PAD ${p?.pad??'?'} / ${st.latched?'LOAD ON':'HOOK'} ${Math.max(0,lowest(hy)-under(hx,hz)).toFixed(1)} M UP / SWING ${amp.toFixed(2)}${w}`;},
    hintFn(){return `WORK ORDER: FLY THE APU CRATE (ВСУ) TO FLOOR PAD ${p?.pad??'?'}. BRIDGE CAMERA. WASD DRIVE, R/F HOIST, SPACE LATCH OR SET DOWN. HOIST HIGH TO CROSS THE CATWALK. STOP THE SWING BEFORE YOU SET IT DOWN.`;}};
  },
  clock(def){
   // АЧС-1 board chronometer on the orbiter's panel and a МСК time readout. Wind the hands to the next
   // full minute, then push ПУСК exactly on the long pip.
   const g=new THREE.Group();box(.6,.3,.04,M.dark,0,0,-.03,g);
   const face=screen(.19,.19,160,160);face.mesh.position.set(-.12,0,.0);g.add(face.mesh);
   const bezel=new THREE.Mesh(new THREE.TorusGeometry(.1,.012,6,20),M.steel);bezel.position.set(-.12,0,.0);g.add(bezel);
   const crown=knob(.022,M.steel);crown.position.set(-.235,-.08,.02);g.add(crown);
   const ref=screen(.24,.07,192,56);ref.mesh.position.set(.14,.06,.0);g.add(ref.mesh);
   const go=cyl(.028,.028,.03,M.red,10);go.rotation.x=Math.PI/2;go.position.set(.14,-.06,.015);g.add(go);
   g.add(label('ПУСК',.07,.022,'#151513','#d6c68f'));g.children.at(-1).position.set(.14,-.105,.001);
   g.add(label('ЧАСЫ БОРТОВЫЕ',.2,.025,'#151513','#d6c68f'));g.children.at(-1).position.set(-.12,.125,.001);
   const st={set:0,t0:0,done:false,runAt:0,lastSec:-1,lastMin:0};let p;
   const refSec=()=>p?p.base+(performance.now()-st.t0)/1000:0;
   const draw=()=>{const r=refSec();
    face.draw((c,W,H)=>{const cx=W/2,cy=H/2,R=W*.46;c.fillStyle='#121311';c.fillRect(0,0,W,H);c.fillStyle='#1b1c19';c.beginPath();c.arc(cx,cy,R,0,TAU);c.fill();
     c.strokeStyle='#d8d2b0';c.fillStyle='#d8d2b0';for(let i=0;i<60;i++){const a=i/60*TAU;c.lineWidth=i%5?1:3;c.beginPath();c.moveTo(cx+Math.sin(a)*R*.92,cy-Math.cos(a)*R*.92);c.lineTo(cx+Math.sin(a)*R*(i%5?.86:.78),cy-Math.cos(a)*R*(i%5?.86:.78));c.stroke();}
     c.font='bold 15px monospace';c.textAlign='center';for(let h=1;h<=12;h++){const a=h/12*TAU;c.fillText(String(h),cx+Math.sin(a)*R*.62,cy-Math.cos(a)*R*.62+5);}
     c.font='8px monospace';c.fillText('АЧС-1',cx,cy+R*.38);
     const hand=(a,len,w,col)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.sin(a)*len,cy-Math.cos(a)*len);c.stroke();};
     hand(((st.set/60)%12)/12*TAU,R*.5,5,'#e8e1c0');hand((st.set%60)/60*TAU,R*.8,3,'#e8e1c0');
     const sec=st.done?(r-st.runAt)%60:0;hand(sec/60*TAU,R*.86,1.5,'#d2462e');c.fillStyle='#d2462e';c.beginPath();c.arc(cx,cy,4,0,TAU);c.fill();});
    ref.draw((c,W,H)=>{const t=Math.floor(r),hh=Math.floor(t/3600)%24,mm=Math.floor(t/60)%60,ss=t%60;c.fillStyle='#120a05';c.fillRect(0,0,W,H);c.fillStyle='#ff9a3c';c.font='bold 30px monospace';c.textAlign='center';
     c.fillText(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`,W/2,40);c.font='9px monospace';c.fillStyle='#a8622a';c.fillText('МСК / ЕДИНОЕ ВРЕМЯ',W/2,52);});};
   const press=()=>{if(st.done||!p)return;const r=refSec(),sec=r%60,err=sec>30?sec-60:sec;st.done=true;st.runAt=Math.round(r/60)*60;onSound('peg');
    onAnswer({set:+st.set.toFixed(2),ref:Math.round(r/60),err:+err.toFixed(2)});};
   return {g,load(q){p=q;st.t0=performance.now();st.set=q.base/60+q.drift;st.done=false;st.lastSec=-1;draw();},
    parts:[{mesh:crown,type:'wheel',drag:d=>{if(st.done)return;st.set+=d*15;const m=Math.floor(st.set);if(m!==st.lastMin){st.lastMin=m;onSound('tick');}}},{mesh:go,type:'click',click:press}],
    update(){if(!p)return;draw();const s=Math.floor(refSec())%60;if(s!==st.lastSec){st.lastSec=s;if(s>=55)onSound('pip');else if(s===0)onSound('pipLong');}},
    fail(){st.done=false;},
    status(){if(!p)return '';const r=refSec(),target=Math.floor(r/60)+1,hh=Math.floor(target/60)%24,mm=target%60,set=Math.round(st.set),sh=Math.floor(set/60)%12||12,sm=((set%60)+60)%60;
     return `HANDS ${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')} / NEXT FULL MINUTE ${String(hh%12||12).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;},
    hint:'THE ORBITER CLOCK HAS DRIFTED. DRAG THE CROWN TO SET THE HANDS TO THE NEXT FULL MINUTE ON THE МСК READOUT, THEN PRESS ПУСК ON THE LONG SIXTH PIP, EXACTLY AT :00.'};
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
  else if(part.type==='plane'||part.type==='hold'){part.down();}
  else part.down?.();
  dragPart=part;canvas.setPointerCapture(e.pointerId);},true);
 canvas.addEventListener('pointermove',e=>{if(!active||!dragPart)return;e.stopPropagation();if(dragPart.type==='hold')return;
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
   document.body.classList.add('leaning');hint.hidden=false;hint.querySelector('p').textContent=m.hintFn?.()||m.hint;hint.querySelector('small').textContent='';hint.querySelector('b').textContent=(m.def?.label||id.toUpperCase());
  },
  key(code,down){return !!active?.m.key?.(code,down);},
  close(){if(!active)return;active.m.closed?.();if(active.fov){camera.fov=active.fov;camera.updateProjectionMatrix();}active=null;dragPart=null;document.body.classList.remove('leaning');hint.hidden=true;onExit?.();},
  fail(reason){if(!active)return;active.m.fail?.();hint.querySelector('small').textContent=reason||'';onSound('reject');},
  // Per frame: animate every machine (so others see wheels turn and fuses out), and drive the camera when leaning.
  update(dt,now,state){
   for(const m of machines.values())m.update(dt,now,state);
   for(const r of rigs.values())r.update(dt,state);
   if(!active)return false;
   if(active.m.status)hint.querySelector('small').textContent=active.m.status();
   const def=active.m.def,anchor=def?def.anchor:active.m.anchor,face=def?def.face:active.m.face;
   const close=def?{radar:.75,furnace:1.3,coolant:1.25,keypad:.65,tubes:.8,harness:1.05,phone:.55,radio:.55,centrifuge:.65,lathe:.85,synchro:.8,rods:1.0,valves:1.45,fuel:1.6,clock:.5,crane:.6}[def.kind]:active.id.startsWith('coax')?.6:active.id==='valve'?1.2:.9;
   const up=def?{radar:.3,keypad:.05,phone:.45,radio:.35,centrifuge:.45,rods:.45,synchro:.15,valves:.2}[def.kind]??.05:0;
   const view=active.m.view?.();
   if(view){tmp.set(...view.pos);look.lookAt(tmp,new THREE.Vector3(...view.look),camera.up);if(view.fov){active.fov??=camera.fov;const f=active.fov+(view.fov-active.fov)*Math.min(1,blend);if(Math.abs(camera.fov-f)>.01){camera.fov=f;camera.updateProjectionMatrix();}}}
   else{tmp.set(anchor.x+face.x*close,anchor.y+up,anchor.z+face.z*close);
   look.lookAt(tmp,new THREE.Vector3(anchor.x,anchor.y+(def?.kind==='rods'?.25:0),anchor.z),camera.up);}goalQ.setFromRotationMatrix(look);
   blend=Math.min(1,blend+dt*3.5);const k=1-Math.pow(1-blend,3);camera.position.lerpVectors(from.pos,tmp,k);camera.quaternion.slerpQuaternions(from.quat,goalQ,k);
   return true;
  },
 };
 return api;
}
export {puzzle,sabPuzzle,machineSeed};
