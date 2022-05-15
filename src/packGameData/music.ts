import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

type SoundAndTrackIndexDir = Pick<Index["dir"], "sound" | "track">;
export function scanAndCopySoundAndTrack(
  dataSrcPath: string,
  dataDstPath: string,
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
            filePath: folderName,
            size: fileSize,
          });
        } else {
          console.error(`\n\n\n\TODO: read randomingore.txt\n\n\n`);
          indexDir[folderName].files.push({
            fileName: fileShortName,
            filePath: folderName,
            size: fileSize,
            // TODO TODO
            useForRandomMusic: true,
          });
        }
        indexDir[folderName].totalSize += fileSize;
      });
  }

  return indexDir;
}
