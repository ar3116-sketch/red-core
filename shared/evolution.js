// Deterministic per-match draft. Effects are consumed by the mutation lab;
// multiplayer monster simulation will use the same rules when implemented.
export const SLOTS = ['movement', 'senses', 'hide'];
export const PARTS = [
 {id:'crusher',slot:'movement',name:'BREAKER ARMS',gain:'Pry heavy doors in 5 seconds. Keep the breach open.',cost:'Loud breach; 15% slower movement.',counter:'Crew can hear the approach and abandon the door.',route:'door',speed:.85,noise:1.4},
 {id:'tentacles',slot:'movement',name:'SOFT TENDRILS',gain:'Squeeze through service vents to flank rooms.',cost:'3 seconds to enter or exit; no attacks inside vents.',counter:'Vent rattles warn anyone at the exit.',route:'vent',speed:1,noise:1},
 {id:'mantis',slot:'movement',name:'CEILING HOOKS',gain:'Climb marked overhead rails for an ambush.',cost:'2 seconds to descend before attacking; exposed overhead.',counter:'Work lamps reveal the ceiling silhouette.',route:'rail',speed:1,noise:1},
 {id:'leaper',slot:'movement',name:'SPRING HAUNCHES',gain:'Leap broken catwalk gaps and close open distance.',cost:'Loud landing; 1.5 second recovery and 10 second cooldown.',counter:'Sharp turns and low ceilings deny the leap.',route:'gap',speed:1,noise:1.2},
 {id:'thermal',slot:'senses',name:'THERMAL PITS',gain:'See living heat in darkness within 8 metres.',cost:'Steam and hot machinery mask targets. No wall vision.',counter:'Crew can hide beside hot equipment.'},
 {id:'antennae',slot:'senses',name:'VIBRATION COMB',gain:'Sense running footsteps through one connected floor.',cost:'No stationary or crouched targets; pumps cause interference.',counter:'Walk slowly or move during machinery pulses.'},
 {id:'echo',slot:'senses',name:'ECHO FANS',gain:'Pulse reveals nearby geometry and moving silhouettes.',cost:'Pulse is audible; 2 second snapshot, 12 second cooldown.',counter:'Crew can bait a pulse and move after it fades.'},
 {id:'scent',slot:'senses',name:'SCENT PALPS',gain:'Follow a target\'s last 12 seconds of trail.',cost:'Trail is delayed and washes away at decontamination.',counter:'Cross a wash station or split routes.'},
 {id:'plates',slot:'hide',name:'LAYERED CHITIN',gain:'Reduce stun duration by 35%.',cost:'10% slower movement; shell scraping increases noise.',counter:'Keep distance and kite the heavier creature.',speed:.9,noise:1.2},
 {id:'veil',slot:'hide',name:'MIMETIC SKIN',gain:'Blend into shadow after standing still for 3 seconds.',cost:'Movement breaks concealment; cameras still reveal you.',counter:'Sweep hiding places with light or CCTV.'},
 {id:'sacs',slot:'hide',name:'MIST BLADDERS',gain:'Make a 4 second sight-blocking cloud to retreat.',cost:'Cloud also blocks your thermal sense; 20 second cooldown.',counter:'Listen for the retreat; do not chase into the cloud.'},
 {id:'insulation',slot:'hide',name:'CERAMIC MANTLE',gain:'Cross steam bursts with 70% less hazard damage.',cost:'Bright warm outline in IR; no protection against stuns.',counter:'IR equipment tracks you through the steam.'},
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
