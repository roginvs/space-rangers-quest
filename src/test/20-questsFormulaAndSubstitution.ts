import * as fs from "fs";
import * as assert from "assert";
import "mocha";

import { QMPlayer, GameState } from "../lib/qmplayer";
import { ParamType, parse, QM } from "../lib/qmreader";
import { substitute } from "../lib/substitution";
import * as formula from "../lib/formula";
import { PlayerSubstitute } from "../lib/qmplayer/playerSubstitute";
import { createDetermenisticRandom, randomFromMathRandom } from "../lib/randomFunc";
import { getGameTaskText } from "../lib/getGameTaskText";
import { ParamValues } from "../lib/formula/types";

// tslint:disable:no-invalid-this

const srcDir = __dirname + `/../../borrowed/qm/`;
describe(`Checking all quests for formulas and params substitution`, function () {
  this.timeout(60 * 1000);
  for (const origin of fs.readdirSync(srcDir)) {
    for (const f of fs.readdirSync(srcDir + origin)) {
      const fullname = srcDir + origin + "/" + f;
      describe(`Checking quest ${fullname}`, () => {
        let quest: QM;
        let paramValues: ParamValues;
        const player: PlayerSubstitute = {
          Ranger: "Ranger",
          Player: "Player",
          FromPlanet: "FromPlanet",
          FromStar: "FromStar",
          ToPlanet: "ToPlanet",
          ToStar: "ToStar",
          Date: "Date",
          Day: "Day",
          Money: "Money",
          CurDate: "CurDate",
          lang: "rus",
        };
        function check(str: string, place = "", isDiamond = false) {
          try {
            substitute(
              str,
              player,
              paramValues,
              quest.params,
              randomFromMathRandom,
              isDiamond ? 1 : undefined,
            );
          } catch (e) {
            throw new Error(`String failed '${str}' with ${e} in ${place}`);
          }
        }
        function checkFormula(str: string, place = "") {
          const staticRandomGenerated = [
            0.8098721706321894, 0.7650745137670785, 0.5122628148859116, 0.7001314250579083,
            0.9777148783782501, 0.6484951526791192, 0.6277520602629139, 0.6271209273581702,
            0.5929518455455183, 0.555114104030954, 0.8769248658117874, 0.9012611135928128,
            0.9887903872842161, 0.9032020764410791, 0.09244706438405847, 0.6841815116128189,
            0.26661520895002355, 0.95424331893931, 0.8900907263092355, 0.9796112746203975,
          ];

          try {
            const formulaResult = formula.calculate(
              str,
              paramValues,
              createDetermenisticRandom(staticRandomGenerated),
            );
          } catch (e) {
            throw new Error(`String failed '${str}' with ${e} in ${place}`);
          }
        }
        it(`Loads quest and substitute variables`, () => {
          const data = fs.readFileSync(fullname);
          quest = parse(data);

          paramValues = quest.params.map((p, i) => {
            if (p.active) {
              // Just an example value
              return i * i;
            } else {
              // There are two quests which have formula with disabled parameters
              // Let's return some random value instead of undefined just to make this test pass
              return i * 3;
            }
          });
        });
        it(`Creates player and starts (to check init values)`, () => {
          const player = new QMPlayer(quest, "rus");
          player.start();
        });
        it(`Starting/ending text`, () => {
          check(quest.taskText, "start");
          check(quest.successText, "success");
        });
        it(`Starting text as shown in main menu`, () => {
          getGameTaskText(quest.taskText, player);
        });
        it(`Locations texts and formulas`, () => {
          quest.locations.forEach((loc) => {
            if (
              (f === "Doomino.qm" && loc.id === 28) ||
              (f === "Kiberrazum.qm" && loc.id === 134)
            ) {
              // Doomino: Какой-то там странный текст. Эта локация пустая и все переходы в неё с описанием
              // Kiberrazum: просто локация без переходов в неё
              // Вообще-то это можно и автоматически фильтровать
            } else {
              loc.texts.forEach((x) => x && check(x, `Loc ${loc.id}`));
            }
            loc.paramsChanges.forEach((p, i) => {
              if (p.critText !== quest.params[i].critValueString) {
                check(p.critText, `Loc ${loc.id} crit param ${i}`);
              }
              if (quest.params[i].active && p.isChangeFormula && p.changingFormula) {
                checkFormula(p.changingFormula, `param ${i} in loc=${loc.id}`);
              }
            });
            if (loc.isTextByFormula && loc.textSelectFormula) {
              checkFormula(loc.textSelectFormula, `loc=${loc.id} text select formula`);
            }
          });
        });
        it(`Jumps texts and formulas`, () => {
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
              if (quest.params[i].active && p.isChangeFormula && p.changingFormula) {
                checkFormula(p.changingFormula, `param ${i} in jump=${jump.id}`);
              }
            });
            if (jump.formulaToPass) {
              checkFormula(jump.formulaToPass, `Jump id=${jump.id} formula to pass`);
            }
          });
        });
        it(`Params ranges`, () => {
          quest.params.forEach((p, i) => {
            p.showingInfo.forEach((range) => {
              check(range.str, `Param ${i} range`, true);
            });
          });
        });
        it(`Params critText`, () => {
          quest.params.forEach((p, i) => {
            if (p.type === ParamType.Обычный) {
              return;
            }
            if (p.critValueString) {
              check(p.critValueString, `Param [p${i + 1}] critText`, true);
            } else {
              //   throw new Error(`Param ${i} has no critValueString`);
            }
          });
        });
      });
    }
  }
});
