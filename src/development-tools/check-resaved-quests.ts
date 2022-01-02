/* Это чтобы проверить что пересорханенные квесты такие же */

import * as fs from "fs";

import * as deepDiff from "deep-diff";

import { parse, ParamType, ParamCritType } from "../lib/qmreader";

import * as assert from "assert";
// import { QMPlayer, QMImages } from './lib/qmplayer'

const gameDir =
  "c:\\R.G. Catalyst\\Space Rangers HD A War Apart\\DATA\\questsRus\\Data\\Quest\\Rus\\";
const resavedDir = __dirname + "/../../data/src/rus/";
for (const fileName of fs.readdirSync(gameDir)) {
  //const fileName = 'Banket.qm';

  console.info("\n");

  const origData = fs.readFileSync(gameDir + fileName);
  console.info(`Loading original quest ${fileName}`);
  const origQuest = parse(origData);

  if (!fs.existsSync(resavedDir + fileName)) {
    console.info("No resaved quest");
    continue;
  }
  const resavedData = fs.readFileSync(resavedDir + fileName);
  console.info(`Loading resaved quest ${fileName}`);
  const resavedQuest = parse(resavedData);

  //if (resavedQuest.paramsCount === origQuest.paramsCount && fileName !== 'GLAVRED.qm') {
  if (fileName !== "GLAVRED.qm") {
    const diff = (deepDiff as any)(origQuest, resavedQuest);
    if (diff) {
      const diffWithoutAddings = diff.filter(
        (x: any) =>
          !(
            (x.kind === "A" &&
              x.item.kind === "N" &&
              (x.path[0] === "params" || x.path[2] === "params") &&
              x.index >= origQuest.paramsCount) ||
            (x.path.length === 1 && x.path[0] === "paramsCount")
          ),
      );
      if (diffWithoutAddings.length === 0) {
        console.info(`Same but have inserts in arrays`);
        // console.info(diff.map((x:any) => x.path).join('\n'))
      } else {
        console.info(diffWithoutAddings);
        throw new Error("Difference!");
      }
    } else {
      console.info("Object are same");
    }
  } else {
    console.info(
      `Skipping check: resavedParams=${resavedQuest.paramsCount} originalParams=${origQuest.paramsCount}`,
    );
  }

  // assert.deepStrictEqual(resavedQuest, origQuest, 'Data is the same');

  // const player = new QMPlayer(quest, undefined, lang, questOrigin === ORIGIN_TGE);
}
