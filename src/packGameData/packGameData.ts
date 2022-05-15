import { parse, QM, ParamType, ParamCritType } from "../lib/qmreader";

import * as pako from "pako";
import * as fs from "fs";

import { QMPlayer } from "../lib/qmplayer";
import { PQImages } from "../lib/pqImages";
import { readPqi } from "./pqi";
import { Index, Game, PQIParsed } from "./defs";
import { scanAndCopyImages } from "./images";
import { scanAndCopySoundAndTrack } from "./music";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";
import { Quest, TRACK_NAME_RESET_DEFAULT_MUSIC } from "../lib/qmplayer/funcs";
import { getAllMediaFromQmm } from "../lib/getAllMediaFromQmm";
import { writeQmm } from "../lib/qmwriter";
import { checkQuest } from "./checkQuest";

/*

This script prepares data and build index.json file

Data is copied from borrowed folder into build-web/data and modified if needed
 - copy tracks
 - copy images and change filename to lowercase
 - copy qm/qmm and re-save them as qmm with images and compress into .gz
 - write index.json




TODO to test:
  - SR1 quests have images
    - location
    - jumps
    - critParams
    - example quest Boat:
      - location id = 1
      - jumps P11 or others
      - Param 1 or param 2
  - SR2 quests have images
    - example Ministry:
      - starting ID=121
      - Param 1
    - example Player
      - Jump 12
  - SR2 eng quests have images
    - same examples as above

Check English have eng quests origin


*/

const warns: string[] = [];

const dataSrcPath = __dirname + "/../../borrowed";
const dataDstPath = __dirname + "/../../built-web/data";

const resultJsonFile = dataDstPath + "/index.json";

console.info(`Creating destination folders`);
if (!fs.existsSync(dataDstPath)) {
  fs.mkdirSync(dataDstPath);
}
for (const d of ["img", "qm", "track", "sound"]) {
  if (!fs.existsSync(dataDstPath + "/" + d)) {
    fs.mkdirSync(dataDstPath + "/" + d);
  }
}

const indexDirImages = scanAndCopyImages(dataSrcPath, dataDstPath);

const indexDirAudibleMedia = scanAndCopySoundAndTrack(dataSrcPath, dataDstPath, (warn) =>
  warns.push(warn),
);

const index: Index = {
  quests: [],
  dir: {
    quests: { files: [], totalSize: 0 },
    ...indexDirImages,
    ...indexDirAudibleMedia,
  },
};

const pqiSR1Parsed = JSON.parse(
  fs.readFileSync(__dirname + "/../../src/sr1-pqi.json").toString(),
) as PQIParsed;

const pqiSR2Parsed = readPqi(dataSrcPath + "/PQI.txt", dataSrcPath, warns);
console.info(`Found ${Object.keys(pqiSR2Parsed).length} quests in PQI.txt`);

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

    const gameName = qmShortName.replace(/(\.qm|\.qmm)$/, "");
    const lang = gameName.endsWith("_eng") ? "eng" : "rus";
    console.info(`Reading ${srcQmName} (lang=${lang} gameName=${gameName}`);

    const srcQmQmmBuffer = fs.readFileSync(srcQmName);

    const quest = parse(srcQmQmmBuffer);

    // Why do we need to do this?
    const player = new QMPlayer(quest, "rus");
    player.start();

    const qmmMedia = getAllMediaFromQmm(quest);
    const qmmImagesList = Object.keys(qmmMedia.images);

    // This will be initial buffer or repacked quest, depending if original have images or not
    let outputQmmBuffer: Buffer | undefined = undefined;

    // If quest have images then do nothing
    if (qmmImagesList.length > 0) {
      outputQmmBuffer = srcQmQmmBuffer;
      for (const qmmImage of qmmImagesList) {
        // This is quite close to transformMedianameToUrl implementation
        if (
          qmmImage.toLowerCase().startsWith("http://") ||
          qmmImage.toLowerCase().startsWith("https://")
        ) {
          // No check for absolute urls
        } else {
          const localImageFilename = qmmImage.toLowerCase() + ".jpg";
          if (
            !index.dir.images.files.find(
              (imageCandidate) => imageCandidate.fileName === localImageFilename,
            )
          ) {
            warns.push(
              `Image ${qmmImage} is from QMM for ${qmShortName}, ` + `but not found in img dir`,
            );
          }
        }
      }
    } else {
      // Else lets checkout PQIs
      const pqi2ImagesData = pqiSR2Parsed[gameName.toLowerCase()];
      const pqi1ImagesData = pqiSR1Parsed[gameName];

      const pqiImagesData = pqi2ImagesData || pqi1ImagesData;
      if (pqiImagesData) {
        const updatedQuest: Quest = {
          ...quest,
          locations: quest.locations.map((l) => {
            const imageFromPQI = pqiImagesData.find((pqiImage) =>
              pqiImage.locationIds?.includes(l.id),
            );
            return {
              ...l,
              media: l.media.map((m) => ({
                ...m,
                img: imageFromPQI?.filename,
              })),
            };
          }),
          jumps: quest.jumps.map((j) => {
            const imageFromPQI = pqiImagesData.find((pqiImage) => pqiImage.jumpIds?.includes(j.id));
            return {
              ...j,
              img: imageFromPQI?.filename,
            };
          }),
          params: quest.params.map((p, paramIndex) => {
            const stParamId = paramIndex + 1;
            const imageFromPQI = pqiImagesData.find((pqiImage) =>
              pqiImage.critParams?.includes(stParamId),
            );
            if (imageFromPQI && p.type === ParamType.Обычный) {
              warns.push(
                `Quest ${qmShortName} has image for param p${stParamId} in PQI but param is not critical!`,
              );
              return p;
            }
            return {
              ...p,
              img: imageFromPQI?.filename,
            };
          }),
        };
        outputQmmBuffer = writeQmm(updatedQuest);
      } else {
        // No PQI, no images from QMM. Maybe donor exists?

        let donorQuestRaw: Buffer | null = null;
        const donorQmShortName =
          lang === "eng" ? qmShortName.replace("_eng.", ".").replace(/.qm$/, ".qmm") : null;

        if (donorQmShortName) {
          for (const donorOrigin of fs.readdirSync(dataSrcPath + "/qm")) {
            const donorQmDir = dataSrcPath + "/qm/" + donorOrigin + "/";

            const donorFullQmName = donorQmDir + donorQmShortName;
            if (fs.existsSync(donorFullQmName)) {
              donorQuestRaw = fs.readFileSync(donorFullQmName);
              break;
            }
          }
        }

        if (donorQuestRaw) {
          const donorQuest = parse(donorQuestRaw);

          const donorWarns: string[] = [];

          const updatedQuest: Quest = {
            ...quest,
            locations: quest.locations.map((l) => {
              const donorLocation = donorQuest.locations.find((dl) => dl.id === l.id);
              if (!donorLocation) {
                donorWarns.push(`L${l.id} is not found in donor quest`);
              }
              return {
                ...l,
                media: l.media.map((srcMedia, srcMediaIndex) => {
                  if (!l.texts[srcMediaIndex]) {
                    return srcMedia;
                  }

                  if (donorLocation && !donorLocation.media[srcMediaIndex]) {
                    donorWarns.push(`L${l.id}-M${srcMediaIndex} is not found in donor quest`);
                  }
                  return {
                    ...srcMedia,
                    img: donorLocation?.media[srcMediaIndex]?.img,
                  };
                }),

                paramsChanges: l.paramsChanges.map((paramChange, srcParamChangeIndex) => {
                  if (!quest.params[srcParamChangeIndex].active) {
                    return paramChange;
                  }
                  if (donorLocation && !donorLocation.paramsChanges[srcParamChangeIndex]) {
                    donorWarns.push(
                      `L${l.id}-PC${srcParamChangeIndex} is not found in donor quest`,
                    );
                  }
                  return {
                    ...paramChange,
                    img: donorLocation?.paramsChanges[srcParamChangeIndex]?.img,
                  };
                }),
              };
            }),
            jumps: quest.jumps.map((j) => {
              const donorJump = donorQuest.jumps.find((dj) => dj.id === j.id);
              if (!donorJump) {
                donorWarns.push(`J${j.id} is not found in donor quest`);
              }
              return {
                ...j,
                img: donorJump?.img,
                paramsChanges: j.paramsChanges.map((paramChange, srcParamChangeIndex) => {
                  if (!quest.params[srcParamChangeIndex].active) {
                    return paramChange;
                  }

                  if (donorJump && !donorJump.paramsChanges[srcParamChangeIndex]) {
                    donorWarns.push(
                      `J${j.id}-PC${srcParamChangeIndex} is not found in donor quest`,
                    );
                  }
                  return {
                    ...paramChange,
                    img: donorJump?.paramsChanges[srcParamChangeIndex]?.img,
                  };
                }),
              };
            }),
            params: quest.params.map((p, paramIndex) => {
              if (!quest.params[paramIndex].active) {
                return p;
              }

              const donorParam = donorQuest.params[paramIndex];
              if (!donorParam) {
                donorWarns.push(`P${paramIndex} is not found in donor quest`);
              }
              return {
                ...p,
                img: donorParam?.img,
              };
            }),
          };
          outputQmmBuffer = writeQmm(updatedQuest);

          if (donorWarns.length > 0) {
            warns.push(`Donor for ${qmShortName} has warnings: ${donorWarns.join(", ")}`);
          }
        } else {
          warns.push(`Not possible to find any images for ${qmShortName}!`);
          outputQmmBuffer = srcQmQmmBuffer;
        }
      }
    }

    const qmmSoundList = Object.keys(qmmMedia.sounds);
    for (const qmmSound of qmmSoundList) {
      // This is quite close to transformMedianameToUrl implementation
      if (
        qmmSound.toLowerCase().startsWith("http://") ||
        qmmSound.toLowerCase().startsWith("https://")
      ) {
        // No check for absolute urls
      } else {
        const localSoundFilename = qmmSound.toLowerCase() + ".mp3";
        // console.info(localSoundFilename, audibleMedia.sound);
        if (
          !index.dir.sound.files.find(
            (soundCandidate) => soundCandidate.fileName === localSoundFilename,
          )
        ) {
          warns.push(
            `Sound ${qmmSound} is from QMM for ${qmShortName}, ` + `but not found in sound dir`,
          );
        }
      }
    }
    const qmmTrackList = Object.keys(qmmMedia.tracks);
    for (const qmmTrack of qmmTrackList) {
      // This is quite close to transformMedianameToUrl implementation
      if (
        qmmTrack.toLowerCase().startsWith("http://") ||
        qmmTrack.toLowerCase().startsWith("https://")
      ) {
        // No check for absolute urls
      } else if (qmmTrack === TRACK_NAME_RESET_DEFAULT_MUSIC) {
        // Special name to reset music to default random
      } else {
        const localTrackFilename = qmmTrack.toLowerCase() + ".mp3";
        // console.info(localTrackFilename, audibleMedia.track);
        if (
          !index.dir.track.files.find(
            (soundCandidate) => soundCandidate.fileName === localTrackFilename,
          )
        ) {
          warns.push(
            `Track ${qmmTrack} is from QMM for ${qmShortName}, ` + `but not found in track dir`,
          );
        }
      }
    }

    checkQuest(quest, (warn) => warns.push(`${qmShortName}: ${warn}`));

    // tslint:disable-next-line:strict-type-predicates
    if (!outputQmmBuffer) {
      throw new Error(`Internal error, outputQmmBuffer must always be set`);
    }

    fs.writeFileSync(
      dataDstPath + "/qm/" + qmShortName + ".gz",
      Buffer.from(pako.gzip(outputQmmBuffer)),
    );

    const gameFilePath = "qm/" + qmShortName + ".gz";
    const game: Game = {
      filename: gameFilePath,
      taskText: quest.taskText,
      smallDescription:
        lang === "rus"
          ? `Сложность: ${quest.hardness}, из ${origin}`
          : `Hardness: ${quest.hardness}, from ${origin}`,
      gameName,
      hardness: quest.hardness,
      questOrigin: origin,
      lang,
    };

    index.quests.push(game);

    const gzFileSize = fs.statSync(dataDstPath + "/qm/" + qmShortName + ".gz").size;
    index.dir.quests.files.push({
      fileName: qmShortName + ".gz",
      filePath: "qm/",
      size: gzFileSize,
    });
    index.dir.quests.totalSize += gzFileSize;
  }
}

index.quests = index.quests.sort(
  (a, b) => a.hardness - b.hardness || (a.gameName > b.gameName ? 1 : -1),
);
console.info(`Done read, writing result into ${resultJsonFile}`);
fs.writeFileSync(resultJsonFile, JSON.stringify(index));

if (warns.length === 0) {
  console.info("\n\nAll done, no warnings");
} else {
  console.info(`\n\nDone with warnings:\n\n${warns.join("\n")}`);
}
