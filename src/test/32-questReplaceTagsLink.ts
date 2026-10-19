import * as assert from "assert";
import "mocha";

import { splitStringToTokens } from "../ui/questReplaceTags.split";
import { formatTokens } from "../ui/questReplaceTags.format";

describe("splitStringToTokens <link>", function () {
  it(`Single link`, () => {
    assert.deepStrictEqual(splitStringToTokens("<link=Jump>A</link>"), [
      { type: "linkStart", jumps: ["Jump"] },
      { type: "text", text: "A" },
      { type: "linkEnd" },
    ]);
  });

  it(`Text around the link`, () => {
    assert.deepStrictEqual(splitStringToTokens("a<link=Jump>B</link>c"), [
      { type: "text", text: "a" },
      { type: "linkStart", jumps: ["Jump"] },
      { type: "text", text: "B" },
      { type: "linkEnd" },
      { type: "text", text: "c" },
    ]);
  });

  it(`Several jumps separated by semicolons, spaces trimmed`, () => {
    assert.deepStrictEqual(
      splitStringToTokens("<link= Открыть дверь ; Войти в комнату ; Взять ключ >key</link>"),
      [
        {
          type: "linkStart",
          jumps: ["Открыть дверь", "Войти в комнату", "Взять ключ"],
        },
        { type: "text", text: "key" },
        { type: "linkEnd" },
      ],
    );
  });

  it(`Quotes are not part of the syntax and stay in the name`, () => {
    assert.deepStrictEqual(splitStringToTokens('<link="Jump">A</link>'), [
      { type: "linkStart", jumps: ['"Jump"'] },
      { type: "text", text: "A" },
      { type: "linkEnd" },
    ]);
  });

  it(`Inner formatting tags are kept as tokens`, () => {
    assert.deepStrictEqual(splitStringToTokens("<link=J><clr>H</link></clr>"), [
      { type: "linkStart", jumps: ["J"] },
      { type: "tag", tag: "clr" },
      { type: "text", text: "H" },
      { type: "linkEnd" },
      { type: "tag", tag: "/clr" },
    ]);
  });

  it(`Nested links are simply parsed one after another`, () => {
    const tokens = splitStringToTokens("<link=A>1<link=B>2</link></link>");
    assert.deepStrictEqual(tokens, [
      { type: "linkStart", jumps: ["A"] },
      { type: "text", text: "1" },
      { type: "linkStart", jumps: ["B"] },
      { type: "text", text: "2" },
      { type: "linkEnd" },
      { type: "linkEnd" },
    ]);
  });

  it(`No percent encoding, any character inside the name until first >`, () => {
    assert.deepStrictEqual(splitStringToTokens("<link=See & [l]!>x</link>"), [
      { type: "linkStart", jumps: ["See & [l]!"] },
      { type: "text", text: "x" },
      { type: "linkEnd" },
    ]);
  });
});

describe("formatTokens <link>", function () {
  it(`Text inside the link gets the jumps, no visual marks`, () => {
    const formatted = formatTokens(splitStringToTokens("<link=Открыть дверь>дверь</link>"));
    assert.deepStrictEqual(formatted, [
      {
        type: "text",
        text: "дверь",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: ["Открыть дверь"],
      },
    ]);
  });

  it(`Link inside clr and fix keeps all the flags`, () => {
    const formatted = formatTokens(
      splitStringToTokens("<fix><clr><link=Ввести код>КОД</link><clrEnd></fix>"),
    );
    assert.deepStrictEqual(formatted, [
      {
        type: "text",
        text: "КОД",
        isClr: true,
        isFix: true,
        color: undefined,
        links: ["Ввести код"],
      },
    ]);
  });

  it(`Link inside <color> keeps the color`, () => {
    const formatted = formatTokens(splitStringToTokens("<color=1,2,3><link=J>hi</link></color>"));
    assert.deepStrictEqual(formatted, [
      {
        type: "text",
        text: "hi",
        isClr: undefined,
        isFix: undefined,
        color: { r: 1, g: 2, b: 3 },
        links: ["J"],
      },
    ]);
  });

  it(`Text after the link closing has no links`, () => {
    const formatted = formatTokens(splitStringToTokens("<link=A>x</link>y"));
    assert.deepStrictEqual(formatted, [
      {
        type: "text",
        text: "x",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: ["A"],
      },
      {
        type: "text",
        text: "y",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: undefined,
      },
    ]);
  });

  it(`Unclosed link is ignored and text renders as normal text`, () => {
    const formatted = formatTokens(splitStringToTokens("<link=A>xyz"));
    assert.deepStrictEqual(formatted, [
      {
        type: "text",
        text: "xyz",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: undefined,
      },
    ]);
  });

  it(`Nested link inner end does not stop the outer link`, () => {
    const formatted = formatTokens(splitStringToTokens("<link=A>1<link=B>2</link>3</link>"));
    assert.deepStrictEqual(formatted, [
      {
        type: "text",
        text: "1",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: ["A"],
      },
      {
        type: "text",
        text: "2",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: ["A"],
      },
      {
        type: "text",
        text: "3",
        isClr: undefined,
        isFix: undefined,
        color: undefined,
        links: ["A"],
      },
    ]);
  });
});
