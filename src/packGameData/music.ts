import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

export function scanAndCopyMusicAndSoundAndTrack(
  dataSrcPath: string,
  dataDstPath: string,
  index: Index,
) {
  const copyAudibleMedia = (folderName: "music" | "sound" | "track") => {
    console.info(`Copying ${folderName}`);
    const audibleList = fs
      .readdirSync(dataSrcPath + "/" + folderName)
      .filter((x) => {
        const fullName = dataSrcPath + "/" + folderName + "/" + x;
        return fs.statSync(fullName).isFile() && fullName.toLowerCase().endsWith(".mp3");
      })
      .map((fileShortInitialName) => {
        // No lowercase for random music because it was already chched
        // And it is never linked from other source, player just player whatever in the folder
        // (Sounds and Tracks are linked from qmm file)
        const fileShortName =
          folderName !== "music" ? fileShortInitialName.toLowerCase() : fileShortInitialName;
        const name = `${folderName}/${fileShortName}`;
        if (!DEBUG_SPEEDUP_SKIP_COPING) {
          fs.writeFileSync(
            dataDstPath + "/" + name,
            fs.readFileSync(dataSrcPath + "/" + folderName + "/" + fileShortInitialName),
          );
        }
        const fileSize = fs.statSync(dataDstPath + "/" + name).size;
        index.dir[folderName].files.push({ path: name, size: fileSize });
        index.dir[folderName].totalSize += fileSize;

        return fileShortName;
      });
    return audibleList;
  };
  return {
    music: copyAudibleMedia("music"),
    sound: copyAudibleMedia("sound"),
    track: copyAudibleMedia("track"),
  };
}
