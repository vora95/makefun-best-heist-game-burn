// A tiny seeded RNG (mulberry32) so anything random in the game — patron
// wander, guard idle pauses — plays back the same way every run. The
// level layouts themselves are fixed by hand in levels.js; this only
// feeds the small wandering bits.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}
