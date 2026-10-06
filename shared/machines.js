// Tactile machines. Each is worked in 3D: you lean in and drag wheels, knobs, dials and levers.
// Puzzles are seeded per room, machine and cycle; the server re-checks every answer.
const rng=seed=>{let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return ()=>((h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296);};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
// face: the direction the machine faces (toward the operator). stand: where the operator stands.
export const MACHINES=[
 {id:'harness',kind:'harness',label:'REACTOR CABLE HARNESS',anchor:{x:1.4,y:1.05,z:-7.62},face:{x:0,z:1},effect:{temp:-6},sabEffect:{temp:5},cooldown:25},
 {id:'manifold',kind:'valves',label:'PUMP MANIFOLD',anchor:{x:-5.3,y:1.35,z:-12.85},face:{x:-1,z:0},effect:{pressure:-8,temp:-3},cooldown:70},
 {id:'phone',kind:'phone',label:'DUTY TELEPHONE',anchor:{x:4.4,y:.92,z:2.85},face:{x:-1,z:0},effect:{temp:-4},cooldown:60},
 {id:'radio',kind:'radio',label:'SHORTWAVE RADIO',anchor:{x:37.95,y:.8,z:6.05},face:{x:-1,z:0},effect:{temp:-2,pin:true},cooldown:80},
 {id:'centrifuge',kind:'centrifuge',label:'SAMPLE CENTRIFUGE',anchor:{x:5.4,y:.9,z:-12.75},face:{x:1,z:0},effect:{temp:-3},cooldown:65},
 {id:'lathe',kind:'lathe',label:'LATHE / VALVE STEM',anchor:{x:-7.4,y:1.15,z:-4.0},face:{x:0,z:1},effect:{pressure:-6},cooldown:70},
 {id:'synchro',kind:'synchro',label:'GENERATOR SYNC',anchor:{x:31.6,y:.79,z:-11.95},face:{x:1,z:0},effect:{temp:-4},cooldown:75},
 {id:'rods',kind:'rods',label:'CONTROL RODS',anchor:{x:-5.6,y:1.25,z:-17.1},face:{x:0,z:-1},effect:{temp:-7},cooldown:90},
 {id:'radar',kind:'radar',label:'AIR DEFENCE LINK / РЛС',anchor:{x:-4.62,y:.79,z:-2.5},face:{x:1,z:0},effect:{temp:-3,pressure:-3},cooldown:70},
 // Older station tasks, now worked in 3D. Their server messages are unchanged (legacy).
 {id:'furnace',kind:'furnace',legacy:true,label:'INCINERATOR FEED',anchor:{x:21,y:1.0,z:-7.82},face:{x:0,z:-1}},
 {id:'coolant',kind:'coolant',legacy:true,label:'COOLING LOOP',anchor:{x:-6,y:-2.3,z:27.98},face:{x:0,z:-1},floor:-3.2},
 {id:'keypad',kind:'keypad',legacy:true,label:'CAMERA ROOM DOOR',anchor:{x:-14.86,y:1.35,z:-4.1},face:{x:1,z:0}},
 {id:'tubes',kind:'tubes',legacy:true,label:'VACUUM TUBE RACK',anchor:{x:-20.9,y:1.1,z:-2.7},face:{x:1,z:0}},
 {id:'crane',kind:'crane',label:'GANTRY CRANE / КРАН',anchor:{x:33.2,y:1.15,z:15.3},face:{x:0,z:-1},effect:{pressure:-5,temp:-4},cooldown:80},
 {id:'clock',kind:'clock',label:'BURAN CHRONOMETER / БОРТОВЫЕ ЧАСЫ',anchor:{x:42,y:-4.85,z:23.75},face:{x:0,z:1},floor:-6.2,effect:{temp:-3,pressure:-3},cooldown:60},
 {id:'fuel',kind:'fuel',label:'BURAN FUEL TRANSFER',anchor:{x:55.2,y:-6.8,z:28},face:{x:-1,z:0},floor:-8,effect:{pressure:-6,temp:-2},cooldown:75},
];
export const standOf=m=>({x:m.anchor.x+m.face.x*1.0,y:m.floor??0,z:m.anchor.z+m.face.z*1.0});
export const nearMachine=(p,r=1.3)=>MACHINES.find(m=>{const s=standOf(m);return Math.abs((p.y??0)-s.y)<.9&&Math.hypot(p.x-s.x,p.z-s.z)<=r;});
export const machineSeed=(seed,id,cycle)=>`${seed}/${id}/${cycle}`;

export function puzzle(kind,seed){
 const r=rng(seed);
 if(kind==='harness')return harness(seed);
 if(kind==='clock')return {base:8*3600+Math.floor(r()*10*3600),drift:(r()<.5?-1:1)*(25+Math.floor(r()*140))};
 if(kind==='radar')return {nodes:4,drift:.6+r()*.4};
 if(kind==='crane'){const pads=[[34,30],[50,30],[30,26],[30,36],[47,18]];const t=pads[Math.floor(r()*pads.length)];return {pickup:[56,40],target:t,pad:pads.indexOf(t)+1};}
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
// Harness: a planar graph whose pegs start scrambled so cables cross. Untangle by moving pegs.
const segX=(a,b,c,d)=>{const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);const d1=o(a,b,c),d2=o(a,b,d),d3=o(c,d,a),d4=o(c,d,b);return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));};
export function crossings(edges,pos){const out=new Set();for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const [a,b]=edges[i],[c,d]=edges[j];if(a===c||a===d||b===c||b===d)continue;if(segX(pos[a],pos[b],pos[c],pos[d])){out.add(i);out.add(j);}}return out;}
function harness(seed){
 const r=rng('harness/'+seed),N=7,pts=Array.from({length:N},()=>[r()*.8-.4,r()*.44-.22]);
 const pairs=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)pairs.push([i,j,Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1])]);pairs.sort((a,b)=>a[2]-b[2]);
 const edges=[];for(const [i,j] of pairs){if(edges.length>=10)break;if(edges.every(([a,b])=>a===i||a===j||b===i||b===j||!segX(pts[a],pts[b],pts[i],pts[j])))edges.push([i,j]);}
 // Scramble onto a ring until plenty of cables cross.
 let start;for(let k=0;k<40;k++){const order=[...Array(N).keys()];for(let i=N-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}start=order.map(o=>[Math.cos(o/N*Math.PI*2)*.32,Math.sin(o/N*Math.PI*2)*.18]);if(crossings(edges,start).size>=6)break;}
 return {edges,start,N};
}
export function check(kind,seed,a){
 const p=puzzle(kind,seed);if(!a)return {ok:false,reason:'NOTHING SET'};
 if(kind==='crane')return Math.hypot((+a.x)-p.target[0],(+a.z)-p.target[1])<=1.3?{ok:true}:{ok:false,reason:'WRONG PAD'};
 if(kind==='clock'){const base=Math.floor(p.base/60),ref=Math.round(+a.ref);if(!(ref>=base&&ref<=base+20))return {ok:false,reason:'NO TIME SIGNAL'};if(Math.abs((+a.set)-ref)>.35)return {ok:false,reason:'HANDS DO NOT MATCH MSK'};if(Math.abs(+a.err)>.6)return {ok:false,reason:(+a.err)<0?'TOO EARLY / WAIT FOR THE LONG PIP':'LATE / MISSED THE LONG PIP'};return {ok:true};}
 if(kind==='radar')return Array.isArray(a.phases)&&a.phases.length===p.nodes&&a.phases.every(v=>Math.abs(+v)<=10)?{ok:true}:{ok:false,reason:'NODES OUT OF SYNC'};
 if(kind==='harness'){const pos=a.pos;if(!Array.isArray(pos)||pos.length!==p.N||pos.some(q=>!Array.isArray(q)||q.some(v=>!Number.isFinite(v)||Math.abs(v)>.5)))return {ok:false,reason:'PEGS OFF THE BOARD'};return crossings(p.edges,pos).size?{ok:false,reason:'CABLES STILL CROSS'}:{ok:true};}
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

export const CRANE={top:11,minX:25,maxX:59,minZ:16,maxZ:44,minL:1.5,maxL:18.4,pickup:[56,40],pads:[[34,30],[50,30],[30,26],[30,36],[47,18]]};
