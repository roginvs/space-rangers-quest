import * as assert from "assert";
import "mocha";
import { formatTokens, splitTokensToParagraphs } from "../ui/questReplaceTags.format";
import { splitStringToTokens } from "../ui/questReplaceTags.split";
import {
  chunksWordsChars,
  computeWordWaveSchedule,
  splitRunsIntoChunks,
  wordWaveDuration,
  wordWaveTotalDuration,
  WORD_WAVE_MIN_WORD_MS,
  WORD_WAVE_MS_PER_CHAR,
} from "../ui/wordWave/wordWave.schedule";

describe("Word wave", () => {
  it("Splits formatted tokens into paragraphs keeping styles across lines", () => {
    const paragraphs = splitTokensToParagraphs(
      formatTokens(splitStringToTokens("a <clr>b\nc<clrEnd> d\n\ne")),
    );
    assert.strictEqual(paragraphs.length, 4);
    assert.deepStrictEqual(
      paragraphs[1].map((token) => token.type),
      ["newline", "text", "text"],
    );
    const c = paragraphs[1][1];
    assert.ok(c.type === "text" && c.text === "c" && c.isClr);
    const d = paragraphs[1][2];
    assert.ok(d.type === "text" && d.text === " d" && !d.isClr);
    assert.strictEqual(paragraphs[2][0].type, "newline");
    assert.ok(paragraphs[2].every((token) => token.type === "newline" || token.text === ""));
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

  it("Animates everything on first render as one continuous wave", () => {
    const schedule = computeWordWaveSchedule(
      [
        { signature: "a", words: [10, 1] },
        { signature: "", words: [] },
        { signature: "b", words: [20] },
      ],
      undefined,
    );
    const d10 = 10 * WORD_WAVE_MS_PER_CHAR;
    const d1 = WORD_WAVE_MIN_WORD_MS;
    assert.strictEqual(wordWaveDuration(1), d1);
    assert.deepStrictEqual(schedule, [
      [
        { delay: 0, duration: d10 },
        { delay: d10 / 2, duration: d1 },
      ],
      [],
      [{ delay: d10 / 2 + d1 / 2, duration: 20 * WORD_WAVE_MS_PER_CHAR }],
    ]);
    assert.strictEqual(
      wordWaveTotalDuration(schedule),
      d10 / 2 + d1 / 2 + 20 * WORD_WAVE_MS_PER_CHAR,
    );
  });

  it("Skips unchanged lines (by index) and does not count them in delays", () => {
    const schedule = computeWordWaveSchedule(
      [
        { signature: "same", words: [10] },
        { signature: "changed", words: [10] },
        { signature: "same2", words: [10] },
        { signature: "new", words: [10] },
      ],
      ["same", "old", "same2"],
    );
    assert.deepStrictEqual(schedule, [
      null,
      [{ delay: 0, duration: 10 * WORD_WAVE_MS_PER_CHAR }],
      null,
      [{ delay: 5 * WORD_WAVE_MS_PER_CHAR, duration: 10 * WORD_WAVE_MS_PER_CHAR }],
    ]);
    assert.strictEqual(wordWaveTotalDuration([null, null]), 0);
  });
});
