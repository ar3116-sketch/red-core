import * as THREE from 'three';
import {industrialMetal} from './ceiling.js';
import {lampVoltage} from './flicker.js';
import {WING_SPACES,WING_FLOORS,WING_FIXTURES,SHAFTS,SHAFT_RAILS,BROKEN_RAILS,SHAFT_FLOOR,LIFT_DOOR} from '../shared/wings.js';

// Tunnels, halls and wing rooms. Low ceilings and sparse caged lamps keep the corridors dark.
export function buildWings(scene,{box,pipe,roomSign,wall,floor,steel,dark,rust,hazard,glow,coolant}){
 const lamps=[];
 const tiled=(material,u,v)=>{const m=material.clone();m.map=material.map.clone();m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.map.repeat.set(Math.max(1,u),Math.max(1,v));return m;};
 const shaftWall=new THREE.MeshLambertMaterial({color:0x1b201a,side:THREE.DoubleSide});
 const grime=new THREE.MeshLambertMaterial({color:0x2f342a});
 const paper=new THREE.MeshLambertMaterial({color:0xb9b28c});
 const red=new THREE.MeshBasicMaterial({color:0x8e2d1f});
 function beam(a,b,r,material){const d=new THREE.Vector3().subVectors(b,a);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),5),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());scene.add(m);return m;}
 function lamp(x,y,z,seed,damaged,range=8,power=7){
  const bulb=glow.clone();box(.36,.14,.36,x,y+.05,z,dark);box(.24,.1,.24,x,y-.05,z,bulb);
  for(const s of [-1,1])box(.03,.18,.3,x+s*.15,y-.07,z,steel);
  const light=new THREE.PointLight(0xd3a264,power,range,1.7);light.position.set(x,y-.25,z);scene.add(light);
  lamps.push({light,bulb,base:power,seed,damaged});
 }
 for(const f of WING_FLOORS)box(f.maxX-f.minX,.12,f.maxZ-f.minZ,(f.minX+f.maxX)/2,-.06,(f.minZ+f.maxZ)/2,tiled(floor,(f.maxX-f.minX)/2.5,(f.maxZ-f.minZ)/2.5));
 let seed=0;
 for(const s of WING_SPACES){
  const w=s.maxX-s.minX,d=s.maxZ-s.minZ,cx=(s.minX+s.maxX)/2,cz=(s.minZ+s.maxZ)/2;
  box(w,.2,d,cx,s.h+.1,cz,industrialMetal(311+seed*17,Math.max(2,Math.round(Math.max(w,d)/3))));
  const long=w>=d;
  // Ceiling services run the length of every space.
  if(s.kind!=='room'){
   for(const off of [-.7,.7]){
    const a=long?new THREE.Vector3(s.minX,s.h-.35,cz+off*(d/3)):new THREE.Vector3(cx+off*(w/3),s.h-.35,s.minZ);
    const b=long?new THREE.Vector3(s.maxX,s.h-.35,cz+off*(d/3)):new THREE.Vector3(cx+off*(w/3),s.h-.35,s.maxZ);
    beam(a,b,off<0?.13:.08,off<0?coolant:rust);
   }
   const tray=long?box(w,.05,.4,cx,s.h-.62,cz,steel):box(.4,.05,d,cx,s.h-.62,cz,steel);
   const span=long?w:d,count=Math.max(1,Math.floor(span/7));
   for(let i=0;i<count;i++){
    const t=(i+.5)/count,x=long?s.minX+w*t:cx-(s.kind==='hall'?w/2-1.2:0),z=long?cz:s.minZ+d*t;
    lamp(x,s.h-.15,z,seed+i*3,(seed+i)%3===0,s.kind==='tunnel'?7:9,s.kind==='tunnel'?5:7);
   }
   // Wall ribs every few metres break up long corridors.
   for(let t=1.5;t<span;t+=3){
    if(long){for(const side of [s.minZ+.14,s.maxZ-.14])box(.16,s.h,.08,s.minX+t,s.h/2,side,dark);}
    else{for(const side of [s.minX+.14,s.maxX-.14])if(!(s.kind==='hall'&&((side>0)===(s.minX>0))))box(.08,s.h,.16,side,s.h/2,s.minZ+t,dark);}
   }
  }else{
   lamp(cx-w/4,s.h-.15,cz,seed,seed%2===0,10,8);lamp(cx+w/4,s.h-.15,cz,seed+5,false,10,8);
  }
  seed+=7;
 }
 // Signs face whoever is walking into each space.
 roomSign('EAST TUNNEL',15.25,2.4,-2.5,-Math.PI/2);roomSign('EXTRACTION',24.75,2.4,-2.5,Math.PI/2);
 roomSign('SUBSTATION',30.8,2.6,-9.5,Math.PI/2);roomSign('BARRACKS',30.8,2.6,7.5,Math.PI/2);roomSign('SURFACE LIFT',30.8,2.5,-.5,Math.PI/2);
 roomSign('EAST HALL',31.2,2.6,-9.5,-Math.PI/2);roomSign('EAST HALL',31.2,2.6,7.5,-Math.PI/2);roomSign('EAST HALL',40.8,2.4,-.5,Math.PI/2);
 roomSign('WEST TUNNEL',-15.25,2.4,-10.5,Math.PI/2);roomSign('PUMP ROOM',-24.75,2.4,-10.5,-Math.PI/2);
 roomSign('STORAGE',-30.8,2.6,-.5,-Math.PI/2);roomSign('ARCHIVE',-30.8,2.6,-20.5,-Math.PI/2);
 roomSign('WEST HALL',-31.2,2.6,-.5,Math.PI/2);roomSign('WEST HALL',-31.2,2.6,-20.5,Math.PI/2);
 roomSign('DANGER / OPEN SHAFT',25.2,1.9,-10,Math.PI/2,'#d6a14e');roomSign('DANGER / OPEN SHAFT',-25.2,1.9,-16,-Math.PI/2,'#d6a14e');
 // Shafts: a lip of hazard paint, sheer walls down to a faint sump glow far below.
 for(const s of SHAFTS){
  const w=s.maxX-s.minX,d=s.maxZ-s.minZ,cx=(s.minX+s.maxX)/2,cz=(s.minZ+s.maxZ)/2,depth=-SHAFT_FLOOR;
  for(const [x,z,sw,sd] of [[s.minX,cz,.08,d],[s.maxX,cz,.08,d],[cx,s.minZ,w,.08],[cx,s.maxZ,w,.08]])box(sw,depth,sd,x,-depth/2-.12,z,shaftWall);
  box(w,.1,d,cx,SHAFT_FLOOR,cz,grime);
  for(const [x,z,sw,sd] of [[s.minX,cz,.12,d],[s.maxX,cz,.12,d],[cx,s.minZ,w,.12],[cx,s.maxZ,w,.12]])box(sw,.03,sd,x,.015,z,hazard);
  for(let y=-1.2;y>SHAFT_FLOOR;y-=2.4)box(w-.1,.1,.1,cx,y,s.minZ+.08,rust);
  const sump=new THREE.PointLight(0x9a6a33,2.2,7,1.6);sump.position.set(cx,SHAFT_FLOOR+1,cz);scene.add(sump);
 }
 for(const r of SHAFT_RAILS){
  for(const h of [.52,1.05])beam(new THREE.Vector3(r.x1,h,r.z1),new THREE.Vector3(r.x2,h,r.z2),.035,rust);
  const n=Math.max(1,Math.ceil(Math.hypot(r.x2-r.x1,r.z2-r.z1)/1.6));
  for(let i=0;i<=n;i++){const t=i/n;box(.06,1.08,.06,r.x1+(r.x2-r.x1)*t,.54,r.z1+(r.z2-r.z1)*t,steel);}
 }
 // Broken sections: torn stubs bent outwards over the drop, hazard plates on the floor.
 for(const g of BROKEN_RAILS){
  const along=g.axis==='x';
  for(const end of [g.min,g.max]){
   const x=along?g.x:end,z=along?end:g.z;
   const stub=box(.06,.7,.06,x,.62,z,rust);stub.rotation[along?'x':'z']=(end===g.min?1:-1)*.7;
  }
  const plate=box(along?.3:g.max-g.min,.012,along?g.max-g.min:.3,along?g.x-.2:(g.min+g.max)/2,.01,along?(g.min+g.max)/2:g.z+.2,hazard);
 }
 // Fixtures by room.
 const at=id=>WING_FIXTURES.find(f=>f.id===id);
 function cabinet(f,material=steel){box(f.w,f.h,f.d,f.x,f.h/2,f.z,material);}
 const bank=at('breaker-bank');cabinet(bank,grime);
 for(let i=0;i<8;i++){const x=bank.x-bank.w/2+.4+i*.74;box(.6,1.5,.04,x,1.15,bank.z+bank.d/2+.02,steel);box(.08,.24,.06,x+.18,1.25,bank.z+bank.d/2+.06,i===3?hazard:dark);box(.3,.08,.02,x,1.75,bank.z+bank.d/2+.05,paper);}
 roomSign('ПОДСТАНЦИЯ / BREAKERS',bank.x,2.55,bank.z+bank.d/2+.02,0,'#d6a14e');
 const tr=at('transformer');cabinet(tr,coolant);for(let i=0;i<5;i++)box(tr.w+.08,.06,tr.d+.08,tr.x,.35+i*.35,tr.z,dark);
 for(const s of [-1,1]){const iso=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,.5,6),new THREE.MeshLambertMaterial({color:0x7a5a3c}));iso.position.set(tr.x+s*.5,tr.h+.25,tr.z);scene.add(iso);}
 const scope=at('scope-safe');cabinet(scope,new THREE.MeshLambertMaterial({color:0x52675b}));box(.04,.5,.7,scope.x-scope.w/2-.02,1.15,scope.z,new THREE.MeshBasicMaterial({color:0x2c4a33}));
 roomSign('MUTAGEN SAFE 03 / SYNC',scope.x-scope.w/2-.03,2.1,scope.z,-Math.PI/2,'#a4cab1');
 for(const id of ['bunk-1','bunk-2','bunk-3']){const b=at(id);for(const y of [.45,1.35]){box(b.w,.12,b.d,b.x,y,b.z,steel);box(b.w-.1,.12,b.d-.1,b.x,y+.11,b.z,new THREE.MeshLambertMaterial({color:0x5d6447}));}for(const sx of [-1,1])for(const sz of [-1,1])box(.06,b.h,.06,b.x+sx*(b.w/2-.03),b.h/2,b.z+sz*(b.d/2-.03),dark);}
 const bl=at('barracks-lockers');for(let i=0;i<4;i++){box(.76,bl.h,bl.d,bl.x-bl.w/2+.4+i*.8,bl.h/2,bl.z,i%2?steel:grime);box(.5,.03,.02,bl.x-bl.w/2+.4+i*.8,1.6,bl.z-bl.d/2-.01,dark);}
 const table=at('barracks-table');box(table.w,.06,table.d,table.x,table.h,table.z,rust);for(const sx of [-1,1])for(const sz of [-1,1])box(.05,table.h,.05,table.x+sx*(table.w/2-.05),table.h/2,table.z+sz*(table.d/2-.05),dark);
 box(.3,.02,.2,table.x-.3,table.h+.04,table.z,paper);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.04,.035,.09,6),steel);cup.position.set(table.x+.4,table.h+.08,table.z+.1);scene.add(cup);
 // The surface lift: a caged platform behind a blast door, cables vanishing up the shaft.
 const cage=at('lift-cage');
 for(const sx of [-1,1])for(const sz of [-1,1])box(.16,5,.16,cage.x+sx*(cage.w/2-.08),2.5,cage.z+sz*(cage.d/2-.08),rust);
 for(let y=.6;y<5;y+=.9)box(.06,.06,cage.d,cage.x-cage.w/2+.05,y,cage.z,steel);
 const liftDoor=new THREE.Group();liftDoor.userData.dynamic=true;liftDoor.position.set(cage.x-cage.w/2-.08,0,cage.z);scene.add(liftDoor);
 for(const side of [-1,1]){const leaf=new THREE.Mesh(new THREE.BoxGeometry(.18,3.6,cage.d/2),new THREE.MeshLambertMaterial({map:wall.map,color:0x8a8f7a}));leaf.position.set(0,1.8,side*cage.d/4);leaf.userData.side=side;liftDoor.add(leaf);for(let i=0;i<5;i++){const stripe=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,cage.d/2-.1),i%2?hazard:dark);stripe.position.set(0,.4+i*.2,0);leaf.add(stripe);}}
 for(const x of [cage.x-.5,cage.x+.5])beam(new THREE.Vector3(x,5.4,cage.z),new THREE.Vector3(x,4.4,cage.z),.03,dark);
 roomSign('ПОДЪЁМ / SURFACE LIFT',LIFT_DOOR.x-3.6,4.2,LIFT_DOOR.z,-Math.PI/2,'#d6a14e');
 const beacon=new THREE.MeshBasicMaterial({color:0x4a1b13});box(.25,.25,.25,cage.x-cage.w/2-.15,3.9,cage.z+2.3,beacon);
 const beaconLight=new THREE.PointLight(0xc0402a,0,8,1.7);beaconLight.position.set(cage.x-cage.w/2-.5,3.7,cage.z+2.3);scene.add(beaconLight);
 const crates=at('lift-crates');box(crates.w,crates.h,crates.d,crates.x,crates.h/2,crates.z,rust);box(crates.w*.7,.5,crates.d*.7,crates.x,crates.h+.25,crates.z,steel);
 const winch=at('lift-winch');cabinet(winch,grime);const drum=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1.4,10),rust);drum.rotation.z=Math.PI/2;drum.position.set(winch.x,winch.h+.3,winch.z);scene.add(drum);
 // Storage: racks of crates and a locker row (one of them hides the IR goggles).
 const racks=at('storage-racks');for(let y=.1;y<racks.h;y+=.6)box(racks.w,.05,racks.d,racks.x,y,racks.z,steel);for(let i=0;i<9;i++)box(.5,.4,.6,racks.x,.35+(i%4)*.6,racks.z-racks.d/2+.5+i*.6,i%3?rust:grime);
 const lockers=at('storage-lockers');for(let i=0;i<5;i++){box(.76,lockers.h,lockers.d,lockers.x-lockers.w/2+.4+i*.8,lockers.h/2,lockers.z,i===2?grime:steel);box(.5,.03,.02,lockers.x-lockers.w/2+.4+i*.8,1.6,lockers.z+lockers.d/2+.01,dark);}
 const sc=at('storage-crates');box(sc.w,sc.h,sc.d,sc.x,sc.h/2,sc.z,rust);
 // Archive: a mainframe wall of tape drives and filing cabinets.
 const mf=at('mainframe');cabinet(mf,grime);
 for(let i=0;i<6;i++){const z=mf.z-mf.d/2+.6+i*1.15;for(const dy of [1.55,.95]){const reel=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.04,10),dark);reel.rotation.z=Math.PI/2;reel.position.set(mf.x+mf.w/2+.03,dy,z);scene.add(reel);}box(.03,.1,.5,mf.x+mf.w/2+.02,.5,z,i%2?hazard:paper);}
 roomSign('ЭВМ-86 / MAINFRAME',mf.x+mf.w/2+.03,2.6,mf.z,Math.PI/2,'#c6d0a1');
 const files=at('file-row');for(let i=0;i<6;i++){box(.8,files.h,files.d,files.x-files.w/2+.42+i*.83,files.h/2,files.z,steel);for(let j=0;j<3;j++)box(.5,.04,.02,files.x-files.w/2+.42+i*.83,.3+j*.45,files.z+files.d/2+.01,dark);}
 const sweeper=at('sweeper-safe');cabinet(sweeper,new THREE.MeshLambertMaterial({color:0x52675b}));box(.7,.5,.04,sweeper.x,1.15,sweeper.z-sweeper.d/2-.02,new THREE.MeshBasicMaterial({color:0x2c4a33}));
 roomSign('MUTAGEN SAFE 02 / GRID',sweeper.x,2.1,sweeper.z-sweeper.d/2-.03,Math.PI,'#a4cab1');
 for(const id of ['hall-e-crates','hall-w-crates']){const c=at(id);box(c.w,c.h,c.d,c.x,c.h/2,c.z,rust);}
 // Pinned notes and posters: people worked here.
 const notes=[[-40.85,1.5,-17.4,Math.PI/2],[-40.85,1.6,-23.6,Math.PI/2],[40.85,1.5,9,-Math.PI/2],[35,1.6,11.85,Math.PI],[-38,1.5,3.85,Math.PI],[33,1.5,-5.15,Math.PI]];
 for(const [x,y,z,a] of notes)for(let i=0;i<3;i++){const n=new THREE.Mesh(new THREE.PlaneGeometry(.22,.3),paper);n.position.set(x+Math.cos(a)*0+Math.sin(a)*(i*.3-.3),y+(i%2)*.12,z+Math.cos(a)*(i*.3-.3));n.rotation.y=a;n.rotation.z=(i-1)*.08;scene.add(n);}
 let doorOpen=0;
 return {
  update(time,blackout=false,liftOpen=0,alarm=false){
   for(const l of lamps){const v=blackout?.05:lampVoltage(time,l.seed,l.damaged);l.light.intensity=l.base*v;l.bulb.color.copy(glow.color).multiplyScalar(v);}
   doorOpen+=(liftOpen-doorOpen)*.08;for(const leaf of liftDoor.children)leaf.position.z=leaf.userData.side*(cage.d/4+doorOpen*cage.d/2);
   const pulse=alarm&&Math.sin(time*6)>0;beacon.color.setHex(pulse?0xd2492e:0x4a1b13);beaconLight.intensity=pulse?8:0;
  }
 };
}
