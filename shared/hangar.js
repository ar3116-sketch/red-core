// Hangar 2: the Buran orbiter on the floor eight metres down, galleries round the walls,
// a catwalk bridge over its spine and a long stair to the floor. The best place to be pushed.
export const HANGAR={minX:22,maxX:62,minZ:12,maxZ:48,floor:-8,top:11};
export const HANGAR_DOOR={axis:'z',z:12,min:25.2,max:28.4};
export const HANGAR_STAIR={id:'hangar-stair',steps:40,minX:25.5,maxX:28,minZ:20,maxZ:40,startY:0,endY:-8};
export const HANGAR_GALLERIES=[
 {id:'g-north',minX:22,maxX:62,minZ:12,maxZ:15.5,y:0},
 {id:'g-west',minX:22,maxX:25.5,minZ:15.5,maxZ:48,y:0},
 {id:'g-east',minX:58.5,maxX:62,minZ:15.5,maxZ:48,y:0},
 {id:'g-south',minX:25.5,maxX:58.5,minZ:44.5,maxZ:48,y:0},
 {id:'g-bridge',minX:40.5,maxX:43.5,minZ:15.5,maxZ:44.5,y:0},
];
export const HANGAR_FLOOR={minX:25.5,maxX:58.5,minZ:15.5,maxZ:44.5,y:-8};
export const HANGAR_SURFACES=[...HANGAR_GALLERIES,HANGAR_FLOOR,HANGAR_STAIR];
// Orbiter and scaffold footprints on the floor (centre x 42, nose pointing north).
export const BURAN={x:42,z:31,length:22,span:14};
export const HANGAR_FIXTURES=[
 {id:'buran-body',x:42,z:31,w:3.4,d:20,minY:-8,maxY:-3},
 {id:'buran-wing-w',x:38.2,z:35.5,w:4.6,d:6,minY:-8,maxY:-6.2},{id:'buran-wing-e',x:45.8,z:35.5,w:4.6,d:6,minY:-8,maxY:-6.2},
 {id:'scaffold-nw',x:36.5,z:22,w:3,d:3,minY:-8,maxY:-2},{id:'scaffold-ne',x:47.5,z:22,w:3,d:3,minY:-8,maxY:-2},
 {id:'scaffold-sw',x:35,z:40.5,w:3,d:2.5,minY:-8,maxY:-3},{id:'scaffold-se',x:49,z:40.5,w:3,d:2.5,minY:-8,maxY:-3},
 {id:'hangar-crates-a',x:54,z:19,w:2,d:2,minY:-8,maxY:-6.6},{id:'hangar-crates-b',x:31,z:43,w:2.4,d:1.4,minY:-8,maxY:-6.8},
 {id:'hangar-tug',x:52,z:37,w:2.2,d:3.6,minY:-8,maxY:-6.6},
];
export const HANGAR_LEAK={id:'hangar-leak',kind:'leak',tool:'wrench',x:39.6,y:-6.9,z:24,floor:-8,label:'BURAN FUEL LINE LEAK'};
// Rails along every gallery lip and the stair. Gaps are where people go over.
const gaps=[{x1:31,z1:15.5,x2:32.2,z2:15.5},{x1:40.5,z1:27,x2:40.5,z2:28.3},{x1:43.5,z1:36,x2:43.5,z2:37.2},{x1:58.5,z1:24,x2:58.5,z2:25.3},{x1:47,z1:44.5,x2:48.2,z2:44.5}];
const lips=[
 {x1:25.5,z1:15.5,x2:40.5,z2:15.5},{x1:43.5,z1:15.5,x2:58.5,z2:15.5},
 {x1:25.5,z1:44.5,x2:40.5,z2:44.5},{x1:43.5,z1:44.5,x2:58.5,z2:44.5},
 {x1:40.5,z1:15.5,x2:40.5,z2:44.5},{x1:43.5,z1:15.5,x2:43.5,z2:44.5},
 {x1:58.5,z1:15.5,x2:58.5,z2:44.5},
 {x1:25.5,z1:15.5,x2:25.5,z2:20},{x1:25.5,z1:21.2,x2:25.5,z2:44.5},
 {x1:28,z1:20,x2:28,z2:40},
];
function cut(seg){
 let parts=[seg];
 for(const g of gaps)parts=parts.flatMap(s=>{
  const vertical=s.x1===s.x2;if(vertical!==(g.x1===g.x2)||(vertical?s.x1!==g.x1:s.z1!==g.z1))return [s];
  const [a,b]=vertical?[s.z1,s.z2]:[s.x1,s.x2],[ga,gb]=vertical?[g.z1,g.z2]:[g.x1,g.x2];
  if(gb<=a||ga>=b)return [s];
  const out=[];if(ga>a)out.push(vertical?{...s,z2:ga}:{...s,x2:ga});if(gb<b)out.push(vertical?{...s,z1:gb}:{...s,x1:gb});return out;
 });
 return parts;
}
export const HANGAR_RAILS=lips.flatMap(cut);
export const HANGAR_RAIL_GAPS=gaps;
// The stair rail follows the steps down; its collider spans the full height.
export const HANGAR_COLLIDERS=[
 ...HANGAR_RAILS.map((r,i)=>{const stair=r.x1===28;return {id:'hangar-rail-'+i,minX:Math.min(r.x1,r.x2)-.045,maxX:Math.max(r.x1,r.x2)+.045,minZ:Math.min(r.z1,r.z2)-.045,maxZ:Math.max(r.z1,r.z2)+.045,minY:stair?-8:0,maxY:1.08};}),
 ...HANGAR_FIXTURES.map(f=>({id:f.id,minX:f.x-f.w/2,maxX:f.x+f.w/2,minZ:f.z-f.d/2,maxZ:f.z+f.d/2,minY:f.minY,maxY:f.maxY})),
];
const T=.3;
export const HANGAR_WALLS=[
 {x:HANGAR.minX,z:30,w:T,d:36,minY:-8.2,maxY:HANGAR.top},{x:HANGAR.maxX,z:30,w:T,d:36,minY:-8.2,maxY:HANGAR.top},
 {x:42,z:HANGAR.maxZ,w:40,d:T,minY:-8.2,maxY:HANGAR.top},
 {x:23.6,z:HANGAR.minZ,w:3.2,d:T,minY:-8.2,maxY:HANGAR.top},{x:45.2,z:HANGAR.minZ,w:33.6,d:T,minY:-8.2,maxY:HANGAR.top},
 {x:26.8,z:HANGAR.minZ,w:3.2,d:T,minY:3.2,maxY:HANGAR.top},
];
