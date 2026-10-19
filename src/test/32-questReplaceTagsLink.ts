import * as assert from "assert";
import "mocha";

import { splitStringToTokens } from "../ui/questReplaceTags.split";
import { formatTokens } from "../ui/questReplaceTags.format";

describe("splitStringToTokens <link>", () => {
  for (const [str, expected] of [
    [
      "<link=Jump>A</link>",
      [{ type: "linkStart", jumps: ["Jump"] }, { type: "text", text: "A" }, { type: "linkEnd" }],
    ],
    [
      "a<link=Jump>B</link>c",
      [
        { type: "text", text: "a" },
        { type: "linkStart", jumps: ["Jump"] },
        { type: "text", text: "B" },
        { type: "linkEnd" },
        { type: "text", text: "c" },
      ],
    ],
    [
      "<link= Открыть дверь ; Войти в комнату ; Взять ключ >key</link>",
      [
        { type: "linkStart", jumps: ["Открыть дверь", "Войти в комнату", "Взять ключ"] },
        { type: "text", text: "key" },
        { type: "linkEnd" },
      ],
    ],
    [
      '<link="Jump">A</link>',
      [{ type: "linkStart", jumps: ['"Jump"'] }, { type: "text", text: "A" }, { type: "linkEnd" }],
    ],
    [
      "<link=J><clr>H</clr></link>",
      [
        { type: "linkStart", jumps: ["J"] },
        { type: "tag", tag: "clr" },
        { type: "text", text: "H" },
        { type: "tag", tag: "/clr" },
        { type: "linkEnd" },
      ],
    ],
    [
      "<link=See & [l]!>x</link>",
      [
        { type: "linkStart", jumps: ["See & [l]!"] },
        { type: "text", text: "x" },
        { type: "linkEnd" },
      ],
    ],
    [
      "<link=<clr>7<clrEnd> правок>x</link>",
      [
        { type: "linkStart", jumps: ["<clr>7<clrEnd> правок"] },
        { type: "text", text: "x" },
        { type: "linkEnd" },
      ],
    ],
    [
      "<link=Доход < 100>проверить</link>",
      [
        { type: "linkStart", jumps: ["Доход < 100"] },
        { type: "text", text: "проверить" },
        { type: "linkEnd" },
      ],
    ],
    [
      "<link=<color1,2,3><formatleft,4>hi</format></color>>x</link>",
      [
        { type: "linkStart", jumps: ["<color1,2,3><formatleft,4>hi</format></color>"] },
        { type: "text", text: "x" },
        { type: "linkEnd" },
      ],
    ],
  ] as const) {
    it(`Splitting '${str}'`, () => {
      assert.deepStrictEqual(splitStringToTokens(str), expected);
    });
  }
});

describe("formatTokens <link>", () => {
  for (const [str, expected] of [
    [
      "<link=Открыть дверь>дверь</link>",
      [{ type: "text", text: "дверь", links: ["Открыть дверь"] }],
    ],
    [
      "<fix><clr><link=Ввести код>КОД</link><clrEnd></fix>",
      [{ type: "text", text: "КОД", isClr: true, isFix: true, links: ["Ввести код"] }],
    ],
    [
      "<color=1,2,3><link=J>hi</link></color>",
      [{ type: "text", text: "hi", color: { r: 1, g: 2, b: 3 }, links: ["J"] }],
    ],
    [
      "<link=A>x</link>y",
      [
        { type: "text", text: "x", links: ["A"] },
        { type: "text", text: "y" },
      ],
    ],
    ["<link=A>xyz", [{ type: "text", text: "xyz", links: ["A"] }]],
    ["</link>xyz", [{ type: "text", text: "xyz" }]],
    [
      "<link=J><fix><clr>A</clr>B</fix></link>",
      [
        { type: "text", text: "A", isClr: true, isFix: true, links: ["J"] },
        { type: "text", text: "B", isFix: true, links: ["J"] },
      ],
    ],
    [
      "<link=J><format=left,4>hi</format></link>",
      [
        { type: "text", text: "  ", links: ["J"] },
        { type: "text", text: "hi", links: ["J"] },
      ],
    ],
    [
      "<link=J><format=right,4>hi</format></link>",
      [
        { type: "text", text: "hi", links: ["J"] },
        { type: "text", text: "  ", links: ["J"] },
      ],
    ],
    [
      "<link=J><format=center,4>hi</format></link>",
      [
        { type: "text", text: " ", links: ["J"] },
        { type: "text", text: "hi", links: ["J"] },
        { type: "text", text: " ", links: ["J"] },
      ],
    ],
    [
      "<format=left,4><link=J>hi</link></format>",
      [
        { type: "text", text: "  " },
        { type: "text", text: "hi", links: ["J"] },
      ],
    ],
    [
      "<link=J>a\nb</link>",
      [
        { type: "text", text: "a", links: ["J"] },
        { type: "newline" },
        { type: "text", text: "b", links: ["J"] },
      ],
    ],
  ] as const) {
    it(`Formatting '${str}'`, () => {
      const observed = formatTokens(splitStringToTokens(str));
      assert.deepStrictEqual(JSON.parse(JSON.stringify(observed)), expected);
    });
  }
});
