import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

export function scanAndCopyMusic(dataSrcPath: string, dataDstPath: string, index: Index) {
  console.info(`Copying music`);
  const allMusic = fs
    .readdirSync(dataSrcPath + "/music")
    .filter((x) => {
      const fullName = dataSrcPath + "/music/" + x;
      return fs.statSync(fullName).isFile() && fullName.toLowerCase().endsWith(".mp3");
    })
    .map((x) => {
      const name = `music/${x}`;
      if (!DEBUG_SPEEDUP_SKIP_COPING) {
        fs.writeFileSync(dataDstPath + "/" + name, fs.readFileSync(dataSrcPath + "/" + name));
      }
      const fileSize = fs.statSync(dataDstPath + "/" + name).size;
      index.dir.music.files.push({ path: name, size: fileSize });
      index.dir.music.totalSize += fileSize;

      return name;
    });
  return allMusic;
}
