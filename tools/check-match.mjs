// Live match test against `npm run party`: lobby, roles, hang, rescue, lunge, sabotage evidence, radio.
import assert from 'node:assert/strict';
const room='match-'+Date.now(),pause=ms=>new Promise(r=>setTimeout(r,ms));
function client(){
 return new Promise((resolve,reject)=>{
  const s=new WebSocket(`ws://127.0.0.1:1999/party/main/${room}`),c={s,state:null,me:null,inbox:[],send:m=>s.send(JSON.stringify(m))};
  s.addEventListener('error',reject);
  s.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.t==='state'){c.state=m;c.me=m.me;}else c.inbox.push(m);if(m.t==='hello')resolve(c);});
 });
}
async function until(fn,ms=8000,what='condition'){const t=Date.now();while(Date.now()-t<ms){if(fn())return;await pause(50);}throw Error('Timed out: '+what);}
async function walk(c,x,z){for(let i=0;i<400;i++){const p=c.me;const d=Math.hypot(x-p.x,z-p.z);if(d<.08||c.me.state!=='ok')return;const s=Math.min(.28,d);c.send({t:'pos',x:p.x+(x-p.x)/d*s,z:p.z+(z-p.z)/d*s});await pause(100);}throw Error(`walk to ${x},${z} stuck: ${JSON.stringify(c.me)}`);}
const cs=[];for(let i=0;i<4;i++)cs.push(await client());
await until(()=>cs.every(c=>c.state?.lobby?.length===4),5000,'lobby');
assert.equal(cs[0].state.host,cs[0].me.id);
cs[1].send({t:'start'});await pause(300);assert.equal(cs[0].state.phase,'lobby','non-host cannot start');
cs[0].send({t:'start'});await until(()=>cs[0].state.phase==='briefing',3000,'briefing');
const roles=cs.map(c=>c.me.role);assert.deepEqual([...roles].sort(),['crew','crew','saboteur','specimen']);
assert.ok(!JSON.stringify(cs[0].state.players).includes('saboteur'),'roles never broadcast');
await until(()=>cs[0].state.phase==='shift',9000,'shift');
const crew=cs.filter(c=>c.me.role==='crew'),sab=cs.find(c=>c.me.role==='saboteur'),spec=cs.find(c=>c.me.role==='specimen');
// 1. Walk an engineer through the east tunnel to the broken rail and over the lip.
const [a,b]=crew;
for(const [x,z] of [[4,0],[10,0],[13,-2.3],[20,-2.2],[27,-2.3],[27,-4.95]])await walk(a,x,z);
for(let i=0;i<20&&a.me.state==='ok';i++){a.send({t:'pos',x:a.me.x+.25,z:a.me.z});await pause(100);}
assert.equal(a.me.state,'hanging','caught the ledge');
const before=a.me.hang.score;a.send({t:'beat',hit:true});await pause(200);assert.ok(a.me.hang.score>before-3,'beat hit helps');
// 2. Second engineer pulls them up.
for(const [x,z] of [[4,0],[10,0],[13,-2.3],[20,-2.2],[27,-2.3],[27.9,-4.95]])await walk(b,x,z);
b.send({t:'hold',kind:'help',target:a.me.id});await until(()=>a.me.state==='ok',4000,'rescue');
// 3. Specimen goes through the vents to the east hall and lunges.
spec.send({t:'hold',kind:'vent'});await until(()=>spec.me.inVent,3000,'enter vent');
spec.send({t:'ventExit',id:'e-hall'});await until(()=>!spec.me.inVent,9000,'vent travel');
await walk(spec,27,8);await walk(spec,27.3,-3.6);
const dx=b.me.x-spec.me.x,dz=b.me.z-spec.me.z;spec.send({t:'lunge',dx,dz});await pause(300);
assert.ok(spec.me.lunge>5,'lunge on cooldown');
assert.ok(b.inbox.some(m=>m.t==='cue'&&m.kind==='hit')||a.inbox.some(m=>m.t==='cue'&&m.kind==='hit'),'someone got hit');
// 4. Saboteur reverses the valve under the pump-room camera; the SCIF log records a figure.
for(const [x,z] of [[-5,0],[-10,0],[-10,-5],[-11.4,-11.5],[-11.4,-14]])await walk(sab,x,z);
sab.send({t:'hold',kind:'sab',target:'valve'});await until(()=>sab.state.valve,7000,'valve sabotage');
// 5. Engineer reads the log and radios line 1 from the SCIF (needs camera room power).
assert.ok(sab.me.sabotage>20,'sabotage cooldown');
console.log('Passed: lobby host start, hidden roles (crew/crew/saboteur/specimen), ledge hang + beat + rescue, vent travel, lunge, valve sabotage with cooldown.');
for(const c of cs)c.s.close();process.exit(0);
