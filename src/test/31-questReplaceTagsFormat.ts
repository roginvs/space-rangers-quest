import * as assert from "assert";
import "mocha";
import { formatTokens } from "../ui/questReplaceTags.format";
import { splitStringToTokens } from "../ui/questReplaceTags.split";

describe("Checking substitute", function () {
  for (const [str, expected] of [
    ["", []],
    ["lol kek", [{ type: "text", text: "lol kek" }]],
    [
      "У вас <clr>30<clrEnd> кредитов",
      [
        { type: "text", text: "У вас " },
        { type: "text", text: "30", isClr: true },
        { type: "text", text: " кредитов" },
      ],
    ],
    [
      "У вас <clr>40</clr> кредитов",
      [
        { type: "text", text: "У вас " },
        { type: "text", text: "40", isClr: true },
        { type: "text", text: " кредитов" },
      ],
    ],
    [
      "Me <fix>1 2 3</fix> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "1 2 3", isFix: true },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=right,11>1 2 3</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "1 2 3" },
        { type: "text", text: "      " },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=left,11>1 2 3</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "      " },
        { type: "text", text: "1 2 3" },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center,11>1 2 3</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "   " },
        { type: "text", text: "1 2 3" },
        { type: "text", text: "   " },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center,11>1 2 33</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "  " },
        { type: "text", text: "1 2 33" },
        { type: "text", text: "   " },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center,11>===============</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "===============" },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center>!</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "!" },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=>!</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "!" },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Bla\nkek\r\nlol",
      [
        {
          text: "Bla",
          type: "text",
        },
        {
          type: "newline",
        },
        {
          text: "kek",
          type: "text",
        },
        {
          type: "newline",
        },
        {
          text: "lol",
          type: "text",
        },
      ],
    ],
  ] as const) {
    it(`stringCalculate '${str}'`, () => {
      const observed = formatTokens(splitStringToTokens(str));

      const observedNoUndefined = JSON.parse(JSON.stringify(observed));
      assert.deepStrictEqual(observedNoUndefined, expected);
    });
  }
});
