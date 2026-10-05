import assert from 'node:assert/strict';
import {isWalkable,moveWithCollisions} from '../shared/world.js';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.015,`${message}: ${a} != ${b}`);
let p={x:0,y:0,z:2};
function walk(x,z,y){p=moveWithCollisions(p,x-p.x,z-p.z);near(p.x,x,'x');near(p.z,z,'z');near(p.y,y,'height');assert.ok(isWalkable(p.x,p.z,undefined,undefined,p.y,true));}
walk(0,7,0);walk(-10.5,7,0);walk(-10.5,9,0);walk(-10.5,25,-3.2);
walk(-10.5,27,-3.2);walk(0,27,-3.2); // Cross beneath the raised bridge.
walk(0,23,-3.2);walk(6.7,23,-3.2);walk(6.7,14,-3.2);walk(10.5,14,-3.2);walk(10.5,16,-3.2);
walk(10.5,32,0);walk(10.5,34,0);walk(0,34,0);walk(0,7,0);walk(0,2,0);
const edge=moveWithCollisions({x:0,y:0,z:21},5,0);assert.ok(edge.x<1.2);near(edge.y,0,'bridge rail height');
const underneath=moveWithCollisions({x:-3,y:-3.2,z:21},6,0);near(underneath.x,3,'walk beneath bridge');near(underneath.y,-3.2,'no snap to upper level');
const side=moveWithCollisions({x:12.5,y:-3.2,z:20},-2,0);assert.ok(side.x>12,'cannot enter ramp from side');
for(const x of [-8,8]){const drain=moveWithCollisions({x,y:-3.2,z:35},0,10);near(drain.z,45,'drain connected');const end=moveWithCollisions(drain,0,5);assert.ok(end.z<46,'drain end');}
let seed=86;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
p={x:0,y:-3.2,z:23};for(let i=0;i<10000;i++){p=moveWithCollisions(p,(random()-.5)*2,(random()-.5)*2);assert.ok(isWalkable(p.x,p.z,undefined,undefined,p.y,true),JSON.stringify(p));}
console.log('Passed: connected bunker, two ramps, full vertical loop, underside of bridge, guardrails, no floor snapping, both drain tunnels, 10,000 valid movements.');

let fall={x:0,y:0,z:26};fall=moveWithCollisions(fall,2,0);for(let i=0;i<15;i++)fall=moveWithCollisions(fall,0,0,undefined,undefined,.1);near(fall.y,-3.2,'exposed bridge drop');assert.ok(fall.stun>=0);
console.log('Passed: exposed rail gap leads to gravity-driven fall to the basin.');

for(const x of [-15,15]){const gallery=moveWithCollisions({x,y:0,z:7},0,27);near(gallery.z,34,'continuous upper gallery entrance');near(gallery.y,0,'gallery remains level');}
console.log('Passed: both upper galleries remain connected at north and south landings.');
