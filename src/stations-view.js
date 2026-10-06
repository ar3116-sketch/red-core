import * as THREE from 'three';
import {isWalkable,SOLIDS} from '../shared/world.js';
import {VENTS,CAMERAS,SABOTAGE,SCIF_DESK} from '../shared/stations.js';
import {SAFES} from '../shared/safes.js';
import {TOOL_JOBS} from '../shared/tool-system.js';
import {LIFT_DOOR} from '../shared/wings.js';
import {CONSOLE_POSITION} from '../shared/constants.js';
import {COOLANT_STATION} from '../shared/coolant.js';
import {CAMERA_PANEL,INCINERATOR,SERVICE_LADDER} from '../shared/facility.js';
import {TUBE_RACK} from '../shared/tubes.js';

// Things you can use all share one tell: a small amber lamp and a yellow floor chevron.
// Plus the physical hardware for vents, cameras, cable boxes, the valve and the tunnel doors.
export function buildStations(scene){
 const amber=new THREE.MeshBasicMaterial({color:0xd99b44}),paint=new THREE.MeshBasicMaterial({color:0xb38a35,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8});
 const steel=new THREE.MeshLambertMaterial({color:0x596153}),dark=new THREE.MeshLambertMaterial({color:0x22281f}),grey=new THREE.MeshLambertMaterial({color:0x6c705f});
 const ledOn=new THREE.MeshBasicMaterial({color:0xd23a22}),ledOff=new THREE.MeshBasicMaterial({color:0x2a1410});
 const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);scene.add(m);return m;};
 // The wall nearest a stand point, so hardware mounts on it rather than in the walkway.
 function wallward(x,z,y=0){let best=null;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])for(let d=.4;d<=1.6;d+=.2){if(!isWalkable(x+dx*d,z+dz*d,SOLIDS,.05,y)){if(!best||d<best.d)best={dx,dz,d};break;}}return best||{dx:0,dz:-1,d:.6};}
 const lamps=[];
 function marker(x,z,y=0,height=1.95){
  const w=wallward(x,z,y),px=x+w.dx*(w.d-.08),pz=z+w.dz*(w.d-.08);
  const lamp=add(new THREE.BoxGeometry(.12,.12,.12),amber.clone(),px,y+height,pz);lamps.push(lamp);
  add(new THREE.BoxGeometry(.2,.04,.2),dark,px,y+height+.08,pz);
  const chevron=add(new THREE.PlaneGeometry(.5,.18),paint,x,y+.012,z);chevron.rotation.x=-Math.PI/2;chevron.rotation.z=Math.atan2(w.dx,w.dz);
  return w;
 }
 for(const p of [{x:CONSOLE_POSITION.x,z:CONSOLE_POSITION.z+1.1},{x:COOLANT_STATION.x,z:COOLANT_STATION.z-.9,y:COOLANT_STATION.y},{x:CAMERA_PANEL.x+.6,z:CAMERA_PANEL.z},{x:INCINERATOR.x,z:INCINERATOR.z-1},{x:TUBE_RACK.x+.6,z:TUBE_RACK.z},{x:SCIF_DESK.x+.6,z:SCIF_DESK.z+1.2},{x:SERVICE_LADDER.x-.4,z:SERVICE_LADDER.z,y:SERVICE_LADDER.y},{x:LIFT_DOOR.x-2.6,z:LIFT_DOOR.z+1.4},...SAFES.map(s=>s.stand),...TOOL_JOBS.map(j=>({x:j.x,z:j.z,y:j.floor}))])marker(p.x,p.z,p.y??0);
 // Floor grates over the ducts.
 const grates=new Map();
 for(const v of VENTS){
  const g=new THREE.Group();g.userData.dynamic=true;g.position.set(v.x,.015,v.z);scene.add(g);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.8,.03,.8),steel);g.add(frame);
  for(let i=-3;i<=3;i++){const slat=new THREE.Mesh(new THREE.BoxGeometry(.09,.035,.7),dark);slat.position.x=i*.1;g.add(slat);}
  grates.set(v.id,{g,until:0});
 }
 // Physical cameras: bracket, body, lens, a red tally lamp. Cut cameras droop and go dark.
 const cams=new Map();
 for(const c of CAMERAS){
  const [x,y,z]=c.mount,g=new THREE.Group();g.userData.dynamic=true;g.position.set(x,y,z);scene.add(g);
  const head=new THREE.Group();g.add(head);head.lookAt(new THREE.Vector3(...c.target));
  const body=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.42),grey);body.position.z=.1;head.add(body);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(.26,.04,.5),dark);hood.position.set(0,.12,.12);head.add(hood);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.08,8),dark);lens.rotation.x=Math.PI/2;lens.position.z=.34;head.add(lens);
  const led=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.04),ledOn);led.position.set(.07,.06,.32);head.add(led);
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.35,5),steel);arm.position.y=.2;g.add(arm);
  const w=wallward(c.box.x,c.box.z),bx=c.box.x+w.dx*(w.d-.12),bz=c.box.z+w.dz*(w.d-.12);
  add(new THREE.BoxGeometry(.32,.42,.32),grey,bx,1.3,bz);add(new THREE.BoxGeometry(.06,1.8,.06),dark,bx,2.4,bz);
  const tag=add(new THREE.BoxGeometry(.12,.08,.02),amber,bx-w.dz*.0,1.6,bz);void tag;
  marker(c.box.x,c.box.z,0,1.75);
  cams.set(c.id,{head,led,rest:head.quaternion.clone()});
 }
 // Pump-room main valve: the saboteur spins it backwards; a red tag hangs off it while reversed.
 const valveStation=SABOTAGE.find(s=>s.id==='valve'),vw=wallward(valveStation.x,valveStation.z);
 const valve=new THREE.Group();valve.userData.dynamic=true;valve.position.set(valveStation.x+vw.dx*(vw.d-.15),1.25,valveStation.z+vw.dz*(vw.d-.15));valve.lookAt(valveStation.x,1.25,valveStation.z);scene.add(valve);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.32,.04,5,12),new THREE.MeshLambertMaterial({color:0x8e2d1f}));valve.add(wheel);
 for(let i=0;i<3;i++){const spoke=new THREE.Mesh(new THREE.BoxGeometry(.6,.04,.04),steel);spoke.rotation.z=i*Math.PI/3;wheel.add(spoke);}
 const redTag=new THREE.Mesh(new THREE.BoxGeometry(.12,.2,.01),new THREE.MeshBasicMaterial({color:0xb3352a}));redTag.position.set(.25,-.3,.05);valve.add(redTag);
 marker(valveStation.x,valveStation.z);
 const breaker=SABOTAGE.find(s=>s.id==='breaker');marker(breaker.x,breaker.z);
 const lever=SABOTAGE.find(s=>s.id==='doors'),lw=wallward(lever.x,lever.z);
 const leverArm=add(new THREE.BoxGeometry(.06,.5,.06),new THREE.MeshLambertMaterial({color:0xb3352a}),lever.x+lw.dx*(lw.d-.1),1.3,lever.z+lw.dz*(lw.d-.1));leverArm.userData.dynamic=true;
 add(new THREE.BoxGeometry(.4,.5,.12),dark,lever.x+lw.dx*(lw.d-.03),1.3,lever.z+lw.dz*(lw.d-.03));marker(lever.x,lever.z);
 // Tunnel blast doors drop from the ceiling when sealed.
 const doors=[{x:15.45,z:-2.5},{x:-15.45,z:-10.5}].map(p=>{const d=add(new THREE.BoxGeometry(.3,2.8,3),new THREE.MeshLambertMaterial({color:0x5a5e4b}),p.x,4.3,p.z);for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.32,.18,3),i%2?paint:dark);s.position.y=-1.2+i*.18;d.add(s);}d.userData.dynamic=true;return d;});
 let spin=0;
 return {
  update(now,s){
   const pulse=.75+.25*Math.sin(now*.004);for(const l of lamps)l.material.color.setHex(0xd99b44).multiplyScalar(s.blackout?.25:pulse);
   for(const [id,c] of cams){const cut=s.cut?.includes(id);c.led.material=cut||s.blackout?ledOff:(Math.floor(now/700)%2?ledOn:ledOff);c.head.rotation.x+=((cut?.9:0)-c.head.rotation.x)*.05;}
   spin+=((s.valve?-1:1)*.4-0)*.016;wheel.rotation.z=s.valve?spin*3:wheel.rotation.z*.95;redTag.visible=!!s.valve;
   leverArm.rotation.x=s.sealed?-.9:0;
   for(const d of doors)d.position.y+=((s.sealed?1.4:4.3)-d.position.y)*.12;
   for(const g of grates.values()){g.g.position.y=.015+(now<g.until?Math.abs(Math.sin(now*.07))*.04:0);}
  },
  rattle(id){const g=grates.get(id);if(g)g.until=performance.now()+1600;},
 };
}
