import * as assert from "assert";
import "mocha";
import { stringParse } from "../lib/stringParse";

describe("stringParse", () => {
  for (const [str, expected] of [["", []]] as const) {
    it(`Parsing '${str}'`, () => assert.deepEqual(stringParse(str), expected));
  }
});
