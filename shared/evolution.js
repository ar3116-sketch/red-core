// Deterministic per-match draft. Effects are consumed by the mutation lab;
// multiplayer monster simulation will use the same rules when implemented.
export const SLOTS = ['movement', 'senses', 'hide'];
export const PARTS = [
 {id:'crusher',slot:'movement',name:'BREAKER ARMS',gain:'Pry sealed blast doors and the camera door. Escape the lift in 3s, not 6.',cost:'Too bulky for vents. 15% slower.',counter:'You hear it coming: heavy steps carry further.',route:'door',speed:.85,noise:1.4},
 {id:'tentacles',slot:'movement',name:'SOFT TENDRILS',gain:'Keep vent access at any size. Crawl 40% faster.',cost:'Lunge cooldown +3s.',counter:'Vent rattles warn anyone at the exit grate.',route:'vent',speed:1,noise:1},
 {id:'mantis',slot:'movement',name:'CEILING HOOKS',gain:'Lunge reaches 2.7m instead of 1.9m.',cost:'Lunge reveals you a little longer.',counter:'Keep more than three steps away from shadows.',route:'rail',speed:1,noise:1},
 {id:'leaper',slot:'movement',name:'SPRING HAUNCHES',gain:'SHIFT: sprint at double speed for 2s.',cost:'10s cooldown; loud landing.',counter:'Sharp turns break the sprint.',route:'gap',speed:1,noise:1.2},
 {id:'thermal',slot:'senses',name:'THERMAL PITS',gain:'See living heat through darkness within 10m.',cost:'No wall vision.',counter:'Break line of sight.'},
 {id:'antennae',slot:'senses',name:'VIBRATION COMB',gain:'Sense anyone moving within 20m, through walls.',cost:'Still targets vanish.',counter:'Stop moving.'},
 {id:'echo',slot:'senses',name:'ECHO FANS',gain:'Q: pulse reveals everyone within 16m for 2s.',cost:'Pulse is audible to them; 12s cooldown.',counter:'Move after the pulse fades.'},
 {id:'scent',slot:'senses',name:'SCENT PALPS',gain:'Follow the nearest target\'s last 10 seconds of trail.',cost:'Only one trail at a time.',counter:'Split up and double back.'},
 {id:'plates',slot:'hide',name:'LAYERED CHITIN',gain:'Shoves cannot move you. Survive one shotgun blast.',cost:'Shell scraping: louder steps.',counter:'Do not try to push it into a shaft.',speed:.95,noise:1.2},
 {id:'veil',slot:'hide',name:'MIMETIC SKIN',gain:'Fainter shadow. Cameras lose you when still.',cost:'Lunging reveals you for longer.',counter:'Watch the floor, not the air.'},
 {id:'sacs',slot:'hide',name:'MIST BLADDERS',gain:'R: burst a 5s sight-blocking cloud.',cost:'20s cooldown.',counter:'Do not chase into the cloud.'},
 {id:'insulation',slot:'hide',name:'CERAMIC MANTLE',gain:'Reactor surges no longer outline you in steam.',cost:'Brighter on CCTV.',counter:'Watch the cameras.'},
];
export function draft(seed) {
 let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);
 const rand=()=>((h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296);
 return Object.fromEntries(SLOTS.map(slot=>{
  const pool=PARTS.filter(p=>p.slot===slot).map(p=>p.id);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return [slot,pool.slice(0,2)];
 }));
}
export function createEvolution(seed) {return {seed:String(seed),offers:draft(seed),stage:0,equipped:{}};}
export function unlockSafe(state) {return {...state,stage:Math.min(3,state.stage+1)};}
export function equip(state,id) {
 const p=PARTS.find(p=>p.id===id);
 const order=['senses','movement','hide'];
 if(!p || state.stage<=order.indexOf(p.slot) || !state.offers[p.slot].includes(id))return state;
 return {...state,equipped:{...state.equipped,[p.slot]:id}};
}
export function effects(state) {
 const selected=Object.values(state.equipped).map(id=>PARTS.find(p=>p.id===id));
 return {speed:selected.reduce((v,p)=>v*(p.speed||1),1),noise:selected.reduce((v,p)=>v*(p.noise||1),1),routes:['corridor',...selected.map(p=>p.route).filter(Boolean)]};
}
export function routeTrial(state,route) {
 const fx=effects(state);
 const routes={corridor:{seconds:20/fx.speed,label:'NORMAL CORRIDOR',detail:'Always available. Every objective remains reachable.'},door:{seconds:5+4/fx.speed,label:'HEAVY DOOR',detail:'Pry for 5 seconds, then cross. Crew hears the breach.'},vent:{seconds:10,label:'VENT BYPASS',detail:'3 seconds in + 4 seconds crawling + 3 seconds out. No attacks inside.'},rail:{seconds:11,label:'OVERHEAD RAIL',detail:'9 seconds climbing + 2 seconds exposed while descending.'},gap:{seconds:6.5,label:'BROKEN CATWALK',detail:'5 seconds approach + 1.5 seconds landing recovery.'}};
 const r=routes[route];return r?{...r,allowed:fx.routes.includes(route)}:null;
}
