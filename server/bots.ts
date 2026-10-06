// Bot engineers and bot saboteurs. They live in the room like players: they path on the walkability
// grid, work machines, run to emergencies, pull people off lips, remember who was where when things
// broke, and tape suspects (two pairs of hands, so a human can be the second). A bot saboteur looks
// busy, sabotages only when nobody is watching, and shoves people off edges when it can get away with it.
import {findPath,reachable} from '../shared/botnav.js';
import {MACHINES,standOf} from '../shared/machines.js';
import {SABOTAGE,NAV,SAB_COOLDOWN} from '../shared/stations.js';
import {moveWithCollisions,roomAt} from '../shared/world.js';
import {HANG,TAPE} from '../shared/match.js';
import {MOVE_SPEED,SHIFT_SECONDS} from '../shared/constants.js';
import {LIFT_DOOR} from '../shared/wings.js';

type V={x:number;z:number};
type Task={kind:string;prio:number;id:string;target?:string;at:V;dur:number;started:number;expires:number;dir?:V};
interface Brain{task:Task|null;path:V[];pathKey:string;think:number;check:{x:number;z:number;at:number;tries:number};beatAt:number;
 sus:Record<string,number>;said:Record<string,number>;fleeUntil:number;fleeFrom:V|null;giveUp:Record<string,number>;nextSab:number;nextShove:number;idleUntil:number}

const dist=(a:V,b:V)=>Math.hypot(a.x-b.x,a.z-b.z);
const pick=<T>(a:T[])=>a[Math.floor(Math.random()*a.length)];
const engineer=(q:any)=>q.role==='crew'||q.role==='saboteur';
const place=(v:V)=>roomAt(v.x,v.z)?.name||'HALL';
const DIRS=[...Array(8)].map((_,i)=>({x:Math.cos(i*Math.PI/4),z:Math.sin(i*Math.PI/4)}));
const WORK:Record<string,number>={valve:7000,breaker:6000,doors:4500};
// Machines bots can reach: everything on the main floor, not the legacy station rigs.
const BOT_MACHINES=MACHINES.filter((m:any)=>!m.legacy&&m.effect&&!(m.floor<0));

// Would a shove (or a lunge) send this person over a lip? Try eight directions.
export function edgeDir(solids:any,q:any,knock=1.6){
 for(const d of DIRS){const n=moveWithCollisions({x:q.x,y:q.y,z:q.z,vy:0,fallStart:q.y,stun:0},d.x*knock,d.z*knock,solids,undefined,.1,true);if(n.ledge)return d;}
 return null;
}

export class Bots{
 claims=new Map<string,{by:string;until:number}>();lastSay=0;
 constructor(readonly room:any){}

 private brain(p:any):Brain{return p.brain??={task:null,path:[],pathKey:'',think:0,check:{x:p.x,z:p.z,at:Date.now(),tries:0},beatAt:0,sus:{},said:{},fleeUntil:0,fleeFrom:null,giveUp:{},nextSab:Date.now()+40000+Math.random()*30000,nextShove:0,idleUntil:0};}
 private claim(key:string,p:any,ms:number,max=1){
  const now=Date.now();let n=0;for(const [k,c] of this.claims)if(c.until>now&&c.by!==p.id&&k.startsWith(key+'#'))n++;
  if(n>=max)return false;this.claims.set(key+'#'+p.id,{by:p.id,until:now+ms});return true;
 }
 private unclaim(p:any){for(const [k,c] of this.claims)if(c.by===p.id)this.claims.delete(k);}
 shared=new Map<string,number>();
 say(p:any,key:string,cooldown:number,text:string,radius=22){
  const now=Date.now(),b=this.brain(p);if(now-(b.said[key]||0)<cooldown||now-this.lastSay<1200)return;
  // One voice per sighting or alarm, not a chorus.
  const group=['spec','lift','guard','keypad','tubes'].includes(key)?key:null;if(group&&now-(this.shared.get(group)||0)<10000)return;if(group)this.shared.set(group,now);
  b.said[key]=now;this.lastSay=now;this.room.say(p,text,radius);
 }
 // ---------- what bots notice ----------
 // kind: noise (sabotage work heard), armed, harness (+5 cycle), shove, edge (shoved over a lip), tamper.
 notice(kind:string,actor:any,at:V,label=''){
  if(!actor||actor.role==='specimen')return;
  const weight:Record<string,number>={noise:70,armed:60,harness:110,shove:35,edge:110,tamper:80,hit:45};
  for(const b of this.room.players.values()){
   if(!b.bot||b.role!=='crew'||b.id===actor.id||b.state!=='ok')continue;
   const d=dist(b,at),same=place(b)===place(at);
   const sees=kind==='hit'?b.id===label:d<12||(same&&d<20)||(kind==='noise'&&d<14);
   if(!sees)continue;
   const br=this.brain(b),before=br.sus[actor.id]||0;br.sus[actor.id]=before+weight[kind];
   if(kind==='noise')this.say(b,'noise',15000,`WHO'S AT THE ${label}?!`);
   if(kind==='harness')this.say(b,'harness',20000,'THE CONSOLE SAYS +5%. THAT WAS YOU. STAY WHERE YOU ARE.');
   if(kind==='edge')this.say(b,'edge',12000,'THEY PUSHED SOMEONE OVER THE RAIL!');
   if(kind==='hit')this.say(b,'hit',8000,pick(['HEY! WATCH IT.','DON\'T PUSH ME.','WHAT ARE YOU DOING?']));
   if(before<100&&br.sus[actor.id]>=100){
    this.say(b,'accuse',15000,label&&kind!=='hit'&&kind!=='shove'?`I SAW SOMEONE AT THE ${label}. HELP ME TAPE THEM.`:'I SAW IT. HELP ME TAPE THEM.',30);
    // Crewmates who hear the accusation half-believe it.
    for(const o of this.room.players.values())if(o.bot&&o.role==='crew'&&o.id!==b.id&&dist(o,b)<30){const ob=this.brain(o);ob.sus[actor.id]=(ob.sus[actor.id]||0)+55;}
   }
  }
 }

 // A suspect got taped: the crew has dealt with them for now.
 taped(target:any){const now=Date.now();for(const b of this.room.players.values())if(b.bot&&b.role==='crew'){const br=this.brain(b);br.sus[target.id]=Math.min(br.sus[target.id]||0,70);br.giveUp[target.id]=now+45000;if(br.task?.target===target.id)this.set(b,br,null);}}
 // ---------- per tick ----------
 tick(p:any,now:number,dt:number){
  const R=this.room,b=this.brain(p);if(p.role==='specimen')return;
  if(p.state==='hanging'&&p.hang){
   const h=p.hang,i=2-h.hands;if(b.beatAt<now-2000)b.beatAt=now+450;
   if(now>=b.beatAt){b.beatAt=now+HANG.beatMs[i];const hit=Math.random()<(h.hands===2?.8:.66);h.score=Math.min(100,h.score+(hit?HANG.hit[i]:-HANG.miss));if(h.score<=0)R.release(p,now);}
   this.say(p,'hang',7000,pick(['PULL ME UP!','I\'M ON THE LIP! HELP!','I CAN\'T HOLD ON!']),26);return;
  }
  if(p.state==='taped'&&p.taped){
   if(now>=b.beatAt){b.beatAt=now+430+Math.random()*220;if(Math.random()<.72){p.taped.hits++;if(p.taped.hits>=TAPE.breakHits)R.untape(p,now,true);}else p.taped.hits=Math.max(0,p.taped.hits-1);}
   this.say(p,'taped',12000,p.role==='saboteur'?pick(['IT WASN\'T ME! CHECK THE CAMERAS!','YOU\'VE GOT THE WRONG ONE.']):pick(['I\'M NOT THE SABOTEUR!','LET ME GO, IDIOTS.']),20);return;
  }
  if(p.state!=='ok'||p.stun>0)return;
  for(const k in b.sus)b.sus[k]=Math.max(0,b.sus[k]-dt*.2);
  if(now>=b.think){b.think=now+300+Math.random()*200;this.decide(p,b,now);}
  this.act(p,b,now,dt);
 }

 private witnesses(p:any,at:V,except:string[]=[]){
  return [...this.room.players.values()].filter((q:any)=>q.id!==p.id&&!except.includes(q.id)&&engineer(q)&&q.state==='ok'&&(dist(q,at)<12||(place(q)===place(at)&&dist(q,at)<20))).length;
 }
 private valid(p:any,t:Task,now:number){
  const R=this.room,q=t.target?R.players.get(t.target):null,s=SABOTAGE.find(s=>s.id===t.id);
  if(now>t.expires)return false;
  switch(t.kind){
   case 'help':return !!q&&q.state==='hanging';
   case 'ruin':return !!q&&q.state==='hanging';
   case 'stop':return !!q&&q.state==='ok'&&(q.hold?.kind==='escape'||dist(q,LIFT_DOOR)<5);
   case 'defend':return !!q&&q.state==='ok'&&!q.inVent&&dist(q,p)<4;
   case 'defuse':return R.armed.has(t.id);
   case 'fix':return !!s&&(s.id==='valve'?now<R.valveUntil:s.id==='breaker'?R.blackoutSeconds>0:!!s.camera&&R.cutCameras.has(s.camera));
   case 'tape':return !!q&&q.state==='ok'&&(this.brain(p).sus[q.id]||0)>=80;
   case 'push':return !!q&&q.state==='ok'&&dist(q,p)<8;
   case 'sab':return !R.armed.has(t.id)&&now-p.lastSabotage>SAB_COOLDOWN*1000;
   case 'machine':return now>=(R.machineState[t.id]?.readyAt??Infinity)||t.started>0;
   case 'keypad':return !R.cameraOpened;
   case 'guard':return !!R.specimen()&&R.specimen().state==='ok';
   case 'tubes':return R.cameraOpened&&!R.tubes.powered;
  }
  return true;
 }
 private set(p:any,b:Brain,t:Task|null){if(b.task&&t&&b.task.kind===t.kind&&b.task.id===t.id)return;if(b.task)this.unclaim(p);p.hold=null;b.task=t;b.path=[];b.pathKey='';}

 private decide(p:any,b:Brain,now:number){
  const R=this.room,sab=p.role==='saboteur',players=[...R.players.values()] as any[];
  if(b.task&&!this.valid(p,b.task,now))this.set(p,b,null);
  const want=(t:Task|null)=>{if(t&&(!b.task||t.prio<b.task.prio))this.set(p,b,t);};
  const T=(kind:string,prio:number,id:string,at:V,extra:Partial<Task>={}):Task=>({kind,prio,id,at,dur:0,started:0,expires:now+(extra.dur??0)+40000,...extra});
  // Eyes: the specimen is invisible when still, a smear when moving, clear when revealed.
  const spec=R.specimen();
  if(spec&&spec.state==='ok'&&!spec.inVent&&Math.abs(spec.y-p.y)<2){
   const d=dist(spec,p),seen=now<spec.revealUntil||(now-spec.stillSince<900&&d<10)||d<2.6;
   if(seen){
    this.say(p,'spec',20000,pick([`IT'S IN THE ${place(spec)}!`,`SHADOW ON THE FLOOR. ${place(spec)}.`,`SOMETHING MOVED IN THE ${place(spec)}!`]),30);
    if(d<2.2&&now-p.lastShove>4000)want(T('defend',0,spec.id,spec,{target:spec.id,dur:3000}));
    else if(d<8&&(!b.task||b.task.prio>3)){b.fleeUntil=now+3200;b.fleeFrom={x:spec.x,z:spec.z};}
   }
  }
  // Someone on a lip.
  for(const q of players)if(q.id!==p.id&&engineer(q)&&q.state==='hanging'&&dist(q,p)<30){
   // A saboteur finishes the job when nobody is looking, and plays the hero when somebody is.
   const watched=this.witnesses(p,q,[q.id])>0;
   if(sab&&!watched){if(dist(q,p)<16){want(T('ruin',1,q.id,q,{target:q.id}));break;}continue;}
   if(this.claim('help:'+q.id,p,8000,2)||b.task?.id===q.id){want(T('help',1,q.id,q,{target:q.id}));break;}
  }
  // The specimen is prying the lift door: everyone near goes to shove it off.
  if(!sab&&spec?.hold?.kind==='escape'&&dist(p,LIFT_DOOR)<50){want(T('stop',2,spec.id,spec,{target:spec.id}));this.say(p,'lift',15000,'IT\'S AT THE SURFACE LIFT! STOP IT!',30);}
  // Armed sabotage: go if you can get there in time.
  if(!sab)for(const [id,a] of R.armed as Map<string,any>){const s=SABOTAGE.find(s=>s.id===id)!,left=(a.at-now)/1000,eta=dist(p,s)*1.35/MOVE_SPEED+1.9;
   if(eta<left+.3&&this.claim('defuse:'+id,p,9000,2)){want(T('defuse',3,id,s));this.say(p,'defuse:'+id,8000,`GOING FOR THE ${s.label}!`);break;}}
  // Repairs.
  if(!sab)for(const s of SABOTAGE){if(!s.fixHold)continue;const broken=s.id==='valve'?now<R.valveUntil:s.id==='breaker'?R.blackoutSeconds>0:!!s.camera&&R.cutCameras.has(s.camera);
   if(broken&&dist(p,s)<45&&this.claim('fix:'+s.id,p,30000)){want(T('fix',4,s.id,s));this.say(p,'fix:'+s.id,20000,`I'LL FIX THE ${s.label}.`);break;}}
  // Tape the one you saw.
  if(!sab){const [sid,score]=Object.entries(b.sus).sort((a,c)=>c[1]-a[1])[0]??[];const q=sid?R.players.get(sid):null;
   if(q&&(score as number)>=100&&q.state==='ok'&&now>(b.giveUp[q.id]||0))want(T('tape',5,q.id,q,{target:q.id,dur:25000}));}
  // Saboteur: an unwatched shove at a lip, or an unwatched sabotage.
  if(sab&&now>b.nextShove){
   for(const q of players){if(q.id===p.id||!engineer(q)||q.state!=='ok'||dist(q,p)>6)continue;
    if(this.witnesses(p,q,[q.id])>0)continue;const d=edgeDir(R.solids(),q);if(d){want(T('push',5,q.id,q,{target:q.id,dir:d,dur:9000}));b.nextShove=now+25000;break;}}
   if(!b.task)b.nextShove=now+3000;
  }
  if(sab&&!b.task&&now>b.nextSab&&now-p.lastSabotage>SAB_COOLDOWN*1000){
   const live=(s:any)=>!R.armed.has(s.id)&&!(s.id==='valve'&&now<R.valveUntil)&&!(s.id==='breaker'&&R.blackoutSeconds>0)&&!(s.id==='doors'&&R.sealed)&&!(s.camera&&R.cutCameras.has(s.camera));
   // The coolant valve is what melts the core; the rest blind and split the crew.
   const worth:Record<string,number>={valve:5,breaker:1.6,doors:1.3};
   const options=SABOTAGE.filter(live).filter(s=>this.witnesses(p,s)===0&&dist(p,s)<45).map(s=>({s,v:(worth[s.id]??1)/(8+dist(p,s))*(.6+Math.random()*.8)})).sort((a,c)=>c.v-a.v);
   if(options.length){const s=options[0].s;want(T('sab',6,s.id,s,{dur:WORK[s.id]??3500}));}
   b.nextSab=now+(options.length?22000+Math.random()*18000:6000);
  }
  // All three safes open: the specimen will go for the surface lift. Two engineers stand guard.
  if(!sab&&spec&&spec.stage>=3&&spec.state==='ok'&&this.claim('guard',p,20000,2))want(T('guard',4,'guard',{x:LIFT_DOOR.x-3.4+Math.random()*.8,z:LIFT_DOOR.z+(Math.random()-.5)*1.6},{dur:20000}));
  if(b.task)return;
  // Camera room: someone has to open it and seat the tubes.
  const elapsed=SHIFT_SECONDS-R.tLeft;
  if(!sab&&elapsed>60){
   const key=MACHINES.find(m=>m.id==='keypad')!,tubes=MACHINES.find(m=>m.id==='tubes')!;
   if(!R.cameraOpened&&this.claim('keypad',p,60000)){want(T('keypad',7,'keypad',standOf(key),{dur:9000}));return;}
   if(R.cameraOpened&&!R.tubes.powered&&this.claim('tubes',p,60000)){want(T('tubes',7,'tubes',standOf(tubes),{dur:11000}));return;}
  }
  if(now<b.idleUntil)return;
  // A machine: worth more when the core is hot, less when it is far.
  const keen=R.temp>=42||R.pressure>=45||Math.random()<.45;
  if(keen||sab){
   const humans=players.filter(q=>!q.bot&&engineer(q)&&q.state==='ok');
   let best:any=null,score=0;
   for(const m of BOT_MACHINES as any[]){
    const st=R.machineState[m.id],at=standOf(m);if(!st||now<st.readyAt||!reachable(at,R.cameraOpened))continue;
    if(humans.some(q=>dist(q,at)<2.2)||!this.claim('m:'+m.id,p,0,1))continue;
    let v=(Math.abs(m.effect.temp||0)+Math.abs(m.effect.pressure||0)*.7)/(10+dist(p,at)*1.3)*(.7+Math.random()*.6);
    if(m.id==='harness')v*=sab?(this.witnesses(p,at)===0?4:.2):(humans.some(q=>q.role==='crew')?.5:1);
    if(v>score){score=v;best=m;}
   }
   if(best&&this.claim('m:'+best.id,p,40000)){want(T('machine',8,best.id,standOf(best),{dur:12000+Math.random()*7000}));return;}
  }
  // Wander with the others: stay near people.
  const near=players.filter(q=>q.id!==p.id&&engineer(q)&&q.state==='ok'&&dist(q,p)<30);
  const nodes=Object.values(NAV).map(([x,z])=>({x,z})).filter(n=>reachable(n,R.cameraOpened));
  const buddy=near.length&&Math.random()<.5?pick(near):null;
  const n=buddy?nodes.sort((a,c)=>dist(a,buddy)-dist(c,buddy))[0]:pick(nodes);
  if(n)want(T('patrol',9,'patrol',n));
 }

 private act(p:any,b:Brain,now:number,dt:number){
  const R=this.room,t=b.task;
  // Running from the specimen beats everything except a rescue or a sabotage countdown.
  if(now<b.fleeUntil&&b.fleeFrom&&!(t&&t.prio<=3)){
   const dx=p.x-b.fleeFrom.x,dz=p.z-b.fleeFrom.z,l=Math.hypot(dx,dz)||1;
   const away={x:p.x+dx/l*5,z:p.z+dz/l*5};if(reachable(away,R.cameraOpened)){this.walk(p,b,away,now,dt,1);return;}
  }
  if(!t)return;
  const q=t.target?R.players.get(t.target):null;
  const goal:V=t.kind==='push'&&q&&t.dir?{x:q.x-t.dir.x*.9,z:q.z-t.dir.z*.9}:q?{x:q.x,z:q.z}:t.at;
  const reach:Record<string,number>={help:1.3,ruin:1.2,guard:.5,stop:1.3,defend:1.5,defuse:.3,fix:.3,tape:1.0,push:.35,sab:.3,machine:.35,keypad:.35,tubes:.35,patrol:.6};
  const d=dist(p,goal);
  if(d>(reach[t.kind]??.5)){if(t.kind!=='tape'&&t.kind!=='help')p.hold=null;this.walk(p,b,goal,now,dt);return;}
  const face=(v:V)=>{p.yaw=Math.atan2(-(v.x-p.x),-(v.z-p.z));};
  const hold=(kind:string,target:string)=>{if(p.hold?.kind===kind)return;const s=R.holdSpec(p,kind,target);if(s.ok)p.hold={kind,target,start:now,duration:s.duration};};
  switch(t.kind){
   case 'help':face(q);hold('help',q.id);this.say(p,'helping',9000,pick(['HOLD ON, I\'VE GOT YOU.','GRAB MY HAND!']));break;
   case 'defuse':face(t.at);hold('defuse',t.id);break;
   case 'fix':face(t.at);hold('fix',t.id);break;
   case 'tape':face(q);hold('tape',q.id);this.say(p,'tape:'+q.id,12000,'HELP ME TAPE THIS ONE! HOLD T ON THEM!',20);
    if(now-t.started>20000&&t.started){b.giveUp[q.id]=now+30000;this.set(p,b,null);}else if(!t.started)t.started=now;break;
   case 'stop':case 'defend':if(now-p.lastShove>4000){R.shove(p,q.x-p.x,q.z-p.z,now);if(t.kind==='defend')this.say(p,'defend',8000,'GET OFF ME!');b.fleeUntil=now+2500;b.fleeFrom={x:q.x,z:q.z};}break;
   case 'ruin':if(this.witnesses(p,q,[q.id])===0&&now-p.lastShove>4000){R.shove(p,q.x-p.x,q.z-p.z,now);}else{this.set(p,b,{...t,kind:'help'});}break;
   case 'push':{const dd=dist(p,q);if(dd<1.6&&now-p.lastShove>4000&&this.witnesses(p,q,[q.id])===0){R.shove(p,q.x-p.x,q.z-p.z,now);this.set(p,b,null);}break;}
   case 'sab':{const s=SABOTAGE.find(s=>s.id===t.id)!;face(s);
    if(!t.started){if(this.witnesses(p,s)>0){b.nextSab=now+15000;this.set(p,b,null);break;}t.started=now;R.sabNoise(p,s,now);}
    else if(now-t.started>=t.dur){this.set(p,b,null);if(Math.random()<.12)R.sabFail(p,s,now);else R.armSabotage(p,s,now);}break;}
   case 'machine':case 'keypad':case 'tubes':{
    const def=MACHINES.find(m=>m.id===t.id)!;face(def.anchor);
    if(!t.started){t.started=now;t.expires=now+t.dur+5000;}
    else if(now-t.started>=t.dur){
     if(t.kind==='machine')R.serviceMachine(p,def,now);
     if(t.kind==='keypad'&&!R.cameraOpened){R.cameraOpened=true;p.stats.tasks++;R.event('CAMERA ROOM / DOOR RELEASED');this.say(p,'keypad',30000,'CAMERA ROOM IS OPEN. CODE WAS ON THE RADIO.');}
     if(t.kind==='tubes'&&!R.tubes.powered){R.tubes.values=[...R.tubes.targets];R.tubes.powered=true;p.stats.tasks++;R.event('CAMERA ROOM / CCTV ONLINE');this.say(p,'tubes',30000,'TUBES ARE SEATED. CAMERAS ARE UP.');}
     this.set(p,b,null);b.idleUntil=now+1500+Math.random()*2500;
    }break;}
   case 'patrol':this.set(p,b,null);b.idleUntil=now+1500+Math.random()*3000;break;
   case 'guard':face(LIFT_DOOR);this.say(p,'guard',40000,R.specimen()?.stage>=3?'ALL THREE SAFES ARE OPEN. I\'M WATCHING THE LIFT.':'TWO SAFES ARE OPEN. SOMEONE SHOULD WATCH THE LIFT. I\'LL GO.',30);break;
  }
 }

 // Walk toward a point along the grid path; replan when the goal moves or the bot gets stuck.
 private walk(p:any,b:Brain,goal:V,now:number,dt:number,urgency=0){
  const R=this.room,key=`${Math.round(goal.x/1.5)},${Math.round(goal.z/1.5)}`;
  if(b.pathKey!==key||!b.path.length){
   b.pathKey=key;b.path=dist(p,goal)<2?[goal]:(findPath(p,goal,R.cameraOpened)||[]);
   // Wall-mounted targets can sit in pockets the grid cannot reach: try points around them.
   for(const r of [.8,1.25])for(const d of DIRS){if(b.path.length)break;const g={x:goal.x+d.x*r,z:goal.z+d.z*r};if(reachable(g,R.cameraOpened)){const path=findPath(p,g,R.cameraOpened);if(path){b.path=path;if(b.task&&!b.task.target)b.task.at=g;}}}
   if(!b.path.length){if(b.task&&b.task.prio>=6)this.set(p,b,null);return;}
  }
  let w=b.path[0];
  if(b.path.length===1)w=b.path[0]=goal;
  if(dist(p,w)<(b.path.length>1?.15:.3)){b.path.shift();w=b.path[0];if(!w)return;}
  const dx=w.x-p.x,dz=w.z-p.z,l=Math.hypot(dx,dz);if(l<.01)return;
  const step=Math.min(l,MOVE_SPEED*(urgency||(b.task?.prio??9)<=4||b.task?.kind==='guard'?1:.85)*dt);
  const next=moveWithCollisions(p,dx/l*step,dz/l*step,R.solids(),undefined,0,now>p.noGrabUntil);
  Object.assign(p,{x:next.x,y:next.y,z:next.z,vy:next.vy,fallStart:next.fallStart});p.yaw=Math.atan2(-dx,-dz);p.lastMove=now;
  if(next.ledge){R.hangOn(p,next.ledge);return;}
  if(now-b.check.at>2200){
   if(Math.hypot(p.x-b.check.x,p.z-b.check.z)<.25){b.path=[];b.pathKey='';if(++b.check.tries>3){b.check.tries=0;if(b.task)this.set(p,b,null);}}else b.check.tries=0;
   b.check={x:p.x,z:p.z,at:now,tries:b.check.tries};
  }
 }
}
