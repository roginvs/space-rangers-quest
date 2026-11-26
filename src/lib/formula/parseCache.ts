import { Expression } from "./types";

/**
 * Memoizes formula parsing by formula text.
 *
 * Parsing is a pure function of the text: the AST holds only numbers,
 * parameter ids, operators and ranges. Parameter values and random picks
 * are resolved later, in calculateAst(), so a cached AST can be reused
 * for any params/random. calculateAst() does not mutate the AST.
 *
 * Quests evaluate the same formulas over and over (every jump re-runs its
 * param changes and conditions), so re-parsing used to dominate
 * calculate() time for formula-heavy quests.
 *
 * The cache is bounded: when it reaches the limit it is simply cleared.
 * Formulas that fail to parse are not cached (the error propagates).
 */
export const PARSE_CACHE_MAX_ENTRIES = 10000;

const cache = new Map<string, Expression>();

export function parseCached(str: string, parse: (str: string) => Expression): Expression {
  const cached = cache.get(str);
  if (cached !== undefined) {
    return cached;
  }
  const ast = parse(str);
  if (cache.size >= PARSE_CACHE_MAX_ENTRIES) {
    cache.clear();
    console.info(`[formula parse cache] cleared: reached ${PARSE_CACHE_MAX_ENTRIES} entries`);
  }
  cache.set(str, ast);
  return ast;
}

/** For tests */
export function getParseCacheSize() {
  return cache.size;
}

/** Called when a new quest is loaded, and from tests. */
export function clearParseCache() {
  cache.clear();
}
