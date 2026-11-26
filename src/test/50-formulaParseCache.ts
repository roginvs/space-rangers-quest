import "mocha";
import * as assert from "assert";
import * as fs from "fs";
import { calculate, parseCached, clearParseCache, getParseCacheSize } from "../lib/formula";
import { parse as parseQuest } from "../lib/qmreader";
import { randomFromMathRandom } from "../lib/randomFunc";

describe("Formula parse cache", function () {
  beforeEach(() => clearParseCache());
  after(() => clearParseCache());

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
    const before = JSON.stringify(parseCached(f));
    for (let i = 0; i < 10; i++) {
      calculate(f, [i, i], randomFromMathRandom);
    }
    assert.strictEqual(JSON.stringify(parseCached(f)), before);
  });

  it("Does not cache formulas which fail to parse", () => {
    assert.throws(() => calculate("2 + ", [], randomFromMathRandom));
    assert.strictEqual(getParseCacheSize(), 0);
  });

  it("Resets the cache when a quest is parsed", () => {
    parseCached("1 + 2");
    assert.strictEqual(getParseCacheSize(), 1);
    const data = fs.readFileSync(__dirname + "/limitedLocation.qmm");
    parseQuest(data);
    assert.strictEqual(getParseCacheSize(), 0);
  });
});
