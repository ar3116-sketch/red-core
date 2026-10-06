// Live test against `npm run party`: crew machine effect + cooldown; saboteur minigame arms, warns, and crew defuses.
import assert from 'node:assert/strict';
import {MACHINES,standOf,puzzle,machineSeed,sabPuzzle} from '../shared/machines.js';
import {SABOTAGE} from '../shared/stations.js';
const room='mach-'+Date.now(),pause=ms=>new Promise(r=>setTimeout(r,ms));
const client=()=>new Promise(res=>{const s=new WebSocket(`ws://127.0.0.1:1999/parties/main/${room}`),c={s,me:null,state:null,inbox:[],send:m=>s.send(JSON.stringify(m))};s.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='state'){c.state=m;c.me=m.me;}else c.inbox.push(m);if(m.t==='hello')res(c);};});
async function until(f,ms=8000,w='cond'){const t=Date.now();while(Date.now()-t<ms){if(f())return;await pause(50);}throw Error('timeout '+w);}
// Teleport-walk: the server clamps speed, so step there.
async function go(c,x,z){for(let i=0;i<900;i++){const p=c.me,d=Math.hypot(x-p.x,z-p.z);if(d<.1)return;const s=Math.min(.28,d);c.send({t:'pos',x:p.x+(x-p.x)/d*s,z:p.z+(z-p.z)/d*s});await pause(100);}throw Error(`stuck going to ${x},${z} at ${c.me.x},${c.me.z}`);}
const cs=[];for(let i=0;i<4;i++)cs.push(await client());
await until(()=>cs[0].state?.lobby?.length===4);cs[0].send({t:'start'});await until(()=>cs[0].state?.phase==='shift',12000,'shift');
const crew=cs.find(c=>c.me.role==='crew'),sab=cs.find(c=>c.me.role==='saboteur');
// Crew: lathe in the workshop (path: control -> workshop door -> lathe stand).
const lathe=MACHINES.find(m=>m.id==='lathe'),st=standOf(lathe);
for(const [x,z] of [[-2,1],[-5,0],[-7.4,-1],[st.x,st.z]])await go(crew,x,z);
const p=puzzle('lathe',machineSeed(crew.state.seed,'lathe',0));
const before=crew.state.pressure;crew.send({t:'machine',id:'lathe',answer:{value:p.target}});
await until(()=>crew.inbox.some(m=>m.t==='machineResult'),3000,'machine result');
const r=crew.inbox.find(m=>m.t==='machineResult');assert.equal(r.ok,true,JSON.stringify(r));
await pause(200);assert.ok(crew.state.machines.lathe.wait>60,'cooldown');assert.ok(crew.state.pressure<=before-5||before<26,'pressure dropped');
crew.send({t:'machine',id:'lathe',answer:{value:p.target}});await pause(300);assert.equal(crew.inbox.filter(m=>m.t==='machineResult').at(-1).ok,false,'cooldown blocks repeat');
// Saboteur: the door override in control, armed with a warning; crew defuses.
const doors=SABOTAGE.find(s=>s.id==='doors');
for(const [x,z] of [[-1.9,3],[-1.9,4.55],[-4.3,4.55],[doors.x,doors.z]])await go(sab,x,z);for(const [x,z] of [[-7.4,-1],[-5,0],[-1.9,1],[-1.9,4.55],[doors.x+.9,4.55]])await go(crew,x,z);
sab.send({t:'sabStart',id:'doors'});await pause(200);
sab.send({t:'sabDone',id:'doors',answer:{code:[9,9,9]}});await until(()=>sab.inbox.some(m=>m.t==='sabResult'),3000,'sab result');
assert.equal(sab.inbox.find(m=>m.t==='sabResult').ok,false,'wrong code rejected');
sab.send({t:'sabStart',id:'doors'});await pause(200);sab.send({t:'sabDone',id:'doors',answer:{code:sab.me.override}});
await until(()=>crew.state.armed?.some(a=>a.id==='doors'),3000,'armed');assert.ok(crew.inbox.some(m=>m.t==='cue'&&m.kind==='warn'),'crew warned');
crew.send({t:'hold',kind:'defuse',target:'doors'});await until(()=>!crew.state.armed?.length,4000,'defused');
assert.equal(crew.state.sealed,false,'doors never sealed');
console.log('Passed: lathe answer applies effect + cooldown, repeat blocked; door sabotage rejects wrong code, arms with crew warning, crew defuses before it fires.');
for(const c of cs)c.s.close();process.exit(0);
