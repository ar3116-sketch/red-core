// Freestanding dressing has the same footprint for rendering and collision.
export const DETAIL_FIXTURES=[
 {id:'shop-spares',kind:'parts',x:-12.2,z:-3.8,y:0,w:1.7,d:.7,h:1.6},
 {id:'control-logs',kind:'archive',x:3.5,z:-3.8,y:0,w:1.4,d:.65,h:1.8},
 {id:'exit-kit',kind:'rescue',x:12.6,z:-3.8,y:0,w:1.6,d:.7,h:1.4},
 {id:'pump-spares',kind:'parts',x:-13.3,z:-5.75,y:0,w:1.8,d:.7,h:1.6,face:-1},
 {id:'reactor-kit',kind:'meters',x:3.6,z:-13.8,y:0,w:1.6,d:.7,h:1.4},
 {id:'lab-cart',kind:'samples',x:7.2,z:-7.1,y:0,w:1.3,d:.7,h:1.05},
 {id:'camera-tapes',kind:'archive',x:-18.2,z:2.35,y:0,w:1.6,d:.65,h:1.8},
 {id:'burn-kit',kind:'filters',x:16.9,z:-14.35,y:0,w:1.8,d:.7,h:1.4},
 {id:'core-spares',kind:'meters',x:6.8,z:-26.7,y:0,w:1.2,d:1.1,h:1.4},
 {id:'sewer-salvage',kind:'filters',x:-16.7,z:25.2,y:0,w:1.2,d:.8,h:1.4},
 {id:'lower-parts',kind:'parts',x:-12.8,z:28.4,y:-3.2,w:1.6,d:.7,h:1.5},
];

// Tall wall banks keep the open circulation and every existing tool approach clear.
DETAIL_FIXTURES.push(
 {id:'shop-tall',kind:'parts',x:-5.65,z:2.8,y:0,w:.65,d:2.2,h:2.45,face:-1},
 {id:'shop-consumables',kind:'filters',x:-14.45,z:-2.6,y:0,w:.65,d:1.7,h:2.35},
 {id:'control-manuals',kind:'archive',x:-3.25,z:-3.85,y:0,w:1.9,d:.65,h:2.35},
 {id:'control-electronics',kind:'meters',x:4.5,z:-2.4,y:0,w:.65,d:1.7,h:2.35,face:-1},
 {id:'exit-lockup',kind:'rescue',x:8,z:3.9,y:0,w:2.2,d:.65,h:2.4,face:-1},
 {id:'pump-canisters',kind:'filters',x:-7.6,z:-6.1,y:0,w:2,d:.6,h:2.3,face:-1},
 {id:'reactor-testgear',kind:'meters',x:-3.8,z:-7.1,y:0,w:.7,d:1.8,h:2.4},
 {id:'lab-reagents',kind:'samples',x:13.9,z:-9.3,y:0,w:.7,d:1.4,h:2.35,face:-1},
 {id:'lab-boxes',kind:'samples',x:7.3,z:-10.9,y:0,w:1.3,d:.65,h:2.15},
 {id:'camera-cassettes',kind:'archive',x:-22.4,z:1.9,y:0,w:.65,d:1.2,h:2.35},
 {id:'camera-records',kind:'archive',x:-17.6,z:-4.45,y:0,w:2,d:.65,h:2.5},
 {id:'burn-canisters',kind:'filters',x:22.3,z:-13.6,y:0,w:.7,d:1.5,h:2.4,face:-1},
 {id:'core-stores',kind:'parts',x:-6.8,z:-26.7,y:0,w:1.2,d:1.1,h:2.3},
 {id:'core-instruments',kind:'meters',x:-3.8,z:-28.4,y:0,w:2.4,d:.7,h:2.6},
 {id:'east-salvage',kind:'parts',x:16.8,z:17.7,y:0,w:.85,d:1.4,h:2.4,face:-1},
 {id:'south-rescue',kind:'rescue',x:-10,z:35.8,y:0,w:2.2,d:.7,h:2.25,face:-1},
 {id:'lower-canisters',kind:'filters',x:13,z:13,y:-3.2,w:.7,d:1.8,h:2.1,face:-1},
);
