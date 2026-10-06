// Tactile machines. Each is worked in 3D: you lean in and drag wheels, knobs, dials and levers.
// Puzzles are seeded per room, machine and cycle; the server re-checks every answer.
const rng=seed=>{let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return ()=>((h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296);};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
// face: the direction the machine faces (toward the operator). stand: where the operator stands.
export const MACHINES=[
 {id:'manifold',kind:'valves',label:'PUMP MANIFOLD',anchor:{x:-5.3,y:1.35,z:-12.85},face:{x:-1,z:0},effect:{pressure:-8,temp:-3},cooldown:70},
 {id:'phone',kind:'phone',label:'DUTY TELEPHONE',anchor:{x:4.4,y:.92,z:2.85},face:{x:-1,z:0},effect:{temp:-4},cooldown:60},
 {id:'radio',kind:'radio',label:'SHORTWAVE RADIO',anchor:{x:39.35,y:.95,z:7.4},face:{x:-1,z:0},effect:{temp:-2,pin:true},cooldown:80},
 {id:'centrifuge',kind:'centrifuge',label:'SAMPLE CENTRIFUGE',anchor:{x:5.45,y:1.05,z:-12.75},face:{x:1,z:0},effect:{temp:-3},cooldown:65},
 {id:'lathe',kind:'lathe',label:'LATHE / VALVE STEM',anchor:{x:-7.4,y:1.15,z:-4.0},face:{x:0,z:1},effect:{pressure:-6},cooldown:70},
 {id:'synchro',kind:'synchro',label:'GENERATOR SYNC',anchor:{x:31.75,y:1.0,z:-11.7},face:{x:1,z:0},effect:{temp:-4},cooldown:75},
 {id:'rods',kind:'rods',label:'CONTROL RODS',anchor:{x:-5.6,y:1.25,z:-17.1},face:{x:0,z:-1},effect:{temp:-7},cooldown:90},
 {id:'fuel',kind:'fuel',label:'BURAN FUEL TRANSFER',anchor:{x:55.2,y:-6.8,z:28},face:{x:-1,z:0},floor:-8,effect:{pressure:-6,temp:-2},cooldown:75},
];
export const standOf=m=>({x:m.anchor.x+m.face.x*1.0,y:m.floor??0,z:m.anchor.z+m.face.z*1.0});
export const nearMachine=(p,r=1.3)=>MACHINES.find(m=>{const s=standOf(m);return Math.abs((p.y??0)-s.y)<.9&&Math.hypot(p.x-s.x,p.z-s.z)<=r;});
export const machineSeed=(seed,id,cycle)=>`${seed}/${id}/${cycle}`;

export function puzzle(kind,seed){
 const r=rng(seed);
 if(kind==='valves'){
  // Three wheels each feed several gauges: turning one moves more than one needle.
  const M=[[2,1,0],[0,2,1],[1,0,2]].map(row=>row.map(v=>v+(r()<.3?1:0)));
  const w=[1,2,3].map(()=>Math.round(2+r()*12)/2);
  return {M,targets:M.map(row=>row.reduce((s,v,j)=>s+v*w[j],0)),max:10};
 }
 if(kind==='phone'){
  const names=['ДЕЖУРНЫЙ РЕАКТОРА / REACTOR DUTY','КОТЕЛЬНАЯ / BOILER ROOM','ОХРАНА / GUARD POST','МЕДПУНКТ / MEDIC','СКЛАД / STORES','ДИСПЕТЧЕР / DISPATCH'];
  const used=new Set(),entries=names.map(n=>{let num;do num=String(1+Math.floor(r()*9))+Array.from({length:3},()=>Math.floor(r()*10)).join('');while(used.has(num));used.add(num);return {name:n,num};});
  return {entries,callee:0};
 }
 if(kind==='radio')return {target:Math.round((6.4+r()*2.2)*100)/100};
 if(kind==='centrifuge'){const cracked=Math.floor(r()*8);let pre;do pre=Math.floor(r()*8);while(pre===cracked||pre===(cracked+4)%8);return {cracked,pre};}
 if(kind==='lathe')return {target:Math.round((8+r()*24)*10)/10};
 if(kind==='synchro')return {speed:Math.round((.25+r()*.5)*100)/100};
 if(kind==='rods')return {a:Math.round((.2+r()*.6)*100)/100,b:Math.round((.2+r()*.6)*100)/100};
 if(kind==='fuel'){const order=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}return {order,band:Math.round((.35+r()*.3)*100)/100};}
 return {};
}
export function check(kind,seed,a){
 const p=puzzle(kind,seed);if(!a)return {ok:false,reason:'NOTHING SET'};
 if(kind==='valves'){const g=p.M.map(row=>row.reduce((s,v,j)=>s+v*(+a.w?.[j]||0),0));const off=Math.max(...g.map((v,i)=>Math.abs(v-p.targets[i])));return off<=.75?{ok:true}:{ok:false,reason:'GAUGES OUT OF BAND'};}
 if(kind==='phone'){return String(a.number)===p.entries[p.callee].num?{ok:true}:{ok:false,reason:'WRONG EXTENSION'};}
 if(kind==='radio')return Math.abs((+a.freq)-p.target)<=.012?{ok:true}:{ok:false,reason:'ONLY STATIC'};
 if(kind==='centrifuge'){const s=[...new Set((a.slots||[]).map(Number))];if(s.length!==4||s.includes(p.cracked)||!s.includes(p.pre))return {ok:false,reason:'LOAD FOUR TUBES, NOT THE CRACKED SLOT'};
  const x=s.reduce((t,i)=>t+Math.cos(i*Math.PI/4),0),y=s.reduce((t,i)=>t+Math.sin(i*Math.PI/4),0);return Math.hypot(x,y)<.01?{ok:true}:{ok:false,reason:'ROTOR UNBALANCED'};}
 if(kind==='lathe')return Math.abs((+a.value)-p.target)<=.05?{ok:true}:{ok:false,reason:'OFF THE MARK'};
 if(kind==='synchro')return Math.abs((+a.speed)-p.speed)<=.035&&Math.abs(+a.angle)<=18?{ok:true}:{ok:false,reason:'OUT OF PHASE'};
 if(kind==='rods')return Math.abs((+a.a)-p.a)<=.04&&Math.abs((+a.b)-p.b)<=.04?{ok:true}:{ok:false,reason:'RODS NOT AT DEPTH'};
 if(kind==='fuel')return JSON.stringify((a.order||[]).map(Number))===JSON.stringify(p.order)?{ok:true}:{ok:false,reason:'WRONG VALVE ORDER'};
 return {ok:false};
}

// Sabotage minigames on the existing sabotage hardware. Each is harder than a crew task,
// makes noise while worked, and only arms: crew get a warning and seconds to stop it.
export const SAB_ARM_SECONDS=8;
export function sabPuzzle(id,seed){
 const r=rng('sab/'+seed+'/'+id);
 if(id==='valve')return {turns:5};
 if(id==='breaker'){const order=[0,1,2,3,4];for(let i=4;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}return {phases:['A','B','C','N','PE'],order:order.slice(0,3),live:order[3]};}
 if(id==='doors')return {code:[0,1,2].map(()=>Math.floor(r()*10))};
 if(id.startsWith('coax')){const colours=['RED','BLACK','WHITE','GREEN','YELLOW'],stripes=colours.map(()=>Math.floor(r()*3));const wire=Math.floor(r()*5);return {colours,stripes,wire,rule:`CUT ${colours[wire]}${stripes[wire]?` WITH ${stripes[wire]} STRIPE${stripes[wire]>1?'S':''}`:' (PLAIN)'}`};}
 return {};
}
export function sabCheck(id,seed,a){
 const p=sabPuzzle(id,seed);if(!a)return {ok:false};
 if(id==='valve')return (+a.turns)>=p.turns?{ok:true}:{ok:false,reason:'NOT ENOUGH TURNS'};
 if(id==='breaker')return JSON.stringify((a.order||[]).map(Number))===JSON.stringify(p.order)?{ok:true}:{ok:false,reason:'WRONG FUSE',shock:(a.order||[]).map(Number).includes(p.live)};
 if(id==='doors')return JSON.stringify((a.code||[]).map(Number))===JSON.stringify(p.code)?{ok:true}:{ok:false,reason:'OVERRIDE REJECTED'};
 if(id.startsWith('coax'))return (+a.wire)===p.wire?{ok:true}:{ok:false,reason:'WRONG WIRE / TAMPER ALERT',tamper:true};
 return {ok:false};
}
