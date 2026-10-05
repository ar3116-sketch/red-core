import assert from 'node:assert/strict';
import {createRelay,relayBlueprint,relayAction,refreshRelay} from '../shared/relay-task.js';
const variants=new Set();
for(let seed=0;seed<200;seed++){
 const s=createRelay('check-'+seed);const b=relayBlueprint(s.seed);variants.add(JSON.stringify(b));
 const go=(kind,extra={},now=10000)=>relayAction(s,{kind,cycle:s.cycle,...extra},now);
 assert.equal(go('breaker',{load:0}).completed,false,'Cannot skip wiring');
 assert.equal(go('wire',{source:NaN,load:0}).ok,false);assert.equal(go('wire',{source:0,load:9}).ok,false);
 assert.equal(relayAction(s,{kind:'test',cycle:99},10000).ok,false,'Reject stale cycle');
 assert.equal(go('test').ok,false);assert.equal(go('wire',{source:0,load:0},10300).ok,false,'Fault debounce');
 for(let i=0;i<3;i++)assert.ok(go('wire',{source:i,load:b.loads.findIndex(l=>l.volts===b.sources[i])},12000).ok);
 assert.ok(go('test',{},13000).ok);assert.equal(s.stage,'start');
 assert.ok(go('breaker',{load:b.order[0]},14000).ok);
 assert.equal(go('breaker',{load:b.order[2]},15000).ok,false);assert.equal(s.started,1,'Wrong breaker keeps completed progress');
 go('breaker',{load:b.order[1]},16000);assert.ok(go('breaker',{load:b.order[2]},17000).completed);
 assert.equal(go('breaker',{load:b.order[2]},18000).completed,false,'Completion only once');
 refreshRelay(s,41999);assert.equal(s.stage,'done');refreshRelay(s,42000);assert.equal(s.stage,'wire');assert.equal(s.cycle,1);assert.deepEqual(s.wires,[-1,-1,-1]);
 const old=relayAction(s,{kind:'wire',source:0,load:0,cycle:0},43000);assert.equal(old.ok,false);
}
assert.ok(variants.size>150,'Substantial seeded variation');
console.log(`Passed ${variants.size} distinct service cards: legal solutions, phase gating, fault recovery, cooldown, repeat reward and stale-packet rejection.`);
