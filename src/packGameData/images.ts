import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

export function scanAndCopyImages(dataSrcPath: string, dataDstPath: string, index: Index) {
  console.info(`Scan and copy images`);
  const allImages = fs
    .readdirSync(dataSrcPath + "/img")
    .filter((x) => fs.statSync(dataSrcPath + "/img/" + x).isFile())
    .map((imgShortName) => {
      const filePath = "img/" + imgShortName.toLowerCase();
      if (!DEBUG_SPEEDUP_SKIP_COPING) {
        fs.writeFileSync(
          dataDstPath + "/" + filePath,
          fs.readFileSync(dataSrcPath + "/img/" + imgShortName),
        );
      }
      const fileSize = fs.statSync(dataSrcPath + "/img/" + imgShortName).size;
      index.dir.images.files.push({ path: filePath, size: fileSize });
      index.dir.images.totalSize += fileSize;

      return imgShortName.toLowerCase();
    });
  return allImages;
}
