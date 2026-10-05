import assert from 'node:assert/strict';
import {accessPuzzle,publicAccessPuzzle,feedFilter,incineratorHeat} from '../shared/facility.js';
import {createCoolantState,setCoolant,updateCoolant,coolantTarget,readings} from '../shared/coolant.js';
import {createTubes,turnTube,tubeContact} from '../shared/tubes.js';
import {moveWithCollisions,solidsForState} from '../shared/world.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.02,`${a} != ${b}`);
const pins=new Set();
for(let seed=0;seed<100;seed++){
 const puzzle=accessPuzzle(String(seed));pins.add(puzzle.pin);assert.match(puzzle.pin,/^\d{4}$/);assert.equal(new Set(puzzle.pin).size,4);assert.equal('pin' in publicAccessPuzzle(String(seed)),false);assert.deepEqual(accessPuzzle(String(seed)),puzzle);
 const s=createTubes(String(seed));for(let i=0;i<3;i++){assert.equal(tubeContact(s,i),'dark');assert.ok(turnTube(s,i,s.targets[i]+8));assert.equal(tubeContact(s,i),'weak');assert.ok(turnTube(s,i,s.targets[i]));assert.equal(tubeContact(s,i),'lit');}assert.equal(s.powered,true);
}
assert.ok(pins.size>70,'Varied access codes');
const tubes=createTubes();assert.equal(turnTube(tubes,4,50),false);assert.equal(turnTube(tubes,0,NaN),false);
const s=createCoolantState('test');const target=coolantTarget(s);
let setting;for(let i=0;i<=100;i+=5)for(let b=0;b<=100;b+=5){const r=readings(i,b);if(r.flow===target.flow&&r.pressure===target.pressure)setting=[i,b];}
assert.ok(setting);assert.ok(setCoolant(s,...setting));for(let i=0;i<50;i++)assert.equal(updateCoolant(s,.1,true),false,'Unprocessed filters block flush');
let now=2000;for(let i=0;i<3;i++){while(now-s.lastFeed<1200||incineratorHeat(now)<40||incineratorHeat(now)>70)now+=100;assert.ok(feedFilter(s,now).ok);now+=1200;}
assert.equal(s.filterReady,true);assert.equal(feedFilter(s,now).ok,false,'No extra processing');
for(let i=0;i<20;i++)updateCoolant(s,.1,true);updateCoolant(s,.1,false);assert.equal(s.progress,0,'Leaving interrupts hold');
let completed=0;for(let i=0;i<50;i++)if(updateCoolant(s,.1,true))completed++;assert.equal(completed,1);assert.equal(s.filterReady,false);assert.ok(s.cooldown>0);assert.equal(setCoolant(s,...setting),false,'Cooldown prevents repeat');
const blocked=moveWithCollisions({x:-13,y:0,z:-1.5},-5,0);assert.ok(blocked.x>-15);
const admitted=moveWithCollisions({x:-13,y:0,z:-1.5},-5,0,solidsForState(true));near(admitted.x,-18);
let p={x:10,y:0,z:-10};p=moveWithCollisions(p,7,0);near(p.x,17);
p=moveWithCollisions(p,0,-1.6);p=moveWithCollisions(p,2.2,0);for(let i=0;i<12;i++)p=moveWithCollisions(p,0,0,undefined,undefined,.1);near(p.y,-2.4);assert.ok(p.stun>=0);
console.log('Passed: 100 seeded PINs/tube racks, tube feedback, filter gating, timed feed, three-second calibration, cooldown, locked/open camera door, incinerator access and service-pit fall.');
