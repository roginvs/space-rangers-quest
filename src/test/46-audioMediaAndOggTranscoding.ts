import { audioMediaNameToMp3FileName } from "../lib/mediaNames";
import { scanAndCopySoundAndTrack } from "../packGameData/music";

import { spawnSync } from "child_process";
import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import "mocha";

describe(`audioMediaNameToMp3FileName`, () => {
  it(`Media name without extension`, () =>
    assert.strictEqual(
      audioMediaNameToMp3FileName("QuestSoundtrack.ForQuest_COSMIC"),
      "questsoundtrack.forquest_cosmic.mp3",
    ));
  it(`Ogg media name`, () =>
    assert.strictEqual(audioMediaNameToMp3FileName("seed.ogg"), "seed.mp3"));
  it(`Mp3 media name`, () =>
    assert.strictEqual(audioMediaNameToMp3FileName("Seed.MP3"), "seed.mp3"));
});

function isFfmpegAvailable(): boolean {
  const ffmpegVersionResult = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return !ffmpegVersionResult.error && ffmpegVersionResult.status === 0;
}

function makeTestAudioFile(srcFileName: string): void {
  const ffmpegResult = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1000:duration=1",
      "-codec:a",
      srcFileName.endsWith(".ogg") ? "libvorbis" : "libmp3lame",
      srcFileName,
    ],
    { stdio: "ignore" },
  );
  if (ffmpegResult.error || ffmpegResult.status !== 0) {
    throw new Error(`Not possible to create test audio file ${srcFileName}`);
  }
}

// ffmpeg is installed in gitlab-ci, see .gitlab-ci.yml
(isFfmpegAvailable() ? describe : describe.skip)(
  `scanAndCopySoundAndTrack, ogg is transcoded into mp3`,
  () => {
    let tmpDir: string | undefined = undefined;
    let srcPath: string = "";
    let dstPath: string = "";

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-sound-test-"));
      srcPath = tmpDir + "/src";
      dstPath = tmpDir + "/dst";
      for (const folder of ["sound", "track"]) {
        fs.mkdirSync(srcPath + "/" + folder, { recursive: true });
        fs.mkdirSync(dstPath + "/" + folder, { recursive: true });
      }
      // Empty ignore list, so no warning about missing ignore file
      fs.writeFileSync(srcPath + "/track/randomignore.txt", "");
    });

    afterEach(() => {
      if (tmpDir) {
        fs.rmdirSync(tmpDir, { recursive: true });
        tmpDir = undefined;
      }
    });

    it(`Mp3 files are copied as is and ogg files are transcoded into mp3`, () => {
      makeTestAudioFile(srcPath + "/sound/plainsound.mp3");
      makeTestAudioFile(srcPath + "/track/seed.ogg");

      const warns: string[] = [];
      const index = scanAndCopySoundAndTrack(srcPath, dstPath, (warn) => warns.push(warn));

      assert.deepEqual(warns, []);
      assert.deepEqual(
        index.sound.files.map((f) => f.fileName),
        ["plainsound.mp3"],
      );
      assert.deepEqual(
        index.track.files.map((f) => f.fileName),
        ["seed.mp3"],
      );
      assert.deepEqual(
        index.track.files.map((f) => f.useForRandomMusic),
        [true],
      );

      for (const fileName of ["sound/plainsound.mp3", "track/seed.mp3"]) {
        const content = fs.readFileSync(dstPath + "/" + fileName);
        assert.ok(content.length > 0, `${fileName} is not empty`);
        assert.ok(!content.slice(0, 4).equals(Buffer.from("OggS")), `${fileName} is mp3 not ogg`);
      }
      assert.ok(index.sound.files[0].size > 0);
      assert.ok(index.track.files[0].size > 0);
    });

    it(`Same named mp3 and ogg files are an error`, () => {
      makeTestAudioFile(srcPath + "/track/seed.mp3");
      makeTestAudioFile(srcPath + "/track/seed.ogg");

      assert.throws(
        () => scanAndCopySoundAndTrack(srcPath, dstPath, () => ({})),
        /Duplicate audible media 'track\/seed\.mp3'/,
      );
    });
  },
);
