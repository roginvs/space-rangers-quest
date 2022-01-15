import { parse, QM, ParamType, ParamCritType, getImagesListFromQmm } from "../lib/qmreader";

import * as pako from "pako";
import * as fs from "fs";

import { QMPlayer } from "../lib/qmplayer";
import { PQImages } from "../lib/pqImages";
import { readPqi } from "./pqi";
import { Index, Game } from "./defs";

const pqiSR1Parsed = JSON.parse(
  fs.readFileSync(__dirname + "/../../src/sr1-pqi.json").toString(),
) as {
  [questName: string]: PQImages;
};

const warns: string[] = [];

const dataSrcPath = __dirname + "/../../borrowed";
const dataDstPath = __dirname + "/../../built-web/data";

const resultJsonFile = dataDstPath + "/index.json";

console.info(`Creating destination folders`);
if (!fs.existsSync(dataDstPath)) {
  fs.mkdirSync(dataDstPath);
}
for (const d of ["img", "qm", "music"]) {
  if (!fs.existsSync(dataDstPath + "/" + d)) {
    fs.mkdirSync(dataDstPath + "/" + d);
  }
}

const index: Index = {
  quests: [],
  dir: {
    quests: { files: [], totalSize: 0 },
    images: { files: [], totalSize: 0 },
    music: { files: [], totalSize: 0 },
  },
};

const DEBUG_SPEEDUP_SKIP_COPING = false;

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

console.info(`Copying music`);
const music = fs
  .readdirSync(dataSrcPath + "/music")
  .filter((x) => {
    const fullName = dataSrcPath + "/music/" + x;
    return (
      fs.statSync(fullName).isFile() &&
      (fullName.toLowerCase().endsWith(".ogg") || fullName.toLowerCase().endsWith(".mp3"))
    );
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

const pqiSR2Parsed = readPqi(dataSrcPath + "/PQI.txt", dataSrcPath, warns);
console.info(`Found ${Object.keys(pqiSR2Parsed).length} quests in PQI.txt`);
//let pqiFound: string[] = [];

console.info(`Scanning quests`);
const seenQuests: string[] = [];
for (const origin of fs.readdirSync(dataSrcPath + "/qm")) {
  console.info(`\n\nScanning origin ${origin}`);
  const qmDir = dataSrcPath + "/qm/" + origin + "/";
  for (const qmShortName of fs.readdirSync(qmDir)) {
    if (seenQuests.indexOf(qmShortName) > -1) {
      throw new Error(`Duplicate file ${qmShortName}. Please rename it!`);
    } else {
      seenQuests.push(qmShortName);
    }
    const srcQmName = qmDir + qmShortName;
    const lang = origin.endsWith("eng") ? "eng" : "rus";
    const oldTge = qmShortName.endsWith(".qm") && lang !== "eng"; //origin.startsWith('Tge');
    const gameName = qmShortName.replace(/(\.qm|\.qmm)$/, "");
    // .replace(/_eng$/, '');
    console.info(`Reading ${srcQmName} (${lang}, oldTge=${oldTge}) gameName=${gameName}`);

    const data = fs.readFileSync(srcQmName);

    if (!DEBUG_SPEEDUP_SKIP_COPING) {
      fs.writeFileSync(dataDstPath + "/qm/" + qmShortName + ".gz", Buffer.from(pako.gzip(data)));
    }

    const quest = parse(data);
    const player = new QMPlayer(quest, undefined, lang); // oldTge
    player.start();

    const probablyThisQuestImages = allImages.filter((x) =>
      x.toLowerCase().startsWith(gameName.toLowerCase()),
    );
    const randomImages = probablyThisQuestImages.map((filename, fileIndex) => {
      return {
        filename,
        locationIds: quest.locations
          .map((loc) => loc.id)
          .filter((id) => (id - 1) % probablyThisQuestImages.length === fileIndex),
      };
    });

    const qmmImagesList = getImagesListFromQmm(quest);

    const pqi2Images = pqiSR2Parsed[gameName.toLowerCase()];
    const pqi1Images = pqiSR1Parsed[gameName];
    const images = qmmImagesList.length > 0 ? [] : pqi2Images || pqi1Images || randomImages;
    if (images === randomImages) {
      warns.push(`No images for ${qmShortName}, using random`);
    }
    //if (pqi[gameName.toLowerCase()]) {
    //pqiFound.push(gameName.toLowerCase());
    //}
    if (qmmImagesList.length > 0) {
      console.info(`Have ${qmmImagesList.length} qmm images`);
    }

    for (const pqiImage of images) {
      if (allImages.indexOf(pqiImage.filename.toLowerCase()) < 0) {
        warns.push(
          `Image ${pqiImage.filename} is from PQI for ${qmShortName}, ` +
            `but not found in img dir`,
        );
      }
    }

    const gameFilePath = "qm/" + qmShortName + ".gz";
    const game: Game = {
      filename: gameFilePath,
      taskText: quest.taskText,
      smallDescription:
        lang === "rus"
          ? `Сложность: ${quest.hardness}, из ${origin}`
          : `Hardness: ${quest.hardness}, from ${origin}`,
      gameName,
      images,
      hardness: quest.hardness,
      questOrigin: origin,
      // oldTgeBehaviour: oldTge,
      lang,
    };

    index.quests.push(game);

    const gzFileSize = fs.statSync(dataDstPath + "/qm/" + qmShortName + ".gz").size;
    index.dir.quests.files.push({
      path: gameFilePath,
      size: gzFileSize,
    });
    index.dir.quests.totalSize += gzFileSize;
  }
}

index.quests = index.quests.sort(
  (a, b) => a.hardness - b.hardness || (a.gameName > b.gameName ? 1 : -1),
);
console.info(`Done read, writing result into ${resultJsonFile}`);
// fs.writeFileSync(resultJsonFile, new Buffer(pako.gzip(JSON.stringify(index, null, 4))));
fs.writeFileSync(resultJsonFile, JSON.stringify(index));

if (warns.length === 0) {
  console.info("All done, no warnings");
} else {
  console.info(`Done with warnings:\n${warns.join("\n")}`);
}
