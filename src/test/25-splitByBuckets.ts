import { splitByBuckets } from "../ui/store";
import * as assert from "assert";
import "mocha";

describe(`splitByBuckets`, function () {
  it("Empty array", () => assert.deepEqual(splitByBuckets([], 1), [[]]));
  it("One bucket with 6 elements", () =>
    assert.deepEqual(splitByBuckets([1, 2, 3, 4, 5, 6], 1), [[1, 2, 3, 4, 5, 6]]));
  it("Two buckets with 6 elements", () =>
    assert.deepEqual(splitByBuckets([1, 2, 3, 4, 5, 6], 2), [
      [1, 3, 5],
      [2, 4, 6],
    ]));
  it("Three buckets with 6 elements", () =>
    assert.deepEqual(splitByBuckets([1, 2, 3, 4, 5, 6], 3), [
      [1, 4],
      [2, 5],
      [3, 6],
    ]));
  it("Three buckets with 8 elements", () =>
    assert.deepEqual(splitByBuckets([1, 2, 3, 4, 5, 6, 7, 8], 3), [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6],
    ]));
});
