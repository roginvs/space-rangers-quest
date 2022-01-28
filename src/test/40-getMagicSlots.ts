import * as assert from "assert";
import "mocha";
import { getMagicSlots } from "../ui/questList.magicSlots";
describe(`getMagicSlots`, () => {
  it(`No games`, () => assert.deepStrictEqual(getMagicSlots([], [], 3), []));
  it(`One game`, () => assert.deepStrictEqual(getMagicSlots(["A"], [], 3), ["A"]));
  it(`No passed games`, () =>
    assert.deepStrictEqual(getMagicSlots(["A", "B", "C", "D", "E", "F"], [], 3), ["A", "B", "C"]));
  it(`One passed game`, () =>
    assert.deepStrictEqual(getMagicSlots(["A", "B", "C", "D", "E", "F"], ["B"], 3), [
      "A",
      "D",
      "C",
    ]));

  it(`Two passed games`, () =>
    assert.deepStrictEqual(getMagicSlots(["A", "B", "C", "D", "E", "F"], ["B", "A"], 3), [
      "E",
      "D",
      "C",
    ]));

  it(`Three passed games`, () =>
    assert.deepStrictEqual(getMagicSlots(["A", "B", "C", "D", "E", "F"], ["B", "A", "E"], 3), [
      "F",
      "D",
      "C",
    ]));

  it(`Four passed games, one slot should be undefined`, () =>
    assert.deepStrictEqual(getMagicSlots(["A", "B", "C", "D", "E", "F"], ["B", "A", "E", "C"], 3), [
      "F",
      "D",
      undefined,
    ]));

  it(`All games are passed`, () =>
    assert.deepStrictEqual(
      getMagicSlots(["A", "B", "C", "D", "E", "F"], ["B", "A", "E", "C", "F", "D"], 3),
      [undefined, undefined, undefined],
    ));

  it(`Passing order did not follow suggestions`, () =>
    assert.deepStrictEqual(getMagicSlots(["A", "B", "C", "D", "E", "F"], ["D", "B"], 3), [
      "A",
      "E",
      "C",
    ]));
});
