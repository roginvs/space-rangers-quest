import "mocha";
import * as assert from "assert";
import { calculate, parse } from "../lib/formula";
import {
  clearParseCache,
  getParseCacheSize,
  parseCached,
  PARSE_CACHE_MAX_ENTRIES,
} from "../lib/formula/parseCache";
import { randomFromMathRandom } from "../lib/randomFunc";

describe("Formula parse cache", function () {
  beforeEach(() => clearParseCache());
  after(() => clearParseCache());

  it("Reuses the parsed AST for the same text", () => {
    const a = parseCached("[p1] + 2 * [p2]", parse);
    const b = parseCached("[p1] + 2 * [p2]", parse);
    assert.strictEqual(a, b);
    assert.strictEqual(getParseCacheSize(), 1);
  });

  it("Parameter values are read at calc time, not cached", () => {
    const f = "[p1] * 10 + [p2]";
    assert.strictEqual(calculate(f, [1, 2], randomFromMathRandom), 12);
    assert.strictEqual(calculate(f, [3, 4], randomFromMathRandom), 34);
    assert.strictEqual(calculate(f, [0, 0], randomFromMathRandom), 0);
  });

  it("Random ranges are picked at calc time, not cached", () => {
    const f = "[0..1000000]";
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) {
      seen.add(calculate(f, [], randomFromMathRandom));
    }
    assert.ok(seen.size > 1, "random value must differ between calls");
    assert.strictEqual(getParseCacheSize(), 1);
  });

  it("Uses the provided random function on every call", () => {
    let calls = 0;
    const random = (n: number) => {
      calls++;
      return n - 1;
    };
    assert.strictEqual(calculate("[1..5]", [], random), 5);
    assert.strictEqual(calculate("[1..5]", [], random), 5);
    assert.strictEqual(calls, 2);
  });

  it("Calculation does not mutate the cached AST", () => {
    const f = "[p1] + [1..3;7] * 2 + ([p2] in [1..5])";
    const before = JSON.stringify(parseCached(f, parse));
    for (let i = 0; i < 10; i++) {
      calculate(f, [i, i], randomFromMathRandom);
    }
    assert.strictEqual(JSON.stringify(parseCached(f, parse)), before);
  });

  it("Does not cache formulas which fail to parse", () => {
    assert.throws(() => calculate("2 + ", [], randomFromMathRandom));
    assert.strictEqual(getParseCacheSize(), 0);
  });

  it("Cache size is bounded", () => {
    for (let i = 0; i < PARSE_CACHE_MAX_ENTRIES + 10; i++) {
      parseCached(`${i} + 1`, parse);
    }
    assert.ok(getParseCacheSize() <= PARSE_CACHE_MAX_ENTRIES);
    assert.strictEqual(calculate("5 + 1", [], randomFromMathRandom), 6);
  });
});
