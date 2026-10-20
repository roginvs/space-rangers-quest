import { spawnSync } from "child_process";
import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

type SoundAndTrackIndexDir = Pick<Index["dir"], "sound" | "track">;

const AUDIO_SOURCE_EXTENSIONS = [".mp3", ".ogg"];

let isFfmpegAvailable: boolean | undefined;

function checkFfmpegAvailable(): boolean {
  if (isFfmpegAvailable === undefined) {
    const ffmpegVersionResult = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
    isFfmpegAvailable = !ffmpegVersionResult.error && ffmpegVersionResult.status === 0;
  }
  return isFfmpegAvailable;
}

/**
 * Ogg/vorbis is not supported by all browsers (IE, old Edge, Safari older than 18.4),
 * so ogg files are transcoded into mp3 while packing.
 */
function transcodeOggToMp3(srcFileName: string, dstFileName: string): void {
  if (!checkFfmpegAvailable()) {
    throw new Error(
      `ffmpeg is not found, but it is needed to transcode ${srcFileName} into mp3. ` +
        `Please install ffmpeg (https://ffmpeg.org)`,
    );
  }
  const ffmpegResult = spawnSync(
    "ffmpeg",
    ["-y", "-i", srcFileName, "-codec:a", "libmp3lame", "-q:a", "2", dstFileName],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  if (ffmpegResult.error || ffmpegResult.status !== 0) {
    throw new Error(
      `Not possible to transcode ${srcFileName} into ${dstFileName}: ` +
        (ffmpegResult.error
          ? ffmpegResult.error.message
          : ffmpegResult.stderr
          ? ffmpegResult.stderr.toString()
          : `ffmpeg exit code is ${ffmpegResult.status}`),
    );
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
    fs.readdirSync(dataSrcPath + "/" + folderName)
      .filter((x) => {
        const fullName = dataSrcPath + "/" + folderName + "/" + x;
        return (
          fs.statSync(fullName).isFile() &&
          AUDIO_SOURCE_EXTENSIONS.some((ext) => fullName.toLowerCase().endsWith(ext))
        );
      })
      .forEach((fileShortInitialName) => {
        const sourceFullName = dataSrcPath + "/" + folderName + "/" + fileShortInitialName;
        // No lowercase for random music because it was already chched
        // And it is never linked from other source, player just player whatever in the folder
        // (Sounds and Tracks are linked from qmm file)
        // Ogg is transcoded into mp3, so its destination filename is changed too
        const fileShortName = fileShortInitialName.toLowerCase().replace(/\.ogg$/, ".mp3");
        const name = `${folderName}/${fileShortName}`;
        if (indexDir[folderName].files.some((file) => file.fileName === fileShortName)) {
          throw new Error(
            `Duplicate audible media '${name}': ` +
              `'${fileShortInitialName}' and same named file with other extension ` +
              `are found in ${dataSrcPath}/${folderName}`,
          );
        }
        if (!DEBUG_SPEEDUP_SKIP_COPING) {
          if (fileShortInitialName.toLowerCase().endsWith(".ogg")) {
            console.info(`  transcoding ${fileShortInitialName} into ${name}`);
            transcodeOggToMp3(sourceFullName, dataDstPath + "/" + name);
          } else {
            fs.writeFileSync(dataDstPath + "/" + name, fs.readFileSync(sourceFullName));
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
