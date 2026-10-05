// East and west service wings: long tunnels, halls and rooms around the original six-room core.
// One rectangle list drives collision, rendering and the floor plan, so they cannot disagree.
export const WING_SPACES=[
 {id:'e-tunnel',name:'EAST TUNNEL',minX:15,maxX:25,minZ:-4,maxZ:-1,h:2.8,open:['w','e'],kind:'tunnel',color:0x77806a},
 {id:'e-hall',name:'EAST HALL',minX:25,maxX:31,minZ:-14,maxZ:12,h:3.2,kind:'hall',color:0x6f7a62},
 {id:'substation',name:'SUBSTATION',minX:31,maxX:41,minZ:-14,maxZ:-5,h:3.4,kind:'room',color:0xb59a4c},
 {id:'barracks',name:'BARRACKS',minX:31,maxX:41,minZ:3,maxZ:12,h:3,kind:'room',color:0x8a7b62},
 {id:'e-passage',name:'LIFT PASSAGE',minX:31,maxX:41,minZ:-2,maxZ:1,h:2.8,open:['w','e'],kind:'tunnel',color:0x77806a},
 {id:'lift',name:'SURFACE LIFT',minX:41,maxX:50,minZ:-6,maxZ:5,h:5.5,kind:'room',color:0x8d9aa0},
 {id:'w-tunnel',name:'WEST TUNNEL',minX:-25,maxX:-15,minZ:-12,maxZ:-9,h:2.8,open:['w','e'],kind:'tunnel',color:0x77806a},
 {id:'w-hall',name:'WEST HALL',minX:-31,maxX:-25,minZ:-26,maxZ:4,h:3.2,kind:'hall',color:0x6f7a62},
 {id:'storage',name:'STORAGE',minX:-41,maxX:-31,minZ:-5,maxZ:4,h:3.2,kind:'room',color:0x7d8a57},
 {id:'archive',name:'ARCHIVE',minX:-41,maxX:-31,minZ:-26,maxZ:-15,h:3.2,kind:'room',color:0x8c7a9b},
];
// Openings on shared edges: axis 'x' means the opening lies in a wall of constant x.
export const WING_OPENINGS=[
 {axis:'x',x:15,min:-4,max:-1},
 {axis:'x',x:25,min:-4,max:-1},
 {axis:'x',x:31,min:-10.7,max:-8.3},
 {axis:'x',x:31,min:-2,max:1},
 {axis:'x',x:31,min:6.3,max:8.7},
 {axis:'x',x:41,min:-2,max:1},
 {axis:'x',x:-15,min:-12,max:-9},
 {axis:'x',x:-25,min:-12,max:-9},
 {axis:'x',x:-31,min:-1.7,max:.7},
 {axis:'x',x:-31,min:-21.7,max:-19.3},
];
const T=.22;
function edgeWalls(s){
 const out=[],h=s.h;
 const side=(axis,fixed,from,to,key)=>{
  if(s.open?.includes(key))return;
  const gaps=WING_OPENINGS.filter(o=>o.axis===axis&&Math.abs((axis==='x'?o.x:o.z)-fixed)<1e-6&&o.max>from&&o.min<to).sort((a,b)=>a.min-b.min);
  let cursor=from;
  for(const g of [...gaps,{min:to,max:to}]){
   const a=cursor,b=Math.min(g.min,to);
   if(b-a>.05)out.push(axis==='x'?{x:fixed,z:(a+b)/2,w:T,d:b-a,maxY:h,wing:s.id}:{x:(a+b)/2,z:fixed,w:b-a,d:T,maxY:h,wing:s.id});
   cursor=Math.max(cursor,g.max);
  }
 };
 side('x',s.minX,s.minZ,s.maxZ,'w');side('x',s.maxX,s.minZ,s.maxZ,'e');
 side('z',s.minZ,s.minX,s.maxX,'n');side('z',s.maxZ,s.minX,s.maxX,'s');
 return out;
}
// Shared edges produce identical segments from both sides; keep one of each.
const seen=new Set();
export const WING_WALLS=WING_SPACES.flatMap(edgeWalls).filter(w=>{const k=[w.x,w.z,w.w,w.d].map(v=>v.toFixed(2)).join();if(seen.has(k))return false;seen.add(k);return true;});
export const WING_SURFACES=WING_SPACES.map(s=>({minX:s.minX,maxX:s.maxX,minZ:s.minZ,maxZ:s.maxZ,y:0}));
export const wingAt=(x,z)=>WING_SPACES.find(s=>x>=s.minX&&x<=s.maxX&&z>=s.minZ&&z<=s.maxZ);
export const LIFT_DOOR={x:49,y:0,z:-.5};
// Large furniture in the wings; rendering and movement share these footprints.
export const WING_FIXTURES=[
 {id:'breaker-bank',x:36,z:-13.55,w:6,d:.8,h:2.2},
 {id:'transformer',x:39.4,z:-6.6,w:1.8,d:1.8,h:2.1},
 {id:'scope-safe',x:40.55,z:-10,w:.8,d:1.4,h:1.65},
 {id:'bunk-1',x:33.2,z:11.3,w:2.1,d:1,h:1.8},{id:'bunk-2',x:36.6,z:11.3,w:2.1,d:1,h:1.8},{id:'bunk-3',x:40.4,z:8.4,w:1,d:2.1,h:1.8},
 {id:'barracks-lockers',x:36.5,z:3.35,w:3.2,d:.6,h:2},{id:'barracks-table',x:38.5,z:5.8,w:1.6,d:1,h:.8},
 {id:'lift-cage',x:48.65,z:-.5,w:2.7,d:4.4,h:5},{id:'lift-crates',x:43,z:3.9,w:1.6,d:1.6,h:1.3},{id:'lift-winch',x:44.5,z:-5.3,w:2.2,d:1,h:1.6},
 {id:'storage-racks',x:-40.4,z:-.5,w:.8,d:6,h:2.4},{id:'storage-lockers',x:-36,z:-4.6,w:4,d:.6,h:2},{id:'storage-crates',x:-33.6,z:2.9,w:1.6,d:1.4,h:1.2},
 {id:'mainframe',x:-40.4,z:-20.5,w:.8,d:7,h:2.3},{id:'file-row',x:-36,z:-25.5,w:5,d:.6,h:1.4},{id:'sweeper-safe',x:-35,z:-15.45,w:1.4,d:.6,h:1.65},
 {id:'hall-e-crates',x:30.3,z:10.6,w:1,d:1.6,h:1.1},{id:'hall-w-crates',x:-30.3,z:-24.4,w:1,d:2,h:1.2},
];
// Open cooling shafts make the halls lethal: a shove at a broken rail sends someone over the lip.
export const SHAFT_FLOOR=-9;
export const SHAFTS=[
 ...[[-14,-11.3],[-7.7,-2.6],[1.6,5.7],[9.3,12]].map(([a,b],i)=>({id:'e-shaft-'+i,minX:28.6,maxX:30.89,minZ:a,maxZ:b})),
 ...[[-26,-22.3],[-18.7,-2.3],[1.3,4]].map(([a,b],i)=>({id:'w-shaft-'+i,minX:-30.89,maxX:-28.6,minZ:a,maxZ:b})),
 {id:'e-hatch',minX:19.2,maxX:20.8,minZ:-3.89,maxZ:-2.9},
 {id:'w-hatch',minX:-20.8,maxX:-19.2,minZ:-10.1,maxZ:-9.11},
];
function subtract(rect,holes){
 let pieces=[rect];
 for(const h of holes){
  pieces=pieces.flatMap(r=>{
   if(h.minX>=r.maxX||h.maxX<=r.minX||h.minZ>=r.maxZ||h.maxZ<=r.minZ)return [r];
   const out=[];
   if(h.minX>r.minX)out.push({...r,maxX:h.minX});
   if(h.maxX<r.maxX)out.push({...r,minX:h.maxX});
   const minX=Math.max(r.minX,h.minX),maxX=Math.min(r.maxX,h.maxX);
   if(h.minZ>r.minZ)out.push({...r,minX,maxX,maxZ:h.minZ});
   if(h.maxZ<r.maxZ)out.push({...r,minX,maxX,minZ:h.maxZ});
   return out;
  });
 }
 return pieces;
}
export const WING_FLOORS=WING_SPACES.flatMap(s=>subtract({minX:s.minX,maxX:s.maxX,minZ:s.minZ,maxZ:s.maxZ,y:0},SHAFTS));
WING_SURFACES.length=0;WING_SURFACES.push(...WING_FLOORS,...SHAFTS.map(s=>({...s,y:SHAFT_FLOOR})));
// Railings line every lip. Gaps are deliberate: broken rails are where people go over.
const RAIL_GAPS=[
 {axis:'x',x:28.6,min:-5.5,max:-4.4},{axis:'x',x:28.6,min:3,max:4},
 {axis:'z',z:5.7,min:29.2,max:30.2},
 {axis:'x',x:-28.6,min:-14,max:-12.9},{axis:'x',x:-28.6,min:-6,max:-5},
 {axis:'z',z:-18.7,min:-30.3,max:-29.3},
 {axis:'z',z:-2.9,min:19.6,max:20.4},{axis:'z',z:-10.1,min:-20.4,max:-19.6},
];
export const SHAFT_RAILS=[];
for(const s of SHAFTS){
 const sides=[];
 const east=s.minX>0;
 if(s.id.includes('shaft')){
  sides.push({axis:'x',x:east?s.minX:s.maxX,min:s.minZ,max:s.maxZ});
  if(s.minZ>(east?-14:-26))sides.push({axis:'z',z:s.minZ,min:s.minX,max:s.maxX});
  if(s.maxZ<(east?12:4))sides.push({axis:'z',z:s.maxZ,min:s.minX,max:s.maxX});
 }else{
  sides.push({axis:'z',z:s.id==='e-hatch'?s.maxZ:s.minZ,min:s.minX,max:s.maxX},{axis:'x',x:s.minX,min:s.minZ,max:s.maxZ},{axis:'x',x:s.maxX,min:s.minZ,max:s.maxZ});
 }
 for(const side of sides){
  const fixed=side.axis==='x'?side.x:side.z;
  const gaps=RAIL_GAPS.filter(g=>g.axis===side.axis&&Math.abs((g.axis==='x'?g.x:g.z)-fixed)<1e-6&&g.max>side.min&&g.min<side.max).sort((a,b)=>a.min-b.min);
  let cursor=side.min;
  for(const g of [...gaps,{min:side.max,max:side.max}]){
   const a=cursor,b=Math.min(g.min,side.max);
   if(b-a>.05)SHAFT_RAILS.push(side.axis==='x'?{x1:fixed,z1:a,x2:fixed,z2:b}:{x1:a,z1:fixed,x2:b,z2:fixed});
   cursor=Math.max(cursor,g.max);
  }
 }
}
export const SHAFT_COLLIDERS=SHAFT_RAILS.map((r,i)=>({id:'shaft-rail-'+i,minX:Math.min(r.x1,r.x2)-.045,maxX:Math.max(r.x1,r.x2)+.045,minZ:Math.min(r.z1,r.z2)-.045,maxZ:Math.max(r.z1,r.z2)+.045,minY:0,maxY:1.08}));
export const BROKEN_RAILS=RAIL_GAPS;
