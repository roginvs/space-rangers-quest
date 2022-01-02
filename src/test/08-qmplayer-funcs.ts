import * as assert from "assert";
import "mocha";

import { _sortJumps } from "../lib/qmplayer/funcs";
import { createDetermenisticRandom } from "../lib/randomFunc";

describe("Checking _sortJumps", function () {
  it(`Empty list returns empty`, () => {
    const r = _sortJumps([], () => assert.fail("no random"));
    assert.deepStrictEqual([], r);
  });
  it(`Sorting, all prios different`, () => {
    const r = _sortJumps(
      [
        { id: 0, showingOrder: 5 },
        { id: 1, showingOrder: 6 },
        { id: 2, showingOrder: 2 },
        { id: 3, showingOrder: 3 },
        { id: 4, showingOrder: 9 },
        { id: 5, showingOrder: 0 },
      ],
      () => assert.fail("no random"),
    );
    assert.deepStrictEqual(
      [
        { id: 5, showingOrder: 0 },
        { id: 2, showingOrder: 2 },
        { id: 3, showingOrder: 3 },
        { id: 0, showingOrder: 5 },
        { id: 1, showingOrder: 6 },
        { id: 4, showingOrder: 9 },
      ],
      r,
    );
  });

  it(`Sorting, have duplicated prios`, () => {
    const random = createDetermenisticRandom([1, 0, 0, 1]);
    const r = _sortJumps(
      [
        { id: 0, showingOrder: 5 },
        { id: 1, showingOrder: 6 },
        { id: 2, showingOrder: 2 },
        { id: 3, showingOrder: 3 },
        { id: 4, showingOrder: 9 },
        { id: 5, showingOrder: 0 },
        { id: 6, showingOrder: 5 },
        { id: 7, showingOrder: 2 },
        { id: 8, showingOrder: 3 },
        { id: 9, showingOrder: 3 },
      ],
      random,
    );
    assert.deepStrictEqual(
      [
        { id: 5, showingOrder: 0 },
        { id: 7, showingOrder: 2 },
        { id: 2, showingOrder: 2 },
        { id: 3, showingOrder: 3 },
        { id: 8, showingOrder: 3 },
        { id: 9, showingOrder: 3 },
        { id: 0, showingOrder: 5 },
        { id: 6, showingOrder: 5 },
        { id: 1, showingOrder: 6 },
        { id: 4, showingOrder: 9 },
      ],
      r,
    );
  });
});
