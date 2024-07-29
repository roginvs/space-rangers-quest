import * as assert from "assert";
import { brAndNobrTags } from "./brAndNobrTags";

describe("brAndNobrTags", () => {
  it("should split the text by <br> into separate lines", () => {
    const texts = ["a", " b <br> c ", "d", "<br>", "c"];
    const result = brAndNobrTags(texts);
    assert.deepEqual(result, ["a", " b ", " c ", "d", "", "", "c"]);
  });

  it("should join line with next if it ends with <nobr>", () => {
    const texts = ["a", "b<nobr>", "c", "d", "<nobr>"];
    const result = brAndNobrTags(texts);
    assert.deepEqual(result, ["a", "bc", "d", ""]);
  });

  it("should not cut last empty line", () => {
    const texts = ["a", ""];
    const result = brAndNobrTags(texts);
    assert.deepEqual(result, ["a", ""]);
  });
});
