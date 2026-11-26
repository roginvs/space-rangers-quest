import * as assert from "assert";
import "mocha";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestReplaceTags } from "../ui/questReplaceTags";
import { formatTokens } from "../ui/questReplaceTags.format";
import { paragraphSignature, splitTokensToParagraphs } from "../ui/questReplaceTags.paragraphs";
import { splitStringToTokens } from "../ui/questReplaceTags.split";
import {
  chunksWordsChars,
  computeWordWaveSchedule,
  splitRunsIntoChunks,
  wordWaveDuration,
  wordWaveStep,
  wordWaveTotalDuration,
  WORD_WAVE_MAX_STEP_MS,
  WORD_WAVE_MIN_DURATION_MS,
  WORD_WAVE_MIN_STEP_MS,
  WORD_WAVE_TOTAL_MS,
} from "../ui/wordWave/wordWave.schedule";

describe("Word wave", () => {
  it("Splits formatted tokens into paragraphs keeping styles across lines", () => {
    const tokens = formatTokens(splitStringToTokens("a <clr>b\nc<clrEnd> d\n\ne"));
    const paragraphs = splitTokensToParagraphs(tokens);
    assert.strictEqual(paragraphs.length, 4);
    paragraphs.forEach((paragraph) =>
      paragraph.tokens.forEach((token, i) =>
        assert.strictEqual(tokens[paragraph.start + i], token),
      ),
    );
    const second = paragraphs[1].tokens;
    assert.deepStrictEqual(
      second.map((token) => token.type),
      ["newline", "text", "text"],
    );
    const c = second[1];
    assert.ok(c.type === "text" && c.text === "c" && c.isClr);
    const d = second[2];
    assert.ok(d.type === "text" && d.text === " d" && !d.isClr);
    assert.strictEqual(paragraphs[2].tokens[0].type, "newline");
    assert.ok(paragraphs[2].tokens.every((token) => token.type === "newline" || token.text === ""));
  });

  it("Paragraph signature changes with text, styles and links", () => {
    const sig = (str: string) => {
      const paragraphs = splitTokensToParagraphs(formatTokens(splitStringToTokens(str)));
      assert.strictEqual(paragraphs.length, 1);
      return paragraphSignature(paragraphs[0].tokens);
    };
    const base = sig("a <clr>bc<clrEnd> d");
    assert.strictEqual(sig("a <clr>bc<clrEnd> d"), base);
    assert.notStrictEqual(sig("a <clr>b<clrEnd>c d"), base, "same text, other highlight");
    assert.notStrictEqual(sig("a <clr>bc<clrEnd> e"), base);
    assert.notStrictEqual(sig("<fix>a <clr>bc<clrEnd> d</fix>"), base);
    assert.notStrictEqual(sig("<color=1,2,3>a <clr>bc<clrEnd> d</color>"), base);
    assert.notStrictEqual(sig("<link=X>a</link>"), sig("<link=Y>a</link>"));
    assert.notStrictEqual(sig("<link=X;Y>a</link>"), sig("<link=X>a</link>"));
    assert.notStrictEqual(sig("<link=X>a</link>"), sig("a"));
    assert.notStrictEqual(sig("ab"), sig("a<clr><clrEnd>b"), "token boundaries count");
  });

  it("Splits runs into words, a word can span several runs", () => {
    const chunks = splitRunsIntoChunks(["  Га", "ал", "", " смотрит  на", " вас "]);
    assert.deepStrictEqual(
      chunks.map((chunk) => [chunk.type, chunk.pieces.map((p) => `${p.run}:${p.text}`)]),
      [
        ["space", ["0:  "]],
        ["word", ["0:Га", "1:ал"]],
        ["space", ["3: "]],
        ["word", ["3:смотрит"]],
        ["space", ["3:  "]],
        ["word", ["3:на"]],
        ["space", ["4: "]],
        ["word", ["4:вас"]],
        ["space", ["4: "]],
      ],
    );
    assert.deepStrictEqual(chunksWordsChars(chunks), [4, 7, 2, 3]);
    assert.deepStrictEqual(splitRunsIntoChunks([]), []);
  });

  it("Step is the same for all words and shrinks for long texts", () => {
    assert.strictEqual(wordWaveStep(1), WORD_WAVE_MAX_STEP_MS);
    assert.strictEqual(wordWaveStep(0), WORD_WAVE_MAX_STEP_MS);
    assert.strictEqual(wordWaveStep(100), WORD_WAVE_TOTAL_MS / 100);
    assert.strictEqual(wordWaveStep(100000), WORD_WAVE_MIN_STEP_MS);
    assert.strictEqual(wordWaveDuration(WORD_WAVE_MAX_STEP_MS), WORD_WAVE_MAX_STEP_MS * 5);
    assert.strictEqual(wordWaveDuration(WORD_WAVE_MIN_STEP_MS), WORD_WAVE_MIN_DURATION_MS);
    assert.strictEqual(wordWaveDuration(40), 200);
  });

  it("Animates everything on first render as one continuous wave", () => {
    const schedule = computeWordWaveSchedule(
      [
        { signature: "a", words: [10, 1] },
        { signature: "", words: [] },
        { signature: "b", words: [20] },
      ],
      undefined,
    );
    const step = wordWaveStep(3);
    const duration = wordWaveDuration(step);
    assert.deepStrictEqual(schedule, [
      [
        { delay: 0, duration },
        { delay: step, duration },
      ],
      [],
      [{ delay: 2 * step, duration }],
    ]);
    assert.strictEqual(wordWaveTotalDuration(schedule), 2 * step + duration);
  });

  it("Skips unchanged lines (by index) and does not count them in delays or step", () => {
    const schedule = computeWordWaveSchedule(
      [
        { signature: "same", words: [10, 10, 10] },
        { signature: "changed", words: [10] },
        { signature: "same2", words: [10] },
        { signature: "new", words: [10] },
      ],
      ["same", "old", "same2"],
    );
    const step = wordWaveStep(2);
    const duration = wordWaveDuration(step);
    assert.deepStrictEqual(schedule, [
      null,
      [{ delay: 0, duration }],
      null,
      [{ delay: step, duration }],
    ]);
    assert.strictEqual(wordWaveTotalDuration([null, null]), 0);
  });

  it("A long text appears in about the total time", () => {
    const words = new Array(110).fill(5);
    const schedule = computeWordWaveSchedule([{ signature: "x", words }], undefined);
    const total = wordWaveTotalDuration(schedule);
    assert.ok(total >= WORD_WAVE_TOTAL_MS && total <= WORD_WAVE_TOTAL_MS + 350, `${total}`);
  });

  describe("QuestTextWave rendering", () => {
    // wordWave.tsx imports css, which is handled by webpack only
    // tslint:disable-next-line:deprecation
    require.extensions[".css"] = () => undefined;
    const { QuestTextWave } = require("../ui/questPlay/questPlay.text");
    const render = (str: string, prev?: string[]) =>
      renderToStaticMarkup(
        React.createElement(QuestTextWave, {
          str,
          onLinkClick: () => {},
          prevParagraphs: { current: prev },
        }),
      );
    const withoutWordSpans = (html: string) =>
      html.replace(/<span( class="word-wave-word" style="[^"]*")?>([^<]*)<\/span>/g, "$2");

    it("Keeps a multi-word link as a single focusable element", () => {
      const html = render("Go <link=Open>Open the door</link> now");
      assert.strictEqual(html.split('role="link"').length - 1, 1);
      assert.strictEqual(html.split('tabindex="0"').length - 1, 1);
      const link = /<span[^>]*role="link"[^>]*>(.*?)<\/span><span/.exec(html);
      assert.ok(link, html);
      assert.strictEqual(link![1].split("word-wave-word").length - 1, 3);
      assert.strictEqual(withoutWordSpans(link![1]), "Open the door");
    });

    it("Renders the same markup as QuestReplaceTags apart from word spans", () => {
      const str = "a <clr>b\nc<clrEnd> d <link=X>e f</link>\n\n<fix>g</fix>  h";
      const html = render(str);
      assert.ok(html.includes("word-wave-word"));
      assert.strictEqual(
        withoutWordSpans(html),
        renderToStaticMarkup(React.createElement(QuestReplaceTags, { str, onLinkClick: () => {} })),
      );
    });

    it("Does not animate paragraphs which are the same as in the previous text", () => {
      const str = "first paragraph\nsecond paragraph";
      const paragraphs = splitTokensToParagraphs(formatTokens(splitStringToTokens(str)));
      const prev = [paragraphSignature(paragraphs[0].tokens), "old"];
      const html = render(str, prev);
      assert.ok(!/word-wave-word[^>]*>first/.test(html), html);
      assert.ok(/word-wave-word[^>]*>second/.test(html), html);
      assert.ok(/animation-delay:0ms[^>]*>second/.test(html), html);
    });
  });
});
