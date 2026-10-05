import assert from 'node:assert/strict';
import {moveWithCollisions,isWalkable} from '../shared/world.js';
let p={x:0,y:0,z:-10};p=moveWithCollisions(p,0,-6.5);assert.ok(p.z<-16.49,'Core hall entrance');
p=moveWithCollisions(p,0,-15);assert.ok(p.z>-17.63&&p.z<-17.60,'Core well rim is solid');
p={x:0,y:0,z:-17};for(let i=1;i<=64;i++){const a=i*Math.PI*2/64,x=Math.sin(a)*5,z=-22+Math.cos(a)*5;p=moveWithCollisions(p,x-p.x,z-p.z);assert.ok(Math.hypot(p.x-x,p.z-z)<.02,'Walkway loop remains clear');assert.ok(isWalkable(p.x,p.z));}
const rescued=moveWithCollisions({x:0,y:0,z:-22},0,0);assert.ok(isWalkable(rescued.x,rescued.z),'Recover an obsolete position inside enlarged core');
console.log('Passed: enlarged hall entrance, circular core rim collision, full service-walkway loop, safe position recovery.');
