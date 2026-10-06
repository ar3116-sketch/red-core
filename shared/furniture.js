// Furniture with a purpose: desks people worked at, machines they ran, things they left behind.
// One list drives rendering (src/furnish.js) and collision (FURNITURE_SOLIDS, appended to SOLIDS).
// Each kind is sized w (local x) by d (local z) by h. The front faces local +z; r turns it in
// quarter turns: 0 faces +z, 1 faces +x, 2 faces -z, 3 faces -x. Wall kinds put x,z on the wall
// face and grow into the room. Only bodies a person would walk into are solid.
export const FURNITURE_KINDS={
 desk:{w:1.4,d:.7,h:.78,solid:true},smallTable:{w:.8,d:.6,h:.74,solid:true},chair:{w:.44,d:.44,h:.9},stool:{w:.35,d:.35,h:.62},
 basket:{w:.3,d:.3,h:.35},coatRack:{w:.5,d:.5,h:1.8,solid:true,round:.22},standAshtray:{w:.3,d:.3,h:.7},
 radiator:{w:1,d:.14,h:.75,wall:true},clock:{w:.36,d:.06,h:.36,wall:true},portrait:{w:.55,d:.05,h:.8,wall:true},pennant:{w:.4,d:.03,h:.6,wall:true},
 switch:{w:.08,d:.03,h:.12,wall:true},fuseBox:{w:.4,d:.16,h:.55,wall:true},intercom:{w:.22,d:.08,h:.3,wall:true},extinguisher:{w:.26,d:.22,h:.95,wall:true},
 wallPhone:{w:.22,d:.14,h:.3,wall:true},hoseCabinet:{w:.6,d:.22,h:.8,wall:true},firstAid:{w:.45,d:.18,h:.55,wall:true},toolBoard:{w:1.4,d:.12,h:.8,wall:true},
 specimenShelf:{w:1,d:.28,h:.5,wall:true},coatHooks:{w:.8,d:.25,h:1.2,wall:true},tongsRack:{w:1,d:.12,h:1.4,wall:true},ppeBoard:{w:.8,d:.15,h:1,wall:true},
 calendar:{w:.32,d:.02,h:.45,wall:true},conduit:{w:1,d:.12,h:.2,wall:true},broom:{w:.3,d:.3,h:1.4,wall:true},shovel:{w:.3,d:.3,h:1.3,wall:true},guitar:{w:.38,d:.3,h:1,wall:true},
 washstand:{w:.6,d:.45,h:.95,wall:true,solid:true},manifold:{w:2,d:.35,h:1.9,wall:true,solid:true},hazmatRack:{w:2,d:.45,h:2,wall:true,solid:true},
 bootRack:{w:1,d:.35,h:.45,wall:true,solid:true},labBenchWall:{w:2,d:.65,h:.95,wall:true,solid:true},fumeHood:{w:1.2,d:.75,h:2.2,wall:true,solid:true},
 rodCabinet:{w:.8,d:.6,h:2,wall:true,solid:true},
 winchPanel:{w:.8,d:.5,h:1.6,solid:true},drillPress:{w:.6,d:.6,h:1.7,solid:true},lathe:{w:1.6,d:.6,h:1.25,solid:true},drum:{w:.6,d:.6,h:.9,solid:true,round:.3},
 gasBottles:{w:.7,d:.4,h:1.55,solid:true},sawhorse:{w:1,d:.45,h:.78,solid:true},vice:{w:.3,d:.2,h:.18},dripTray:{w:.9,d:.5,h:.05},mopBucket:{w:.45,d:.35,h:1.2},
 deconShower:{w:1.1,d:1.1,h:2.3,solid:true},bench:{w:1.4,d:.4,h:.46,solid:true},wasteBin:{w:.5,d:.5,h:.7,solid:true,round:.25},bioBin:{w:.45,d:.45,h:.6,solid:true,round:.22},
 instrumentCart:{w:.8,d:.5,h:1,solid:true},ashCart:{w:1,d:.6,h:.85,solid:true},ashBucket:{w:.35,d:.35,h:.4},rubberMat:{w:1,d:.7,h:.02},
 coil:{w:.76,d:.76,h:.9,solid:true,round:.38},cableReel:{w:.6,d:1,h:1,solid:true},warningStand:{w:.5,d:.4,h:1.1,solid:true},
 footlocker:{w:.8,d:.45,h:.45,solid:true},wardrobe:{w:1,d:.6,h:2,solid:true},stove:{w:.3,d:.3,h:.3},radio:{w:.36,d:.2,h:.24},laundryLine:{w:1,d:.1,h:.5},
 palletCrates:{w:1.2,d:1,h:1.5,solid:true},palletSacks:{w:1.2,d:1,h:.95,solid:true},palletStack:{w:1.2,d:1,h:.6,solid:true},palletJack:{w:.6,d:1.6,h:1.2,solid:true},
 scale:{w:.7,d:.55,h:1.2,solid:true},sack:{w:.6,d:.4,h:.3},cardCatalogue:{w:1,d:.5,h:1.3,solid:true},ladder:{w:.45,d:.5,h:1.9},globe:{w:.5,d:.5,h:1.1,solid:true,round:.25},
 bookCart:{w:.8,d:.5,h:.95,solid:true},cableSpool:{w:.7,d:1.1,h:1.15,solid:true},trashBin:{w:.4,d:.4,h:.6,solid:true,round:.2},
 mug:{w:.1,d:.1,h:.1},ashtray:{w:.12,d:.12,h:.04},
};
// Interior walls are .22 thick, so wall-face coordinates sit .11 off the wall line.
export const FURNITURE=[
 // CONTROL: two operators' desks off the door-to-door diagonals, a portrait, a radiator and the room's coat rack.
 {room:'control',kind:'desk',x:-4.54,z:-2.5,r:1,top:['typewriter','papers','ashtray','phone']},
 {room:'control',kind:'chair',x:-3.8,z:-2.45,r:3},
 {room:'control',kind:'desk',x:4.54,z:3.3,r:3,top:['lamp','phone','papers','carafe','binder']},
 {room:'control',kind:'chair',x:3.78,z:3.25,r:1},
 {room:'control',kind:'basket',x:3.95,z:2.4},
 {room:'control',kind:'clock',x:-4.89,z:-2.5,y:2.25,r:1},
 {room:'control',kind:'portrait',x:4.89,z:3.95,y:1.75,r:3},
 {room:'control',kind:'radiator',x:4.89,z:2,r:3},
 {room:'control',kind:'coatRack',x:4.45,z:4.45},
 {room:'control',kind:'pennant',x:2,z:4.89,y:2,r:2},
 {room:'control',kind:'switch',x:-4.89,z:-1.5,y:1.42,r:1},
 {room:'control',kind:'intercom',x:4.89,z:1.55,y:1.5,r:3},
 {room:'control',kind:'extinguisher',x:-1.65,z:-4.89,r:0},
 // WORKSHOP: machine tools on the north wall, drums and bottles by the south wall.
 {room:'workshop',kind:'drillPress',x:-5.95,z:-4.5,r:0},
 {room:'workshop',kind:'lathe',x:-7.4,z:-4.53,r:0},
 {room:'workshop',kind:'toolBoard',x:-7.4,z:-4.89,y:1.85,r:0},
 {room:'workshop',kind:'drum',x:-7.55,z:4.5,v:0},{room:'workshop',kind:'drum',x:-6.95,z:3.72,v:1},
 {room:'workshop',kind:'gasBottles',x:-12.9,z:4.55,r:2},
 {room:'workshop',kind:'sawhorse',x:-14.42,z:3.1,r:1},
 {room:'workshop',kind:'broom',x:-5.11,z:-2.2,r:3},
 {room:'workshop',kind:'vice',x:-8.8,z:2.45,y:1.05,r:2},
 {room:'workshop',kind:'extinguisher',x:-14.89,z:4.4,r:1},
 {room:'workshop',kind:'fuseBox',x:-5.11,z:-3.2,y:1.55,r:3},
 {room:'workshop',kind:'switch',x:-5.11,z:-1.55,y:1.42,r:3},
 // PUMP ROOM: valve manifolds on the walls, drip trays under the seals, a duty table.
 {room:'pumps',kind:'manifold',x:-5.11,z:-12.85,r:3,len:2},
 {room:'pumps',kind:'manifold',x:-14.89,z:-7.6,r:1,len:1.5},
 {room:'pumps',kind:'dripTray',x:-12.7,z:-11.95},{room:'pumps',kind:'dripTray',x:-9.9,z:-11.95},{room:'pumps',kind:'dripTray',x:-7.25,z:-11.85},
 {room:'pumps',kind:'mopBucket',x:-8.65,z:-14.3,r:0},
 {room:'pumps',kind:'smallTable',x:-5.41,z:-7.5,r:3,top:['logbook','mug']},
 {room:'pumps',kind:'stool',x:-6.05,z:-7.45},
 {room:'pumps',kind:'extinguisher',x:-6.1,z:-5.11,r:2},
 {room:'pumps',kind:'fuseBox',x:-13.3,z:-14.89,y:1.6,r:0},
 {room:'pumps',kind:'wallPhone',x:-14.89,z:-13.7,y:1.45,r:1},
 {room:'pumps',kind:'switch',x:-5.11,z:-8.4,y:1.42,r:3},
 // EXTRACTION: decontamination before the way out.
 {room:'extraction',kind:'deconShower',x:5.7,z:-4.33,r:0},
 {room:'extraction',kind:'bench',x:7.65,z:-4.68,r:0},
 {room:'extraction',kind:'hazmatRack',x:5.11,z:2.45,r:1,len:1.9},
 {room:'extraction',kind:'bootRack',x:5.11,z:4.1,r:1},
 {room:'extraction',kind:'firstAid',x:14.4,z:-4.89,y:1.45,r:0},
 {room:'extraction',kind:'wasteBin',x:5.6,z:-3.15},
 {room:'extraction',kind:'smallTable',x:13.15,z:3.4,r:3,top:['dosimeters','logbook']},
 {room:'extraction',kind:'chair',x:12.45,z:3.4,r:1},
 {room:'extraction',kind:'extinguisher',x:14.89,z:.35,r:3},
 {room:'extraction',kind:'clock',x:5.11,z:-2.4,y:2.2,r:1},
 {room:'extraction',kind:'switch',x:14.89,z:-.55,y:1.42,r:3},
 // CONTAINMENT: a working laboratory around the specimen.
 {room:'containment',kind:'fumeHood',x:6.6,z:-5.11,r:2},
 {room:'containment',kind:'labBenchWall',x:5.11,z:-13.4,r:1,len:2},
 {room:'containment',kind:'stool',x:6.15,z:-12.95},
 {room:'containment',kind:'bioBin',x:14.45,z:-14.45},
 {room:'containment',kind:'specimenShelf',x:14.89,z:-12.4,y:1.45,r:3},
 {room:'containment',kind:'coatHooks',x:5.11,z:-6.3,y:1.75,r:1},
 {room:'containment',kind:'extinguisher',x:5.11,z:-7.75,r:1},
 {room:'containment',kind:'intercom',x:14.89,z:-7.6,y:1.5,r:3},
 {room:'containment',kind:'switch',x:5.11,z:-8.45,y:1.42,r:1},
 // REACTOR HALL: control rod drive cabinets, the shift log, a rolling instrument cart.
 {room:'reactor',kind:'rodCabinet',x:2.15,z:-5.11,r:2},{room:'reactor',kind:'rodCabinet',x:2.95,z:-5.11,r:2,v:1},{room:'reactor',kind:'rodCabinet',x:3.75,z:-5.11,r:2,v:2},
 {room:'reactor',kind:'desk',x:4.54,z:-12.55,r:3,top:['logbook','lamp','phone','mug']},
 {room:'reactor',kind:'chair',x:3.8,z:-12.5,r:1},
 {room:'reactor',kind:'instrumentCart',x:-4.35,z:-12.9,r:1},
 {room:'reactor',kind:'extinguisher',x:-4.89,z:-14,r:1},{room:'reactor',kind:'extinguisher',x:4.89,z:-7,r:3},
 {room:'reactor',kind:'wallPhone',x:-2,z:-5.11,y:1.45,r:2},
 {room:'reactor',kind:'clock',x:-3,z:-5.11,y:2.3,r:2},
 {room:'reactor',kind:'switch',x:-4.89,z:-8.4,y:1.42,r:1},
 // CAMERA ROOM: the night watch.
 {room:'cameras',kind:'chair',x:-20.35,z:-2.35,r:3},{room:'cameras',kind:'chair',x:-20.35,z:.45,r:3},
 {room:'cameras',kind:'mug',x:-21.1,z:-2.95,y:1},{room:'cameras',kind:'ashtray',x:-21.08,z:-2.45,y:1},{room:'cameras',kind:'mug',x:-21.1,z:.85,y:1},
 {room:'cameras',kind:'smallTable',x:-16.2,z:2.3,r:2,top:['fan','kettle','mug']},
 {room:'cameras',kind:'coatRack',x:-15.6,z:-4.4},
 {room:'cameras',kind:'wallPhone',x:-15.11,z:.8,y:1.45,r:3},
 {room:'cameras',kind:'clock',x:-20,z:2.89,y:2.4,r:2},
 {room:'cameras',kind:'standAshtray',x:-16.3,z:-3.5},
 {room:'cameras',kind:'basket',x:-20.25,z:1.45},
 // INCINERATOR: ash handling.
 {room:'incinerator',kind:'ashCart',x:17.6,z:-5.45,r:2},
 {room:'incinerator',kind:'ashCart',x:16.4,z:-12.9,r:1},
 {room:'incinerator',kind:'drum',x:15.45,z:-13.85,v:3},{room:'incinerator',kind:'drum',x:15.45,z:-13.2,v:3},
 {room:'incinerator',kind:'tongsRack',x:19.4,z:-14.89,y:1,r:0},
 {room:'incinerator',kind:'shovel',x:22.89,z:-8.45,r:3},
 {room:'incinerator',kind:'extinguisher',x:15.11,z:-7.6,r:1},
 {room:'incinerator',kind:'ashBucket',x:19.3,z:-7.55},
 // REACTOR CORE: safety kit on the walls only.
 {room:'core',kind:'extinguisher',x:-7.89,z:-17.6,r:1},{room:'core',kind:'extinguisher',x:7.89,z:-17.6,r:3},
 {room:'core',kind:'wallPhone',x:7.89,z:-25.4,y:1.45,r:3},
 // SUBSTATION: dielectric mats, spare coils, cable drums and the duty electrician's desk.
 {room:'substation',kind:'rubberMat',x:36,z:-12.75,r:0,len:5.6},
 {room:'substation',kind:'coil',x:40.4,z:-12.6},{room:'substation',kind:'coil',x:40.4,z:-11.75},
 {room:'substation',kind:'cableReel',x:34.3,z:-5.65,r:0},{room:'substation',kind:'cableReel',x:35.5,z:-5.65,r:0},
 {room:'substation',kind:'warningStand',x:37.4,z:-6.4,r:3},
 {room:'substation',kind:'desk',x:31.46,z:-12.4,r:1,top:['logbook','phone','lamp']},
 {room:'substation',kind:'chair',x:32.2,z:-12.35,r:3},
 {room:'substation',kind:'extinguisher',x:31.11,z:-7.4,r:1},
 {room:'substation',kind:'ppeBoard',x:40.89,z:-8.2,y:1.45,r:3},
 // BARRACKS: what off-shift life looked like.
 {room:'barracks',kind:'footlocker',x:33.2,z:10.5,r:2},{room:'barracks',kind:'footlocker',x:36.6,z:10.5,r:2},{room:'barracks',kind:'footlocker',x:39.6,z:8.4,r:3},
 {room:'barracks',kind:'wardrobe',x:39.3,z:3.42,r:0},
 {room:'barracks',kind:'stove',x:38.75,z:5.5,y:.83,r:0},
 {room:'barracks',kind:'chair',x:38.5,z:4.95,r:0},{room:'barracks',kind:'chair',x:38.6,z:6.75,r:2},{room:'barracks',kind:'chair',x:37.25,z:5.75,r:1},
 {room:'barracks',kind:'radio',x:39.6,z:8.25,y:.47,r:3},
 {room:'barracks',kind:'guitar',x:38.65,z:11.89,r:2},
 {room:'barracks',kind:'laundryLine',x:31.11,z:9.95,x2:40.89,y:2.6},
 {room:'barracks',kind:'washstand',x:31.11,z:4.6,r:1},
 {room:'barracks',kind:'clock',x:33.5,z:3.11,y:2.2,r:0},
 {room:'barracks',kind:'calendar',x:31.11,z:10,y:1.5,r:1},
 // STORAGE: pallets, sacks and the jack that moves them.
 {room:'storage',kind:'palletCrates',x:-36.3,z:3.3,r:2},
 {room:'storage',kind:'palletSacks',x:-38.6,z:3.3,r:2},
 {room:'storage',kind:'palletJack',x:-37.2,z:-2.3,r:0},
 {room:'storage',kind:'palletStack',x:-33,z:-4.3,r:0},
 {room:'storage',kind:'scale',x:-38.6,z:-.6,r:1},
 {room:'storage',kind:'sack',x:-37.35,z:2.45,r:0},
 {room:'storage',kind:'extinguisher',x:-31.11,z:2.2,r:3},
 {room:'storage',kind:'clock',x:-36,z:-4.89,y:2.4,r:0},
 // ARCHIVE: reading room for the records.
 {room:'archive',kind:'desk',x:-37.5,z:-17.9,r:0,top:['bankerLamp','books','papers','carafe']},
 {room:'archive',kind:'chair',x:-37.5,z:-17.1,r:2},
 {room:'archive',kind:'desk',x:-37.5,z:-23.1,r:2,top:['bankerLamp','typewriter','papers']},
 {room:'archive',kind:'chair',x:-37.5,z:-23.9,r:0},
 {room:'archive',kind:'cardCatalogue',x:-31.36,z:-23.3,r:3},
 {room:'archive',kind:'ladder',x:-34.2,z:-25.2,r:0},
 {room:'archive',kind:'globe',x:-33,z:-17},
 {room:'archive',kind:'bookCart',x:-32,z:-18.6,r:3},
 {room:'archive',kind:'clock',x:-31.11,z:-17.6,y:2.3,r:3},
 // SURFACE LIFT: winch controls and the spare hoist cable.
 {room:'lift',kind:'winchPanel',x:46.6,z:-5.64,r:0},
 {room:'lift',kind:'cableSpool',x:48.6,z:-4.9,r:0},
 {room:'lift',kind:'warningStand',x:45.6,z:2.6,r:3},{room:'lift',kind:'warningStand',x:45.6,z:-3.4,r:3},
 {room:'lift',kind:'extinguisher',x:41.11,z:2.4,r:1},
 {room:'lift',kind:'wallPhone',x:41.11,z:-3.5,y:1.45,r:1},
 // Tunnels and halls: safety kit and services on the walls, away from the shaft side.
 {room:'e-tunnel',kind:'extinguisher',x:17,z:-1.11,r:2},{room:'e-tunnel',kind:'wallPhone',x:23.4,z:-1.11,y:1.45,r:2},
 {room:'e-tunnel',kind:'hoseCabinet',x:23,z:-3.89,y:1.3,r:0},{room:'e-tunnel',kind:'clock',x:17.5,z:-3.89,y:2.15,r:0},
 {room:'e-tunnel',kind:'conduit',x:20,z:-3.89,y:2.35,r:0,len:9.4},
 {room:'e-passage',kind:'extinguisher',x:33,z:-1.89,r:0},{room:'e-passage',kind:'clock',x:36,z:.89,y:2.1,r:2},
 {room:'e-passage',kind:'bench',x:37,z:.68,r:2},{room:'e-passage',kind:'trashBin',x:38,z:.66},{room:'e-passage',kind:'wallPhone',x:34.5,z:.89,y:1.45,r:2},
 {room:'w-tunnel',kind:'extinguisher',x:-17,z:-11.89,r:0},{room:'w-tunnel',kind:'wallPhone',x:-22.6,z:-11.89,y:1.45,r:0},
 {room:'w-tunnel',kind:'hoseCabinet',x:-22.9,z:-9.11,y:1.3,r:2},{room:'w-tunnel',kind:'conduit',x:-20,z:-11.89,y:2.35,r:0,len:9.4},
 {room:'e-hall',kind:'hoseCabinet',x:25.11,z:-7,y:1.3,r:1},{room:'e-hall',kind:'extinguisher',x:25.11,z:-8.3,r:1},
 {room:'e-hall',kind:'wallPhone',x:25.11,z:.3,y:1.45,r:1},{room:'e-hall',kind:'clock',x:25.11,z:8.6,y:2.3,r:1},
 {room:'e-hall',kind:'bench',x:25.32,z:8.6,r:1},{room:'e-hall',kind:'trashBin',x:25.4,z:4.9},{room:'e-hall',kind:'extinguisher',x:25.11,z:10.3,r:1},
 {room:'e-hall',kind:'conduit',x:25.11,z:-9,y:2.55,r:1,len:9.8},{room:'e-hall',kind:'conduit',x:25.11,z:5.45,y:2.55,r:1,len:12.7},
 {room:'w-hall',kind:'hoseCabinet',x:-25.11,z:-2.2,y:1.3,r:3},{room:'w-hall',kind:'wallPhone',x:-25.11,z:-8,y:1.45,r:3},
 {room:'w-hall',kind:'extinguisher',x:-25.11,z:-19.8,r:3},{room:'w-hall',kind:'extinguisher',x:-25.11,z:.6,r:3},
 {room:'w-hall',kind:'clock',x:-25.11,z:-23,y:2.4,r:3},{room:'w-hall',kind:'bench',x:-25.32,z:-23,r:3},{room:'w-hall',kind:'trashBin',x:-25.4,z:-21.4},
 {room:'w-hall',kind:'conduit',x:-25.11,z:-19,y:2.55,r:3,len:13.8},{room:'w-hall',kind:'conduit',x:-25.11,z:-2.55,y:2.55,r:3,len:12.7},
];
export const furnitureSize=f=>{const k=FURNITURE_KINDS[f.kind];return {...k,w:f.len??k.w};};
// World-space footprint: wall kinds start at the wall face and extend into the room.
export function furnitureFootprint(f){
 const k=furnitureSize(f),r=((f.r??0)%4+4)%4,fx=Math.round(Math.sin(r*Math.PI/2)),fz=Math.round(Math.cos(r*Math.PI/2));
 const cx=f.x+(k.wall?fx*k.d/2:0),cz=f.z+(k.wall?fz*k.d/2:0);
 const [hw,hd]=r%2?[k.d/2,k.w/2]:[k.w/2,k.d/2];
 return {minX:cx-hw,maxX:cx+hw,minZ:cz-hd,maxZ:cz+hd,x:cx,z:cz};
}
export const FURNITURE_SOLIDS=FURNITURE.flatMap((f,i)=>{
 const k=FURNITURE_KINDS[f.kind];if(!k.solid)return [];
 const b=furnitureFootprint(f),id=`furn-${f.room}-${f.kind}-${i}`;
 return [k.round?{id,x:b.x,z:b.z,radius:k.round,minY:0,maxY:k.h}:{id,minX:b.minX,maxX:b.maxX,minZ:b.minZ,maxZ:b.maxZ,minY:0,maxY:k.h}];
});
