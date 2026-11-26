import "mocha";
import * as assert from "assert";
import { makeCached } from "../lib/makeCached";

describe("makeCached", function () {
  it("Reuses the result for the same argument", () => {
    let calls = 0;
    const { cached, size } = makeCached((n: number) => {
      calls++;
      return { n: n * 2 };
    });
    const a = cached(3);
    const b = cached(3);
    assert.strictEqual(a, b);
    assert.strictEqual(a.n, 6);
    assert.strictEqual(calls, 1);
    assert.strictEqual(size(), 1);
    const c = cached(4);
    assert.notStrictEqual(c, a);
    assert.strictEqual(c.n, 8);
    assert.strictEqual(calls, 2);
    assert.strictEqual(size(), 2);
  });

  it("Caches a function that returns undefined", () => {
    let calls = 0;
    const { cached, size } = makeCached((_n: number) => {
      calls++;
      return undefined;
    });
    assert.strictEqual(cached(1), undefined);
    assert.strictEqual(cached(1), undefined);
    assert.strictEqual(calls, 1);
    assert.strictEqual(size(), 1);
  });

  it("Does not cache errors", () => {
    let calls = 0;
    const { cached, size } = makeCached((s: string) => {
      calls++;
      if (s === "bad") {
        throw new Error("nope");
      }
      return s.toUpperCase();
    });
    assert.throws(() => cached("bad"));
    assert.throws(() => cached("bad"));
    assert.strictEqual(calls, 2);
    assert.strictEqual(size(), 0);
    assert.strictEqual(cached("ok"), "OK");
    assert.strictEqual(size(), 1);
  });

  it("clear and size work", () => {
    const { cached, clear, size } = makeCached((n: number) => n + 1);
    cached(1);
    cached(2);
    assert.strictEqual(size(), 2);
    clear();
    assert.strictEqual(size(), 0);
    const first = cached(1);
    assert.strictEqual(size(), 1);
    assert.strictEqual(first, 2);
  });

  it("Logs once when the cache is cleared at the size limit", () => {
    const maxEntries = 5;
    const { cached, size } = makeCached((n: number) => n + 1, maxEntries);
    const logs: string[] = [];
    const originalInfo = console.info;
    console.info = (message?: unknown, ..._rest: unknown[]) => {
      logs.push(String(message));
    };
    try {
      for (let i = 0; i < maxEntries + 1; i++) {
        cached(i);
      }
      assert.deepStrictEqual(logs, [`[cache] cleared: reached ${maxEntries} entries`]);
      assert.strictEqual(size(), 1);
    } finally {
      console.info = originalInfo;
    }
  });
});
