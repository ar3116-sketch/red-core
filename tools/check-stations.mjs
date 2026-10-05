import assert from 'node:assert/strict';
import {isWalkable,moveWithCollisions,SOLIDS,groundHeight} from '../shared/world.js';
import {VENTS,CAMERAS,SABOTAGE,NAV,NAV_EDGES,SCIF_DESK,REACTOR_SMASH,navPath} from '../shared/stations.js';
import {SAFES} from '../shared/safes.js';
// Every interaction stand point must be on a floor and clear of solids.
const bad=[];
const stand=(id,x,z)=>{const y=groundHeight(x,z,0)??groundHeight(x,z,0,Infinity);if(y===null||!isWalkable(x,z,SOLIDS,.28,y))bad.push(`${id} (${x},${z})`);};
for(const v of VENTS)stand('vent '+v.id,v.x,v.z);
for(const s of SABOTAGE)stand('sabotage '+s.id,s.x,s.z);
for(const s of SAFES)stand('safe '+s.id,s.stand.x,s.stand.z);
for(const [k,[x,z]] of Object.entries(NAV))stand('nav '+k,x,z);
stand('scif',SCIF_DESK.x+.6,SCIF_DESK.z);stand('smash',REACTOR_SMASH.x,REACTOR_SMASH.z);
// Each nav edge must be walkable end to end, so the stalker never sticks.
for(const [a,b] of NAV_EDGES){
 let p={x:NAV[a][0],y:0,z:NAV[a][1]};const [tx,tz]=NAV[b];
 for(let i=0;i<800;i++){const dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz);if(l<.08)break;const s=Math.min(.1,l);const n=moveWithCollisions(p,dx/l*s,dz/l*s,SOLIDS,undefined,1/30,false);if(Math.hypot(n.x-p.x,n.z-p.z)<1e-4){bad.push(`edge ${a}->${b} stuck at ${n.x.toFixed(2)},${n.z.toFixed(2)}`);break;}p=n;}
}
assert.deepEqual(bad,[],bad.join('\n'));
const route=navPath({x:-35,z:-20},{x:45,z:0});
assert.ok(route.length>8);
console.log(`Passed: ${VENTS.length} vents, ${SABOTAGE.length} sabotage points, ${SAFES.length} safes, ${Object.keys(NAV).length} nav nodes and ${NAV_EDGES.length} edges all walkable; archive->lift route ${route.length} nodes.`);
