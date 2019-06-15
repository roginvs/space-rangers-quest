"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var qmreader_1 = require("../qmreader");
var alea_1 = require("../alea");
var formula_1 = require("../formula");
var substitution_1 = require("../substitution");
var defs_1 = require("./defs");
var calculator_1 = require("../formula/calculator");
var assert = __importStar(require("assert"));
exports.DEFAULT_RUS_PLAYER = {
    // TODO: move from this file
    Ranger: "Греф",
    Player: "Греф",
    FromPlanet: "Земля",
    FromStar: "Солнечная",
    ToPlanet: "Боннасис",
    ToStar: "Процион",
    Money: "65535",
    lang: "rus"
};
exports.DEFAULT_ENG_PLAYER = {
    // TODO: move from this file
    Ranger: "Ranger",
    Player: "Player",
    FromPlanet: "FromPlanet",
    FromStar: "FromStar",
    ToPlanet: "ToPlanet",
    ToStar: "ToStar",
    Money: "65535",
    lang: "eng"
};
var DEFAULT_DAYS_TO_PASS_QUEST = 35;
function initGame(quest, seed) {
    var alea = new alea_1.Alea(seed);
    var startLocation = quest.locations.find(function (x) { return x.isStarting; });
    if (!startLocation) {
        throw new Error("No start location!");
    }
    var startingParams = quest.params.map(function (param, index) {
        if (!param.active) {
            return 0;
        }
        if (param.isMoney) {
            var giveMoney = 2000;
            var money = param.max > giveMoney ? giveMoney : param.max;
            var starting = "[" + money + "]";
            return formula_1.parse(starting, [], alea.random);
        }
        return formula_1.parse(param.starting.replace('h', '..'), [], alea.random);
    });
    var startingShowing = quest.params.map(function () { return true; });
    var state = {
        state: "starting",
        locationId: startLocation.id,
        lastJumpId: undefined,
        possibleJumps: [],
        paramValues: startingParams,
        paramShow: startingShowing,
        jumpedCount: {},
        locationVisitCount: {},
        daysPassed: 0,
        imageFilename: undefined,
        aleaState: alea.exportState(),
        aleaSeed: seed,
        performedJumps: []
    };
    return state;
}
exports.initGame = initGame;
function SRDateToString(daysToAdd, lang, initialDate) {
    if (initialDate === void 0) { initialDate = new Date(); }
    var d = new Date(initialDate.getTime() + 1000 * 60 * 60 * 24 * daysToAdd);
    var months = lang === "eng"
        ? [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ]
        : [
            "Января",
            "Февраля",
            "Марта",
            "Апреля",
            "Мая",
            "Июня",
            "Июля",
            "Августа",
            "Сентября",
            "Октября",
            "Ноября",
            "Декабря"
        ];
    return d.getDate() + " " + months[d.getMonth()] + " " + (d.getFullYear() + 1000);
}
function replace(str, state, player, diamondIndex, random // Should not be called
) {
    var lang = player.lang;
    return substitution_1.substitute(str, __assign({ Day: "" + (DEFAULT_DAYS_TO_PASS_QUEST - state.daysPassed), Date: SRDateToString(DEFAULT_DAYS_TO_PASS_QUEST, lang), CurDate: SRDateToString(state.daysPassed, lang), lang: lang }, player), state.paramValues, random, diamondIndex);
}
function getParamsState(quest, state, player, random) {
    var paramsState = [];
    for (var i = 0; i < quest.paramsCount; i++) {
        if (state.paramShow[i] && quest.params[i].active) {
            var val = state.paramValues[i];
            var param = quest.params[i];
            if (val !== 0 || param.showWhenZero) {
                for (var _i = 0, _a = param.showingInfo; _i < _a.length; _i++) {
                    var range = _a[_i];
                    if (val >= range.from && val <= range.to) {
                        var str = replace(range.str, state, player, i, random);
                        paramsState.push(str);
                        break;
                    }
                }
            }
        }
    }
    return paramsState;
}
function calculateLocationShowingTextId(location, state, random) {
    var locationTextsWithText = location.texts
        .map(function (text, i) {
        return { text: text, i: i };
    })
        .filter(function (x) { return x.text; });
    if (location.isTextByFormula) {
        if (location.textSelectFurmula) {
            var id = formula_1.parse(location.textSelectFurmula, state.paramValues, random) -
                1;
            if (location.texts[id]) {
                return id;
            }
            else {
                console.warn("Location id=" + location.id + " formula result textid=" + id + ", but no text");
                return 0; // Tge 4 and 5 shows different here. We will show location text 0
            }
        }
        else {
            console.warn("Location id=" + location.id + " text by formula is set, but no formula");
            var textNum = random(locationTextsWithText.length);
            return ((locationTextsWithText[textNum] &&
                locationTextsWithText[textNum].i) ||
                0);
        }
    }
    else {
        var textNum = locationTextsWithText.length > 0
            ? state.locationVisitCount[location.id] %
                locationTextsWithText.length
            : 0;
        return ((locationTextsWithText[textNum] &&
            locationTextsWithText[textNum].i) ||
            0);
    }
}
function getUIState(quest, state, player) {
    var alea = new alea_1.Alea(state.aleaState.slice());
    var random = alea.random;
    var texts = player.lang === "rus"
        ? {
            iAgree: "Я берусь за это задание",
            next: "Далее",
            goBackToShip: "Вернуться на корабль"
        }
        : {
            iAgree: "I agree",
            next: "Next",
            goBackToShip: "Go back to ship"
        };
    if (state.state === "starting") {
        return {
            text: replace(quest.taskText, state, player, undefined, random),
            paramsState: [],
            choices: [
                {
                    jumpId: defs_1.JUMP_I_AGREE,
                    text: texts.iAgree,
                    active: true
                }
            ],
            gameState: "running"
        };
    }
    else if (state.state === "jump") {
        var jump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        if (!jump) {
            throw new Error("Internal error: no last jump id=" + state.lastJumpId);
        }
        return {
            text: replace(jump.description, state, player, undefined, alea.random),
            paramsState: getParamsState(quest, state, player, random),
            choices: [
                {
                    jumpId: defs_1.JUMP_NEXT,
                    text: texts.next,
                    active: true
                }
            ],
            gameState: "running",
            imageFileName: state.imageFilename
        };
    }
    else if (state.state === "location" || state.state === "critonlocation") {
        var location_1 = quest.locations.find(function (x) { return x.id === state.locationId; });
        if (!location_1) {
            throw new Error("Internal error: no state loc id=" + state.locationId);
        }
        var locTextId = calculateLocationShowingTextId(location_1, state, random);
        var locationOwnText = location_1.texts[locTextId] || "";
        var lastJump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        var text = location_1.isEmpty && lastJump && lastJump.description
            ? lastJump.description
            : locationOwnText;
        return {
            text: replace(text, state, player, undefined, alea.random),
            paramsState: getParamsState(quest, state, player, random),
            choices: state.state === "location"
                ? location_1.isFaily || location_1.isFailyDeadly
                    ? []
                    : location_1.isSuccess
                        ? [
                            {
                                jumpId: defs_1.JUMP_GO_BACK_TO_SHIP,
                                text: texts.goBackToShip,
                                active: true
                            }
                        ]
                        : state.possibleJumps.map(function (x) {
                            var jump = quest.jumps.find(function (y) { return y.id === x.id; });
                            if (!jump) {
                                throw new Error("Internal error: no jump " + x.id + " in possible jumps");
                            }
                            return {
                                text: replace(jump.text, state, player, undefined, alea.random) || texts.next,
                                jumpId: x.id,
                                active: x.active
                            };
                        })
                : [
                    {
                        // critonlocation
                        jumpId: defs_1.JUMP_NEXT,
                        text: texts.next,
                        active: true
                    }
                ],
            gameState: location_1.isFailyDeadly
                ? "dead"
                : location_1.isFaily
                    ? "fail"
                    : "running",
            imageFileName: state.imageFilename
        };
    }
    else if (state.state === "critonjump") {
        var critId = state.critParamId;
        var jump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        if (critId === undefined || !jump) {
            throw new Error("Internal error: crit=" + critId + " lastjump=" + state.lastJumpId);
        }
        var param = quest.params[critId];
        return {
            text: replace(jump.paramsChanges[critId].critText ||
                quest.params[critId].critValueString, state, player, undefined, alea.random),
            paramsState: getParamsState(quest, state, player, random),
            choices: param.type === qmreader_1.ParamType.Успешный
                ? [
                    {
                        jumpId: defs_1.JUMP_GO_BACK_TO_SHIP,
                        text: texts.goBackToShip,
                        active: true
                    }
                ]
                : [],
            gameState: param.type === qmreader_1.ParamType.Успешный
                ? "running"
                : param.type === qmreader_1.ParamType.Провальный
                    ? "fail"
                    : "dead",
            imageFileName: state.imageFilename
        };
    }
    else if (state.state === "jumpandnextcrit") {
        var critId = state.critParamId;
        var jump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        if (critId === undefined || !jump) {
            throw new Error("Internal error: crit=" + critId + " lastjump=" + state.lastJumpId);
        }
        var param = quest.params[critId];
        return {
            text: replace(jump.description, state, player, undefined, alea.random),
            paramsState: getParamsState(quest, state, player, random),
            choices: [
                {
                    jumpId: defs_1.JUMP_NEXT,
                    text: texts.next,
                    active: true
                }
            ],
            gameState: "running",
            imageFileName: state.imageFilename
        };
    }
    else if (state.state === "critonlocationlastmessage") {
        var critId = state.critParamId;
        var location_2 = quest.locations.find(function (x) { return x.id === state.locationId; });
        if (critId === undefined) {
            throw new Error("Internal error: no critId");
        }
        if (!location_2) {
            throw new Error("Internal error: no crit state location " + state.locationId);
        }
        var param = quest.params[critId];
        return {
            text: replace(location_2.paramsChanges[critId].critText ||
                quest.params[critId].critValueString, state, player, undefined, alea.random),
            paramsState: getParamsState(quest, state, player, random),
            choices: param.type === qmreader_1.ParamType.Успешный
                ? [
                    {
                        jumpId: defs_1.JUMP_GO_BACK_TO_SHIP,
                        text: texts.goBackToShip,
                        active: true
                    }
                ]
                : [],
            gameState: param.type === qmreader_1.ParamType.Успешный
                ? "running"
                : param.type === qmreader_1.ParamType.Провальный
                    ? "fail"
                    : "dead",
            imageFileName: state.imageFilename
        };
    }
    else if (state.state === "returnedending") {
        return {
            text: replace(quest.successText, state, player, undefined, alea.random),
            paramsState: [],
            choices: [],
            gameState: "win"
        };
    }
    else {
        return calculator_1.assertNever(state.state);
    }
}
exports.getUIState = getUIState;
function calculateParamsUpdate(quest, stateOriginal, random, paramsChanges) {
    var critParamsTriggered = [];
    var state = stateOriginal;
    var oldValues = state.paramValues.slice(0, quest.paramsCount);
    var newValues = state.paramValues.slice(0, quest.paramsCount);
    for (var i = 0; i < quest.paramsCount; i++) {
        var change = paramsChanges[i];
        if (change.showingType === qmreader_1.ParameterShowingType.Показать) {
            var paramShow = state.paramShow.slice();
            paramShow[i] = true;
            state = __assign({}, state, { paramShow: paramShow });
        }
        else if (change.showingType === qmreader_1.ParameterShowingType.Скрыть) {
            var paramShow = state.paramShow.slice();
            paramShow[i] = false;
            state = __assign({}, state, { paramShow: paramShow });
        }
        if (change.isChangeValue) {
            newValues[i] = change.change;
        }
        else if (change.isChangePercentage) {
            newValues[i] = Math.round((oldValues[i] * (100 + change.change)) / 100);
        }
        else if (change.isChangeFormula) {
            if (change.changingFormula) {
                newValues[i] = formula_1.parse(change.changingFormula, oldValues, random);
            }
        }
        else {
            newValues[i] = oldValues[i] + change.change;
        }
        var param = quest.params[i];
        if (newValues[i] > param.max) {
            newValues[i] = param.max;
        }
        if (newValues[i] < param.min) {
            newValues[i] = param.min;
        }
        if (newValues[i] !== oldValues[i] && param.type !== qmreader_1.ParamType.Обычный) {
            if ((param.critType === qmreader_1.ParamCritType.Максимум &&
                newValues[i] === param.max) ||
                (param.critType === qmreader_1.ParamCritType.Минимум &&
                    newValues[i] === param.min)) {
                critParamsTriggered.push(i);
            }
        }
    }
    state = __assign({}, state, { paramValues: newValues });
    return { state: state, critParamsTriggered: critParamsTriggered };
}
function performJump(jumpId, quest, stateOriginal, images, date) {
    if (images === void 0) { images = []; }
    if (date === void 0) { date = new Date(); }
    var alea = new alea_1.Alea(stateOriginal.aleaState.slice());
    var random = alea.random;
    var performedJumps = stateOriginal.performedJumps.concat([
        {
            date: date,
            jumpId: jumpId
        }
    ]);
    var state = __assign({}, stateOriginal, { performedJumps: performedJumps });
    state = performJumpInternal(jumpId, quest, state, images, random);
    return __assign({}, state, { aleaState: alea.exportState() });
}
exports.performJump = performJump;
function performJumpInternal(jumpId, quest, stateOriginal, images, random) {
    if (images === void 0) { images = []; }
    var _a;
    if (jumpId === defs_1.JUMP_GO_BACK_TO_SHIP) {
        return __assign({}, stateOriginal, { state: "returnedending" });
    }
    var state = stateOriginal;
    var jumpForImg = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
    var image = jumpForImg && jumpForImg.img
        ? jumpForImg.img.toLowerCase() + ".jpg"
        : images
            .filter(function (x) { return !!x.jumpIds && x.jumpIds.indexOf(jumpId) > -1; })
            .map(function (x) { return x.filename; })
            .shift();
    if (image) {
        state = __assign({}, state, { imageFilename: image });
    }
    if (state.state === "starting") {
        state = __assign({}, state, { state: "location" });
        state = calculateLocation(quest, state, images, random);
    }
    else if (state.state === "jump") {
        var jump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        if (!jump) {
            throw new Error("Internal error: no jump " + state.lastJumpId);
        }
        state = __assign({}, state, { locationId: jump.toLocationId, state: "location" });
        state = calculateLocation(quest, state, images, random);
    }
    else if (state.state === "location") {
        if (!state.possibleJumps.find(function (x) { return x.id === jumpId; })) {
            throw new Error("Jump " + jumpId + " is not in list in that location");
        }
        var jump_1 = quest.jumps.find(function (x) { return x.id === jumpId; });
        if (!jump_1) {
            throw new Error("\"Internal Error: no jump id=" + jumpId + " from possible jump list");
        }
        state = __assign({}, state, { lastJumpId: jumpId });
        if (jump_1.dayPassed) {
            state = __assign({}, state, { daysPassed: state.daysPassed + 1 });
        }
        state = __assign({}, state, { jumpedCount: __assign({}, state.jumpedCount, (_a = {}, _a[jumpId] = (state.jumpedCount[jumpId] || 0) + 1, _a)) });
        var paramsUpdate = calculateParamsUpdate(quest, state, random, jump_1.paramsChanges);
        state = paramsUpdate.state;
        var critParamsTriggered = paramsUpdate.critParamsTriggered;
        var nextLocation = quest.locations.find(function (x) { return x.id === jump_1.toLocationId; });
        if (!nextLocation) {
            throw new Error("Internal error: no next location " + jump_1.toLocationId);
        }
        if (!jump_1.description) {
            if (critParamsTriggered.length > 0) {
                var critParamId = critParamsTriggered[0];
                state = __assign({}, state, { state: "critonjump", critParamId: critParamId });
                var qmmImage = (state.critParamId !== undefined &&
                    jump_1.paramsChanges[state.critParamId].img) ||
                    quest.params[critParamId].img;
                var image_1 = qmmImage
                    ? qmmImage.toLowerCase() + ".jpg"
                    : images
                        .filter(function (x) {
                        return !!x.critParams &&
                            x.critParams.indexOf(state.critParamId) > -1;
                    })
                        .map(function (x) { return x.filename; })
                        .shift();
                if (image_1) {
                    state = __assign({}, state, { imageFilename: image_1 });
                }
            }
            else {
                state = __assign({}, state, { locationId: nextLocation.id, state: "location" });
                state = calculateLocation(quest, state, images, random);
            }
        }
        else {
            if (critParamsTriggered.length > 0) {
                state = __assign({}, state, { state: "jumpandnextcrit", critParamId: critParamsTriggered[0] });
            }
            else if (nextLocation.isEmpty) {
                state = __assign({}, state, { locationId: nextLocation.id, state: "location" });
                state = calculateLocation(quest, state, images, random);
            }
            else {
                state = __assign({}, state, { state: "jump" });
            }
        }
    }
    else if (state.state === "jumpandnextcrit") {
        state = __assign({}, state, { state: "critonjump" });
        var jump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        var qmmImg = (state.critParamId !== undefined &&
            jump &&
            jump.paramsChanges[state.critParamId].img) ||
            (state.critParamId !== undefined &&
                quest.params[state.critParamId].img);
        var image_2 = qmmImg
            ? qmmImg.toLowerCase() + ".jpg"
            : images
                .filter(function (x) {
                return !!x.critParams &&
                    state.critParamId !== undefined &&
                    x.critParams.indexOf(state.critParamId) > -1;
            })
                .map(function (x) { return x.filename; })
                .shift();
        if (image_2) {
            state = __assign({}, state, { imageFilename: image_2 });
        }
    }
    else if (state.state === "critonlocation") {
        state = __assign({}, state, { state: "critonlocationlastmessage" });
    }
    else {
        throw new Error("Unknown state " + state.state + " in performJump");
    }
    return state;
}
function calculateLocation(quest, stateOriginal, images, random) {
    var _a;
    var state = stateOriginal;
    state = __assign({}, state, { locationVisitCount: __assign({}, state.locationVisitCount, (_a = {}, _a[state.locationId] = state.locationVisitCount[state.locationId] !== undefined
            ? state.locationVisitCount[state.locationId] + 1
            : 0 // TODO : change to 1
        , _a)) });
    var location = quest.locations.find(function (x) { return x.id === state.locationId; });
    if (!location) {
        throw new Error("Internal error: no state location " + state.locationId);
    }
    var locImgId = calculateLocationShowingTextId(location, state, random);
    var imageFromQmm = location.media[locImgId] && location.media[locImgId].img;
    var imageFromPQI = images.find(function (x) { return !!x.locationIds && x.locationIds.indexOf(state.locationId) > -1; });
    var image = imageFromQmm
        ? imageFromQmm.toLowerCase() + ".jpg"
        : imageFromPQI && imageFromPQI.filename;
    if (image) {
        state = __assign({}, state, { imageFilename: image });
    }
    if (location.dayPassed) {
        state = __assign({}, state, { daysPassed: state.daysPassed + 1 });
    }
    var paramsUpdate = calculateParamsUpdate(quest, state, random, location.paramsChanges);
    state = paramsUpdate.state;
    var critParamsTriggered = paramsUpdate.critParamsTriggered;
    var oldTgeBehaviour = quest.header === qmreader_1.HEADER_QM_2 ||
        quest.header === qmreader_1.HEADER_QM_3 ||
        quest.header === qmreader_1.HEADER_QM_4;
    var allJumps = quest.jumps
        .filter(function (x) { return x.fromLocationId === state.locationId; })
        .filter(function (jump) {
        // Сразу выкинуть переходы в локации с превышенным лимитом
        var toLocation = quest.locations.find(function (x) { return x.id === jump.toLocationId; });
        if (toLocation) {
            if (toLocation.maxVisits &&
                state.locationVisitCount[jump.toLocationId] + 1 >=
                    toLocation.maxVisits) {
                return false;
            }
        }
        if (oldTgeBehaviour) {
            // Это какая-то особенность TGE - не учитывать переходы, которые ведут в локацию
            // где были переходы, а проходимость закончилась.
            // Это вообще дикость какая-то, потому как там вполне может быть
            // критичный параметр завершить квест
            var jumpsFromDestination = quest.jumps.filter(function (x) { return x.fromLocationId === jump.toLocationId; });
            if (jumpsFromDestination.length === 0) {
                // Но если там вообще переходов не было, то всё ок
                return true;
            }
            if (jumpsFromDestination.filter(function (x) {
                return x.jumpingCountLimit &&
                    state.jumpedCount[x.id] >= x.jumpingCountLimit;
            }).length === jumpsFromDestination.length) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    });
    // Если есть такие же тексты - то спорный по весам
    // Если текст один - то по вероятности
    var possibleJumps = allJumps
        .sort(function (a, b) {
        return a.showingOrder !== b.showingOrder
            ? a.showingOrder - b.showingOrder
            : random(2) * 2 - 1;
    })
        .map(function (jump) {
        return {
            jump: jump,
            active: (function (jump) {
                var _loop_3 = function (i) {
                    if (quest.params[i].active) {
                        if (state.paramValues[i] >
                            jump.paramsConditions[i].mustTo ||
                            state.paramValues[i] <
                                jump.paramsConditions[i].mustFrom) {
                            return { value: false };
                        }
                        if (jump.paramsConditions[i].mustEqualValues
                            .length > 0) {
                            var isEqual = jump.paramsConditions[i].mustEqualValues.filter(function (x) { return x === state.paramValues[i]; });
                            if (jump.paramsConditions[i]
                                .mustEqualValuesEqual &&
                                isEqual.length === 0) {
                                return { value: false };
                            }
                            if (!jump.paramsConditions[i]
                                .mustEqualValuesEqual &&
                                isEqual.length !== 0) {
                                return { value: false };
                            }
                        }
                        if (jump.paramsConditions[i].mustModValues.length >
                            0) {
                            var isMod = jump.paramsConditions[i].mustModValues.filter(function (x) { return state.paramValues[i] % x === 0; });
                            if (jump.paramsConditions[i].mustModValuesMod &&
                                isMod.length === 0) {
                                return { value: false };
                            }
                            if (!jump.paramsConditions[i]
                                .mustModValuesMod &&
                                isMod.length !== 0) {
                                return { value: false };
                            }
                        }
                    }
                };
                for (var i = 0; i < quest.paramsCount; i++) {
                    var state_1 = _loop_3(i);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
                if (jump.formulaToPass) {
                    if (formula_1.parse(jump.formulaToPass, state.paramValues, random) === 0) {
                        return false;
                    }
                }
                if (jump.jumpingCountLimit &&
                    state.jumpedCount[jump.id] >= jump.jumpingCountLimit) {
                    return false;
                }
                return true;
            })(jump)
        };
    });
    var newJumps = [];
    var seenTexts = {};
    var _loop_1 = function (j) {
        if (!seenTexts[j.jump.text]) {
            seenTexts[j.jump.text] = true;
            var jumpsWithSameText = possibleJumps.filter(function (x) { return x.jump.text === j.jump.text; });
            if (jumpsWithSameText.length === 1) {
                if (j.jump.prio < 1 && j.active) {
                    var ACCURACY = 1000;
                    j.active = random(ACCURACY) < j.jump.prio * ACCURACY;
                    // console.info(`Jump ${j.jump.text} is now ${j.active} by random`)
                }
                if (j.active || j.jump.alwaysShow) {
                    newJumps.push(j);
                }
            }
            else {
                var jumpsActiveWithSameText = jumpsWithSameText.filter(function (x) { return x.active; });
                if (jumpsActiveWithSameText.length > 0) {
                    var maxPrio_1 = jumpsActiveWithSameText.reduce(function (max, jump) {
                        return jump.jump.prio > max ? jump.jump.prio : max;
                    }, 0);
                    var jumpsWithNotSoLowPrio = jumpsActiveWithSameText.filter(function (x) { return x.jump.prio * 100 >= maxPrio_1; });
                    var prioSum = jumpsWithNotSoLowPrio
                        .map(function (x) { return x.jump.prio; })
                        .reduce(function (sum, i) { return i + sum; }, 0);
                    var ACCURACY = 1000000;
                    var rnd = (random(ACCURACY) / ACCURACY) * prioSum;
                    for (var _i = 0, jumpsWithNotSoLowPrio_1 = jumpsWithNotSoLowPrio; _i < jumpsWithNotSoLowPrio_1.length; _i++) {
                        var jj = jumpsWithNotSoLowPrio_1[_i];
                        if (jj.jump.prio >= rnd ||
                            jj === jumpsWithNotSoLowPrio.slice(-1).pop()) {
                            newJumps.push(jj);
                            break;
                        }
                        else {
                            rnd = rnd - jj.jump.prio;
                        }
                    }
                }
                else {
                    var alLeastOneWithAlwaysShow = jumpsWithSameText
                        .filter(function (x) { return x.jump.alwaysShow; })
                        .shift();
                    if (alLeastOneWithAlwaysShow) {
                        newJumps.push(alLeastOneWithAlwaysShow);
                    }
                }
            }
        }
    };
    for (var _i = 0, possibleJumps_1 = possibleJumps; _i < possibleJumps_1.length; _i++) {
        var j = possibleJumps_1[_i];
        _loop_1(j);
    }
    /*
    const newActiveJumpsWithoutEmpty = newJumps.filter(x => x.active && x.jump.text);
    const newActiveJumpsOnlyEmpty = newJumps.filter(x => x.active && !x.jump.text);
    const newActiveJumpsOnlyOneEmpty = newActiveJumpsOnlyEmpty.length > 0 ? [newActiveJumpsOnlyEmpty[0]] : [];
    
    this.state.possibleJumps = (newActiveJumpsWithoutEmpty.length > 0 ?
        newJumps.filter(x => x.jump.text) :
        newActiveJumpsOnlyOneEmpty)
        .map(x => {
            return {
                active: x.active,
                id: x.jump.id
            }
        })
        */
    var newJumpsWithoutEmpty = newJumps.filter(function (x) { return x.jump.text; });
    var newActiveJumpsOnlyEmpty = newJumps.filter(function (x) { return x.active && !x.jump.text; });
    var newActiveJumpsOnlyOneEmpty = newActiveJumpsOnlyEmpty.length > 0 ? [newActiveJumpsOnlyEmpty[0]] : [];
    var statePossibleJumps = (newJumpsWithoutEmpty.length > 0
        ? newJumpsWithoutEmpty
        : newActiveJumpsOnlyOneEmpty).map(function (x) {
        return {
            active: x.active,
            id: x.jump.id
        };
    });
    state = __assign({}, state, { possibleJumps: statePossibleJumps });
    var _loop_2 = function (critParam) {
        var gotCritWithChoices = (quest.params[critParam].type === qmreader_1.ParamType.Провальный ||
            quest.params[critParam].type === qmreader_1.ParamType.Смертельный) &&
            state.possibleJumps.filter(function (x) { return x.active; }).length > 0;
        if (!oldTgeBehaviour || !gotCritWithChoices) {
            var lastjump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
            state = __assign({}, state, { state: location.isEmpty
                    ? state.lastJumpId && lastjump && lastjump.description
                        ? "critonlocation"
                        : "critonlocationlastmessage"
                    : "critonlocation", critParamId: critParam });
            var qmmImg = location.paramsChanges[critParam].img ||
                quest.params[critParam].img;
            var image_3 = qmmImg
                ? qmmImg.toLowerCase() + ".jpg"
                : images
                    .filter(function (x) {
                    return !!x.critParams &&
                        x.critParams.indexOf(critParam) > -1;
                })
                    .map(function (x) { return x.filename; })
                    .shift();
            if (image_3) {
                state = __assign({}, state, { imageFilename: image_3 });
            }
        }
    };
    for (var _b = 0, critParamsTriggered_1 = critParamsTriggered; _b < critParamsTriggered_1.length; _b++) {
        var critParam = critParamsTriggered_1[_b];
        _loop_2(critParam);
    }
    // calculateLocation is always called when state.state === "location"
    /* А это дикий костыль для пустых локаций и переходов */
    if (state.possibleJumps.length === 1) {
        var lonenyCurrentJumpInPossible_1 = state.possibleJumps[0];
        var lonenyCurrentJump = quest.jumps.find(function (x) { return x.id === lonenyCurrentJumpInPossible_1.id; });
        if (!lonenyCurrentJump) {
            throw new Error("Unable to find jump id=" + lonenyCurrentJumpInPossible_1.id);
        }
        var lastJump = quest.jumps.find(function (x) { return x.id === state.lastJumpId; });
        var locTextId = calculateLocationShowingTextId(location, state, random);
        var locationOwnText = location.texts[locTextId] || "";
        //console.info(
        //    `\noldTgeBehaviour=${oldTgeBehaviour} locationOwnText=${locationOwnText} isEmpty=${location.isEmpty} id=${location.id} `+
        //    `lastJump=${!!lastJump} lastJumpDesc=${lastJump ? lastJump.description : "<nojump>"}`
        //);
        var needAutoJump = lonenyCurrentJumpInPossible_1.active &&
            !lonenyCurrentJump.text &&
            (location.isEmpty
                ? lastJump
                    ? !lastJump.description
                    : true
                : !locationOwnText);
        if (needAutoJump) {
            console.info("Performinig autojump from loc=" + state.locationId + " via jump=" + lonenyCurrentJump.id);
            state = performJumpInternal(lonenyCurrentJump.id, quest, state, images, random);
        }
    }
    return state;
}
function getAllImagesToPreload(quest, images) {
    var imagesPQI = images.map(function (x) { return x.filename; });
    var imagesQmm = qmreader_1.getImagesListFromQmm(quest).map(function (x) { return x.toLowerCase() + ".jpg"; });
    var uniq = {};
    for (var _i = 0, _a = imagesPQI.concat(imagesQmm); _i < _a.length; _i++) {
        var img = _a[_i];
        uniq[img] = true;
    }
    return Object.keys(uniq);
}
exports.getAllImagesToPreload = getAllImagesToPreload;
function validateState(quest, stateOriginal, images) {
    if (images === void 0) { images = []; }
    try {
        var state = initGame(quest, stateOriginal.aleaSeed);
        for (var _i = 0, _a = stateOriginal.performedJumps; _i < _a.length; _i++) {
            var performedJump = _a[_i];
            state = performJump(performedJump.jumpId, quest, state, images, performedJump.date);
        }
        ;
        assert.deepStrictEqual(stateOriginal, state);
        return true;
    }
    catch (e) {
        console.info(e);
        return false;
    }
}
exports.validateState = validateState;
function getGameLog(state) {
    return {
        aleaSeed: state.aleaSeed,
        performedJumps: state.performedJumps,
    };
}
exports.getGameLog = getGameLog;
function validateWinningLog(quest, gameLog) {
    try {
        var state = initGame(quest, gameLog.aleaSeed);
        for (var _i = 0, _a = gameLog.performedJumps; _i < _a.length; _i++) {
            var performedJump = _a[_i];
            state = performJump(performedJump.jumpId, quest, state, [], performedJump.date);
        }
        ;
        if (state.state !== "returnedending") {
            throw new Error('Not a winning state');
        }
        return true;
    }
    catch (e) {
        console.info(e);
        return false;
    }
}
exports.validateWinningLog = validateWinningLog;
