import * as THREE from 'three';
import {addMicroscope} from './equipment.js';

// Room-specific work surfaces and records; small props stay within solid furniture.
export function dressBunker(scene,{box,pipe,steel,dark,rust,coolant,hazard}) {
 function placard(x,y,z,w,h,angle,paint,width=128,height=96){
  const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;paint(g,width,height);
  const texture=new THREE.CanvasTexture(c);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:texture}));mesh.position.set(x,y,z);mesh.rotation.y=angle;scene.add(mesh);return mesh;
 }
 function paper(g,x,y,w,h,title,lines,tilt=0){
  g.save();g.translate(x,y);g.rotate(tilt);g.fillStyle='#aaa98a';g.fillRect(0,0,w,h);g.fillStyle='#30372c';g.font='bold 6px monospace';g.fillText(title,3,9);
  g.font='5px monospace';lines.forEach((line,i)=>g.fillText(line,3,17+i*7));g.fillStyle='#5f3227';g.fillRect(w/2-1,1,3,3);g.restore();
 }
 function board(x,y,z,angle,kind){
  placard(x,y,z,2.3,1.55,angle,(g)=>{
   g.fillStyle='#302f21';g.fillRect(0,0,128,96);g.strokeStyle='#626344';g.lineWidth=4;g.strokeRect(2,2,124,92);
   paper(g,8,9,55,69,kind==='lab'?'EXPERIMENT 09':'SHIFT / OCT 86',kind==='lab'?['GROWTH: +18%','LIGHT: AVOID','FEED: 04:00','','NO SOLO ENTRY']:['VALVE 02 LEAKS','REPLACE SEAL','KEEP DRAIN OPEN','','SIGNED: IVAN'], -.04);
   paper(g,72,12,46,39,'WARNING',['TWO PERSON','ACCESS ONLY'],.06);
   paper(g,68,56,50,29,'REMINDER',['RETURN TOOLS','CHECK FILTERS'],-.04);
   g.strokeStyle='#623c2e';g.strokeRect(14,58,41,13);g.font='bold 7px monospace';g.fillStyle='#623c2e';g.fillText('OVERDUE',17,68);
  });
 }
 function diagram(x,y,z,angle,type){
  placard(x,y,z,2.4,1.65,angle,(g)=>{
   g.fillStyle='#26372e';g.fillRect(0,0,128,96);g.strokeStyle='#9ba98b';g.strokeRect(2,2,124,92);g.fillStyle='#c0c4a0';g.font='bold 9px monospace';g.fillText(type,7,14);
   g.strokeStyle='#6c9180';g.lineWidth=2;
   g.strokeRect(50,30,28,37);g.strokeRect(9,39,22,22);g.strokeRect(97,39,22,22);
   g.beginPath();g.moveTo(31,44);g.lineTo(50,44);g.moveTo(78,44);g.lineTo(97,44);g.moveTo(108,61);g.lineTo(108,78);g.lineTo(20,78);g.lineTo(20,61);g.stroke();
   g.fillStyle='#b39959';for(let i=0;i<4;i++)g.fillRect(54+i*6,34,3,27);g.fillRect(39,41,5,6);g.fillRect(84,41,5,6);
   g.font='6px monospace';g.fillStyle='#d4cba1';g.fillText('PUMP',10,35);g.fillText('CORE',52,26);g.fillText('RETURN',93,35);g.fillText('FLOW > 03 / MANUAL BYPASS',8,90);
  });
 }
 board(-12,1.9,4.83,Math.PI,'shop');board(2.8,1.9,-4.83,0,'shop');
 diagram(-2.8,1.9,-4.83,0,'COOLANT CIRCUIT');diagram(-4.82,1.65,-12,Math.PI/2,'CONTROL RODS / 86');
 board(12.4,1.9,-5.17,Math.PI,'lab');
 // Tool tray, a dismantled unit and handwritten job card on the existing workbench.
 box(.8,.045,.58,-10.7,1.07,2.7,dark);
 for(let i=0;i<3;i++){
  box(.06,.05,.34,-10.95+i*.22,1.11,2.7,steel);
  for(const side of [-1,1])box(.05,.05,.12,-10.95+i*.22+side*.055,1.11,2.87,steel);
 }
 box(.6,.22,.38,-9.3,1.17,2.7,coolant);for(let i=0;i<4;i++)box(.055,.1,.12,-9.52+i*.14,1.33,2.7,rust);
 const job=placard(-10,1.062,2.7,.42,.32,0,g=>{g.fillStyle='#aaa98a';g.fillRect(0,0,128,96);g.fillStyle='#3b4135';g.font='bold 15px monospace';g.fillText('REPAIR 02',6,24);g.font='10px monospace';g.fillText('GASKET / 6MM',6,49);g.fillText('DO NOT POWER',6,72);});job.rotation.x=-Math.PI/2;
 // A microscope, tube rack, notebook and sealed sample jar on the laboratory bench.
 box(2.5,.07,1.2,12.1,.95,-7.3,steel);
 addMicroscope(scene,12.15,.99,-7.4,{steel,dark,rust});
 const glass=new THREE.MeshLambertMaterial({color:0x80a994,transparent:true,opacity:.65});
 const samplePaint=new THREE.MeshLambertMaterial({color:0x817859});
 box(.6,.08,.26,11.35,1.025,-7.3,dark);
 for(let i=0;i<4;i++){
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.27,6),glass);tube.position.set(11.13+i*.15,1.19,-7.3);scene.add(tube);
  box(.08,.035,.08,11.13+i*.15,1.34,-7.3,rust);
 }
 const jar=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.38,8),glass);jar.position.set(12.93,1.19,-7.35);scene.add(jar);
 box(.27,.05,.27,12.93,1.4,-7.35,dark);box(.1,.19,.1,12.93,1.15,-7.35,samplePaint);
 const book=placard(12.6,1.001,-7.05,.38,.42,0,g=>{g.fillStyle='#acac91';g.fillRect(0,0,128,96);g.fillStyle='#313f30';g.font='12px monospace';g.fillText('SPECIMEN 09',5,20);g.font='9px monospace';['TISSUE / 17B','MOTION: ++','RETEST 06:00'].forEach((t,i)=>g.fillText(t,6,40+i*17));});book.rotation.x=-Math.PI/2;
 // Reactor radiation monitor and sample drums sit on the existing vessel base.
 placard(4.82,1.7,-12,1.15,1.5,-Math.PI/2,g=>{
  g.fillStyle='#65654b';g.fillRect(0,0,128,96);g.fillStyle='#132419';g.fillRect(8,8,112,29);g.font='bold 16px monospace';g.fillStyle='#a8c185';g.fillText('0.86 mSv',12,29);
  g.fillStyle='#c2ad61';g.fillRect(8,44,112,44);g.fillStyle='#292d21';g.font='bold 11px monospace';g.fillText('RADIATION',28,58);g.font='8px monospace';g.fillText('DOSIMETER REQUIRED',10,76);
 });
 for(const x of [-4.8,4.8]){
  const drum=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.48,8),hazard);drum.position.set(x,.24,-18.4);scene.add(drum);
  box(.3,.05,.3,x,.49,-18.4,dark);
 }
 // Pump station gauge board and a worn inspection chart.
 placard(-10,1.9,-14.8,2.6,1.25,0,g=>{
  g.fillStyle='#3a493a';g.fillRect(0,0,128,96);g.font='bold 9px monospace';g.fillStyle='#c2c5a1';g.fillText('PRESSURE / BAR',9,13);
  for(let i=0;i<3;i++){const x=24+i*40;g.fillStyle='#a7af91';g.beginPath();g.arc(x,46,16,0,Math.PI*2);g.fill();g.strokeStyle='#293527';g.lineWidth=2;g.beginPath();g.moveTo(x,46);g.lineTo(x+9-i*7,34+i*3);g.stroke();}
  g.fillStyle='#d0bb79';g.font='8px monospace';g.fillText('02: SEAL LEAK',13,82);
 });
 board(-7,1.65,-14.8,0,'shop');
 placard(12.8,1.9,-4.82,2.1,1.5,0,g=>{
  g.fillStyle='#797e65';g.fillRect(0,0,128,96);g.fillStyle='#283d2f';g.font='bold 11px monospace';g.fillText('EVACUATION',12,15);
  for(let i=0;i<3;i++)g.strokeRect(10+i*35,29,29,24);g.fillRect(26,59,77,5);g.fillRect(98,52,5,25);g.beginPath();g.moveTo(92,73);g.lineTo(101,86);g.lineTo(110,73);g.fill();g.font='7px monospace';g.fillText('FILTERS ON / PAIR UP',7,93);
 });
 // Repeated concrete bays gain service records and legible industrial landmarks.
 board(-6.5,1.8,5.2,0,'shop');
 for(const side of [-1,1])for(const [i,z] of [13,21,29].entries()){
  placard(side*17.76,1.5,z,2.8,1.7,side<0?Math.PI/2:-Math.PI/2,g=>{g.fillStyle='#444b38';g.fillRect(0,0,128,96);g.fillStyle='#969675';g.font='bold 48px monospace';g.fillText('0'+(i+1),32,59);g.font='9px monospace';g.fillText('COLLECTOR / 86',22,80);});
 }
}
