import assert from 'node:assert/strict';
import { generateMap, validateMap, pathLength, LANDMARKS } from '../shared/map.js';

const layouts = new Set();
for (let seed = 0; seed < 1000; seed++) {
  const map = generateMap(seed);
  assert.deepEqual(map, generateMap(seed), 'same seed must generate same map');
  assert.ok(validateMap(map.edges), `seed ${seed} failed map constraints`);
  assert.equal(new Set(map.rooms.map(room => room.type)).size, 16, 'each room role must be distinct');
  assert.ok(pathLength(map.edges, LANDMARKS.crewSpawn, LANDMARKS.reactor) <= 5);
  layouts.add(JSON.stringify(map.edges));
}
assert.ok(layouts.size > 100, 'seeds should offer meaningful route variety');
console.log(`1000 valid maps; ${layouts.size} distinct passage layouts`);
