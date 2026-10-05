import assert from 'node:assert/strict';
import {createToolState,pickTool,dropTool,beginToolJob,finishToolJob,ropeDestination,heldTool,TOOL_JOBS,TOOL_STARTS} from '../shared/tool-system.js';
import {isWalkable,solidsForState} from '../shared/world.js';
const s=createToolState(),id='a',bench={x:-10.5,y:0,z:1.7};
assert.equal(pickTool(s,id,{x:0,y:0,z:0},'wrench-shop',1000).ok,false);
assert.ok(pickTool(s,id,bench,'wrench-shop',1000).ok);
assert.equal(pickTool(s,'b',bench,'wrench-shop',1000).ok,false,'No duplicate pickup');
assert.equal(pickTool(s,id,bench,'rope-shop',2000).ok,false,'One item per player');
const j=TOOL_JOBS[0],p={x:j.x,y:j.floor,z:j.z+.9};
assert.equal(beginToolJob(s,id,p,j.id,1300).ok,false,'Equip delay');
let now=2000;
for(let i=0;i<3;i++){
 const pending=beginToolJob(s,id,p,j.id,now);assert.ok(pending.ok);
 assert.equal(finishToolJob(s,id,p,pending,now+100).ok,false,'Cannot skip hold');
 assert.equal(finishToolJob(s,id,{x:0,y:0,z:0},pending,now+1000).ok,false,'Remote completion rejected');
 const result=finishToolJob(s,id,p,pending,now+800);assert.ok(result.ok);assert.equal(result.completed,i===2);now+=1000;
}
assert.equal(beginToolJob(s,id,p,j.id,now).ok,false,'No repeated reward');
assert.ok(dropTool(s,id,bench).ok);assert.equal(heldTool(s,id),undefined);
assert.ok(pickTool(s,id,bench,'rope-shop',now).ok);
const anchor=TOOL_JOBS.find(j=>j.kind==='anchor');const top={...anchor.top};
assert.equal(ropeDestination(s,top,anchor.id),null);
const pending=beginToolJob(s,id,top,anchor.id,now+1000);assert.ok(pending.ok);assert.ok(finishToolJob(s,id,top,pending,now+3000).completed);
assert.equal(heldTool(s,id),undefined,'Rope becomes world route');assert.deepEqual(ropeDestination(s,top,anchor.id),anchor.bottom);
assert.deepEqual(ropeDestination(s,anchor.bottom,anchor.id),anchor.top);
for(const j of TOOL_JOBS.filter(j=>j.kind==='anchor'))for(const q of [j.top,j.bottom])assert.ok(isWalkable(q.x,q.z,solidsForState(true),.28,q.y),`Clear rope destination ${j.id}`);
for(const t of TOOL_STARTS){let reachable=false;for(let a=0;a<Math.PI*2;a+=.2){const q={x:t.x+Math.cos(a)*1.2,y:t.floor,z:t.z+Math.sin(a)*1.2};if(isWalkable(q.x,q.z,solidsForState(true),.28,q.y))reachable=true;}assert.ok(reachable,t.id+' has approach');}
console.log('Passed: single-slot/exclusive pickup, equip delay, timed turns, range rejection, three-bolt completion, safe drops, consumable rope, two-way safe climb destinations and reachable tool spawns.');
