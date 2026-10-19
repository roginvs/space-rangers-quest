import * as assert from "assert";
import * as fs from "fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "mocha";
import { QuestReplaceTags } from "../ui/questReplaceTags";

describe("QuestReplaceTags link rendering", () => {
  it("Adds only a cursor class, preserving the existing appearance", () => {
    for (const [plain, linked] of [
      ["door", "<link=Open>door</link>"],
      ["<clr><fix>door</fix></clr>", "<clr><fix><link=Open>door</link></fix></clr>"],
      ["<color=1,2,3>door</color>", "<link=Open><color=1,2,3>door</color></link>"],
    ]) {
      const render = (str: string) =>
        renderToStaticMarkup(React.createElement(QuestReplaceTags, { str, onLinkClick: () => {} }));
      assert.strictEqual(render(linked).replace(/ game-text-link/g, ""), render(plain));
    }
    const css = fs.readFileSync(__dirname + "/../ui/questPlay/questPlay.css", "utf8");
    const rule = css.match(/\.game-root \.game-text-link\s*\{([^}]*)\}/);
    assert.ok(rule);
    assert.strictEqual(rule![1].trim(), "cursor: pointer;");
  });

  it("Stops bubbling to a choice and sends the whole chain once", () => {
    const calls: string[][] = [];
    const rendered = QuestReplaceTags({
      str: "<link=Open;Enter>door</link>",
      onLinkClick: (jumps) => calls.push(jumps),
    });
    const spans = rendered.props.children[1] as React.ReactElement[];
    let prevented = 0;
    let stopped = 0;
    spans[0].props.onClick({
      preventDefault: () => prevented++,
      stopPropagation: () => stopped++,
    });
    assert.strictEqual(prevented, 1);
    assert.strictEqual(stopped, 1);
    assert.deepStrictEqual(calls, [["Open", "Enter"]]);
  });

  it("Shows plain text when no click handler is supplied", () => {
    const rendered = renderToStaticMarkup(
      React.createElement(QuestReplaceTags, {
        str: "<link=Open>door</link>",
      }),
    );
    assert.ok(rendered.includes("door"));
    assert.ok(!rendered.includes("game-text-link"));
    assert.ok(!rendered.includes("&lt;link"));
  });
});
