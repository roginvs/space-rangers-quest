import * as fs from "fs";
import * as assert from "assert";
import "mocha";

import { QMPlayer, GameState, Player } from "../lib/qmplayer";
import { parse, QM } from "../lib/qmreader";
import { substitute } from "../lib/substitution";
import * as formula from "../lib/formula";
import * as formula2 from "../lib/formula2";

const srcDir = __dirname + `/../../borrowed/qm/`;

function heapGenerate(
    n: number,
    arr: number[],
    permutationCb: (arr: number[]) => void
) {
    if (n === -1 || n === 0) {
        permutationCb([]);
        return;
    }
    if (n === 1) {
        permutationCb(arr);
    } else {
        for (let i = 0; i < n - 1; i++) {
            heapGenerate(n - 1, arr, permutationCb);
            if (n % 2 === 0) {
                const c = arr[i];
                arr[i] = arr[n - 1];
                arr[n - 1] = c;
            } else {
                const c = arr[0];
                arr[0] = arr[n - 1];
                arr[n - 1] = c;
            }
        }
        heapGenerate(n - 1, arr, permutationCb);
    }
}

describe(`Checking all quests for formulas and params substitution`, function() {
    this.timeout(60 * 1000);
    for (const origin of fs.readdirSync(srcDir)) {
        for (const f of fs.readdirSync(srcDir + origin)) {
            const fullname = srcDir + origin + "/" + f;
            describe(`Checking quest ${fullname}`, () => {
                let quest: QM;
                let params: number[];
                let player: Player = {
                    Ranger: "Ranger",
                    Player: "Player",
                    FromPlanet: "FromPlanet",
                    FromStar: "FromStar",
                    ToPlanet: "ToPlanet",
                    ToStar: "ToStar",
                    Date: "Date",
                    Day: "Day",
                    Money: "Money",
                    CurDate: "CurDate"
                };
                function check(str: string, place = "", isDiamond = false) {
                    try {
                        substitute(
                            str,
                            player,
                            params,
                            isDiamond ? 1 : undefined
                        );
                    } catch (e) {
                        throw new Error(
                            `String failed '${str}' with ${e} in ${place}`
                        );
                    }
                }
                function checkFormula(str: string, place = "") {
                    const staticRandomGenerated = [
                        0.8728740903521885,
                        0.762138604121094,
                        0.8143235466416332,
                        0.9826834701104354,
                        0.09171212371343129,
                        0.4563365189271211,
                        0.48931175333281907,
                        0.16177116212690001,
                        0.5660071652513856,
                        0.9646507144323373
                    ];

                    try {
                        let i = -1;
                        const random = (staticRandom: number[]) => () => {
                            i++;
                            if (i >= staticRandom.length) {
                                throw new Error(
                                    `Lots of random i=${i} len=${
                                        staticRandom.length
                                    }`
                                );
                                i = 0;
                            }
                            return staticRandom[i];
                        };
                        console.info(`====== ${str} ======`);
                        const oldFormulaResult = formula.parse(
                            str,
                            params,
                            random(staticRandomGenerated)
                        );

                        let permsCount = i;
                        let matchingFound = false;
                        console.info(`permsCount=${permsCount} oldFormulaResult=${oldFormulaResult}`)
                        let permId = 0;
                        heapGenerate(
                            permsCount + 1,
                            staticRandomGenerated.slice(),
                            permRandom => {
                                i = -1;
                                const newFormulaResult = formula2.parse(
                                    str,
                                    params,
                                    random(permRandom)
                                );                                
                                if (oldFormulaResult === newFormulaResult) {
                                    matchingFound = true;
                                }
                                console.info(`Perm id=${permId} newFormula=${newFormulaResult} matching=${matchingFound}`);
                                permId++;
                            }
                        );
                        if (!matchingFound) {
                            console.info(
                                `!!!!!\n\nconst staticRandom=[${staticRandomGenerated.join(
                                    ", "
                                )}];\n` +
                                    `const params=[${params.join(", ")}];\n` +
                                    `const str="${str}";\n` +
                                    `oldFormulaResult=${oldFormulaResult}\n` +
                                    `'${str}'`
                            );
                            throw new Error("New formula fail");
                        }
                    } catch (e) {
                        fs.appendFileSync(
                            __dirname + "/tmp.txt",
                            `|| str === '${str}'\n`
                        );
                        throw new Error(
                            `String failed '${str}' with ${e} in ${place}`
                        );
                    }
                }
                it(`Loads quest and substitute variables`, () => {
                    const data = fs.readFileSync(fullname);
                    quest = parse(data);
                    // Random values. P25 have some quest with big values, so that's why it is reduced
                    params = quest.params.map(
                        (p, i) => (i === 24 ? 2 : i === 4 ? 4 : i * 3 + 1 - 100)
                    );
                });
                it(`Starting/ending text`, () => {
                    check(quest.taskText, "start");
                    check(quest.successText, "success");
                });
                it(`Locations texts and formulas`, () => {
                    quest.locations.map(loc => {
                        if (
                            (f === "Doomino.qm" && loc.id === 28) ||
                            (f === "Kiberrazum.qm" && loc.id === 134)
                        ) {
                            // Doomino: Какой-то там странный текст. Эта локация пустая и все переходы в неё с описанием
                            // Kiberrazum: просто локация без переходов в неё
                            // Вообще-то это можно и автоматически фильтровать
                        } else {
                            loc.texts.map(x => x && check(x, `Loc ${loc.id}`));
                        }
                        loc.paramsChanges.map((p, i) => {
                            if (
                                p.critText !== quest.params[i].critValueString
                            ) {
                                check(
                                    p.critText,
                                    `Loc ${loc.id} crit param ${i}`
                                );
                            }
                            if (
                                quest.params[i].active &&
                                p.isChangeFormula &&
                                p.changingFormula
                            ) {
                                checkFormula(
                                    p.changingFormula,
                                    `param ${i} in loc=${loc.id}`
                                );
                            }
                        });
                        if (loc.isTextByFormula && loc.textSelectFurmula) {
                            checkFormula(
                                loc.textSelectFurmula,
                                `loc=${loc.id} text select formula`
                            );
                        }
                    });
                });
                it(`Jumps texts and formulas`, () => {
                    quest.jumps.map(jump => {
                        jump.text && check(jump.text, `Jump ${jump.id} text`);
                        jump.description &&
                            check(jump.description, `Jump ${jump.id} decr`);
                        jump.paramsChanges.map((p, i) => {
                            if (
                                p.critText !== quest.params[i].critValueString
                            ) {
                                check(
                                    p.critText,
                                    `Jump ${jump.id} crit param ${i}`
                                );
                            }
                            if (
                                quest.params[i].active &&
                                p.isChangeFormula &&
                                p.changingFormula
                            ) {
                                checkFormula(
                                    p.changingFormula,
                                    `param ${i} in jump=${jump.id}`
                                );
                            }
                        });
                        if (jump.formulaToPass) {
                            checkFormula(
                                jump.formulaToPass,
                                `Jump id=${jump.id} formula to pass`
                            );
                        }
                    });
                });
                it(`Params ranges`, () => {
                    quest.params.map((p, i) => {
                        p.showingInfo.map(range => {
                            check(range.str, `Param ${i} range`, true);
                        });
                    });
                });
            });
        }
    }
});
