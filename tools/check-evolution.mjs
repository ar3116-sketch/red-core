import assert from 'node:assert/strict';
import {PARTS,SLOTS,createEvolution,equip,unlockSafe,effects,routeTrial} from '../shared/evolution.js';
const supplies=new Set(),seen=new Map(PARTS.map(p=>[p.id,0]));let noStrength=0;
for(let i=0;i<10000;i++){
 let s=createEvolution(i);assert.deepEqual(s,createEvolution(i));
 supplies.add(JSON.stringify(SLOTS.map(k=>[...s.offers[k]].sort())));
 for(const slot of SLOTS){assert.equal(s.offers[slot].length,2);assert.equal(new Set(s.offers[slot]).size,2);for(const id of s.offers[slot]){assert.equal(PARTS.find(p=>p.id===id).slot,slot);seen.set(id,seen.get(id)+1);assert.equal(equip(s,id),s);}}
 if(!s.offers.movement.includes('crusher'))noStrength++;
 for(let stage=0;stage<3;stage++)s=unlockSafe(s);
 for(const slot of SLOTS){for(const id of s.offers[slot])s=equip(s,id);const absent=PARTS.find(p=>p.slot===slot&&!s.offers[slot].includes(p.id));assert.equal(equip(s,absent.id),s);}
 assert.equal(Object.keys(s.equipped).length,3);assert.equal(routeTrial(s,'corridor').allowed,true);
 assert.equal(routeTrial(s,'door').allowed,s.equipped.movement==='crusher');assert.equal(routeTrial(s,'vent').allowed,s.equipped.movement==='tentacles');
 assert.ok(effects(s).speed>=.765);assert.equal(unlockSafe(s).stage,3);
}
assert.equal(supplies.size,216);for(const n of seen.values())assert.ok(n>4400&&n<5600);
console.log(`10,000 drafts checked; ${supplies.size} distinct supplies; ${noStrength} without strength. All 12 parts sampled fairly. Locks, slot replacement, progression cap and base route verified.`);
