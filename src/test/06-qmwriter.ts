import * as fs from "fs";
import * as assert from "assert";
import "mocha";
import { writeQmm, Writer } from "../lib/qmwriter";
import { HEADER_QMM_7, parse, Reader } from "../lib/qmreader";

describe("Writer class", () => {
  for (const chunkSize of [1, 3, 100]) {
    describe(`Chunk size = ${chunkSize}`, () => {
      it(`Empty buff`, () => {
        const w = new Writer();
        assert.strictEqual(w.export().length, 0);
      });
      it(`int32`, () => {
        const w = new Writer();
        w.int32(83758303);
        const buf = w.export();
        assert.strictEqual(w.export().length, 4);

        const r = new Reader(buf);
        assert.strictEqual(r.int32(), 83758303);
      });
      it(`byte`, () => {
        const w = new Writer();
        w.byte(243);
        const buf = w.export();
        assert.strictEqual(w.export().length, 1);

        const r = new Reader(buf);
        assert.strictEqual(r.byte(), 243);
      });
      it(`float64`, () => {
        const w = new Writer();
        const value = 0.123456789;
        w.float64(value);
        const buf = w.export();
        assert.strictEqual(w.export().length, 8);

        const r = new Reader(buf);
        assert.strictEqual(r.float64(), value);
      });
      it(`Empty string`, () => {
        const w = new Writer();
        w.writeString(null);
        const buf = w.export();
        assert.strictEqual(w.export().length, 4);

        const r = new Reader(buf);
        assert.strictEqual(r.readString(), ""); // ReadString returns "" if string is empty
      });

      it(`Not empty string with utf8 symbols`, () => {
        const w = new Writer();
        w.writeString("Лол куку");
        const buf = w.export();
        assert.strictEqual(w.export().length, 4 + 4 + 8 * 2);

        const r = new Reader(buf);
        assert.strictEqual(r.readString(), "Лол куку"); // ReadString returns "" if string is empty
      });
    });
  }
});

describe("All files here", () => {
  for (const f of fs.readdirSync(__dirname)) {
    if (!f.endsWith(".qm") && !f.endsWith(".qmm")) {
      continue;
    }
    if (f !== "qmreader-1.qmm") {
      continue;
    }

    const fileRaw = fs.readFileSync(`${__dirname}/${f}`);
    /*
    if (fileRaw.readInt32LE(0) === HEADER_QMM_7) {
      it(`${f} equals`, () => {
        const qm = parse(fileRaw);
        const buf = writeQmm(qm);
        //assert.deepStrictEqual(fileRaw, buf);
        assert.deepStrictEqual(fileRaw.slice(0, buf.length), buf);
      });
    }
    */

    it(`${f}`, () => {
      const quest = parse(fileRaw);
      const packed = writeQmm(quest);
      const unpacked = parse(packed);
      assert.deepStrictEqual(unpacked, quest);
    });
  }
});
