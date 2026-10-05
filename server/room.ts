import {createToolState,pickTool,dropTool,beginToolJob,finishToolJob,ropeDestination,TOOL_JOBS,withinToolReach} from '../shared/tool-system.js';
import {createRelay,refreshRelay,relayAction} from '../shared/relay-task.js';
import {CAMERA_PANEL,INCINERATOR,SERVICE_LADDER,nearStation,accessPuzzle,publicAccessPuzzle,feedFilter} from '../shared/facility.js';
import {createTubes,turnTube,TUBE_RACK} from '../shared/tubes.js';
import {createCoolantState,atCoolantStation,setCoolant,updateCoolant} from '../shared/coolant.js';
import { SAFE_POSITION, SAFE_RANGE, puzzleForRoom, tryMate } from '../shared/chess-safe.js';
import { moveWithCollisions,solidsForState } from '../shared/world.js';
import type * as Party from 'partykit/server';
import {
  ACTION_RANGE, CONSOLE_POSITION, DRIFT_PER_SEC,
  MOVE_SPEED, SHIFT_SECONDS, START_TEMP, TICK_HZ
} from '../shared/constants.js';
import { chooseDirectorAction, type DirectorAction } from './director.js';

type Role = 'crew' | 'saboteur';
interface Player { y: number; x: number; z: number; role: Role; vy:number;fallStart:number;stun:number;lastShove:number;lastPin:number;lastMove: number; lastAction: number }

export default class Room implements Party.Server {
  tLeft = SHIFT_SECONDS;
  temp = START_TEMP;
  pressure = 20;
  players = new Map<string, Player>();
  timer: ReturnType<typeof setInterval> | null = null;
  outcome: 'meltdown' | 'lockdown' | null = null;
  directorClock = 0;
  directorBusy = false;
  clusterSeconds = 0;
  blackoutSeconds = 0;
  lastEvent = '';
  coolant=createCoolantState();
  coolantOperator:string|null=null;
  cameraOpened=false;
  tubes=createTubes();
  tools=createToolState();
  toolPending=new Map<string,any>();
  relayJobs=new Map<string,ReturnType<typeof createRelay>>();
  safeOpened=false;
  safePuzzle:string;

  constructor(readonly room: Party.Room) {this.safePuzzle=puzzleForRoom(room.id);this.coolant=createCoolantState(room.id);this.tubes=createTubes(room.id);}

  onStart() {
    if (!this.timer && !this.outcome) this.timer = setInterval(() => this.tick(), 1000 / TICK_HZ);
  }

  private snapshot() {
    return {
      t: 'state',tools:this.tools, cameraOpened:this.cameraOpened,cameraPuzzle:publicAccessPuzzle(this.room.id),tubes:this.tubes,coolant:this.coolant,safeOpened:this.safeOpened,safePuzzle:this.safePuzzle,tLeft: this.tLeft, temp: this.temp,
      players: [...this.players].map(([id, p]) => ({ id, x: p.x, y: p.y, vy:p.vy,stun:p.stun,z: p.z })),
      outcome: this.outcome, pressure: this.pressure,
      blackout: this.blackoutSeconds > 0, event: this.lastEvent
    };
  }

  private broadcast() { this.room.broadcast(JSON.stringify(this.snapshot())); }

  tick() {
    if (this.outcome) return;
    for(const p of this.players.values())Object.assign(p,moveWithCollisions(p,0,0,solidsForState(this.cameraOpened),undefined,1/TICK_HZ));
    for(const [id,pending] of this.toolPending){const p=this.players.get(id),job=TOOL_JOBS.find(j=>j.id===pending.job);if(!p||!job||!withinToolReach(p,job,this.cameraOpened))this.toolPending.delete(id);}
    this.tLeft = Math.max(0, this.tLeft - 1 / TICK_HZ);
    this.temp = Math.min(100, this.temp + DRIFT_PER_SEC / TICK_HZ);
    this.pressure = Math.max(20, this.pressure - 0.03 / TICK_HZ);
    this.blackoutSeconds = Math.max(0, this.blackoutSeconds - 1 / TICK_HZ);
    this.clusterSeconds = this.largestCluster() >= 3 ? this.clusterSeconds + 1 / TICK_HZ : 0;
    this.directorClock += 1 / TICK_HZ;
    if (this.directorClock >= 18 && !this.directorBusy && this.players.size > 0) {
      this.directorClock = 0;
      void this.runDirector();
    }
    if (this.temp >= 100 || this.pressure >= 100) this.outcome = 'meltdown';
    else if (this.tLeft <= 0) this.outcome = 'lockdown';
    if(!this.outcome){
      const operator=this.coolantOperator?this.players.get(this.coolantOperator):null;
      if(updateCoolant(this.coolant,1/TICK_HZ,!!operator&&atCoolantStation(operator))){this.temp=Math.max(0,this.temp-8);this.pressure=Math.max(20,this.pressure-6);this.lastEvent='LOWER BASIN: COOLANT FLUSH / CORE -8';}
    }
    this.broadcast();
    if (this.outcome && this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private largestCluster(): number {
    const all = [...this.players.values()];
    return all.reduce((largest, center) => Math.max(largest,
      all.filter(p => Math.hypot(p.x - center.x, p.y-center.y, p.z - center.z) <= 2.5).length), 0);
  }

  private async runDirector() {
    this.directorBusy = true;
    try {
      const { action } = await chooseDirectorAction({
        temp: this.temp, pressure: this.pressure, secondsLeft: this.tLeft,
        playerCount: this.players.size,
        largestCluster: this.clusterSeconds >= 10 ? this.largestCluster() : 0
      }, this.room.env.OPENAI_API_KEY);
      if (this.outcome) return;
      this.applyDirectorAction(action);
      this.broadcast();
    } finally {
      this.directorBusy = false;
    }
  }

  private applyDirectorAction(action: DirectorAction) {
    if (action === 'blow_valve') { this.temp = Math.min(100, this.temp + 4); this.lastEvent = 'MAINFRAME-86: COOLANT VALVE FAILURE'; }
    if (action === 'trip_breaker') { this.blackoutSeconds = 8; this.lastEvent = 'MAINFRAME-86: SUBSTATION BREAKER TRIPPED'; }
    if (action === 'vent_steam') { this.pressure = Math.min(100, this.pressure + 10); this.lastEvent = 'MAINFRAME-86: STEAM BYPASS OPEN'; }
    if (action === 'coolant_flush') { this.temp = Math.max(0, this.temp - 5); this.lastEvent = 'MAINFRAME-86: EMERGENCY COOLANT FLUSH'; }
    if (this.temp >= 100 || this.pressure >= 100) this.outcome = 'meltdown';
  }

  onConnect(conn: Party.Connection) {
    const role: Role = this.players.size > 0 && ![...this.players.values()].some(p => p.role === 'saboteur') ? 'saboteur' : 'crew';
    this.players.set(conn.id, { x: 0, y: 0, z: 0, role,vy:0,fallStart:0,stun:0,lastShove:0,lastPin:0,lastMove: Date.now(), lastAction: 0 });
    const relay=createRelay(this.room.id+':'+conn.id);this.relayJobs.set(conn.id,relay);
    conn.send(JSON.stringify({ ...this.snapshot(), t: 'hello', id: conn.id, role,relay }));
    this.broadcast();
    this.onStart();
  }

  onMessage(msg: string, sender: Party.Connection) {
    let m: any;
    try { m = JSON.parse(msg); } catch { return; }
    const p = this.players.get(sender.id);
    if (!p || this.outcome) return;
    const now = Date.now();
    if (m.t === 'pos') {
      const x = Number(m.x), z = Number(m.z);
      if (!Number.isFinite(x) || !Number.isFinite(z)) return;
      const elapsed = Math.min(0.25, Math.max(0, (now - p.lastMove) / 1000));
      const maxDistance = MOVE_SPEED * elapsed + 0.15;
      const dx = x - p.x, dz = z - p.z;
      const distance = Math.hypot(dx, dz);
      const fraction = distance > maxDistance ? maxDistance / distance : 1;
      const next = moveWithCollisions(p, dx * fraction, dz * fraction,solidsForState(this.cameraOpened));
      Object.assign(p,next);
      p.lastMove = now;
    } else if(['toolPick','toolDrop','toolBegin','toolFinish','toolCancel','ropeClimb'].includes(m.t)){
      let result:any={ok:false,message:'INVALID TOOL ACTION'};
      if(m.t==='toolCancel'){this.toolPending.delete(sender.id);return;}
      if(m.t==='toolPick')result=pickTool(this.tools,sender.id,p,m.id,now,this.cameraOpened);
      if(m.t==='toolDrop'){this.toolPending.delete(sender.id);result=dropTool(this.tools,sender.id,p,this.cameraOpened);}
      if(m.t==='toolBegin'){result=beginToolJob(this.tools,sender.id,p,m.id,now,this.cameraOpened);if(result.ok){this.toolPending.set(sender.id,result);result={...result,pending:result};}}
      if(m.t==='toolFinish'){result=finishToolJob(this.tools,sender.id,p,this.toolPending.get(sender.id),now,this.cameraOpened);this.toolPending.delete(sender.id);result.finished=true;if(result.completed&&result.kind==='leak')this.pressure=Math.max(0,this.pressure-4);}
      if(m.t==='ropeClimb'){const dest=ropeDestination(this.tools,p,m.id);if(dest){Object.assign(p,dest,{vy:0,stun:0,fallStart:dest.y});result={ok:true,message:'CLIMBED RESCUE ROPE'};}}
      sender.send(JSON.stringify({t:'toolResult',...result}));this.broadcast();
    } else if(m.t==='shove'){
      const dx=Number(m.dx),dz=Number(m.dz),length=Math.hypot(dx,dz);
      if(!Number.isFinite(length)||length<.01||now-p.lastShove<4000||p.stun>0)return;
      const direction={x:dx/length,z:dz/length};
      const target=[...this.players.entries()].filter(([id,q])=>id!==sender.id&&Math.abs(q.y-p.y)<.8&&Math.hypot(q.x-p.x,q.z-p.z)<1.7&&((q.x-p.x)*direction.x+(q.z-p.z)*direction.z)>.2).sort((a,b)=>Math.hypot(a[1].x-p.x,a[1].z-p.z)-Math.hypot(b[1].x-p.x,b[1].z-p.z))[0]?.[1];
      p.lastShove=now;if(target){Object.assign(target,moveWithCollisions(target,direction.x*1.6,direction.z*1.6,solidsForState(this.cameraOpened)));this.lastEvent='A SHOVE / FOOTSTEPS SCUFF ON CONCRETE';this.broadcast();}
    } else if(m.t==='cameraPin'){
      if(!nearStation(p,CAMERA_PANEL)||now-p.lastPin<1500)return;p.lastPin=now;
      if(String(m.pin)===accessPuzzle(this.room.id).pin)this.cameraOpened=true;
      sender.send(JSON.stringify({t:'cameraResult',reason:this.cameraOpened?'ACCESS GRANTED / DOOR RELEASED':'WRONG ORDER / CHECK THE CLUES'}));this.broadcast();
    } else if(m.t==='feedFilter'){
      if(!nearStation(p,INCINERATOR))return;
      const result=feedFilter(this.coolant,now);sender.send(JSON.stringify({t:'burnResult',reason:result.reason}));this.broadcast();
    } else if(m.t==='tubeTurn'){
      if(this.cameraOpened&&nearStation(p,TUBE_RACK)&&turnTube(this.tubes,m.index,m.value))this.broadcast();
    } else if(m.t==='climb'){
      if(p.y< -1&&nearStation(p,SERVICE_LADDER,1.6)){Object.assign(p,{x:17.9,y:0,z:-11.6,vy:0,fallStart:0,stun:0});this.broadcast();}
    } else if(m.t==='coolantSet'){
      if(atCoolantStation(p)&&setCoolant(this.coolant,m.intake,m.bypass)){this.coolantOperator=sender.id;this.broadcast();}
    } else if(m.t==='safeSolve') {
      if(this.safeOpened){sender.send(JSON.stringify({t:'safeResult',ok:false,reason:'The safe is already unlocked.'}));return;}
      if(Math.hypot(p.x-SAFE_POSITION.x,p.z-SAFE_POSITION.z)>SAFE_RANGE || m.puzzle!==this.safePuzzle){sender.send(JSON.stringify({t:'safeResult',ok:false,reason:'Stand at the safe to solve its current position.'}));return;}
      const result=tryMate(this.safePuzzle,String(m.from),String(m.to));
      if(result.ok){this.safeOpened=true;this.lastEvent='CONTAINMENT: MUTAGEN SAFE OPEN';this.broadcast();}
      sender.send(JSON.stringify({t:'safeResult',ok:result.ok,reason:result.reason}));
    } else if(m.t==='relayOpen'||m.t==='relayAction'){
      if(Math.abs(p.y)>.8||Math.hypot(p.x-CONSOLE_POSITION.x,p.z-CONSOLE_POSITION.z)>ACTION_RANGE)return;
      const relay=this.relayJobs.get(sender.id);if(!relay)return;
      refreshRelay(relay,now);
      let ok=true;
      if(m.t==='relayAction'){
        const result=relayAction(relay,m.action,now);ok=result.ok;
        if(result.completed){
          this.temp=Math.max(0,Math.min(100,this.temp+(p.role==='saboteur'?5:-6)));
          this.lastEvent='REACTOR: SERVICE CYCLE COMPLETED';
          if(this.temp>=100)this.outcome='meltdown';this.broadcast();
        }
      }
      sender.send(JSON.stringify({t:m.t==='relayAction'?'relayResult':'relayState',relay,ok}));
    }
  }

  onClose(conn: Party.Connection) {
    const p=this.players.get(conn.id);if(p){const result=dropTool(this.tools,conn.id,p,this.cameraOpened);if(!result.ok){const item=this.tools.items.find(t=>t.holder===conn.id);if(item){item.holder=null;item.x=0;item.y=.14;item.z=2;item.floor=0;}}}this.toolPending.delete(conn.id);
    this.players.delete(conn.id);this.relayJobs.delete(conn.id);
    this.broadcast();
  }
}
