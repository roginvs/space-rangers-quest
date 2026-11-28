import "mocha";
import * as assert from "assert";
import * as fs from "fs";
import * as pako from "pako";
import { parse } from "../lib/qmreader";
import { parseQuestGz } from "../lib/parseQuestGz";

describe("parseQuestGz", function () {
  const exts: Array<"qm" | "qmm"> = ["qm", "qmm"];
  for (const ext of exts) {
    it(`Ungzips and parses qmreader-1.${ext} the same as parse()`, () => {
      const raw = fs.readFileSync(__dirname + `/qmreader-1.${ext}`);
      const gz = Buffer.from(pako.gzip(raw));
      const fromGz = parseQuestGz(gz);
      const fromRaw = parse(raw);
      assert.deepStrictEqual(fromGz, fromRaw);
    });
  }

  it("Accepts an ArrayBuffer", () => {
    const raw = fs.readFileSync(__dirname + "/qmreader-1.qm");
    const gz = Buffer.from(pako.gzip(raw));
    const arrayBuffer = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    const quest = parseQuestGz(arrayBuffer);
    assert.strictEqual(quest.taskText, parse(raw).taskText);
  });

  it("Throws on data that is not gzip", () => {
    assert.throws(() => parseQuestGz(Buffer.from("not a gzip quest")));
  });
});
