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
      .map((x) => {
        const name = `${folderName}/${x}`;
        if (!DEBUG_SPEEDUP_SKIP_COPING) {
          fs.writeFileSync(dataDstPath + "/" + name, fs.readFileSync(dataSrcPath + "/" + name));
        }
        const fileSize = fs.statSync(dataDstPath + "/" + name).size;
        index.dir[folderName].files.push({ path: name, size: fileSize });
        index.dir[folderName].totalSize += fileSize;

        return name;
      });
    return audibleList;
  };
  return {
    music: copyAudibleMedia("music"),
    sound: copyAudibleMedia("sound"),
    track: copyAudibleMedia("track"),
  };
}
