import { parse, QM, ParamType, ParamCritType } from "../lib/qmreader";
import * as fs from "fs";

const dataSrcPath = __dirname + "/../../borrowed";

const stats: {
  quest: QM;
  name: string;
}[] = [];

let scannedCount = 0;
for (const origin of fs.readdirSync(dataSrcPath + "/qm")) {
  const qmDir = dataSrcPath + "/qm/" + origin + "/";
  for (const qmShortName of fs.readdirSync(qmDir)) {
    const srcQmName = qmDir + qmShortName;
    const lang = origin.endsWith("eng") ? "eng" : "rus";
    const oldTge = origin.startsWith("Tge");
    const gameName = qmShortName.replace(/(\.qm|\.qmm)$/, "").replace(/_eng$/, "");

    const data = fs.readFileSync(srcQmName);

    const quest = parse(data);

    scannedCount++;

    quest.locations
      .filter((loc) => !loc.isStarting)
      .filter((loc) => !quest.jumps.some((j) => j.toLocationId === loc.id))
      .forEach((loc) => {
        console.info(`${srcQmName} locId=${loc.id} ${loc.texts.filter((x) => x).join(" ; ")}`);
      });

    console.info("===========================");
    //const player = new QMPlayer(quest, undefined, lang, oldTge);
    //player.start();
  }
}

console.info("===========================");

console.info(`Scanned ${scannedCount} quests`);
