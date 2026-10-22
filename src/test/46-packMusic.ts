import * as assert from "assert";
import { execFileSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import "mocha";
import { scanAndCopySoundAndTrack } from "../packGameData/music";

describe("Packing audio", function () {
  // tslint:disable-next-line:no-invalid-this
  this.timeout(15000);
  let root: string;
  const folders: Array<"sound" | "track"> = ["sound", "track"];
  const fixtures: { [extension: string]: Buffer } = {};
  let nextCase = 0;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "quest-audio-"));
    assert.ok(ffmpegPath);
    for (const extension of ["mp3", "ogg", "wav"]) {
      const filename = path.join(root, `sample.${extension}`);
      execFileSync(ffmpegPath!, [
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=0.1",
        filename,
      ]);
      fixtures[extension] = fs.readFileSync(filename);
    }
  });

  after(() => {
    function removeDirectory(directory: string): void {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          removeDirectory(filename);
        } else {
          fs.unlinkSync(filename);
        }
      }
      fs.rmdirSync(directory);
    }
    removeDirectory(root);
  });

  function directories() {
    const base = path.join(root, String(nextCase++));
    const src = path.join(base, "src");
    const dst = path.join(base, "dst");
    for (const folder of ["sound", "track"]) {
      fs.mkdirSync(path.join(src, folder), { recursive: true });
      fs.mkdirSync(path.join(dst, folder), { recursive: true });
    }
    return { src, dst };
  }

  for (const folder of folders) {
    it(`Copies MP3 unchanged in ${folder}, preserving names and random exclusions`, () => {
      const { src, dst } = directories();
      fs.writeFileSync(path.join(src, folder, "Квест Song.MP3"), fixtures.mp3);
      fs.writeFileSync(path.join(src, "track", "randomignore.txt"), "КВЕСТ SONG.MP3\n");
      const index = scanAndCopySoundAndTrack(src, dst, () => {});
      assert.deepStrictEqual(
        fs.readFileSync(path.join(dst, folder, "квест song.mp3")),
        fixtures.mp3,
      );
      assert.strictEqual(index[folder].files.length, 1);
      assert.strictEqual(index[folder].files[0].fileName, "квест song.mp3");
      assert.strictEqual(index[folder].files[0].size, fixtures.mp3.length);
      assert.strictEqual(index[folder].totalSize, fixtures.mp3.length);
      if (folder === "track") {
        assert.strictEqual(index.track.files[0].useForRandomMusic, false);
      }
    });

    for (const extension of ["ogg", "wav"]) {
      it(`Converts ${extension.toUpperCase()} to an actual MP3 in ${folder}`, () => {
        const { src, dst } = directories();
        const inputName = `Квест Song.${extension.toUpperCase()}`;
        fs.writeFileSync(path.join(src, folder, inputName), fixtures[extension]);
        fs.writeFileSync(path.join(src, "track", "randomignore.txt"), "квест song.mp3\n");
        const index = scanAndCopySoundAndTrack(src, dst, () => {});
        const output = path.join(dst, folder, "квест song.mp3");
        const decoded = execFileSync(ffmpegPath!, [
          "-v",
          "error",
          "-f",
          "mp3",
          "-i",
          output,
          "-f",
          "s16le",
          "-",
        ]);
        assert.ok(decoded.length > 0);
        assert.deepStrictEqual(fs.readdirSync(path.join(dst, folder)), ["квест song.mp3"]);
        assert.deepStrictEqual(
          fs.readFileSync(path.join(src, folder, inputName)),
          fixtures[extension],
        );
        assert.strictEqual(index[folder].files.length, 1);
        assert.strictEqual(index[folder].files[0].size, fs.statSync(output).size);
        assert.strictEqual(index[folder].totalSize, fs.statSync(output).size);
        if (folder === "track") {
          assert.strictEqual(index.track.files[0].useForRandomMusic, false);
        }
      });
    }

    for (const names of [
      ["tone.mp3", "tone.ogg"],
      ["Tone.mp3", "Tone.ogg"],
      ["tone.MP3", "tone.wav"],
      ["tone.ogg", "tone.wav"],
      ["Tone.OGG", "tone.WAV"],
    ]) {
      it(`Rejects ${names.join(" + ")} in ${folder} before writing output`, () => {
        const { src, dst } = directories();
        for (const name of names) {
          const extension = path.extname(name).slice(1).toLowerCase();
          fs.writeFileSync(path.join(src, folder, name), fixtures[extension]);
        }
        const output = path.join(dst, folder, "tone.mp3");
        fs.writeFileSync(output, "existing output");
        assert.throws(() => scanAndCopySoundAndTrack(src, dst, () => {}), /both produce/);
        assert.strictEqual(fs.readFileSync(output, "utf8"), "existing output");
      });
    }
  }

  it("Reports the source file and FFmpeg error for invalid audio", () => {
    const { src, dst } = directories();
    fs.writeFileSync(path.join(src, "sound", "broken.ogg"), "invalid audio");
    assert.throws(
      () => scanAndCopySoundAndTrack(src, dst, () => {}),
      /Failed to transcode .*broken\.ogg to .*broken\.mp3: .+/,
    );
  });
});
