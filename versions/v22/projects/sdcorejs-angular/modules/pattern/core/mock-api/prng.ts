/** Park–Miller generator: the same sequence for the same seed, so seeded records and e2e stay stable. */
export function createPrng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** Picks one item with the generator. */
export const pickWith =
  (random: () => number) =>
  <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)];
