// Seeded randomness for Gobble Dash: a small linear-congruential generator plus a
// deterministic hash, so a `?seed=N` run always deals the same farm, hazards and
// pickups. Written for this game; no library, no Math.random in the simulation.

/** A seeded PRNG (LCG). Returns a function yielding [0, 1). */
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Deterministic hash in [0, 1) for integer lattice points (background decor). */
export function hash2(ix, seed) {
  let h = (Math.imul(ix, 2246822519) ^ Math.imul(seed, 3266489917)) | 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296);
}

/** Clamp v into [lo, hi]. */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Linear interpolation. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
