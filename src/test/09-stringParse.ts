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

    [
      "A<Ranger><Date> B <FromPlanet>",

      [
        {
          text: "A",
          type: "text",
        },
        {
          player: "Ranger",
          type: "ranger",
        },
        {
          player: "Date",
          type: "ranger",
        },
        {
          text: " B ",
          type: "text",
        },
        {
          player: "FromPlanet",
          type: "ranger",
        },
      ],
    ],
  ] as const) {
    it(`Parsing '${str}'`, () => {
      const observed = stringParse(str);
      //console.info("\n\n", JSON.stringify(observed, null, 4), "\n\n");
      assert.deepEqual(observed, expected);
    });
  }
});
