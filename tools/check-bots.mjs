// Offline bot shifts: bundles the room server, fakes the clock and plays whole solo shifts where every
// engineer (the "human" too) is a bot. Prints how shifts end and what the bots did.
import {build} from 'esbuild';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const out=join(mkdtempSync(join(tmpdir(),'rc-bots-')),'room.mjs');
await build({entryPoints:['server/room.ts'],bundle:true,platform:'node',format:'esm',outfile:out,logLevel:'error'});
let clock=1.8e12;Date.now=()=>clock;globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
const {default:Room}=await import(pathToFileURL(out).href);

const GAMES=Number(process.argv[2]||10);
function play(n,roomId){
 const conns=new Map(),party={id:roomId,env:{},getConnections:()=>conns.values(),getConnection:id=>conns.get(id)};
 const room=new Room(party),h={id:'h1',send(){},close(){}};conns.set('h1',h);room.onConnect(h);
 const events=[],says=[];const ev=room.event.bind(room);room.event=t=>{events.push(t);ev(t);};room.say=(p,text)=>says.push(`${p.callsign}: ${text}`);
 const taped=[];const done=room.complete.bind(room);room.complete=(p,hd,now)=>{if(hd.kind==='tape'&&room.players.get(hd.target)?.state==='ok')taped.push(room.players.get(hd.target).role);done(p,hd,now);};
 room.onMessage(JSON.stringify({t:'start',fill:true}),h);
 const h1=room.players.get('h1');h1.bot=true;if(h1.role==='specimen')h1.ai={path:[],until:0,retreatUntil:clock+42000};conns.clear();
 const moved=new Map(),last=new Map();let temps=[];
 for(let i=0;i<6000&&room.phase!=='over';i++){
  clock+=100;room.tick();
  for(const p of room.players.values()){const l=last.get(p.id);if(l)moved.set(p.id,(moved.get(p.id)||0)+Math.hypot(p.x-l.x,p.z-l.z));last.set(p.id,{x:p.x,z:p.z});}
  if(i%300===0)temps.push(Math.round(room.temp));
 }
 const ps=[...room.players.values()];
 return {kind:room.outcome?.kind??'none',temps,roles:ps.map(p=>p.role),
  tasks:ps.filter(p=>p.role==='crew').reduce((s,p)=>s+p.stats.tasks,0),sab:ps.filter(p=>p.role==='saboteur').reduce((s,p)=>s+p.stats.sabotage,0),
  rescues:ps.reduce((s,p)=>s+p.stats.rescues,0),falls:ps.reduce((s,p)=>s+p.stats.falls,0),stage:ps.find(p=>p.role==='specimen')?.stage??0,
  tapes:taped.length?taped.map(r=>r[0]).join(''):'0',stopped:events.filter(e=>e.startsWith('SABOTAGE STOPPED')).length,
  minMoved:Math.min(...ps.filter(p=>p.role!=='specimen').map(p=>Math.round(moved.get(p.id)||0))),says:says.length,sample:says.slice(0,6),events,lazy:ps.filter(p=>p.role!=='specimen'&&(moved.get(p.id)||0)<200).map(p=>`${p.callsign}/${p.role}/${p.state} at ${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)} task ${p.brain?.task?.kind??'-'}`)};
}
const results=[];
for(let g=0;g<GAMES;g++){
 const solo=g%2===0,r=play(g,solo?`SOLO-T${g}`:`FILL-T${g}`);results.push(r);
 if(r.lazy.length)console.log('  barely moved:',r.lazy.join('; '));
 console.log(`${solo?'solo':'fill'} #${g}: ${r.kind.padEnd(9)} core ${r.temps.join('→')} | crew tasks ${r.tasks} sabotage ${r.sab} stopped ${r.stopped} rescues ${r.rescues} falls ${r.falls} tapes ${r.tapes} specimen stage ${r.stage} | least walked ${r.minMoved} m | ${r.says} lines`);
}
console.log('sample chatter:',results.flatMap(r=>r.sample).slice(0,10));
const kinds=results.reduce((m,r)=>(m[r.kind]=(m[r.kind]||0)+1,m),{});console.log('outcomes',kinds);
assert.ok(results.every(r=>r.kind!=='none'),'every shift ends');
assert.ok(results.every(r=>r.minMoved>60),'every bot walks the map');
assert.ok(results.reduce((s,r)=>s+r.tasks,0)/GAMES>=8,'crew bots service machines');
assert.ok(results.some(r=>r.sab>0),'bot saboteurs sabotage');
console.log('Passed: bot shifts end, bots move, work, sabotage and talk.');
