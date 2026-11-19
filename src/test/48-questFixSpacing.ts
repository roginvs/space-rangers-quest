import * as assert from "assert";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "mocha";
import { QuestReplaceTags } from "../ui/questReplaceTags";

const paragraphIndent = "\u00A0";
const zeroWidthSpace = "\u200B";

function collectIndents(str: string) {
  const tree = QuestReplaceTags({ str });
  const first = tree.props.children[0] as React.ReactElement;
  const tokens = tree.props.children[1] as React.ReactElement[];
  const newlines = tokens
    .filter((token) => typeof token.props.children !== "string")
    .map((token) => (token.props.children as React.ReactElement).props.children[1] as string);
  return { first: first.props.children as string, newlines };
}

describe("QuestReplaceTags paragraph indents", () => {
  it("preserves the original visible indent for regular paragraphs", () => {
    assert.deepStrictEqual(collectIndents("First line\nSecond line"), {
      first: paragraphIndent,
      newlines: [paragraphIndent],
    });
  });

  it("avoids extra columns before and within fixed-width diagrams", () => {
    assert.deepStrictEqual(collectIndents("<fix>┌──┐\n│  │\n└──┘</fix>"), {
      first: zeroWidthSpace,
      newlines: [zeroWidthSpace, zeroWidthSpace],
    });

    const html = renderToStaticMarkup(
      React.createElement(QuestReplaceTags, {
        str: "<fix>┌──┐\n│  │\n└──┘</fix>",
      }),
    );
    assert.ok(html.includes("┌──┐"));
    assert.ok(html.includes("│  │"));
    assert.ok(html.includes("└──┘"));
  });

  it("preserves ordinary paragraph indents on both sides of a fixed block", () => {
    assert.deepStrictEqual(collectIndents("Description\n<fix>X\nY</fix>\nAfter"), {
      first: paragraphIndent,
      newlines: [paragraphIndent, zeroWidthSpace, paragraphIndent],
    });
  });

  it("does not trim explicit spaces in diagram content", () => {
    const html = renderToStaticMarkup(
      React.createElement(QuestReplaceTags, { str: "<fix>  A\n B</fix>" }),
    );
    assert.ok(html.includes("  A"));
    assert.ok(html.includes(" B"));
  });
});
