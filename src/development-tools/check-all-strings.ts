import { parse, QM, ParamType, ParamCritType } from "../lib/qmreader";
import * as fs from "fs";

const dataSrcPath = __dirname + "/../../borrowed";

const tags: Record<string, number> = {};
let scannedQuests = 0;
for (const origin of fs.readdirSync(dataSrcPath + "/qm")) {
  // console.info(`Scanning origin ${origin}`);
  const qmDir = dataSrcPath + "/qm/" + origin + "/";
  for (const qmShortName of fs.readdirSync(qmDir)) {
    const srcQmName = qmDir + qmShortName;
    const lang = origin.endsWith("eng") ? "eng" : "rus";
    const oldTge = origin.startsWith("Tge");
    const gameName = qmShortName.replace(/(\.qm|\.qmm)$/, "").replace(/_eng$/, "");
    //console.info(`Reading ${srcQmName} (${lang}, oldTge=${oldTge}) gameName=${gameName}`);

    const data = fs.readFileSync(srcQmName);

    const quest = parse(data);

    const check = (str: string, place = "", isDiamond = false) => {
      // str = str.split("<fix><format>").join("");
      // str = str.split("<format><fix>").join("");

      while (true) {
        const m = str.match(/\<([^\>]*)\>/);
        //const m = str.match(/<([a-zA-Z\=0-9\,]*)>/);
        if (!m) {
          return;
        }

        if (m) {
          const tag = m[1];
          tags[tag] = (tags[tag] || 0) + 1;

          //console.info(`${srcQmName} ${place} ${str}`);
        }
        str = str.slice((m.index || 0) + m[0].length);
      }
    };

    check("Lol kek <blablababab=22,334,fix> 2");

    check(quest.taskText, "start");
    check(quest.successText, "success");

    quest.locations.forEach((loc) => {
      loc.texts.forEach((x) => x && check(x, `Loc ${loc.id}`));
      loc.paramsChanges.forEach((p, i) => {
        if (p.critText !== quest.params[i].critValueString) {
          check(p.critText, `Loc ${loc.id} crit param ${i}`);
        }
      });
    });
    quest.jumps.forEach((jump) => {
      if (jump.text) {
        check(jump.text, `Jump ${jump.id} text`);
      }
      if (jump.description) {
        check(jump.description, `Jump ${jump.id} decr`);
      }
      jump.paramsChanges.forEach((p, i) => {
        if (p.critText !== quest.params[i].critValueString) {
          check(p.critText, `Jump ${jump.id} crit param ${i}`);
        }
      });
    });
    quest.params.forEach((p, i) => {
      p.showingInfo.forEach((range) => {
        check(range.str, `Param ${i} range`, true);
      });
      check(p.critValueString, `Prm ${i} crit value`);
    });

    scannedQuests++;
  }
}

console.info(`Scanned ${scannedQuests} quests`);

console.info(tags);
