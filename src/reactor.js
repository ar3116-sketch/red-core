import * as THREE from 'three';
import {industrialMetal,dressCeiling} from './ceiling.js';
import {readings,coolantTarget} from '../shared/coolant.js';
export function buildReactor(scene,{box,pipe,roomSign,wall,floor,steel,dark,rust,hazard,glow}){
 const blue=new THREE.MeshBasicMaterial({color:0x458eae});
 const lining=wall.clone();lining.side=THREE.DoubleSide;
 const outline=new THREE.Shape();outline.moveTo(-8,15);outline.lineTo(8,15);outline.lineTo(8,29);outline.lineTo(-8,29);outline.closePath();
 const hole=new THREE.Path();hole.absarc(0,22,3.72,0,Math.PI*2,true);outline.holes.push(hole);
 const slabGeometry=new THREE.ShapeGeometry(outline,24);slabGeometry.rotateX(-Math.PI/2);
 const floorPaint=floor.clone();floorPaint.map=floor.map.clone();floorPaint.map.wrapS=floorPaint.map.wrapT=THREE.RepeatWrapping;floorPaint.map.repeat.set(.4,.4);
 scene.add(new THREE.Mesh(slabGeometry,floorPaint));
 box(16,.25,14,0,8.5,-22,industrialMetal(412,6));dressCeiling(scene,{box,steel,rust,dark},0,-22,16,14,8.5);box(7,.3,.3,0,3.2,-15,steel);
 const well=new THREE.Mesh(new THREE.CylinderGeometry(3.72,3.3,5.6,24,1,true),lining);well.position.set(0,-2.8,-22);scene.add(well);
 const bottom=new THREE.Mesh(new THREE.CircleGeometry(3.3,24),dark);bottom.rotation.x=-Math.PI/2;bottom.position.set(0,-5.61,-22);scene.add(bottom);
 function ring(r,t,y,material){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,32),material);mesh.rotation.x=Math.PI/2;mesh.position.set(0,y,-22);scene.add(mesh);return mesh;}
 ring(3.83,.22,.13,steel);ring(3.55,.07,-.7,rust);ring(3.45,.07,-2.7,steel);ring(3.34,.07,-4.7,rust);
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,x=Math.cos(a)*3.85,z=-22+Math.sin(a)*3.85;
  const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.08,6),dark);bolt.position.set(x,.34,z);scene.add(bolt);
 }
 ring(4.04,.035,.58,rust);ring(4.04,.045,1.05,rust);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;box(.07,1.1,.07,Math.cos(a)*4.04,.55,-22+Math.sin(a)*4.04,steel);}
 const fuel=new THREE.MeshBasicMaterial({color:0x66b9d0});
 for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){
  box(.39,.55,.39,x*.5,-5.03,-22+z*.5,steel);
  for(let j=0;j<3;j++)box(.035,.04,.35,x*.5-.12+j*.12,-4.73,-22+z*.5,fuel);
 }
 const water=new THREE.Mesh(new THREE.CircleGeometry(3.64,24),new THREE.MeshBasicMaterial({color:0x143d51,transparent:true,opacity:.24,depthWrite:false}));water.rotation.x=-Math.PI/2;water.position.set(0,-.8,-22);scene.add(water);
 const coreLight=new THREE.PointLight(0x5ca9cc,22,15,1.7);coreLight.position.set(0,.6,-22);scene.add(coreLight);
 for(const side of [-1,1]){
  pipe(.3,12,side*7.4,4.6,-22,rust);pipe(.18,12,side*6.9,4.6,-22,steel);
  const riser=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,3.9,8),steel);riser.position.set(side*2.5,2.1,-24.7);scene.add(riser);
  const overhead=box(5.1,.24,.24,side*4.9,4.1,-24.7,steel);
  for(const z of [-18,-22,-26]){box(.14,3.4,.14,side*7.7,6.5,z,dark);box(.14,.14,15.7,0,7.9,z,steel).rotation.y=Math.PI/2;}
 }
 // Service crane and suspended handling head make the scale legible.
 box(15.5,.5,.75,0,7.1,-22,rust);box(1.4,.65,1.1,0,6.7,-22,steel);
 box(.07,4.7,.07,0,4.02,-22,dark);box(.35,.6,.35,0,1.35,-22,steel);
 for(const x of [-5.7,5.7])for(const z of [-17,-27]){
  box(1.6,.08,.45,x,6.6,z,glow);
  const light=new THREE.PointLight(0xc69452,14,13,1.7);light.position.set(x,5.8,z);scene.add(light);
 }
 roomSign('REACTOR CORE / OBJECT 86',0,4.5,-28.82,0,'#b2ccd0');
 roomSign('KEEP CLEAR / OPEN CORE',0,2.3,-26.4,0,'#d8b66e');
 roomSign('CONTROL GALLERY',0,3.7,-15.16,Math.PI);
 const screens=[],needles=[];
 const titles=['CORE THERMAL','LOOP PRESSURE','COOLANT FLOW','FILTER BANK','ROD MONITOR','SHUTDOWN BUS','POWER STATUS','THERMAL TREND'];
 function screen(x,y,z,yaw,index){
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=112;
  const texture=new THREE.CanvasTexture(canvas);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
  const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=yaw;scene.add(group);
  function part(w,h,d,x,y,z,m){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
  part(1.65,1.18,.25,0,0,-.1,dark);part(1.5,.98,.025,0,.04,.045,steel);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.36,.87),new THREE.MeshBasicMaterial({map:texture}));mesh.position.set(0,.06,.063);group.add(mesh);
  for(let i=0;i<5;i++)part(.12,.04,.06,-.55+i*.27,-.5,.06,i===4?hazard:steel);
  for(const sx of [-.75,.75])for(const sy of [-.5,.5])part(.025,.025,.025,sx,sy,.04,rust);
  screens.push({canvas,texture,index});
 }
 for(const side of [-1,1])for(let i=0;i<3;i++)screen(side*6.92,1.45,-23.7+i*1.7,side<0?Math.PI/2:-Math.PI/2,(side<0?0:3)+i);
 screen(-5.6,1.7,-16.95,0,6);screen(5.6,1.7,-16.95,0,7);
 // Analog meters and lamp matrices above the main console remain readable when CRTs dim.
 for(let i=0;i<6;i++){
  const x=-2.25+i*.9;
  box(.64,.78,.2,x,2.35,-14.93,dark);box(.03,.48,.03,x,2.94,-14.93,steel);
  const face=new THREE.Mesh(new THREE.CircleGeometry(.23,16),new THREE.MeshLambertMaterial({color:0xa7ad8e}));face.position.set(x,2.42,-14.81);scene.add(face);
  const needle=box(.023,.32,.018,x,2.42,-14.79,rust);needle.userData.dynamic=true;needles.push(needle);
  for(let k=0;k<3;k++)box(.09,.06,.025,x-.17+k*.17,2.02,-14.8,k===0?blue:hazard);
 }
 let clock=0,history=[];
 return {update(dt,time,temp,pressure,blackout,coolant){
  coreLight.intensity=19+Math.sin(time*1.7)*2;fuel.color.setHex(temp>=85?0xaabcbd:0x66b9d0);
  needles.forEach((n,i)=>n.rotation.z=1.1-(i%2?pressure:temp)*.022);
  clock+=dt;if(clock<.25)return;clock=0;history.push(temp);if(history.length>60)history.shift();
  const flow=readings(coolant.intake,coolant.bypass),target=coolantTarget(coolant);
  for(const s of screens){const g=s.canvas.getContext('2d');g.fillStyle=blackout?'#030906':'#071810';g.fillRect(0,0,160,112);g.strokeStyle='#173125';for(let x=0;x<160;x+=16){g.beginPath();g.moveTo(x,20);g.lineTo(x,112);g.stroke();}for(let y=20;y<112;y+=12){g.beginPath();g.moveTo(0,y);g.lineTo(160,y);g.stroke();}
   g.fillStyle=temp>=85?'#de9671':'#89bf8d';g.font='bold 10px monospace';g.fillText(titles[s.index],6,14);g.font='10px monospace';
   const lines=[
    [`TEMP ${temp.toFixed(1)}%`,temp>=85?'LIMIT EXCEEDED':'CORE ONLINE','TRIP LIMIT 100%'],
    [`PRESSURE ${pressure.toFixed(0)}%`,'VALVE 03 / BYPASS',pressure>=65?'CHECK COOLANT':'LINE CHARGED'],
    [`FLOW ${flow.flow} / ${target.flow}`,`INTAKE ${coolant.intake}%`,`BYPASS ${coolant.bypass}%`],
    [coolant.filterReady?'FILTERS CLEAR':'FILTERS BLOCKED',`PROCESSED ${coolant.filterProgress}/3`,coolant.cooldown>0?`FLUSH ${Math.ceil(coolant.cooldown)}S`:'INCINERATOR LINK'],
    ['ROD BANK / LOCKED','REMOTE DRIVE OFF','INSPECTION MODE'],
    ['CONTAINMENT BUS',temp>=85?'THERMAL ALERT':'MONITORING','MANUAL WATCH'],
    [blackout?'BREAKER TRIPPED':'MAINS 50 HZ','BACKUP / STANDBY','OBJECT 86'],
    [`CORE ${temp.toFixed(1)}%`,'15 SECOND TRACE','COOLANT MONITOR']
   ][s.index];lines.forEach((line,i)=>g.fillText(line,6,32+i*15));
   g.strokeStyle='#79b58b';g.beginPath();history.forEach((value,i)=>{const x=6+i*2.4,y=104-value*.28;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();s.texture.needsUpdate=true;
  }
 }};
}
