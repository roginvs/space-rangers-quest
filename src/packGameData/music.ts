import { spawnSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

type SoundAndTrackIndexDir = Pick<Index["dir"], "sound" | "track">;

function transcodeToMp3(srcPath: string, mp3Path: string): void {
  if (!ffmpegPath) {
    throw new Error("FFmpeg is not available for this platform");
  }
  const res = spawnSync(
    ffmpegPath,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-nostdin",
      "-y",
      "-i",
      srcPath,
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "2",
      mp3Path,
    ],
    { encoding: "utf8" },
  );
  if (res.error || res.status !== 0) {
    const details = res.error ? res.error.message : res.stderr.trim() || `exit code ${res.status}`;
    throw new Error(`Failed to transcode ${srcPath} to ${mp3Path}: ${details}`);
  }
}

export function scanAndCopySoundAndTrack(
  dataSrcPath: string,
  dataDstPath: string,
  onWarn: (warnMsg: string) => void,
): SoundAndTrackIndexDir {
  const indexDir: SoundAndTrackIndexDir = {
    sound: {
      totalSize: 0,
      files: [],
    },
    track: {
      totalSize: 0,
      files: [],
    },
  };

  const trackRandomIgnoreFileName = dataSrcPath + "/track/randomignore.txt";

  let tracksRandomIngore = fs.existsSync(trackRandomIgnoreFileName)
    ? fs
        .readFileSync(trackRandomIgnoreFileName)
        .toString()
        .split("\n")
        .map((fName) => fName.trim().toLowerCase())
        // Ignore whatever follows # symbol
        .map((fName) => fName.split("#")[0])
        .map((fName) => fName.trim())
        .filter((fName) => fName)
    : undefined;
  if (!tracksRandomIngore) {
    onWarn(
      `No ${trackRandomIgnoreFileName} file found, all tracks will be used in random shuffle `,
    );
  }

  // tslint:disable-next-line:no-useless-cast
  for (const folderName of ["sound", "track"] as const) {
    console.info(`Copying ${folderName}`);
    const inputFileNames = fs.readdirSync(dataSrcPath + "/" + folderName).filter((x) => {
      const fullName = dataSrcPath + "/" + folderName + "/" + x;
      const lower = fullName.toLowerCase();
      return (
        fs.statSync(fullName).isFile() &&
        (lower.endsWith(".mp3") || lower.endsWith(".ogg") || lower.endsWith(".wav"))
      );
    });

    // Check the final names before writing, including case and OGG/WAV collisions.
    const sourceByOutputName = new Map<string, string>();
    for (const inputFileName of inputFileNames) {
      const outputName = inputFileName.toLowerCase().replace(/\.(ogg|wav)$/, ".mp3");
      const previousSource = sourceByOutputName.get(outputName);
      if (previousSource !== undefined) {
        throw new Error(
          `Audio files '${folderName}/${previousSource}' and '${folderName}/${inputFileName}' ` +
            `both produce '${folderName}/${outputName}'`,
        );
      }
      sourceByOutputName.set(outputName, inputFileName);
    }

    inputFileNames.forEach((fileShortInitialName) => {
      const fullSrcName = dataSrcPath + "/" + folderName + "/" + fileShortInitialName;
      const lowerInit = fileShortInitialName.toLowerCase();

      // Keep the same lowercase MP3 names used by the player and randomignore.txt.
      const fileShortName = lowerInit.replace(/\.(ogg|wav)$/, ".mp3");
      const name = `${folderName}/${fileShortName}`;
      if (!DEBUG_SPEEDUP_SKIP_COPING) {
        if (lowerInit.endsWith(".mp3")) {
          fs.writeFileSync(dataDstPath + "/" + name, fs.readFileSync(fullSrcName));
        } else {
          transcodeToMp3(fullSrcName, dataDstPath + "/" + name);
        }
      }
      const fileSize = fs.statSync(dataDstPath + "/" + name).size;
      if (folderName === "sound") {
        indexDir[folderName].files.push({
          fileName: fileShortName,
          filePath: folderName + "/",
          size: fileSize,
        });
      } else {
        const foundInIngoreList = tracksRandomIngore
          ? tracksRandomIngore.includes(fileShortName)
          : false;
        console.info(`  [${foundInIngoreList ? " " : "r"}] ${fileShortName}`);
        indexDir[folderName].files.push({
          fileName: fileShortName,
          filePath: folderName + "/",
          size: fileSize,
          useForRandomMusic: !foundInIngoreList,
        });
        if (foundInIngoreList) {
          tracksRandomIngore = tracksRandomIngore?.filter((fName) => fName !== fileShortName);
        }
      }
      indexDir[folderName].totalSize += fileSize;
    });

    console.info(
      `  Copied ${indexDir[folderName].files.length} files, ${indexDir[folderName].totalSize} bytes total ` +
        `(~${Math.round(indexDir[folderName].totalSize / 1024 / 1024)}mb)`,
    );
  }

  tracksRandomIngore?.forEach((fname) =>
    onWarn(`Tracks ingore file have '${fname}' line but this track is not found`),
  );

  return indexDir;
}
