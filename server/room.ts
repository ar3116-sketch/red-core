import {createToolState,pickTool,dropTool,beginToolJob,finishToolJob,ropeDestination,TOOL_JOBS,withinToolReach} from '../shared/tool-system.js';
import {createRelay,refreshRelay,relayAction} from '../shared/relay-task.js';
import {CAMERA_PANEL,INCINERATOR,SERVICE_LADDER,nearStation,accessPuzzle,publicAccessPuzzle,feedFilter} from '../shared/facility.js';
import {createTubes,turnTube,TUBE_RACK} from '../shared/tubes.js';
import {createCoolantState,atCoolantStation,setCoolant,updateCoolant} from '../shared/coolant.js';
import {puzzleForRoom,tryMate} from '../shared/chess-safe.js';
import {moveWithCollisions,solidsForState,roomAt,LETHAL_DROP} from '../shared/world.js';
import {SAFES,nearSafe,checkSweeper,checkScope,publicSweeper} from '../shared/safes.js';
import {draft,PARTS} from '../shared/evolution.js';
import {VENTS,ventTravel,nearVent,CAMERAS,SABOTAGE,SAB_COOLDOWN,SCIF_DESK,REACTOR_SMASH,navPath,NAV} from '../shared/stations.js';
import {LIFT_DOOR} from '../shared/wings.js';
import {CALLSIGNS,MAX_PLAYERS,BRIEFING_SECONDS,assignRoles,roleCounts,SPECIMEN,MUTATION_ORDER,HANG,TAPE,RADIO_DELAY,winners} from '../shared/match.js';
import type * as Party from 'partykit/server';
import {ACTION_RANGE,CONSOLE_POSITION,DRIFT_PER_SEC,MOVE_SPEED,SHIFT_SECONDS,START_TEMP,TICK_HZ} from '../shared/constants.js';
import {chooseDirectorAction,type DirectorAction} from './director.js';

type Role='crew'|'saboteur'|'specimen';
type Hold={kind:string,target:string,start:number,duration:number};
interface Player{
 id:string;line:number;callsign:string;ready:boolean;role:Role|null;bot?:boolean;
 x:number;y:number;z:number;vy:number;fallStart:number;stun:number;yaw:number;
 state:'ok'|'hanging'|'taped'|'dead'|'escaped'|'spectator';
 hang:{score:number;hands:number;dirX:number;dirZ:number}|null;
 taped:{since:number;hits:number}|null;adrenalineUntil:number;noGrabUntil:number;
 lastMove:number;lastShove:number;lastPin:number;lastRadio:number;lastSabotage:number;
 hold:Hold|null;
 stage:number;mutations:Record<string,string>;offer:string|null;lastLunge:number;lastSmash:number;lastSprint:number;lastPulse:number;lastMist:number;
 stillSince:number;revealUntil:number;vent:{to:string;arrive:number}|null;inVent:boolean;solved:string[];
 stats:{tasks:number;sabotage:number;rescues:number;shoves:number;lunges:number;falls:number};
 ai?:{path:{x:number;z:number}[];until:number;retreatUntil:number};
}
const clock=(s:number)=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const humanRole=(p:Player)=>p.role==='crew'||p.role==='saboteur';
const PATROL=['workshop','pumps','reactor','containment','extraction','coreW','coreE','eHallS','sub','bar','wHallN','arc','sto','burn','control'];

export default class Room implements Party.Server {
 phase:'lobby'|'briefing'|'shift'|'over'='lobby';
 hostId:string|null=null;
 matchNo=0;seed='';phaseEnds=0;
 tLeft=SHIFT_SECONDS;temp=START_TEMP;pressure=20;
 players=new Map<string,Player>();
 timer:ReturnType<typeof setInterval>|null=null;
 outcome:{kind:string;winners:string[]}|null=null;
 directorClock=0;directorBusy=false;clusterSeconds=0;blackoutSeconds=0;lastEvent='';eventAt=0;
 coolant=createCoolantState();coolantOperator:string|null=null;cameraOpened=false;tubes=createTubes();
 tools=createToolState();toolPending=new Map<string,any>();relayJobs=new Map<string,ReturnType<typeof createRelay>>();
 safePuzzle='';offers:Record<string,string[]>={};
 valveUntil=0;sealedUntil=0;cutCameras=new Set<string>();lastConsoleCycle:{delta:number;at:number}|null=null;
 log:{at:string;text:string}[]=[];radioQueue:{to:number;text:string;deliver:number}[]=[];
 surgeUntil=0;mistAt:{x:number;z:number;until:number}|null=null;

 constructor(readonly room:Party.Room){this.resetMatch();}

 private resetMatch(){
  this.matchNo++;this.seed=`${this.room.id}#${this.matchNo}`;
  this.tLeft=SHIFT_SECONDS;this.temp=START_TEMP;this.pressure=20;this.outcome=null;
  this.directorClock=0;this.clusterSeconds=0;this.blackoutSeconds=0;this.lastEvent='';
  this.coolant=createCoolantState(this.seed);this.coolantOperator=null;this.cameraOpened=false;this.tubes=createTubes(this.seed);
  this.tools=createToolState();this.toolPending.clear();
  for(const id of this.relayJobs.keys())this.relayJobs.set(id,createRelay(this.seed+':'+id));
  this.safePuzzle=puzzleForRoom(this.seed);this.offers=draft(this.seed);
  this.valveUntil=0;this.sealedUntil=0;this.cutCameras.clear();this.lastConsoleCycle=null;this.log=[];this.radioQueue=[];this.surgeUntil=0;this.mistAt=null;
  for(const [id,p] of this.players){if(p.bot){this.players.delete(id);continue;}Object.assign(p,this.freshBody(),{ready:false,role:null,state:'ok'});}
 }
 private freshBody(){return {x:0,y:0,z:2,vy:0,fallStart:0,stun:0,yaw:0,hang:null,taped:null,adrenalineUntil:0,noGrabUntil:0,hold:null,stage:0,mutations:{},offer:null,lastLunge:0,lastSmash:0,lastSprint:0,lastPulse:0,lastMist:0,stillSince:0,revealUntil:0,vent:null,inVent:false,solved:[],stats:{tasks:0,sabotage:0,rescues:0,shoves:0,lunges:0,falls:0}};}
 private newPlayer(id:string):Player{
  const used=new Set([...this.players.values()].map(p=>p.line));let line=1;while(used.has(line))line++;
  return {id,line,callsign:CALLSIGNS[(line-1)%CALLSIGNS.length],ready:false,role:null,lastMove:Date.now(),lastShove:0,lastPin:0,lastRadio:0,lastSabotage:0,...this.freshBody(),state:'ok'} as Player;
 }
 private get sealed(){return Date.now()<this.sealedUntil;}
 private solids(){return solidsForState(this.cameraOpened,this.sealed);}
 private event(text:string){this.lastEvent=text;this.eventAt=Date.now();}
 private specimen(){return [...this.players.values()].find(p=>p.role==='specimen');}
 private mut(p:Player,id:string){return Object.values(p.mutations).includes(id);}
 private speedOf(p:Player){
  if(p.role==='specimen'){if(p.bot)return 2.7;let s=SPECIMEN.speed;for(const id of Object.values(p.mutations))s*=PARTS.find(x=>x.id===id)?.speed??1;if(this.mut(p,'leaper')&&Date.now()-p.lastSprint<2000)s*=2;return s;}
  return MOVE_SPEED*(Date.now()<p.adrenalineUntil?TAPE.adrenalineSpeed:1);
 }
 private canVent(p:Player){return p.stage<2||this.mut(p,'tentacles');}
 private lungeCooldown(p:Player){return SPECIMEN.lungeCooldown+(this.mut(p,'tentacles')?3:0)-p.stage*1.5;}

 onStart(){if(!this.timer)this.timer=setInterval(()=>this.tick(),1000/TICK_HZ);}

 // ---------- networking ----------
 private common(){
  const now=Date.now(),spec=this.specimen();
  return {
   phase:this.phase,host:this.hostId,phaseLeft:Math.max(0,(this.phaseEnds-now)/1000),seed:this.seed,
   tools:this.tools,cameraOpened:this.cameraOpened,cameraPuzzle:publicAccessPuzzle(this.seed),tubes:this.tubes,coolant:this.coolant,
   tLeft:this.tLeft,temp:this.temp,pressure:this.pressure,blackout:this.blackoutSeconds>0,event:now-this.eventAt<6000?this.lastEvent:'',
   valve:now<this.valveUntil,sealed:this.sealed,cut:[...this.cutCameras],surge:now<this.surgeUntil,
   console:this.lastConsoleCycle&&now-this.lastConsoleCycle.at<20000?{delta:this.lastConsoleCycle.delta}:null,
   mist:this.mistAt&&now<this.mistAt.until?this.mistAt:null,
   lobby:[...this.players.values()].filter(p=>!p.bot).map(p=>({line:p.line,ready:p.ready,host:p.id===this.hostId})),
   players:[...this.players.values()].filter(p=>p.role!=='specimen'&&p.state!=='spectator').map(p=>({id:p.id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,stun:p.stun,state:p.state,hang:p.hang?{hands:p.hang.hands,dirX:p.hang.dirX,dirZ:p.hang.dirZ}:null,hold:p.hold?.kind??null})),
   specimen:spec&&spec.state!=='dead'&&this.phase!=='lobby'?{x:spec.x,y:spec.y,z:spec.z,yaw:spec.yaw,still:now-spec.stillSince,stage:spec.stage,mutations:spec.mutations,inVent:spec.inVent,reveal:now<spec.revealUntil,hold:spec.hold?.kind??null,bot:!!spec.bot}:null,
   outcome:this.outcome?{...this.outcome,roster:[...this.players.values()].filter(p=>p.role).map(p=>({id:p.id,line:p.line,callsign:p.bot?'STALKER':p.callsign,role:p.role,state:p.state,bot:!!p.bot,stats:p.stats}))}:null,
  };
 }
 private mine(p:Player){
  const now=Date.now();
  const me:any={id:p.id,line:p.line,callsign:p.callsign,role:p.role,state:p.state,hang:p.hang,taped:p.taped?{hits:p.taped.hits,left:Math.max(0,TAPE.autoFree-(now-p.taped.since)/1000)}:null,adrenaline:Math.max(0,(p.adrenalineUntil-now)/1000),hold:p.hold?{kind:p.hold.kind,target:p.hold.target,progress:Math.min(1,(now-p.hold.start)/p.hold.duration)}:null,x:p.x,y:p.y,z:p.z,vy:p.vy,stun:p.stun};
  if(p.role==='specimen')Object.assign(me,{stage:p.stage,mutations:p.mutations,offer:p.offer?{slot:p.offer,ids:this.offers[p.offer]}:null,lunge:Math.max(0,this.lungeCooldown(p)-(now-p.lastLunge)/1000),lungeMax:this.lungeCooldown(p),smash:Math.max(0,SPECIMEN.smashCooldown-(now-p.lastSmash)/1000),sprint:Math.max(0,10-(now-p.lastSprint)/1000),pulse:Math.max(0,12-(now-p.lastPulse)/1000),mistCd:Math.max(0,20-(now-p.lastMist)/1000),inVent:p.inVent,vent:p.vent,solved:p.solved,safePuzzle:this.safePuzzle,sweeper:publicSweeper(this.seed),canVent:this.canVent(p)});
  if(p.role==='saboteur')me.sabotage=Math.max(0,SAB_COOLDOWN-(now-p.lastSabotage)/1000);
  if(nearStation(p,SCIF_DESK,2.6))me.scif={log:this.log.slice(-8),lines:[...this.players.values()].filter(q=>!q.bot&&q.id!==p.id&&q.state!=='spectator').map(q=>q.line).sort((a,b)=>a-b),powered:this.cameraOpened&&this.tubes.powered};
  return me;
 }
 private broadcast(){
  const common=JSON.stringify(this.common()).slice(1);
  for(const conn of this.room.getConnections()){const p=this.players.get(conn.id);if(!p)continue;conn.send(`{"t":"state","me":${JSON.stringify(this.mine(p))},${common}`);}
 }
 private send(id:string,msg:any){this.room.getConnection(id)?.send(JSON.stringify(msg));}

 onConnect(conn:Party.Connection){
  const live=[...this.players.values()].filter(p=>!p.bot);
  if(live.length>=MAX_PLAYERS){conn.send(JSON.stringify({t:'full'}));conn.close();return;}
  const p=this.newPlayer(conn.id);
  if(this.phase!=='lobby')p.state='spectator';
  this.players.set(conn.id,p);
  if(!this.hostId||!this.players.has(this.hostId))this.hostId=conn.id;
  this.relayJobs.set(conn.id,createRelay(this.seed+':'+conn.id));
  conn.send(JSON.stringify({t:'hello',id:conn.id,line:p.line,callsign:p.callsign,relay:this.relayJobs.get(conn.id)}));
  this.onStart();this.broadcast();
 }
 onClose(conn:Party.Connection){
  const p=this.players.get(conn.id);
  if(p){
   const r=dropTool(this.tools,conn.id,p,this.cameraOpened);if(!r.ok){const item=this.tools.items.find(t=>t.holder===conn.id);if(item){item.holder=null;item.x=0;item.y=.14;item.z=2;item.floor=0;}}
   // A departing monster hands its body to the stalker so the match can still end properly.
   if(p.role==='specimen'&&this.phase==='shift'){const bot={...p,id:'ai-'+conn.id,bot:true,ai:{path:[],until:0,retreatUntil:0}};this.players.set(bot.id,bot as Player);}
  }
  this.players.delete(conn.id);this.toolPending.delete(conn.id);this.relayJobs.delete(conn.id);
  if(this.hostId===conn.id)this.hostId=[...this.players.values()].find(p=>!p.bot)?.id??null;
  if(![...this.players.values()].some(p=>!p.bot)){this.phase='lobby';this.resetMatch();}
  this.broadcast();
 }

 // ---------- match flow ----------
 private startBriefing(){
  this.resetMatch();
  const ids=[...this.players.values()].filter(p=>!p.bot&&p.state!=='spectator').map(p=>p.id);
  const roles=assignRoles(ids);
  const spawn=[[0,2],[-2,1],[2,1],[-1,3],[1,3],[0,.5],[-3,2.5],[3,2.5]];
  const lair=VENTS.find(v=>v.id==='core')!;
  ids.forEach((id,i)=>{const p=this.players.get(id)!;p.role=roles[id] as Role;p.state='ok';
   if(p.role==='specimen')Object.assign(p,{x:lair.x,z:lair.z,y:0,stillSince:Date.now()});
   else Object.assign(p,{x:spawn[i][0],z:spawn[i][1],y:0});});
  if(roleCounts(ids.length).aiSpecimen){
   const bot={...this.newPlayer('ai-stalker'),bot:true,role:'specimen' as Role,line:0,callsign:'STALKER',x:lair.x,z:lair.z,ai:{path:[],until:0,retreatUntil:Date.now()+(BRIEFING_SECONDS+35)*1000}};
   this.players.set(bot.id,bot);
  }
  this.phase='briefing';this.phaseEnds=Date.now()+BRIEFING_SECONDS*1000;
 }
 private finish(kind:string){
  if(this.outcome)return;
  const roles=Object.fromEntries([...this.players.values()].map(p=>[p.id,{role:p.role}]));
  this.outcome={kind,winners:winners(kind,roles)};this.phase='over';
 }

 tick(){
  const now=Date.now(),dt=1/TICK_HZ;
  if(this.phase==='briefing'&&now>=this.phaseEnds){this.phase='shift';this.event('SHIFT STARTED / 8 MINUTES TO LOCKDOWN');}
  if(this.phase==='shift')this.simulate(now,dt);
  this.broadcast();
  if(![...this.players.values()].some(p=>!p.bot)&&this.timer){clearInterval(this.timer);this.timer=null;}
 }

 private simulate(now:number,dt:number){
  for(const p of this.players.values())this.body(p,now,dt);
  for(const [id,pending] of this.toolPending){const p=this.players.get(id),job=TOOL_JOBS.find(j=>j.id===pending.job);if(!p||!job||!withinToolReach(p,job,this.cameraOpened))this.toolPending.delete(id);}
  this.tLeft=Math.max(0,this.tLeft-dt);
  this.temp=Math.min(100,this.temp+DRIFT_PER_SEC*(now<this.valveUntil?3:1)*dt);
  this.pressure=Math.max(20,this.pressure-.03*dt);
  this.blackoutSeconds=Math.max(0,this.blackoutSeconds-dt);
  if(this.temp>=85&&now>this.surgeUntil+30000){this.surgeUntil=now+4500;this.event('REACTOR SURGE / STEAM IN EVERY DUCT');}
  this.clusterSeconds=this.largestCluster()>=3?this.clusterSeconds+dt:0;
  this.directorClock+=dt;
  if(this.directorClock>=18&&!this.directorBusy){this.directorClock=0;void this.runDirector();}
  const op=this.coolantOperator?this.players.get(this.coolantOperator):null;
  if(updateCoolant(this.coolant,dt,!!op&&atCoolantStation(op))){this.temp=Math.max(0,this.temp-8);this.pressure=Math.max(20,this.pressure-6);this.event('LOWER BASIN: COOLANT FLUSH / CORE -8');if(op)op.stats.tasks++;}
  for(const r of this.radioQueue.filter(r=>now>=r.deliver)){const to=[...this.players.values()].find(p=>p.line===r.to&&!p.bot);if(to)this.send(to.id,{t:'radio',text:r.text});}
  this.radioQueue=this.radioQueue.filter(r=>now<r.deliver);
  const humans=[...this.players.values()].filter(humanRole);
  if(this.temp>=100||this.pressure>=100)this.finish('meltdown');
  else if(humans.length&&humans.every(p=>p.state==='dead'))this.finish('massacre');
  else if(this.tLeft<=0)this.finish('lockdown');
 }

 private body(p:Player,now:number,dt:number){
  if(p.state==='dead'||p.state==='escaped'||p.state==='spectator')return;
  if(p.inVent){if(p.vent&&now>=p.vent.arrive){const v=VENTS.find(v=>v.id===p.vent!.to)!;Object.assign(p,{x:v.x,z:v.z,y:0,vy:0,fallStart:0,inVent:false,vent:null,stillSince:now});this.ventNoise(v.id);}return;}
  if(p.bot)this.drive(p,now,dt);
  if(p.state==='hanging'&&p.hang){
   p.hang.score-=HANG.drain[2-p.hang.hands]*dt;
   if(p.hang.score<50&&p.hang.hands===2){p.hang.hands=1;this.send(p.id,{t:'cue',kind:'slip'});}
   if(p.hang.score<=0)this.release(p,now);
  }else if(p.state==='taped'&&p.taped){
   if((now-p.taped.since)/1000>=TAPE.autoFree)this.untape(p,now,true);
  }else{
   const grab=p.role!=='specimen'&&now>p.noGrabUntil;
   const before=p.y;
   const next=moveWithCollisions(p,0,0,this.solids(),undefined,dt,grab);
   Object.assign(p,{x:next.x,y:next.y,z:next.z,vy:next.vy,fallStart:next.fallStart,stun:next.stun});
   if(next.ledge)this.hangOn(p,next.ledge);
   if(before>p.y+.001&&p.vy===0&&p.y<=-LETHAL_DROP)this.landed(p,now);
  }
  if(p.hold)this.advanceHold(p,now);
 }
 private landed(p:Player,now:number){
  // Bottom of a shaft. People die; the specimen climbs back out through the nearest grate.
  if(p.role==='specimen'){const v=VENTS.reduce((b,v)=>Math.hypot(v.x-p.x,v.z-p.z)<Math.hypot(b.x-p.x,b.z-p.z)?v:b);p.inVent=true;p.vent={to:v.id,arrive:now+2500};return;}
  p.state='dead';p.stats.falls++;this.event('A SCREAM IN THE SHAFT / SOMEONE IS GONE');
  const item=this.tools.items.find(t=>t.holder===p.id);if(item){item.holder=null;item.spent=true;}
 }
 private hangOn(p:Player,ledge:{x:number;z:number}){
  p.state='hanging';p.hang={score:100,hands:2,dirX:ledge.x,dirZ:ledge.z};p.hold=null;this.toolPending.delete(p.id);
  this.event('SOMEONE WENT OVER THE RAIL');this.send(p.id,{t:'cue',kind:'grab'});
 }
 private release(p:Player,now:number){
  if(!p.hang)return;const {dirX,dirZ}=p.hang;
  p.state='ok';p.hang=null;p.noGrabUntil=now+4000;p.x+=dirX*.6;p.z+=dirZ*.6;p.vy=0;p.fallStart=p.y;
  this.send(p.id,{t:'cue',kind:'fall'});
 }
 private untape(p:Player,now:number,adrenaline:boolean){p.state='ok';p.taped=null;if(adrenaline){p.adrenalineUntil=now+TAPE.adrenaline*1000;this.event('TAPE SNAPS / SOMEONE IS RUNNING');}}

 // Holds: every channelled action (help up, tape, sabotage, repair, monster work) runs through here.
 private holdSpec(p:Player,kind:string,target:string):{duration:number;ok:boolean;why?:string}{
  const t=this.players.get(target);
  const near=(q:{x:number;z:number;y?:number},r:number)=>Math.abs((q.y??0)-p.y)<.9&&Math.hypot(q.x-p.x,q.z-p.z)<=r;
  if(p.state!=='ok'||p.inVent)return {duration:0,ok:false};
  switch(kind){
   case 'help':return {duration:HANG.helpHold,ok:!!t&&humanRole(p)&&t.state==='hanging'&&near(t,1.9)};
   case 'tape':return {duration:TAPE.hold,ok:!!t&&humanRole(p)&&t.state==='ok'&&humanRole(t)&&t.id!==p.id&&near(t,TAPE.range)};
   case 'cut':return {duration:TAPE.cutHold,ok:!!t&&humanRole(p)&&t.state==='taped'&&near(t,TAPE.range)};
   case 'sab':{const s=SABOTAGE.find(s=>s.id===target);if(!s||p.role!=='saboteur'||!near(s,1.6))return {duration:0,ok:false};
    if(Date.now()-p.lastSabotage<SAB_COOLDOWN*1000)return {duration:0,ok:false,why:'YOUR HANDS ARE SHAKING / WAIT'};
    if(s.camera&&this.cutCameras.has(s.camera))return {duration:0,ok:false,why:'ALREADY CUT'};return {duration:s.hold,ok:true};}
   case 'fix':{const s=SABOTAGE.find(s=>s.id===target);if(!s||!humanRole(p)||!near(s,1.6)||!s.fixHold)return {duration:0,ok:false};
    const broken=s.id==='valve'?Date.now()<this.valveUntil:s.id==='breaker'?this.blackoutSeconds>0:!!s.camera&&this.cutCameras.has(s.camera);return {duration:s.fixHold,ok:broken,why:broken?undefined:'NOTHING TO FIX'};}
   case 'smash':return {duration:SPECIMEN.smashHold,ok:p.role==='specimen'&&near(REACTOR_SMASH,1.8)&&Date.now()-p.lastSmash>SPECIMEN.smashCooldown*1000};
   case 'escape':return {duration:this.mut(p,'crusher')?3000:SPECIMEN.escapeHold,ok:p.role==='specimen'&&p.stage>=3&&near(LIFT_DOOR,3.2),why:p.stage<3?'THE DOOR WILL NOT MOVE / OPEN ALL THREE SAFES':undefined};
   case 'vent':{const v=nearVent(p);return {duration:SPECIMEN.ventEnterHold,ok:p.role==='specimen'&&!!v&&this.canVent(p),why:v&&!this.canVent(p)?'TOO BIG FOR THE DUCT':undefined};}
   case 'pry':return {duration:4000,ok:p.role==='specimen'&&this.mut(p,'crusher')&&((!this.cameraOpened&&near(CAMERA_PANEL,2.2))||(this.sealed&&(near({x:15.4,z:-2.5},2.2)||near({x:-15.4,z:-10.5},2.2))))};
  }
  return {duration:0,ok:false};
 }
 private advanceHold(p:Player,now:number){
  const h=p.hold!;const spec=this.holdSpec(p,h.kind,h.target);
  if(!spec.ok){p.hold=null;return;}
  // Two pairs of hands, same target, both holding.
  if(h.kind==='tape'&&[...this.players.values()].filter(q=>q.hold?.kind==='tape'&&q.hold.target===h.target).length<2){h.start=now;return;}
  if(now-h.start<h.duration)return;
  p.hold=null;this.complete(p,h,now);
 }
 private complete(p:Player,h:Hold,now:number){
  const t=this.players.get(h.target);
  if(h.kind==='help'&&t?.hang){const {dirX,dirZ}=t.hang;t.state='ok';t.hang=null;t.x-=dirX*.7;t.z-=dirZ*.7;t.noGrabUntil=now+1500;p.stats.rescues++;this.event('PULLED BACK OVER THE LIP');}
  if(h.kind==='tape'&&t){for(const q of this.players.values())if(q.hold?.kind==='tape'&&q.hold.target===t.id)q.hold=null;t.state='taped';t.taped={since:now,hits:0};t.hold=null;this.event('SOMEONE IS TAPED TO A PIPE');}
  if(h.kind==='cut'&&t?.taped){this.untape(t,now,false);p.stats.rescues++;}
  if(h.kind==='sab'){const s=SABOTAGE.find(s=>s.id===h.target)!;p.lastSabotage=now;p.stats.sabotage++;
   if(s.id==='valve')this.valveUntil=now+s.lasts*1000;
   if(s.id==='breaker'){this.blackoutSeconds=s.lasts;this.event('SUBSTATION / MAIN BREAKER OPEN');}
   if(s.id==='doors'){this.sealedUntil=now+s.lasts*1000;this.event('BLAST DOORS / BOTH TUNNELS SEALED');}
   if(s.camera){this.cutCameras.add(s.camera);this.logLine(`CAM ${CAMERAS.find(c=>c.id===s.camera)!.label.slice(0,2)} / SIGNAL LOST`);}
   this.witness(s);
  }
  if(h.kind==='fix'){const s=SABOTAGE.find(s=>s.id===h.target)!;p.stats.tasks++;
   if(s.id==='valve'){this.valveUntil=0;this.event('PUMP ROOM / VALVE RESET');}
   if(s.id==='breaker'){this.blackoutSeconds=0;this.event('SUBSTATION / POWER RESTORED');}
   if(s.camera){this.cutCameras.delete(s.camera);this.logLine(`CAM ${CAMERAS.find(c=>c.id===s.camera)!.label.slice(0,2)} / SIGNAL RESTORED`);}
  }
  if(h.kind==='smash'){p.lastSmash=now;this.temp=Math.max(0,this.temp-12);p.revealUntil=now+2500;this.event('SOMETHING TORE OPEN THE COOLANT BYPASS / CORE -12');}
  if(h.kind==='escape'){p.state='escaped';this.finish('escape');}
  if(h.kind==='vent'){const v=nearVent(p)!;p.inVent=true;p.vent=null;Object.assign(p,{x:v.x,z:v.z});this.ventNoise(v.id);this.send(p.id,{t:'ventOpen',from:v.id});}
  if(h.kind==='pry'){if(!this.cameraOpened&&nearStation(p,CAMERA_PANEL,2.2))this.cameraOpened=true;else this.sealedUntil=0;p.revealUntil=now+2000;this.event('METAL SHRIEKS / A DOOR WAS TORN OPEN');}
 }
 // A camera that is powered, uncut and in the same space records the tampering.
 private witness(s:{x:number;z:number;label:string}){
  const space=roomAt(s.x,s.z)?.name;
  const cam=CAMERAS.find(c=>!this.cutCameras.has(c.id)&&this.blackoutSeconds<=0&&roomAt(c.mount[0],c.mount[2])?.name===space&&Math.hypot(c.mount[0]-s.x,c.mount[2]-s.z)<16);
  if(cam)this.logLine(`CAM ${cam.label.slice(0,2)} / FIGURE AT ${s.label}`);
 }
 private logLine(text:string){this.log.push({at:clock(SHIFT_SECONDS-this.tLeft),text});if(this.log.length>40)this.log.shift();}
 private ventNoise(id:string){const v=VENTS.find(v=>v.id===id)!;for(const q of this.players.values())if(!q.bot&&q.role!=='specimen'&&Math.hypot(q.x-v.x,q.z-v.z)<14)this.send(q.id,{t:'cue',kind:'vent',x:v.x,z:v.z});}

 private lunge(p:Player,dx:number,dz:number,now:number){
  const l=Math.hypot(dx,dz);if(!(l>.01)||p.state!=='ok'||p.inVent)return;
  if((now-p.lastLunge)/1000<this.lungeCooldown(p))return;
  const dir={x:dx/l,z:dz/l},range=this.mut(p,'mantis')?2.7:SPECIMEN.lungeRange;
  const target=[...this.players.values()].filter(q=>humanRole(q)&&(q.state==='ok'||q.state==='hanging'||q.state==='taped')&&Math.abs(q.y-p.y)<1.2&&Math.hypot(q.x-p.x,q.z-p.z)<range&&((q.x-p.x)*dir.x+(q.z-p.z)*dir.z)>.15).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  p.lastLunge=now;p.stats.lunges++;p.revealUntil=now+(SPECIMEN.revealOnLunge+(this.mut(p,'mantis')||this.mut(p,'veil')?1:0))*1000;
  if(!target){this.event('SOMETHING LUNGED AT NOTHING');return;}
  if(target.state==='hanging'&&target.hang){target.hang.score-=HANG.lungePenalty;this.send(target.id,{t:'cue',kind:'hit'});return;}
  if(target.state==='taped')this.untape(target,now,false);
  target.hold=null;this.toolPending.delete(target.id);
  const next=moveWithCollisions(target,dir.x*SPECIMEN.lungeKnock,dir.z*SPECIMEN.lungeKnock,this.solids(),undefined,.1,now>target.noGrabUntil);
  Object.assign(target,{x:next.x,y:next.y,z:next.z,vy:next.vy,fallStart:next.fallStart});
  if(next.ledge)this.hangOn(target,next.ledge);else target.stun=SPECIMEN.lungeStun;
  this.send(target.id,{t:'cue',kind:'hit'});this.event('SOMETHING THREW SOMEONE');
 }

 // Solo stalker: patrols, hunts the nearest engineer it can reach, lunges, then backs off.
 private drive(p:Player,now:number,dt:number){
  const ai=p.ai!;if(p.inVent||p.state!=='ok')return;
  p.stage=Math.min(3,Math.floor((SHIFT_SECONDS-this.tLeft)/140));
  const prey=[...this.players.values()].filter(q=>humanRole(q)&&(q.state==='ok'||q.state==='hanging')&&Math.abs(q.y-p.y)<1.5).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const dist=prey?Math.hypot(prey.x-p.x,prey.z-p.z):Infinity;
  const hunting=now>ai.retreatUntil&&!!prey&&(dist<9||(dist<20&&roomAt(prey.x,prey.z)?.name===roomAt(p.x,p.z)?.name));
  let goal:{x:number;z:number}|null=null;
  if(hunting){
   if(dist<SPECIMEN.lungeRange-.2&&(now-p.lastLunge)/1000>=this.lungeCooldown(p)){this.lunge(p,prey!.x-p.x,prey!.z-p.z,now);ai.retreatUntil=now+9000;ai.path=[];return;}
   if(dist<6)goal={x:prey!.x,z:prey!.z};
   else if(now>ai.until){ai.path=navPath(p,prey!).slice(1);ai.until=now+1500;}
  }else if(!ai.path.length||now>ai.until){
   // Now and then it slips into the ducts instead of walking.
   const v=nearVent(p,2);if(v&&Math.random()<.35){const to=VENTS[Math.floor(Math.random()*VENTS.length)];p.inVent=true;p.vent={to:to.id,arrive:now+ventTravel(v,to)*1000};this.ventNoise(v.id);return;}
   const [x,z]=NAV[PATROL[Math.floor(Math.random()*PATROL.length)] as keyof typeof NAV];
   ai.path=navPath(p,{x,z}).slice(1);ai.until=now+25000;
  }
  if(!goal&&ai.path.length){goal=ai.path[0];if(Math.hypot(goal.x-p.x,goal.z-p.z)<.4){ai.path.shift();goal=ai.path[0]??null;}}
  if(!goal)return;
  const dx=goal.x-p.x,dz=goal.z-p.z,l=Math.hypot(dx,dz);if(l<.05)return;
  const step=Math.min(l,this.speedOf(p)*dt);
  const next=moveWithCollisions(p,dx/l*step,dz/l*step,this.solids(),undefined,0,false);
  if(Math.hypot(next.x-p.x,next.z-p.z)>.005){p.stillSince=now;p.yaw=Math.atan2(-dx,-dz);}
  Object.assign(p,{x:next.x,y:next.y,z:next.z,vy:next.vy,fallStart:next.fallStart});
 }

 private largestCluster(){
  const all=[...this.players.values()].filter(p=>humanRole(p)&&p.state!=='dead');
  return all.reduce((n,c)=>Math.max(n,all.filter(p=>Math.hypot(p.x-c.x,p.y-c.y,p.z-c.z)<=2.5).length),0);
 }
 private async runDirector(){
  this.directorBusy=true;
  try{
   const {action}=await chooseDirectorAction({temp:this.temp,pressure:this.pressure,secondsLeft:this.tLeft,playerCount:this.players.size,largestCluster:this.clusterSeconds>=10?this.largestCluster():0},this.room.env.OPENAI_API_KEY);
   if(this.phase==='shift')this.applyDirectorAction(action);
  }finally{this.directorBusy=false;}
 }
 private applyDirectorAction(action:DirectorAction){
  if(action==='blow_valve'){this.temp=Math.min(100,this.temp+4);this.event('MAINFRAME-86: COOLANT VALVE FAILURE');}
  if(action==='trip_breaker'){this.blackoutSeconds=8;this.event('MAINFRAME-86: SUBSTATION BREAKER TRIPPED');}
  if(action==='vent_steam'){this.pressure=Math.min(100,this.pressure+10);this.surgeUntil=Date.now()+3000;this.event('MAINFRAME-86: STEAM BYPASS OPEN');}
  if(action==='coolant_flush'){this.temp=Math.max(0,this.temp-5);this.event('MAINFRAME-86: EMERGENCY COOLANT FLUSH');}
 }

 onMessage(raw:string,sender:Party.Connection){
  let m:any;try{m=JSON.parse(raw);}catch{return;}
  const p=this.players.get(sender.id);if(!p)return;
  const now=Date.now();
  if(m.t==='ready'&&this.phase==='lobby'){p.ready=!p.ready;this.broadcast();return;}
  if(m.t==='start'&&this.phase==='lobby'&&sender.id===this.hostId){this.startBriefing();this.broadcast();return;}
  if(m.t==='again'&&this.phase==='over'&&sender.id===this.hostId){this.phase='lobby';this.resetMatch();this.broadcast();return;}
  if(this.phase!=='shift')return;
  if(p.state==='dead'||p.state==='escaped'||p.state==='spectator'){if(m.t==='pos'&&Number.isFinite(m.x)&&Number.isFinite(m.z)){p.x=m.x;p.z=m.z;p.y=Number.isFinite(m.y)?m.y:p.y;}return;}
  if(m.t==='pos'){
   if(p.state!=='ok'||p.inVent||p.stun>0){p.lastMove=now;return;}
   const x=Number(m.x),z=Number(m.z);if(!Number.isFinite(x)||!Number.isFinite(z))return;
   if(Number.isFinite(m.yaw))p.yaw=m.yaw;
   const elapsed=Math.min(.25,Math.max(0,(now-p.lastMove)/1000));
   const max=this.speedOf(p)*elapsed+.15,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),f=d>max?max/d:1;
   const next=moveWithCollisions(p,dx*f,dz*f,this.solids(),undefined,0,p.role!=='specimen'&&now>p.noGrabUntil);
   const moved=Math.hypot(next.x-p.x,next.z-p.z);
   if(moved>.02)p.stillSince=now;
   Object.assign(p,{x:next.x,y:next.y,z:next.z,vy:next.vy,fallStart:next.fallStart});p.lastMove=now;
   if(next.ledge)this.hangOn(p,next.ledge);
   if(p.hold&&moved>.3)p.hold=null;
   return;
  }
  if(m.t==='hold'){const spec=this.holdSpec(p,String(m.kind),String(m.target??''));if(spec.ok)p.hold={kind:String(m.kind),target:String(m.target??''),start:now,duration:spec.duration};else if(spec.why)this.send(p.id,{t:'note',text:spec.why});return;}
  if(m.t==='release'){p.hold=null;return;}
  if(m.t==='beat'&&p.state==='hanging'&&p.hang){p.hang.score=Math.min(100,p.hang.score+(m.hit?HANG.hit[2-p.hang.hands]:-HANG.miss));if(p.hang.score<=0)this.release(p,now);return;}
  if(m.t==='break'&&p.state==='taped'&&p.taped){if(m.hit){p.taped.hits++;if(p.taped.hits>=TAPE.breakHits)this.untape(p,now,true);}else p.taped.hits=Math.max(0,p.taped.hits-1);return;}
  if(m.t==='ventExit'&&p.role==='specimen'&&p.inVent&&!p.vent){const from=VENTS.reduce((b,v)=>Math.hypot(v.x-p.x,v.z-p.z)<Math.hypot(b.x-p.x,b.z-p.z)?v:b),to=VENTS.find(v=>v.id===m.id);if(to){p.vent={to:to.id,arrive:now+ventTravel(from,to)*(this.mut(p,'tentacles')?600:1000)};this.ventNoise(from.id);}return;}
  if(p.state!=='ok'||p.inVent)return;
  if(m.t==='lunge'&&p.role==='specimen'){this.lunge(p,Number(m.dx),Number(m.dz),now);return;}
  if(m.t==='sprint'&&p.role==='specimen'&&this.mut(p,'leaper')&&now-p.lastSprint>10000){p.lastSprint=now;return;}
  if(m.t==='pulse'&&p.role==='specimen'&&this.mut(p,'echo')&&now-p.lastPulse>12000){p.lastPulse=now;for(const q of this.players.values())if(humanRole(q)&&Math.hypot(q.x-p.x,q.z-p.z)<20)this.send(q.id,{t:'cue',kind:'pulse'});this.send(p.id,{t:'pulse',until:now+2000});return;}
  if(m.t==='mist'&&p.role==='specimen'&&this.mut(p,'sacs')&&now-p.lastMist>20000){p.lastMist=now;this.mistAt={x:p.x,z:p.z,until:now+5000};return;}
  if(m.t==='mutate'&&p.role==='specimen'&&p.offer&&this.offers[p.offer]?.includes(m.id)){p.mutations[p.offer]=m.id;p.offer=null;this.send(p.id,{t:'note',text:PARTS.find(x=>x.id===m.id)!.name+' GRAFTED'});return;}
  if(m.t==='safeSolve'&&p.role==='specimen'){
   const id=String(m.safe);
   if(p.solved.includes(id)||!nearSafe(p,id)){this.send(p.id,{t:'safeResult',safe:id,ok:false,reason:'Stand at the safe.'});return;}
   const result:any=id==='chess'?tryMate(this.safePuzzle,String(m.from),String(m.to)):id==='sweeper'?checkSweeper(this.seed,m.cells):checkScope(this.seed,m.guess);
   if(result.ok){p.solved.push(id);p.stage++;p.offer=MUTATION_ORDER[p.stage-1]??null;this.event(`CONTAINMENT: ${SAFES.find(s=>s.id===id)!.name} OPENED`);}
   this.send(p.id,{t:'safeResult',safe:id,ok:result.ok,reason:result.reason});return;
  }
  if(m.t==='shove'&&humanRole(p)){
   const dx=Number(m.dx),dz=Number(m.dz),l=Math.hypot(dx,dz);
   if(!Number.isFinite(l)||l<.01||now-p.lastShove<4000||p.stun>0)return;
   const dir={x:dx/l,z:dz/l};p.lastShove=now;p.stats.shoves++;
   const target=[...this.players.values()].filter(q=>q.id!==p.id&&(q.state==='ok'||q.state==='hanging')&&!q.inVent&&Math.abs(q.y-p.y)<.8&&Math.hypot(q.x-p.x,q.z-p.z)<1.7&&((q.x-p.x)*dir.x+(q.z-p.z)*dir.z)>.2).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
   this.event('A SHOVE / FOOTSTEPS SCUFF ON CONCRETE');
   if(!target)return;
   if(target.state==='hanging'&&target.hang){target.hang.score-=HANG.shovePenalty;this.send(target.id,{t:'cue',kind:'hit'});return;}
   if(target.role==='specimen'&&this.mut(target,'plates'))return;
   target.hold=null;this.toolPending.delete(target.id);
   const next=moveWithCollisions(target,dir.x*1.6,dir.z*1.6,this.solids(),undefined,.1,target.role!=='specimen'&&now>target.noGrabUntil);
   Object.assign(target,{x:next.x,y:next.y,z:next.z,vy:next.vy,fallStart:next.fallStart});
   if(next.ledge)this.hangOn(target,next.ledge);
   this.send(target.id,{t:'cue',kind:'shoved'});return;
  }
  if(m.t==='radio'&&humanRole(p)){
   if(!nearStation(p,SCIF_DESK,2.6)||!this.cameraOpened||!this.tubes.powered||now-p.lastRadio<2500)return;
   const text=String(m.text||'').toUpperCase().replace(/[^A-Z0-9 /.,!?'-]/g,'').slice(0,60);if(!text)return;
   p.lastRadio=now;this.radioQueue.push({to:Number(m.line),text,deliver:now+RADIO_DELAY});this.send(p.id,{t:'note',text:`TAPE ROLLING / LINE ${m.line} HEARS THIS IN 10 SECONDS`});return;
  }
  if(p.role==='specimen')return;
  // Engineering tasks: crew and saboteur look identical doing them.
  if(['toolPick','toolDrop','toolBegin','toolFinish','toolCancel','ropeClimb'].includes(m.t)){
   let result:any={ok:false,message:'INVALID TOOL ACTION'};
   if(m.t==='toolCancel'){this.toolPending.delete(sender.id);return;}
   if(m.t==='toolPick')result=pickTool(this.tools,sender.id,p,m.id,now,this.cameraOpened);
   if(m.t==='toolDrop'){this.toolPending.delete(sender.id);result=dropTool(this.tools,sender.id,p,this.cameraOpened);}
   if(m.t==='toolBegin'){result=beginToolJob(this.tools,sender.id,p,m.id,now,this.cameraOpened);if(result.ok){this.toolPending.set(sender.id,result);result={...result,pending:result};}}
   if(m.t==='toolFinish'){result=finishToolJob(this.tools,sender.id,p,this.toolPending.get(sender.id),now,this.cameraOpened);this.toolPending.delete(sender.id);result.finished=true;if(result.completed&&result.kind==='leak'){this.pressure=Math.max(0,this.pressure-4);p.stats.tasks++;}}
   if(m.t==='ropeClimb'){const dest=ropeDestination(this.tools,p,m.id);if(dest){Object.assign(p,dest,{vy:0,stun:0,fallStart:dest.y});result={ok:true,message:'CLIMBED RESCUE ROPE'};}}
   this.send(sender.id,{t:'toolResult',...result});return;
  }
  if(m.t==='cameraPin'){
   if(!nearStation(p,CAMERA_PANEL)||now-p.lastPin<1500)return;p.lastPin=now;
   if(String(m.pin)===accessPuzzle(this.seed).pin&&!this.cameraOpened){this.cameraOpened=true;p.stats.tasks++;}
   this.send(sender.id,{t:'cameraResult',reason:this.cameraOpened?'ACCESS GRANTED / DOOR RELEASED':'WRONG ORDER / CHECK THE CLUES'});return;
  }
  if(m.t==='feedFilter'){if(!nearStation(p,INCINERATOR))return;const r=feedFilter(this.coolant,now);if(r.ok)p.stats.tasks++;this.send(sender.id,{t:'burnResult',reason:r.reason});return;}
  if(m.t==='tubeTurn'){if(this.cameraOpened&&nearStation(p,TUBE_RACK))turnTube(this.tubes,m.index,m.value);return;}
  if(m.t==='climb'){if(p.y<-1&&nearStation(p,SERVICE_LADDER,1.6))Object.assign(p,{x:17.9,y:0,z:-11.6,vy:0,fallStart:0,stun:0});return;}
  if(m.t==='coolantSet'){if(atCoolantStation(p)&&setCoolant(this.coolant,m.intake,m.bypass))this.coolantOperator=sender.id;return;}
  if(m.t==='relayOpen'||m.t==='relayAction'){
   if(Math.abs(p.y)>.8||Math.hypot(p.x-CONSOLE_POSITION.x,p.z-CONSOLE_POSITION.z)>ACTION_RANGE)return;
   const relay=this.relayJobs.get(sender.id)??createRelay(this.seed+':'+sender.id);this.relayJobs.set(sender.id,relay);
   refreshRelay(relay,now);let ok=true;
   if(m.t==='relayAction'){
    const result=relayAction(relay,m.action,now);ok=result.ok;
    if(result.completed){
     const delta=p.role==='saboteur'?5:-6;this.temp=Math.max(0,Math.min(100,this.temp+delta));p.stats.tasks++;
     // The console screen shows the last cycle's effect to anyone who looks.
     this.lastConsoleCycle={delta,at:now};this.event('REACTOR: SERVICE CYCLE COMPLETED');
    }
   }
   this.send(sender.id,{t:m.t==='relayAction'?'relayResult':'relayState',relay,ok});
  }
 }
}
