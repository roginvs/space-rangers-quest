import * as assert from "assert";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "mocha";
import { QuestReplaceTags } from "../ui/questReplaceTags";

describe("QuestReplaceTags fixed-width line spacing", () => {
  it("does not add a visible column before the first line or after a newline", () => {
    const html = renderToStaticMarkup(
      React.createElement(QuestReplaceTags, {
        str: "<fix>┌──┐\n│  │\n└──┘</fix>",
      }),
    );
    assert.ok(!html.includes("\u00A0"));
    assert.ok(!html.includes("&#xA0;"));
    assert.ok(html.includes("┌──┐"));
    assert.ok(html.includes("│  │"));
    assert.ok(html.includes("└──┘"));
    assert.ok(html.includes("<br"));
  });

  it("keeps explicit indentation in quest markup", () => {
    const html = renderToStaticMarkup(
      React.createElement(QuestReplaceTags, {
        str: "<fix>  A\n B</fix>",
      }),
    );
    assert.ok(html.includes("  A"));
    assert.ok(html.includes(" B"));
    assert.ok(html.includes("game-fix"));
  });
});
