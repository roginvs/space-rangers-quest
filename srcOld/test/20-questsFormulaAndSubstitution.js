"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
require("mocha");
var qmplayer_1 = require("../lib/qmplayer");
var qmreader_1 = require("../lib/qmreader");
var substitution_1 = require("../lib/substitution");
var formula = __importStar(require("../lib/formula"));
var randomFunc_1 = require("../lib/randomFunc");
var srcDir = __dirname + "/../../borrowed/qm/";
describe("Checking all quests for formulas and params substitution", function () {
    this.timeout(60 * 1000);
    for (var _i = 0, _a = fs.readdirSync(srcDir); _i < _a.length; _i++) {
        var origin = _a[_i];
        var _loop_1 = function (f) {
            var fullname = srcDir + origin + '/' + f;
            describe("Checking quest " + fullname, function () {
                var quest;
                var params;
                var player = {
                    Ranger: 'Ranger',
                    Player: 'Player',
                    FromPlanet: 'FromPlanet',
                    FromStar: 'FromStar',
                    ToPlanet: 'ToPlanet',
                    ToStar: 'ToStar',
                    Date: 'Date',
                    Day: 'Day',
                    Money: 'Money',
                    CurDate: 'CurDate',
                    lang: "rus",
                };
                function check(str, place, isDiamond) {
                    if (place === void 0) { place = ''; }
                    if (isDiamond === void 0) { isDiamond = false; }
                    try {
                        substitution_1.substitute(str, player, params, randomFunc_1.randomFromMathRandom, isDiamond ? 1 : undefined);
                    }
                    catch (e) {
                        throw new Error("String failed '" + str + "' with " + e + " in " + place);
                    }
                }
                function checkFormula(str, place) {
                    if (place === void 0) { place = ''; }
                    var staticRandomGenerated = [0.8098721706321894,
                        0.7650745137670785,
                        0.5122628148859116,
                        0.7001314250579083,
                        0.9777148783782501,
                        0.6484951526791192,
                        0.6277520602629139,
                        0.6271209273581702,
                        0.5929518455455183,
                        0.555114104030954,
                        0.8769248658117874,
                        0.9012611135928128,
                        0.9887903872842161,
                        0.9032020764410791,
                        0.09244706438405847,
                        0.6841815116128189,
                        0.26661520895002355,
                        0.95424331893931,
                        0.8900907263092355,
                        0.9796112746203975];
                    function createRandom(staticRandom) {
                        var i = 0;
                        return function () {
                            i++;
                            if (i >= staticRandom.length) {
                                throw new Error("Lots of random");
                                i = 0;
                            }
                            return staticRandom[i];
                        };
                    }
                    try {
                        var formulaResult = formula.parse(str, params, createRandom(staticRandomGenerated));
                    }
                    catch (e) {
                        throw new Error("String failed '" + str + "' with " + e + " in " + place);
                    }
                }
                it("Loads quest and substitute variables", function () {
                    var data = fs.readFileSync(fullname);
                    quest = qmreader_1.parse(data);
                    params = quest.params.map(function (p, i) { return i * i; });
                });
                it("Creates player and starts (to check init values)", function () {
                    var player = new qmplayer_1.QMPlayer(quest, [], "rus");
                    player.start();
                });
                it("Starting/ending text", function () {
                    check(quest.taskText, 'start');
                    check(quest.successText, 'success');
                });
                it("Locations texts and formulas", function () {
                    quest.locations.map(function (loc) {
                        if ((f === 'Doomino.qm' && loc.id === 28) ||
                            (f === 'Kiberrazum.qm' && loc.id === 134)) {
                            // Doomino: Какой-то там странный текст. Эта локация пустая и все переходы в неё с описанием
                            // Kiberrazum: просто локация без переходов в неё
                            // Вообще-то это можно и автоматически фильтровать
                        }
                        else {
                            loc.texts.map(function (x) { return x && check(x, "Loc " + loc.id); });
                        }
                        loc.paramsChanges.map(function (p, i) {
                            if (p.critText !== quest.params[i].critValueString) {
                                check(p.critText, "Loc " + loc.id + " crit param " + i);
                            }
                            if (quest.params[i].active && p.isChangeFormula && p.changingFormula) {
                                checkFormula(p.changingFormula, "param " + i + " in loc=" + loc.id);
                            }
                        });
                        if (loc.isTextByFormula && loc.textSelectFurmula) {
                            checkFormula(loc.textSelectFurmula, "loc=" + loc.id + " text select formula");
                        }
                    });
                });
                it("Jumps texts and formulas", function () {
                    quest.jumps.map(function (jump) {
                        jump.text && check(jump.text, "Jump " + jump.id + " text");
                        jump.description && check(jump.description, "Jump " + jump.id + " decr");
                        jump.paramsChanges.map(function (p, i) {
                            if (p.critText !== quest.params[i].critValueString) {
                                check(p.critText, "Jump " + jump.id + " crit param " + i);
                            }
                            if (quest.params[i].active && p.isChangeFormula && p.changingFormula) {
                                checkFormula(p.changingFormula, "param " + i + " in jump=" + jump.id);
                            }
                        });
                        if (jump.formulaToPass) {
                            checkFormula(jump.formulaToPass, "Jump id=" + jump.id + " formula to pass");
                        }
                    });
                });
                it("Params ranges", function () {
                    quest.params.map(function (p, i) {
                        p.showingInfo.map(function (range) {
                            check(range.str, "Param " + i + " range", true);
                        });
                    });
                });
            });
        };
        for (var _b = 0, _c = fs.readdirSync(srcDir + origin); _b < _c.length; _b++) {
            var f = _c[_b];
            _loop_1(f);
        }
    }
});
