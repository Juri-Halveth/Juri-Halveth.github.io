// LUCINET × LUCINETA: synthetic cellular-world countertest. No network or Pi access.
// Each cell follows B3/S23. A and B exchange only edge-neighbor signals when portal=true.
export const WIDTH = 22;
export const HEIGHT = 16;
const SIZE = WIDTH * HEIGHT;

function index(x, y) { return y * WIDTH + x; }
function randomizer(seed) {
  let n = (seed >>> 0) || 1;
  return () => {
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };
}
function setCell(world, x, y) { world[index(x, y)] = 1; }

export function createState(seed = 777) {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 999999999) throw new RangeError('Ungültiger Seed');
  const a = new Uint8Array(SIZE), b = new Uint8Array(SIZE);
  const rng = randomizer(seed);
  // Deliberate, documented portal fixture: three neighbors across each edge
  // produce a birth on the opposite world in generation 1, but not in isolation.
  for (const y of [4, 5, 6]) setCell(a, WIDTH - 1, y);
  for (const y of [9, 10, 11]) setCell(b, 0, y);
  for (const [x, y] of [[4, 3], [5, 4], [3, 5], [4, 5], [5, 5]]) setCell(a, x, y);
  for (const [x, y] of [[WIDTH - 5, 3], [WIDTH - 4, 4], [WIDTH - 6, 5], [WIDTH - 5, 5], [WIDTH - 4, 5]]) setCell(b, x, y);
  // Seeded extra structure never touches the portal edges.
  for (let y = 2; y < HEIGHT - 2; y++) {
    for (let x = 3; x < WIDTH - 3; x++) {
      if (rng() < 0.065) setCell(a, x, y);
      if (rng() < 0.065) setCell(b, x, y);
    }
  }
  return {
    generation: 0, firstDifference: null,
    a, b, isolatedA: a.slice(), isolatedB: b.slice()
  };
}
function neighbor(world, other, side, x, y, portal) {
  if (y < 0 || y >= HEIGHT) return 0;
  if (x >= 0 && x < WIDTH) return world[index(x, y)];
  if (!portal) return 0;
  if (side === 'A' && x === WIDTH) return other[index(0, y)];
  if (side === 'B' && x === -1) return other[index(WIDTH - 1, y)];
  return 0;
}
function advance(world, other, side, portal) {
  const next = new Uint8Array(SIZE);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          n += neighbor(world, other, side, x + dx, y + dy, portal);
        }
      }
      const alive = world[index(x, y)];
      next[index(x, y)] = Number(n === 3 || (alive === 1 && n === 2));
    }
  }
  return next;
}
export function differenceCount(state) {
  let result = 0;
  for (let i = 0; i < SIZE; i++) {
    result += Number(state.a[i] !== state.isolatedA[i]);
    result += Number(state.b[i] !== state.isolatedB[i]);
  }
  return result;
}
export function population(world) {
  let total = 0;
  for (let i = 0; i < world.length; i++) total += world[i];
  return total;
}
export function stepState(state, portal) {
  if (typeof portal !== 'boolean') throw new TypeError('Portal muss boolean sein');
  // Both sides read the SAME prior generation. No world gets a head start.
  const next = {
    generation: state.generation + 1,
    firstDifference: state.firstDifference,
    a: advance(state.a, state.b, 'A', portal),
    b: advance(state.b, state.a, 'B', portal),
    isolatedA: advance(state.isolatedA, state.isolatedB, 'A', false),
    isolatedB: advance(state.isolatedB, state.isolatedA, 'B', false)
  };
  if (next.firstDifference === null && differenceCount(next) > 0) {
    next.firstDifference = next.generation;
  }
  return next;
}
