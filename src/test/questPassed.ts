import * as assert from "assert";
import "mocha";
import { getQuestPassedInfo, QuestPassingProof } from "../ui/questPassed";

function proof(jumps: number[]): QuestPassingProof {
  return {
    performedJumps: jumps.map((dateUnix) => ({ dateUnix })),
  };
}

describe("getQuestPassedInfo", () => {
  it("is loading when proofs have not been loaded yet", () => {
    assert.deepStrictEqual(getQuestPassedInfo({ a: proof([1, 2]) }, false), {
      loading: true,
      passedAt: undefined,
      passings: [],
    });
  });

  it("is not passed when loaded proofs are missing or empty", () => {
    for (const proofs of [undefined, null, false, {}] as const) {
      assert.deepStrictEqual(getQuestPassedInfo(proofs, true), {
        loading: false,
        passedAt: false,
        passings: [],
      });
    }
  });

  it("returns the first completion date and each passing with duration", () => {
    const start = Date.UTC(2024, 0, 1, 12, 0, 0);
    const end = start + 5 * 60 * 1000;
    const laterStart = Date.UTC(2024, 0, 2, 12, 0, 0);
    const laterEnd = laterStart + 90 * 1000;
    const info = getQuestPassedInfo(
      {
        later: proof([laterStart, laterEnd]),
        first: proof([start, end]),
      },
      true,
    );

    assert.strictEqual(info.loading, false);
    assert.ok(info.passedAt instanceof Date);
    assert.strictEqual((info.passedAt as Date).getTime(), end);
    assert.deepStrictEqual(info.passings, [
      { seed: "first", started: start, end, durationsMins: 5 },
      { seed: "later", started: laterStart, end: laterEnd, durationsMins: 2 },
    ]);
  });

  it("treats proofs without jump dates as passed with an unknown date", () => {
    const info = getQuestPassedInfo(
      {
        empty: proof([]),
      },
      true,
    );
    assert.deepStrictEqual(info, {
      loading: false,
      passedAt: true,
      passings: [],
    });
  });

  it("keeps a known date from other proofs and skips empty logs in passings", () => {
    const start = Date.UTC(2024, 5, 10, 8, 0, 0);
    const end = start + 60 * 1000;
    const info = getQuestPassedInfo(
      {
        empty: proof([]),
        dated: proof([start, end]),
      },
      true,
    );
    assert.strictEqual(info.loading, false);
    assert.ok(info.passedAt instanceof Date);
    assert.strictEqual((info.passedAt as Date).getTime(), end);
    assert.deepStrictEqual(info.passings, [
      { seed: "dated", started: start, end, durationsMins: 1 },
    ]);
  });

  it("rounds duration up to the next minute", () => {
    const start = 1_000_000;
    const info = getQuestPassedInfo(
      {
        almost: proof([start, start + 1]),
        exact: proof([start, start + 60 * 1000]),
      },
      true,
    );
    assert.deepStrictEqual(
      info.passings.map((p) => [p.seed, p.durationsMins]),
      [
        ["almost", 1],
        ["exact", 1],
      ],
    );
  });
});
