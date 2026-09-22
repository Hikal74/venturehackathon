/**
 * Tiny deterministic PRNG (mulberry32) — NOT cryptographic, just a fast,
 * seedable generator so demo data looks the same every time it's seeded
 * instead of shuffling on every signup. That matters for a hackathon demo:
 * the same "4 of 5 school days, cafeteria at lunch" pattern needs to be
 * findable by Pattern Discovery every single time, not just sometimes.
 */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gaussian-ish noise via Box-Muller, drawn from a seeded uniform RNG. */
export function gaussian(rng: () => number, mean: number, stddev: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stddev;
}
