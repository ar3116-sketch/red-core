// A small topology generator for the planned Object-86 room graph.
// Critical room positions are fixed; a seed varies a few passages and side-room uses.
const SIZE = 4;
export const LANDMARKS = Object.freeze({
  crewSpawn: 13, reactor: 5, scif: 4, safe1: 0, safe2: 3,
  safe3: 8, lift: 2, monsterSpawn: 15
});
const SIDE_ROOMS = ['pump', 'filter', 'cable', 'vent', 'observation', 'storage', 'barracks', 'substation'];

function hashSeed(seed) {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
function seeded(seed) {
  let value = hashSeed(seed);
  return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function allEdges() {
  const edges = [];
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    const id = row * SIZE + col;
    if (col < SIZE - 1) edges.push([id, id + 1]);
    if (row < SIZE - 1) edges.push([id, id + SIZE]);
  }
  return edges;
}
function neighbors(edges, id) {
  return edges.flatMap(([a, b]) => a === id ? [b] : b === id ? [a] : []);
}
export function pathLength(edges, from, to) {
  const queue = [[from, 0]], visited = new Set([from]);
  for (let i = 0; i < queue.length; i++) {
    const [cell, distance] = queue[i];
    if (cell === to) return distance;
    for (const next of neighbors(edges, cell)) if (!visited.has(next)) {
      visited.add(next); queue.push([next, distance + 1]);
    }
  }
  return Infinity;
}
function connected(edges) {
  return Array.from({ length: SIZE * SIZE }, (_, id) => id)
    .every(id => Number.isFinite(pathLength(edges, 0, id)));
}
function safeTopology(edges) {
  if (!connected(edges)) return false;
  // Every passage must have an alternate route, so one door cannot isolate a sector.
  for (let i = 0; i < edges.length; i++) {
    if (!connected(edges.filter((_, index) => index !== i))) return false;
  }
  const l = LANDMARKS;
  const bounds = [
    [l.crewSpawn, l.reactor, 2, 5],
    [l.reactor, l.lift, 2, 5],
    [l.monsterSpawn, l.safe1, 6, 9],
    [l.monsterSpawn, l.safe2, 3, 6],
    [l.monsterSpawn, l.safe3, 4, 7],
    [l.safe1, l.safe2, 3, 6],
    [l.safe2, l.safe3, 4, 8],
    [l.safe3, l.lift, 3, 7]
  ];
  return bounds.every(([a, b, min, max]) => {
    const distance = pathLength(edges, a, b);
    return distance >= min && distance <= max;
  });
}
export function validateMap(edges) {
  return edges.length >= 19 && edges.length <= 21 && safeTopology(edges);
}

export function generateMap(seed) {
  const random = seeded(seed);
  const candidates = allEdges();
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  let edges = allEdges();
  const target = 3 + Math.floor(random() * 3);
  for (const edge of candidates) {
    if (24 - edges.length >= target) break;
    const trial = edges.filter(([a, b]) => a !== edge[0] || b !== edge[1]);
    if (safeTopology(trial)) edges = trial;
  }
  const names = new Map(Object.entries(LANDMARKS).map(([name, id]) => [id, name]));
  const sideRooms = [...SIDE_ROOMS];
  for (let i = sideRooms.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [sideRooms[i], sideRooms[j]] = [sideRooms[j], sideRooms[i]];
  }
  const rooms = Array.from({ length: SIZE * SIZE }, (_, id) => ({
    id, row: Math.floor(id / SIZE), col: id % SIZE,
    type: names.get(id) || sideRooms.shift()
  }));
  return { seed: String(seed), size: SIZE, rooms, edges };
}
