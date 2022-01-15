import { PQImages } from "../lib/pqImages";
import * as fs from "fs";
import { PQIParsed } from "./defs";

export function readPqi(filename: string, dataSrcPath: string, warns: string[]): PQIParsed {
  const result: PQIParsed = {};

  if (!fs.existsSync(filename)) {
    warns.push(`==========\nPQI file ${filename} not found, will process without\n======`);
    return result;
  }
  const content = fs.readFileSync(filename).toString();
  let currentName = "";
  for (const line of content
    .split(/\r\n|\n/)
    .map((x) => x.replace(/ /g, ""))
    .filter((x) => x)) {
    if (line.startsWith("//")) {
      currentName = line.slice(2).replace(/\.qm$/, "").toLowerCase();
      continue;
    }
    const [data1, data2] = line.split("=");
    const filename = data2.replace(/.*\./g, "").toLowerCase() + ".jpg";
    if (!fs.existsSync(dataSrcPath + "/img/" + filename)) {
      warns.push(`File '${filename}' (${dataSrcPath + "/img/" + filename}) not found`);
      continue;
    }
    const d = data1.split(",");
    d.shift();
    const type = d.shift() as "L" | "P" | "PAR";
    const indexes = d.map((x) => parseInt(x)).map((x) => (type === "PAR" ? x - 1 : x));
    if (!result[currentName]) {
      result[currentName] = [];
    }
    const indexesNames = type === "L" ? "locationIds" : type === "P" ? "jumpIds" : "critParams";

    result[currentName].push({
      filename,
      [indexesNames]: indexes,
    });
  }
  const newResult: typeof result = {};
  for (const k of Object.keys(result)) {
    const allImages: { [name: string]: boolean } = {};
    for (const x of result[k]) {
      allImages[x.filename] = true;
    }
    newResult[k] = [];
    for (const image of Object.keys(allImages)) {
      newResult[k].push({
        filename: image,
        critParams: ([] as number[]).concat(
          ...result[k].filter((x) => x.filename === image).map((x) => x.critParams || []),
        ),
        locationIds: ([] as number[]).concat(
          ...result[k].filter((x) => x.filename === image).map((x) => x.locationIds || []),
        ),
        jumpIds: ([] as number[]).concat(
          ...result[k].filter((x) => x.filename === image).map((x) => x.jumpIds || []),
        ),
      });
    }
  }
  return newResult;
}
