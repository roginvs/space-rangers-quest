/* Это чтобы проверить что пересорханенные квесты такие же */

import * as fs from "fs";

import * as deepDiff from "deep-diff";

import { parse, ParamType, ParamCritType } from "../lib/qmreader";

import * as assert from "assert";
// import { QMPlayer, QMImages } from './lib/qmplayer'

//const gameDir = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart\\DATA\\questsRus\\Data\\Quest\\Rus\\'
//const gameDir = __dirname + '/../../src/development-tools/'
const qmmDir =
  "c:\\R.G. Catalyst\\Space Rangers HD A War Apart2.1.2170\\DATA\\questsRus\\Data\\Quest\\Rus\\";
//const qmDir = __dirname + '/../../data/src/rus/'
const qmDir =
  "c:\\R.G. Catalyst\\Space Rangers HD A War Apart\\DATA\\questsRus\\Data\\Quest\\Rus\\";
for (const fileName of fs.readdirSync(qmmDir)) {
  if (fileName !== "Amnesia.qmm") {
    // continue
  }

  console.info("\n");

  console.info(`Loading qmm quest ${fileName}`);
  const qmmData = fs.readFileSync(qmmDir + fileName);
  const qmmQuest = parse(qmmData);
  if (!false) {
    continue;
  }

  if (!fs.existsSync(qmDir + fileName.slice(0, -1))) {
    console.info("No resaved quest");
    //  continue;
  }
  console.info(`Loading qm quest ${fileName.slice(0, -1)}`);
  const qmData = fs.readFileSync(qmDir + fileName.slice(0, -1));
  const qmQuest = parse(qmData);

  //if (resavedQuest.paramsCount === origQuest.paramsCount && fileName !== 'GLAVRED.qm') {
  //  if (fileName !== 'GLAVRED.qm') {

  const diff = (deepDiff as any)(qmmQuest, qmQuest);
  //const diff = undefined;
  if (diff) {
    const diffWithoutAddings = diff.filter(
      (x: any) =>
        !(
          (x.kind === "A" &&
            x.item.kind === "N" &&
            (x.path[0] === "params" || x.path[2] === "params") &&
            x.index >= qmmQuest.paramsCount) ||
          (x.path.length === 1 && x.path[0] === "paramsCount") ||
          //  (x.path[2] === 'img' || x.path[2] === 'sound' || x.path[2] === 'track') ||
          x.path[0] === "header" ||
          (x.path[0] === "strings" && (x.path[1] === "Parsec" || x.path[1] === "Artefact")) ||
          x.path[x.path.length - 1] === "img" ||
          x.path[x.path.length - 1] === "sound" ||
          x.path[x.path.length - 1] === "track" ||
          (x.kind === "A" &&
            x.item.kind === "A" &&
            (x.item.path[x.item.path.length - 1] === "img" ||
              x.item.path[x.item.path.length - 1] === "sound" ||
              x.item.path[x.item.path.length - 1] === "track"))
        ),
    );
    if (diffWithoutAddings.length === 0) {
      console.info(`Almost the same`);
      // console.info(diff.map((x:any) => x.path).join('\n'))
    } else {
      console.info(diffWithoutAddings);
      // throw new Error('Difference!')
    }
  } else {
    console.info("Object are same");
  }
}
// } else {
//     console.info(`Skipping check: resavedParams=${resavedQuest.paramsCount} originalParams=${origQuest.paramsCount}`)
// }

// assert.deepStrictEqual(resavedQuest, origQuest, 'Data is the same');

// const player = new QMPlayer(quest, undefined, lang, questOrigin === ORIGIN_TGE);

//}
