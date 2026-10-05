import * as THREE from 'three';
import {TOOL_JOBS,withinToolReach,heldTool,TOOL_NAMES,ropeDestination} from '../shared/tool-system.js';
import {makeTool,toolMaterials} from './tool-models.js';
export function createToolWorld(scene){
 const group=new THREE.Group();group.userData.dynamic=true;scene.add(group);const models=new Map(),fittings=new Map();const m=toolMaterials();
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.23,.008,3,16),new THREE.MeshBasicMaterial({color:0xd1bb7b}));halo.visible=false;group.add(halo);
 for(const j of TOOL_JOBS){
  const g=new THREE.Group();g.position.set(j.x,j.y,j.z);group.add(g);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(j.kind==='leak'?.15:.10,.035,4,10),m.steel);g.add(ring);
  const bolts=[];for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const b=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.10,6),m.red);b.rotation.x=Math.PI/2;b.position.set(Math.cos(a)*.15,Math.sin(a)*.15,.025);g.add(b);bolts.push(b);}
  let steam,rope;
  if(j.kind==='leak'){
   const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.65,8),m.dark);pipe.rotation.x=Math.PI/2;g.add(pipe);
   if(j.id==='pump-leak'){const supply=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,1.2,8),m.dark);supply.rotation.x=Math.PI/2;supply.position.z=-.6;g.add(supply);}
   if(j.id==='core-leak'){const riser=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.5,8),m.dark);riser.position.set(0,.75,-.32);g.add(riser);const header=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2,8),m.dark);header.rotation.z=Math.PI/2;header.position.set(1,1.5,-.32);g.add(header);}
   steam=new THREE.Group();g.add(steam);for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),new THREE.MeshBasicMaterial({color:0xaab2a0,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}));steam.add(p);}
  }else{
   rope=new THREE.Group();g.add(rope);const height=j.top.y-j.bottom.y+.85;
   const line=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,height,5),m.rope);line.position.set(.12,-height/2,0);rope.add(line);
   for(let i=0;i<Math.floor(height/.32);i++){const knot=new THREE.Mesh(new THREE.BoxGeometry(.07,.045,.06),m.rope);knot.position.set(.12,-.18-i*.32,0);rope.add(knot);}
  }
  fittings.set(j.id,{g,bolts,steam,rope});
 }
 return {
  target(s,id,p,yaw,pitch,cameraOpen){
   const aim=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)),eye=new THREE.Vector3(p.x,p.y+1.6,p.z);const candidates=[];
   for(const t of s.items)if(!t.holder&&!t.spent&&withinToolReach(p,t,cameraOpen))candidates.push({...t,type:'pickup',label:TOOL_NAMES[t.kind]});
   for(const j of TOOL_JOBS){const dest=ropeDestination(s,p,j.id);if(dest){const q=Math.abs(p.y-j.top.y)<.7?j.top:j.bottom;candidates.push({...j,x:q.x,y:q.y+1,z:q.z,type:'climb',label:'CLIMB RESCUE ROPE'});}else if(s.jobs[j.id]<3&&withinToolReach(p,j,cameraOpen))candidates.push({...j,type:'job',label:j.label});}
   let best=null,score=.84;for(const c of candidates){const dot=new THREE.Vector3(c.x,c.y,c.z).sub(eye).normalize().dot(aim);if(dot>score){best=c;score=dot;}}
   halo.visible=!!best;if(best){halo.position.set(best.x,best.y,best.z);halo.rotation.set(pitch,yaw,0);}
   return best;
  },
  update(s,id,p,players,time,camera){
   for(const t of s.items){let mesh=models.get(t.id);if(!mesh){mesh=makeTool(t.kind);group.add(mesh);models.set(t.id,mesh);}mesh.visible=!t.spent&&t.holder!==id;
    if(t.holder){const q=players.find(q=>q.id===t.holder);mesh.visible=mesh.visible&&!!q;if(q){mesh.position.set(q.x+.35,q.y+.90,q.z);mesh.rotation.set(0,0,-.3);mesh.scale.setScalar(1);}}
    else{mesh.position.set(t.x,t.y,t.z);mesh.rotation.set(Math.PI/2,0,t.kind==='wrench'?.6:0);mesh.scale.setScalar(1);}
   }
   for(const j of TOOL_JOBS){const f=fittings.get(j.id),progress=s.jobs[j.id]||0;f.bolts.forEach((b,i)=>{b.position.z=i<progress?0:.06;});if(f.rope)f.rope.visible=progress>=3;
    if(f.steam){f.steam.visible=progress<3;f.steam.children.forEach((p,i)=>{const t=(time*.65+i*.2)%1;p.position.set(.03+Math.sin(i*5+t)*.08,t*.55,.13+t*.22);p.quaternion.copy(camera.quaternion);p.scale.setScalar(.6+t*1.5);p.material.opacity=(1-t)*.15;});}
   }
  }
 };
}
