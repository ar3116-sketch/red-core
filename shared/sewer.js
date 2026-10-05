export const SEWER={minX:-18,maxX:18,minZ:5,maxZ:37,bottom:-3.2};
export const DECKS=[
 {id:'north-gallery',minX:-18,maxX:18,minZ:5,maxZ:9,y:0},
 {id:'south-gallery',minX:-18,maxX:18,minZ:32,maxZ:37,y:0},
 {id:'west-gallery',minX:-18,maxX:-14,minZ:9,maxZ:32,y:0},
 {id:'east-gallery',minX:14,maxX:18,minZ:9,maxZ:32,y:0},
 {id:'central-bridge',minX:-1.5,maxX:1.5,minZ:9,maxZ:32,y:0},
];
export const RAMPS=[
 {id:'west-stairs',steps:20,minX:-12,maxX:-9,minZ:9,maxZ:25,startY:0,endY:-3.2},
 {id:'east-stairs',steps:20,minX:9,maxX:12,minZ:16,maxZ:32,startY:-3.2,endY:0},
];
export const SEWER_SURFACES=[
 {id:'basin',minX:-18,maxX:18,minZ:5,maxZ:37,y:-3.2},
 ...[-8,8].map(x=>({id:`drain-${x}`,minX:x-1.55,maxX:x+1.55,minZ:37,maxZ:46,y:-3.2})),
 ...DECKS,...RAMPS,
];
export const onSurface=(s,x,z)=>x>=s.minX-1e-8&&x<=s.maxX+1e-8&&z>=s.minZ-1e-8&&z<=s.maxZ+1e-8;
export const surfaceY=(s,z)=>{
 if(s.y!==undefined)return s.y;
 const t=Math.max(0,Math.min(1,(z-s.minZ)/(s.maxZ-s.minZ)));
 return s.startY+(s.endY-s.startY)*(s.steps?Math.floor(t*s.steps+1e-8)/s.steps:t);
};
export const RAILS=[];
function rail(x1,z1,x2,z2,y=0,endY=y){RAILS.push({x1,z1,x2,z2,y,endY});}
for(const [a,b] of [[-14,-12.1],[-8.9,-1.6],[1.6,14]])rail(a,9,b,9);
for(const [a,b] of [[-14,-6],[-3,-1.6],[1.6,8.9],[12.1,14]])rail(a,32,b,32);
rail(-14,9,-14,17);rail(-14,20,-14,32);rail(14,9,14,32);rail(-1.5,9,-1.5,32);rail(1.5,9,1.5,25);rail(1.5,28,1.5,32);
rail(-18,37,18,37);
for(const r of RAMPS)for(const x of [r.minX,r.maxX])for(let z=r.minZ;z<r.maxZ;z+=2)rail(x,z,x,z+2,surfaceY(r,z),surfaceY(r,z+2));
export const SEWER_COLLIDERS=[
 {id:'fuel-pool',minX:2.83,maxX:9.17,minZ:23.83,maxZ:31.17,minY:-5.6,maxY:-2.48},
 {id:'coolant-station',minX:-6.88,maxX:-5.12,minZ:28.02,maxZ:28.98,minY:-3.2,maxY:-1.84},
 ...[-5].map(x=>({id:`sump-pump-${x}`,minX:x-1,maxX:x+1,minZ:19.5,maxZ:22.5,minY:-3.2,maxY:-.7})),
 ...[-8,8].map(x=>({id:`drain-grate-${x}`,minX:x-3,maxX:x+3,minZ:45.65,maxZ:46,minY:-3.2,maxY:2})),
 ...RAILS.map((r,i)=>({id:`rail-${i}`,minX:Math.min(r.x1,r.x2)-.045,maxX:Math.max(r.x1,r.x2)+.045,minZ:Math.min(r.z1,r.z2)-.045,maxZ:Math.max(r.z1,r.z2)+.045,minY:Math.min(r.y,r.endY),maxY:Math.max(r.y,r.endY)+1.08})),
 ...[-16,16].flatMap(x=>[13,21,29].map(z=>({id:`pier-${x}-${z}`,minX:x-.35,maxX:x+.35,minZ:z-.35,maxZ:z+.35,minY:-3.2,maxY:5}))),
];
