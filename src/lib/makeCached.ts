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
  const cache = new Map<A, R>();

  function cached(arg: A): R {
    if (cache.has(arg)) {
      return cache.get(arg) as R;
    }
    const result = fn(arg);
    if (cache.size >= maxEntries) {
      cache.clear();
      console.info(`[cache] cleared: reached ${maxEntries} entries`);
    }
    cache.set(arg, result);
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
