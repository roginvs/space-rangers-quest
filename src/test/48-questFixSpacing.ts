import * as assert from "assert";
import classNames from "classnames";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "mocha";
import { QuestReplaceTags } from "../ui/questReplaceTags";
import { formatTokens } from "../ui/questReplaceTags.format";
import { splitStringToTokens } from "../ui/questReplaceTags.split";

const nbsp = "\u00A0";

// Frozen reference for the original master renderer. HTML is compared
// byte-for-byte for input that does not begin a line with <fix>.
function renderLegacy(str: string, withLinks = false): string {
  const tags = formatTokens(splitStringToTokens(str));
  const children = tags.map((tag, index) => {
    const linked = tag.type === "text" && !!tag.links && withLinks;
    const body =
      tag.type === "text"
        ? tag.text
        : React.createElement(React.Fragment, null, React.createElement("br"), nbsp);
    return React.createElement(
      "span",
      {
        key: index,
        className: classNames("game-text", {
          "game-fix": tag.isFix,
          "game-clr": tag.type === "text" ? tag.isClr : undefined,
          "game-text-link": linked,
        }),
        style: {
          color:
            tag.type === "text" && tag.color
              ? `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})`
              : undefined,
        },
        role: linked ? "link" : undefined,
        tabIndex: linked ? 0 : undefined,
      },
      body,
    );
  });
  return renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement("span", { className: "game-text" }, nbsp),
      ...children,
    ),
  );
}

function render(str: string, withLinks = false) {
  return renderToStaticMarkup(
    React.createElement(QuestReplaceTags, {
      str,
      onLinkClick: withLinks ? () => {} : undefined,
    }),
  );
}

function countIndents(html: string) {
  return html.split(nbsp).length - 1;
}

describe("QuestReplaceTags paragraph indent compatibility", () => {
  it("preserves the exact original HTML for non-fixed line starts", () => {
    const originalCases = [
      "",
      "Hello",
      "First line\nSecond line",
      "One\n\nTwo",
      "\n\n",
      "One\n",
      "One\r\nTwo",
      "One\n \n Two",
      "  Leading spaces",
      "<clr>colored</clr> text",
      "<color=255,80,0>orange</color> text",
      "A<fix>mono</fix>B",
      "Start\n<clr>Colored</clr>",
      "<format=left,8>A</format>B",
      ">> Option text",
    ];
    for (const input of originalCases) {
      assert.strictEqual(render(input), renderLegacy(input), input);
    }
    assert.strictEqual(
      render("<link=Next>Go</link> now", true),
      renderLegacy("<link=Next>Go</link> now", true),
    );
  });

  it("suppresses only the inserted indent when a line begins with <fix>", () => {
    assert.strictEqual(countIndents(render("<fix>┌─┐\n│ │\n└─┘</fix>")), 0);
    assert.ok(render("<fix>┌─┐\n│ │\n└─┘</fix>").includes("│ │"));
    assert.strictEqual(countIndents(render("Text\n<clr><fix>A\nB</fix></clr>\nText")), 2);
    assert.strictEqual(countIndents(render("<fix>A\n</fix>Normal")), 1);
    assert.strictEqual(countIndents(render("<fix>A</fix>\nNormal")), 1);
  });

  it("keeps empty lines and every original NBSP not followed by fixed text", () => {
    assert.strictEqual(countIndents(render("One\n\n<fix>Two</fix>")), 2);
    assert.strictEqual(countIndents(render("<fix>A</fix>\n\nNormal")), 2);
    assert.strictEqual(countIndents(render("One\n\nTwo")), 3);
  });

  it("preserves author-supplied spaces inside <fix> exactly", () => {
    const html = render("<fix>  A\n B</fix>");
    assert.ok(html.includes("  A"));
    assert.ok(html.includes(" B"));
    assert.strictEqual(countIndents(html), 0);
  });
});
