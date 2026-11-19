import * as assert from "assert";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "mocha";
import { QuestReplaceTags } from "../ui/questReplaceTags";

function getIndentStructure(str: string) {
  const element = QuestReplaceTags({ str });
  const tokens = element.props.children as React.ReactElement[];
  return tokens
    .map((token): string | null => {
      if (token.type === "br") {
        return "newline";
      }
      const [indent, text] = token.props.children as [React.ReactElement | null, React.ReactElement];
      if (!text.props.children) {
        return null; // Empty text token after a tag boundary or newline
      }
      return indent ? "indented" : "flush";
    })
    .filter((x) => x !== null);
}

describe("QuestReplaceTags paragraph indents", () => {
  it("keeps the original indentation for ordinary text and line breaks", () => {
    assert.deepStrictEqual(getIndentStructure("First line\nSecond line"), [
      "indented", "newline", "indented",
    ]);
  });

  it("does not insert any extra characters into a fixed-width diagram", () => {
    assert.deepStrictEqual(getIndentStructure("<fix>┌──┐\n│  │\n└──┘</fix>"), [
      "flush", "newline", "flush", "newline", "flush",
    ]);
    const html = renderToStaticMarkup(
      React.createElement(QuestReplaceTags, { str: "<fix>  A\n B</fix>" }),
    );
    assert.ok(html.includes("  A"));
    assert.ok(html.includes(" B"));
    assert.ok(!html.includes("\u00A0"));
    assert.ok(!html.includes("\u200B"));
  });

  it("handles transitions from prose to fix and back, including style tags", () => {
    assert.deepStrictEqual(
      getIndentStructure("Description\n<clr><fix>X\nY</fix></clr>\nAfter"),
      ["indented", "newline", "flush", "newline", "flush", "newline", "indented"],
    );
  });

  it("indents normal text after a newline that was inside a now-closed fix tag", () => {
    assert.deepStrictEqual(getIndentStructure("<fix>A\n</fix>Normal"), [
      "flush", "newline", "indented",
    ]);
  });

  it("does not indent empty lines, but preserves each explicit newline", () => {
    assert.deepStrictEqual(getIndentStructure("One\n\nTwo"), [
      "indented", "newline", "newline", "indented",
    ]);
  });
});
