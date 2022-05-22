import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

type SoundAndTrackIndexDir = Pick<Index["dir"], "sound" | "track">;
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
        return fs.statSync(fullName).isFile() && fullName.toLowerCase().endsWith(".mp3");
      })
      .forEach((fileShortInitialName) => {
        // No lowercase for random music because it was already chched
        // And it is never linked from other source, player just player whatever in the folder
        // (Sounds and Tracks are linked from qmm file)
        const fileShortName = fileShortInitialName.toLowerCase();
        const name = `${folderName}/${fileShortName}`;
        if (!DEBUG_SPEEDUP_SKIP_COPING) {
          fs.writeFileSync(
            dataDstPath + "/" + name,
            fs.readFileSync(dataSrcPath + "/" + folderName + "/" + fileShortInitialName),
          );
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
