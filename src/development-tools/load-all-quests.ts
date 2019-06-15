import {
  parse,
  QM,
  ParamType,
  ParamCritType,
  getImagesListFromQmm
} from "../lib/qmreader";
import * as fs from "fs";

import { QMPlayer } from "../lib/qmplayer";

const dataSrcPath = __dirname + "/../../borrowed";

for (const origin of fs.readdirSync(dataSrcPath + "/qm")) {
  console.info(`Scanning origin ${origin}`);
  const qmDir = dataSrcPath + "/qm/" + origin + "/";
  for (const qmShortName of fs.readdirSync(qmDir)) {
    const srcQmName = qmDir + qmShortName;
    const lang = origin.endsWith("eng") ? "eng" : "rus";
    const oldTge = origin.startsWith("Tge");
    const gameName = qmShortName
      .replace(/(\.qm|\.qmm)$/, "")
      .replace(/_eng$/, "");
    console.info(
      `Reading ${srcQmName} (${lang}, oldTge=${oldTge}) gameName=${gameName}`
    );

    const data = fs.readFileSync(srcQmName);

    const quest = parse(data);
    //const player = new QMPlayer(quest, undefined, lang, oldTge);
    //player.start();
  }
}
