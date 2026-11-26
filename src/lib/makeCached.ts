/**
 * Memoizes a unary pure function by its argument.
 *
 * The cache is bounded: when it reaches the limit it is simply cleared.
 * Errors thrown by the function are not cached (they propagate).
 */
export function makeCached<A, R>(
  fn: (arg: A) => R,
  maxEntries = 10000,
): { cached: (arg: A) => R; clear: () => void; size: () => number } {
  // Map.get returns R | undefined, and has() does not narrow the following get().
  // Storing a wrapper does a single lookup, avoids a cast, and correctly caches
  // functions that legitimately return undefined.
  const cache = new Map<A, { value: R }>();

  function cached(arg: A): R {
    const hit = cache.get(arg);
    if (hit) {
      return hit.value;
    }
    const result = fn(arg);
    if (cache.size >= maxEntries) {
      cache.clear();
      console.info(`[cache] cleared: reached ${maxEntries} entries`);
    }
    cache.set(arg, { value: result });
    return result;
  }

  return {
    cached,
    clear() {
      cache.clear();
    },
    size() {
      return cache.size;
    },
  };
}
