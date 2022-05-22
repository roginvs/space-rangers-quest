import * as fs from "fs";
import { Index } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

export function scanAndCopyImages(dataSrcPath: string, dataDstPath: string) {
  const indexDir: Pick<Index["dir"], "images"> = {
    images: {
      files: [],
      totalSize: 0,
    },
  };
  console.info(`Scan and copy images`);
  fs.readdirSync(dataSrcPath + "/img")
    .filter((x) => fs.statSync(dataSrcPath + "/img/" + x).isFile())
    .forEach((imgShortName) => {
      const filePath = "img/" + imgShortName.toLowerCase();
      if (!DEBUG_SPEEDUP_SKIP_COPING) {
        fs.writeFileSync(
          dataDstPath + "/" + filePath,
          fs.readFileSync(dataSrcPath + "/img/" + imgShortName),
        );
      }
      const fileSize = fs.statSync(dataSrcPath + "/img/" + imgShortName).size;
      indexDir.images.files.push({
        fileName: imgShortName.toLowerCase(),
        filePath: "img/",
        size: fileSize,
      });
      indexDir.images.totalSize += fileSize;

      return imgShortName.toLowerCase();
    });
  console.info(
    `  Copied ${indexDir.images.files.length} files, ${indexDir.images.totalSize} bytes total ` +
      `(~${Math.round(indexDir.images.totalSize / 1024 / 1024)}mb)`,
  );
  return indexDir;
}
