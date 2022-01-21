import * as assert from "assert";
import "mocha";

import { splitStringToTokens } from "../ui/questReplaceTags.split";

describe("stringParse", () => {
  for (const [str, expected] of (
    [
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
        "Lol <clr><Ranger><Ranger><clrEnd>",
        [
          {
            text: "Lol ",
            type: "text",
          },
          {
            tag: "clr",
            type: "tag",
          },
          {
            type: "text",
            text: "<Ranger><Ranger>",
          },
          {
            tag: "clrEnd",
            type: "tag",
          },
        ],
      ],

      [
        "<format=right,30>BB</format>",
        [
          {
            format: {
              kind: "right",
              numberOfSpaces: 30,
            },
            type: "format",
          },
          {
            text: "BB",
            type: "text",
          },
          {
            tag: "/format",
            type: "tag",
          },
        ],
      ],
      [
        "B<color=2,3,4>C",
        [
          {
            text: "B",
            type: "text",
          },
          {
            color: {
              b: 4,
              g: 3,
              r: 2,
            },
            type: "color",
          },
          {
            text: "C",
            type: "text",
          },
        ],
      ],

      [
        "B<color>CD",
        [
          {
            text: "B",
            type: "text",
          },
          {
            color: undefined,
            type: "color",
          },
          {
            text: "CD",
            type: "text",
          },
        ],
      ],

      [
        "B<format>CD",
        [
          {
            text: "B",
            type: "text",
          },
          {
            format: undefined,
            type: "format",
          },
          {
            text: "CD",
            type: "text",
          },
        ],
      ],
    ] as const
  ).slice()) {
    it(`Splitting '${str}'`, () => {
      const observed = splitStringToTokens(str);
      //console.info("\n\n", JSON.stringify(observed, null, 4), "\n\n");
      assert.deepEqual(observed, expected);
    });
  }
});
