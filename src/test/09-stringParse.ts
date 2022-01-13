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
          type: "tag",
          tag: "",
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
          type: "tag",
          tag: "Ranger",
        },
        {
          type: "tag",
          tag: "Date",
        },
        {
          text: " B ",
          type: "text",
        },
        {
          type: "tag",
          tag: "FromPlanet",
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
      "R [p10]-",
      [
        {
          text: "R ",
          type: "text",
        },
        {
          paramNumber: 10,
          type: "param",
        },
        {
          text: "-",
          type: "text",
        },
      ],
    ],
    [
      "R [d8]-",
      [
        {
          text: "R ",
          type: "text",
        },
        {
          paramNumber: 8,
          type: "paramstr",
        },
        {
          text: "-",
          type: "text",
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
