import * as assert from "assert";
import "mocha";
import { stringParse } from "../lib/stringParse";

describe("stringParse", () => {
  for (const [str, expected] of [
    ["", []],
    [
      "Just text",
      [
        {
          type: "text",
          text: "Just text",
        },
      ],
    ],

    [
      "Text <> with diamond",
      [
        {
          type: "text",
          text: "Text ",
        },
        {
          type: "diamond",
        },
        {
          type: "text",
          text: " with diamond",
        },
      ],
    ],
  ] as const) {
    it(`Parsing '${str}'`, () => assert.deepEqual(stringParse(str), expected));
  }
});
