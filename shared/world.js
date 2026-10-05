import {DETAIL_FIXTURES} from './detail-layout.js';
import {CORE_FIXTURES,CORE_WELL} from './reactor.js';
import { SEWER_SURFACES,SEWER_COLLIDERS,onSurface,surfaceY } from './sewer.js';
import { CONSOLE_POSITION } from './constants.js';

export const ROOMS = [
 {id:'workshop',name:'WORKSHOP',x:-10,z:0,color:0x9b8653},
 {id:'control',name:'CONTROL',x:0,z:0,color:0x809b68},
 {id:'extraction',name:'EXTRACTION',x:10,z:0,color:0x7c9698},
 {id:'pumps',name:'PUMP ROOM',x:-10,z:-10,color:0x62978d},
 {id:'reactor',name:'REACTOR HALL',x:0,z:-10,color:0xc99546},
 {id:'containment',name:'CONTAINMENT',x:10,z:-10,color:0x92709d},
];
export const DOORS = [
 {x:-5,z:0,axis:'x',a:'workshop',b:'control'},
 {x:5,z:0,axis:'x',a:'control',b:'extraction'},
 {x:-5,z:-10,axis:'x',a:'pumps',b:'reactor'},
 {x:5,z:-10,axis:'x',a:'reactor',b:'containment'},
 {x:-10,z:-5,axis:'z',a:'workshop',b:'pumps'},
 {x:0,z:-5,axis:'z',a:'control',b:'reactor'},
 {x:10,z:-5,axis:'z',a:'extraction',b:'containment'},
];
export function roomAt(x,z) {return z< -15?{id:'core',name:'REACTOR CORE'}:x<-15?{id:'cameras',name:'CAMERA ROOM'}:x>15?{id:'incinerator',name:'INCINERATOR'}:z>5?{id:'sewer',name:z>37?'DRAIN TUNNEL':'SEWER CHAMBER'}:ROOMS.find(r=>Math.abs(x-r.x)<=5&&Math.abs(z-r.z)<=5);}
export const WALLS = [
 {x:-15,z:-8.85,w:.22,d:12.3},{x:-15,z:2.35,w:.22,d:5.3},
 {x:15,z:-13.1,w:.22,d:3.8},{x:15,z:-1.9,w:.22,d:13.8},
 {x:-23,z:-1,w:.22,d:8},{x:-19,z:-5,w:8,d:.22},{x:-19,z:3,w:8,d:.22},
 {x:23,z:-10,w:.22,d:10},{x:19,z:-15,w:8,d:.22},{x:19,z:-5,w:8,d:.22},
 {x:-9.25,z:-15,w:11.5,d:.22},{x:9.25,z:-15,w:11.5,d:.22},
 {x:-8,z:-22,w:.22,d:14,minY:0,maxY:8.5},{x:8,z:-22,w:.22,d:14,minY:0,maxY:8.5},{x:0,z:-29,w:16,d:.22,minY:0,maxY:8.5},
 ...[-10,0,10].flatMap(x=>[-1,1].map(side=>({x:x+side*3.1,z:5,w:3.8,d:.22}))),
 {x:-18,z:21,w:.22,d:32,minY:-3.2,maxY:8},{x:18,z:21,w:.22,d:32,minY:-3.2,maxY:8},
 {x:-16.5,z:5,w:3,d:.22,minY:-3.2,maxY:8},{x:16.5,z:5,w:3,d:.22,minY:-3.2,maxY:8},
 {x:-14.5,z:37,w:7,d:.22,minY:-3.2,maxY:8},{x:0,z:37,w:10,d:.22,minY:-3.2,maxY:8},{x:14.5,z:37,w:7,d:.22,minY:-3.2,maxY:8},
];
// Split each interior wall around a 2.4 metre passage. Visible and solid geometry agree.
for(const door of DOORS)for(const side of [-1,1])WALLS.push(door.axis==='x'
 ?{x:door.x,z:door.z+side*3.1,w:.22,d:3.8}
 :{x:door.x+side*3.1,z:door.z,w:3.8,d:.22});
export const FIXTURES = [
 {id:'incinerator-furnace',x:21,z:-6.8,w:2.7,d:2,h:2.8},
 {id:'camera-desk',x:-21.5,z:-1,w:1.1,d:4.5,h:1.0},
 {id:'lab-bench',x:12.1,z:-7.3,w:2.5,d:1.2,h:.94},
 ...CORE_FIXTURES,
 {id:'workbench',x:-10,z:2.7,w:3,d:1.05,h:.95},
 {id:'mutagen-safe',x:10,z:-13.7,w:1.4,d:.65,h:1.65},
 {id:'containment-tank',x:12.4,z:-12.2,w:1.6,d:1.6,h:2.3},
];
// Rendering and movement share prop placements, including trays and handles.
export const PROP_LAYOUT = [
 {type:'locker',x:-13.9,z:1,yaw:Math.PI/2},
 {type:'locker',x:-13.9,z:2,yaw:Math.PI/2},
 {type:'terminal',x:-2.6,z:3.7,yaw:Math.PI},
 {type:'terminal',x:2.6,z:3.7,yaw:Math.PI},
 {type:'locker',x:-3.8,z:2.5,yaw:Math.PI/2},
 {type:'pump',x:-12.8,z:-12.7,yaw:0},
 {type:'pump',x:-10,z:-12.7,yaw:0},
 {type:'pump',x:-7.3,z:-12.7,yaw:0},
 {type:'filter',x:-13.6,z:-7.2,yaw:Math.PI/2},
 {type:'filter',x:-12.8,z:-7.2,yaw:Math.PI/2},
 {type:'terminal',x:7,z:-13.7,yaw:0},
 {type:'locker',x:13.8,z:1.7,yaw:-Math.PI/2},
 {type:'door',x:13.9,z:3,yaw:-Math.PI/2},
];
const FOOTPRINTS = {
  locker:{minX:-.36,maxX:.36,minZ:-.25,maxZ:.34},
  pump:{minX:-.45,maxX:.62,minZ:-.325,maxZ:.325},
  terminal:{minX:-.41,maxX:.41,minZ:-.30,maxZ:.535},
  door:{minX:-.9,maxX:.9,minZ:-.21,maxZ:.35},
  filter:{minX:-.275,maxX:.275,minZ:-.12,maxZ:.132},
};
function footprint(prop,index) {
  const box=FOOTPRINTS[prop.type],c=Math.cos(prop.yaw),s=Math.sin(prop.yaw);
  const corners=[box.minX,box.maxX].flatMap(x=>[box.minZ,box.maxZ].map(z=>({x:prop.x+x*c+z*s,z:prop.z-x*s+z*c})));
  return {id:`${prop.type}-${index}`,minX:Math.min(...corners.map(p=>p.x)),maxX:Math.max(...corners.map(p=>p.x)),minZ:Math.min(...corners.map(p=>p.z)),maxZ:Math.max(...corners.map(p=>p.z))};
}
export const PLAYER_RADIUS=.28;
// Bounds describe the room interior; movement keeps the entire player inside it.
export const ROOM_BOUNDS={minX:-22.89,maxX:22.89,minZ:-28.89,maxZ:45.89};
export const SOLIDS=[
 ...DETAIL_FIXTURES.map(f=>({id:f.id,minX:f.x-f.w/2,maxX:f.x+f.w/2,minZ:f.z-f.d/2,maxZ:f.z+f.d/2,minY:f.y,maxY:f.y+f.h+.1})),
 {id:'core-well',...CORE_WELL,minY:-6,maxY:1.15},
 ...[-4.8,4.8].map(x=>({id:`core-sample-${x}`,x,z:-18.4,radius:.2,minY:0,maxY:.6})),
 {id:'feed-chute',minX:20.5,maxX:21.5,minZ:-8.4,maxZ:-7.8,minY:0,maxY:.76},
 {id:'camera-door',minX:-15.15,maxX:-14.85,minZ:-2.7,maxZ:-.3,minY:0,maxY:2.7},
 ...SEWER_COLLIDERS,
 {id:'reactor-console',minX:CONSOLE_POSITION.x-.9,maxX:CONSOLE_POSITION.x+.9,minZ:CONSOLE_POSITION.z-.475,maxZ:CONSOLE_POSITION.z+.61},
 ...PROP_LAYOUT.map(footprint),
 ...WALLS.map((w,i)=>({id:`wall-${i}`,minX:w.x-w.w/2,maxX:w.x+w.w/2,minZ:w.z-w.d/2,maxZ:w.z+w.d/2,minY:w.minY??-.15,maxY:w.maxY??3.5})),
 ...FIXTURES.map(f=>({id:f.id,minX:f.x-f.w/2,maxX:f.x+f.w/2,minZ:f.z-f.d/2,maxZ:f.z+f.d/2})),
];
const OPEN_SOLIDS=SOLIDS.filter(s=>s.id!=='camera-door');
export const solidsForState=cameraOpen=>cameraOpen?OPEN_SOLIDS:SOLIDS;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function overlapsSolid(x,z,box,radius=PLAYER_RADIUS) {
  if(box.radius)return Math.hypot(x-box.x,z-box.z)<box.radius+radius-1e-8;
  const dx=x-clamp(x,box.minX,box.maxX),dz=z-clamp(z,box.minZ,box.maxZ);
  return dx*dx+dz*dz < radius*radius-1e-10;
}
const SURFACES=[
 {minX:-8,maxX:8,minZ:-29,maxZ:-15,y:0},
 {minX:-23,maxX:-15,minZ:-5,maxZ:3,y:0},
 {minX:15,maxX:23,minZ:-15,maxZ:-13,y:0},
 {minX:15,maxX:23,minZ:-10.5,maxZ:-5,y:0},
 {minX:15,maxX:18.5,minZ:-13,maxZ:-10.5,y:0},
 {minX:21,maxX:23,minZ:-13,maxZ:-10.5,y:0},
 {minX:18.5,maxX:21,minZ:-13,maxZ:-10.5,y:-2.4},
 {minX:-15,maxX:15,minZ:-15,maxZ:5,y:0},...SEWER_SURFACES];
export function groundHeight(x,z,previousY=0,maxStep=.22) {
 const levels=SURFACES.filter(s=>onSurface(s,x,z)).map(s=>surfaceY(s,z)).filter(y=>Math.abs(y-previousY)<=maxStep+1e-8);
 return levels.length?Math.max(...levels):null;
}
function floorBelow(x,z,y){const levels=SURFACES.filter(s=>onSurface(s,x,z)).map(s=>surfaceY(s,z)).filter(h=>h<=y+.22);return levels.length?Math.max(...levels):null;}
const solidAt=(box,y)=>y+1.8>(box.minY??-.15)+.001&&y<(box.maxY??3.5)-.001;
export function isWalkable(x,z,solids=SOLIDS,radius=PLAYER_RADIUS,y=groundHeight(x,z,0,Infinity),airborne=false) {
 return y!==null&&Number.isFinite(x)&&Number.isFinite(z)&&x>=ROOM_BOUNDS.minX+radius-1e-9&&x<=ROOM_BOUNDS.maxX-radius+1e-9&&z>=ROOM_BOUNDS.minZ+radius-1e-9&&z<=ROOM_BOUNDS.maxZ-radius+1e-9
  &&(airborne?floorBelow(x,z,y)!==null:SURFACES.some(s=>onSurface(s,x,z)&&Math.abs(surfaceY(s,z)-y)<.03))
  &&!SURFACES.some(s=>onSurface(s,x,z)&&surfaceY(s,z)>y+.22&&surfaceY(s,z)<y+1.9)
  &&!solids.some(b=>solidAt(b,y)&&overlapsSolid(x,z,b,radius));
}
function bound(point,radius) {
  point.x=clamp(point.x,ROOM_BOUNDS.minX+radius,ROOM_BOUNDS.maxX-radius);
  point.z=clamp(point.z,ROOM_BOUNDS.minZ+radius,ROOM_BOUNDS.maxZ-radius);
}
function recover(point,solids,radius) {
  // Recover saved/network positions that were inside a prop before collisions existed.
  for(let pass=0;pass<16;pass++) {
    bound(point,radius);let changed=false;
    for(const b of solids) {
      if(!solidAt(b,point.y)||!overlapsSolid(point.x,point.z,b,radius))continue;
      if(b.radius){const dx=point.x-b.x,dz=point.z-b.z,length=Math.hypot(dx,dz);point.x=b.x+(length?dx/length:1)*(b.radius+radius+1e-6);point.z=b.z+(length?dz/length:0)*(b.radius+radius+1e-6);changed=true;continue;}
      const nearX=clamp(point.x,b.minX,b.maxX),nearZ=clamp(point.z,b.minZ,b.maxZ);
      const dx=point.x-nearX,dz=point.z-nearZ,length=Math.hypot(dx,dz);
      if(length>1e-8){point.x=nearX+dx/length*(radius+1e-6);point.z=nearZ+dz/length*(radius+1e-6);}
      else {
        const exits=[{x:b.minX-radius-1e-6,z:point.z},{x:b.maxX+radius+1e-6,z:point.z},{x:point.x,z:b.minZ-radius-1e-6},{x:point.x,z:b.maxZ+radius+1e-6}];
        exits.sort((a,c)=>Math.hypot(a.x-point.x,a.z-point.z)-Math.hypot(c.x-point.x,c.z-point.z));
        Object.assign(point,exits[0]);
      }
      changed=true;
    }
    if(!changed)break;
  }
  bound(point,radius);
  if(!isWalkable(point.x,point.z,solids,radius,point.y,true)){point.x=0;point.y=0;point.z=2;}
}
export function moveWithCollisions(from,dx,dz,solids=SOLIDS,radius=PLAYER_RADIUS,dt=0) {
  const point={x:from.x,z:from.z,y:Number.isFinite(from.y)?from.y:(groundHeight(from.x,from.z,0,Infinity)??0)};
  if(!Number.isFinite(point.x)||!Number.isFinite(point.z))Object.assign(point,{x:0,y:0,z:2});
  point.vy=from.vy??0;point.fallStart=from.fallStart??point.y;point.stun=Math.max(0,(from.stun??0)-dt);
  recover(point,solids,radius);
  if(point.stun>0){dx=0;dz=0;}
  if(!Number.isFinite(dx)||!Number.isFinite(dz))return point;
  // Short steps stop fast/diagonal movement tunnelling through narrow equipment.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
  const sx=dx/steps,sz=dz/steps;
  function axis(key,amount) {
    if(!amount)return;
    const candidate={...point,[key]:point[key]+amount};bound(candidate,radius);
    let y=groundHeight(candidate.x,candidate.z,point.y)??point.y;
    if(isWalkable(candidate.x,candidate.z,solids,radius,y,true)){point[key]=candidate[key];point.y=y;return;}
    // Approach the surface accurately, rather than stop one whole step away.
    let lo=0,hi=1;
    for(let n=0;n<12;n++){const t=(lo+hi)/2;candidate[key]=point[key]+amount*t;if(isWalkable(candidate.x,candidate.z,solids,radius,groundHeight(candidate.x,candidate.z,point.y)??point.y,true))lo=t;else hi=t;}
    point[key]+=amount*lo;
    point.y=groundHeight(point.x,point.z,point.y)??point.y;
  }
  for(let i=0;i<steps;i++) {
    // Resolve the larger component first; the free axis continues along a wall.
    if(Math.abs(sx)>Math.abs(sz)){axis('x',sx);axis('z',sz);}else{axis('z',sz);axis('x',sx);}
  }
  const floor=floorBelow(point.x,point.z,point.y);
  if(floor!==null&&floor<point.y-.22){
    point.vy-=9.8*Math.min(dt,.1);point.y=Math.max(floor,point.y+point.vy*Math.min(dt,.1));
    if(point.y===floor){if(point.fallStart-floor>1.2)point.stun=.8;point.vy=0;point.fallStart=floor;}
  }else if(floor!==null){point.y=floor;point.vy=0;point.fallStart=floor;}
  return point;
}
