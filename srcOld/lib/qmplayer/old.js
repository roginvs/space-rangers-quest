"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var qmreader_1 = require("../qmreader");
var formula_1 = require("../formula");
var substitution_1 = require("../substitution");
var defs_1 = require("./defs");
var randomFunc_1 = require("../randomFunc");
var DEFAULT_DAYS_TO_PASS_QUEST = 35;
var QMPlayer = /** @class */ (function () {
    //    private locationsIds = this.quest.locations.map(x => x.id);
    //    private jumpsIds = this.quest.jumps.map(x => x.id);
    function QMPlayer(quest, images, lang, oldTgeBehaviour) {
        if (images === void 0) { images = []; }
        this.quest = quest;
        this.images = images;
        this.lang = lang;
        this.oldTgeBehaviour = oldTgeBehaviour;
        this.texts = this.lang === "rus"
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
        for (var i = 0; i < this.quest.paramsCount; i++) {
            if (this.quest.params[i].isMoney) {
                var giveMoney = 2000;
                var money = this.quest.params[i].max > giveMoney
                    ? giveMoney
                    : this.quest.params[i].max;
                this.quest.params[i].starting = "[" + money + "]";
            }
        }
        this.start();
    }
    QMPlayer.prototype.start = function () {
        var startLocation = this.quest.locations.find(function (x) { return x.isStarting; });
        if (!startLocation) {
            throw new Error("No start location!");
        }
        var startingParams = this.quest.params.map(function (param, index) {
            return param.active ? formula_1.parse(param.starting, [], randomFunc_1.randomFromMathRandom) : 0;
        });
        var startingShowing = this.quest.params.map(function () { return true; });
        this.state = {
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
            randomSeed: 0,
        };
    };
    QMPlayer.prototype.replace = function (str, diamondIndex) {
        return substitution_1.substitute(str, {
            Ranger: this.lang === "rus" ? "Греф" : "Ranger",
            Player: this.lang === "rus" ? "Греф" : "Player",
            FromPlanet: this.lang === "rus" ? "Земля" : "FromPlanet",
            FromStar: this.lang === "rus" ? "Солнечная" : "FromStar",
            ToPlanet: this.lang === "rus" ? "Боннасис" : "ToPlanet",
            ToStar: this.lang === "rus" ? "Процион" : "ToStar",
            Money: "65535",
            Day: "" + (DEFAULT_DAYS_TO_PASS_QUEST - this.state.daysPassed),
            Date: this.SRDateToString(DEFAULT_DAYS_TO_PASS_QUEST),
            CurDate: this.SRDateToString(this.state.daysPassed),
            lang: "rus"
        }, this.state.paramValues, randomFunc_1.randomFromMathRandom, diamondIndex);
    };
    QMPlayer.prototype.getParamsState = function () {
        var paramsState = [];
        for (var i = 0; i < this.quest.paramsCount; i++) {
            if (this.state.paramShow[i] && this.quest.params[i].active) {
                var val = this.state.paramValues[i];
                var param = this.quest.params[i];
                if (val !== 0 || param.showWhenZero) {
                    for (var _i = 0, _a = param.showingInfo; _i < _a.length; _i++) {
                        var range = _a[_i];
                        if (val >= range.from && val <= range.to) {
                            var str = this.replace(range.str, i);
                            paramsState.push(str);
                            break;
                        }
                    }
                }
            }
        }
        return paramsState;
    };
    QMPlayer.prototype.getAllImagesToPreload = function () {
        var imagesPQI = this.images.map(function (x) { return x.filename; });
        var imagesQmm = qmreader_1.getImagesListFromQmm(this.quest).map(function (x) { return x.toLowerCase() + ".jpg"; });
        var uniq = {};
        for (var _i = 0, _a = imagesPQI.concat(imagesQmm); _i < _a.length; _i++) {
            var img = _a[_i];
            uniq[img] = true;
        }
        return Object.keys(uniq);
    };
    QMPlayer.prototype.getState = function () {
        var _this = this;
        if (this.state.state === "starting") {
            return {
                text: this.replace(this.quest.taskText),
                paramsState: [],
                choices: [
                    {
                        jumpId: defs_1.JUMP_I_AGREE,
                        text: this.texts.iAgree,
                        active: true
                    }
                ],
                gameState: "running"
            };
        }
        else if (this.state.state === "jump") {
            var jump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            if (!jump) {
                throw new Error("Internal error: no last jump id=" + this.state.lastJumpId);
            }
            return {
                text: this.replace(jump.description),
                paramsState: this.getParamsState(),
                choices: [
                    {
                        jumpId: defs_1.JUMP_NEXT,
                        text: this.texts.next,
                        active: true
                    }
                ],
                gameState: "running",
                imageFileName: this.state.imageFilename
            };
        }
        else if (this.state.state === "location" ||
            this.state.state === "critonlocation") {
            var location_1 = this.quest.locations.find(function (x) { return x.id === _this.state.locationId; });
            if (!location_1) {
                throw new Error("Internal error: no state loc id=" + this.state.locationId);
            }
            var locTextId = this.calculateLocationShowingTextId(location_1);
            var textInOptions = location_1.texts[locTextId] || "";
            var lastJump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            var text = location_1.isEmpty && lastJump && lastJump.description
                ? lastJump.description
                : textInOptions;
            return {
                text: this.replace(text),
                paramsState: this.getParamsState(),
                choices: this.state.state === "location"
                    ? location_1.isFaily || location_1.isFailyDeadly
                        ? []
                        : location_1.isSuccess
                            ? [
                                {
                                    jumpId: defs_1.JUMP_GO_BACK_TO_SHIP,
                                    text: this.texts.goBackToShip,
                                    active: true
                                }
                            ]
                            : this.state.possibleJumps.map(function (x) {
                                var jump = _this.quest.jumps.find(function (y) { return y.id === x.id; });
                                if (!jump) {
                                    throw new Error("Internal error: no jump " + x.id + " in possible jumps");
                                }
                                return {
                                    text: _this.replace(jump.text) ||
                                        _this.texts.next,
                                    jumpId: x.id,
                                    active: x.active
                                };
                            })
                    : [
                        {
                            // critonlocation
                            jumpId: defs_1.JUMP_NEXT,
                            text: this.texts.next,
                            active: true
                        }
                    ],
                gameState: location_1.isFailyDeadly
                    ? "dead"
                    : location_1.isFaily ? "fail" : "running",
                imageFileName: this.state.imageFilename
            };
        }
        else if (this.state.state === "critonjump") {
            var critId = this.state.critParamId;
            var jump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            if (critId === undefined || !jump) {
                throw new Error("Internal error: crit=" + critId + " lastjump=" + this.state
                    .lastJumpId);
            }
            var param = this.quest.params[critId];
            return {
                text: this.replace(jump.paramsChanges[critId].critText ||
                    this.quest.params[critId].critValueString),
                paramsState: this.getParamsState(),
                choices: param.type === qmreader_1.ParamType.Успешный
                    ? [
                        {
                            jumpId: defs_1.JUMP_GO_BACK_TO_SHIP,
                            text: this.texts.goBackToShip,
                            active: true
                        }
                    ]
                    : [],
                gameState: param.type === qmreader_1.ParamType.Успешный
                    ? "running"
                    : param.type === qmreader_1.ParamType.Провальный ? "fail" : "dead",
                imageFileName: this.state.imageFilename
            };
        }
        else if (this.state.state === "jumpandnextcrit") {
            var critId = this.state.critParamId;
            var jump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            if (critId === undefined || !jump) {
                throw new Error("Internal error: crit=" + critId + " lastjump=" + this.state
                    .lastJumpId);
            }
            var param = this.quest.params[critId];
            return {
                text: this.replace(jump.description),
                paramsState: this.getParamsState(),
                choices: [
                    {
                        jumpId: defs_1.JUMP_NEXT,
                        text: this.texts.next,
                        active: true
                    }
                ],
                gameState: "running",
                imageFileName: this.state.imageFilename
            };
        }
        else if (this.state.state === "critonlocationlastmessage") {
            var critId = this.state.critParamId;
            var location_2 = this.quest.locations.find(function (x) { return x.id === _this.state.locationId; });
            if (critId === undefined) {
                throw new Error("Internal error: no critId");
            }
            if (!location_2) {
                throw new Error("Internal error: no crit state location " + this.state.locationId);
            }
            var param = this.quest.params[critId];
            return {
                text: this.replace(location_2.paramsChanges[critId].critText ||
                    this.quest.params[critId].critValueString),
                paramsState: this.getParamsState(),
                choices: param.type === qmreader_1.ParamType.Успешный
                    ? [
                        {
                            jumpId: defs_1.JUMP_GO_BACK_TO_SHIP,
                            text: this.texts.goBackToShip,
                            active: true
                        }
                    ]
                    : [],
                gameState: param.type === qmreader_1.ParamType.Успешный
                    ? "running"
                    : param.type === qmreader_1.ParamType.Провальный ? "fail" : "dead",
                imageFileName: this.state.imageFilename
            };
        }
        else if (this.state.state === "returnedending") {
            return {
                text: this.replace(this.quest.successText),
                paramsState: [],
                choices: [],
                gameState: "win"
            };
        }
        else {
            throw new Error("Unknown state " + this.state.state + " in getState");
        }
    };
    QMPlayer.prototype.calculateParamsUpdate = function (paramsChanges) {
        var critParamsTriggered = [];
        var oldValues = this.state.paramValues.slice(0, this.quest.paramsCount);
        var newValues = this.state.paramValues.slice(0, this.quest.paramsCount);
        for (var i = 0; i < this.quest.paramsCount; i++) {
            var change = paramsChanges[i];
            if (change.showingType === qmreader_1.ParameterShowingType.Показать) {
                this.state.paramShow[i] = true;
            }
            else if (change.showingType === qmreader_1.ParameterShowingType.Скрыть) {
                this.state.paramShow[i] = false;
            }
            if (change.isChangeValue) {
                newValues[i] = change.change;
            }
            else if (change.isChangePercentage) {
                newValues[i] = Math.round(oldValues[i] * (100 + change.change) / 100);
            }
            else if (change.isChangeFormula) {
                if (change.changingFormula) {
                    newValues[i] = formula_1.parse(change.changingFormula, oldValues, randomFunc_1.randomFromMathRandom);
                }
            }
            else {
                newValues[i] = oldValues[i] + change.change;
            }
            var param = this.quest.params[i];
            if (newValues[i] > param.max) {
                newValues[i] = param.max;
            }
            if (newValues[i] < param.min) {
                newValues[i] = param.min;
            }
            if (newValues[i] !== oldValues[i] &&
                param.type !== qmreader_1.ParamType.Обычный) {
                if ((param.critType === qmreader_1.ParamCritType.Максимум &&
                    newValues[i] === param.max) ||
                    (param.critType === qmreader_1.ParamCritType.Минимум &&
                        newValues[i] === param.min)) {
                    critParamsTriggered.push(i);
                }
            }
        }
        this.state.paramValues = newValues;
        return critParamsTriggered;
    };
    QMPlayer.prototype.performJump = function (jumpId) {
        var _this = this;
        if (jumpId === defs_1.JUMP_GO_BACK_TO_SHIP) {
            this.state.state = "returnedending";
            return;
        }
        var jumpForImg = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
        var image = jumpForImg && jumpForImg.img
            ? jumpForImg.img.toLowerCase() + ".jpg"
            : this.images
                .filter(function (x) { return !!x.jumpIds && x.jumpIds.indexOf(jumpId) > -1; })
                .map(function (x) { return x.filename; })
                .shift();
        if (image) {
            this.state.imageFilename = image;
        }
        if (this.state.state === "starting") {
            this.state.state = "location";
            this.calculateLocation();
        }
        else if (this.state.state === "jump") {
            var jump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            if (!jump) {
                throw new Error("Internal error: no just " + this.state.lastJumpId);
            }
            this.state.locationId = jump.toLocationId;
            this.state.state = "location";
            this.calculateLocation();
        }
        else if (this.state.state === "location") {
            if (!this.state.possibleJumps.find(function (x) { return x.id === jumpId; })) {
                throw new Error("Jump " + jumpId + " is not in list in that location");
            }
            var jump_1 = this.quest.jumps.find(function (x) { return x.id === jumpId; });
            if (!jump_1) {
                throw new Error("\"Internal Error: no jump id=" + jumpId + " from possible jump list");
            }
            this.state.lastJumpId = jumpId;
            if (jump_1.dayPassed) {
                this.state.daysPassed++;
            }
            if (!(jumpId in this.state.jumpedCount)) {
                this.state.jumpedCount[jumpId] = 1;
            }
            else {
                this.state.jumpedCount[jumpId]++;
            }
            var critParamsTriggered = this.calculateParamsUpdate(jump_1.paramsChanges);
            var nextLocation = this.quest.locations.find(function (x) { return x.id === jump_1.toLocationId; });
            if (!nextLocation) {
                throw new Error("Internal error: no next location " + jump_1.toLocationId);
            }
            if (!jump_1.description) {
                if (critParamsTriggered.length > 0) {
                    this.state.state = "critonjump";
                    this.state.critParamId = critParamsTriggered[0];
                    var qmmImage = (this.state.critParamId !== undefined &&
                        jump_1.paramsChanges[this.state.critParamId].img) ||
                        this.quest.params[this.state.critParamId].img;
                    var image_1 = qmmImage
                        ? qmmImage.toLowerCase() + ".jpg"
                        : this.images
                            .filter(function (x) {
                            return !!x.critParams &&
                                x.critParams.indexOf(_this.state
                                    .critParamId) > -1;
                        })
                            .map(function (x) { return x.filename; })
                            .shift();
                    if (image_1) {
                        this.state.imageFilename = image_1;
                    }
                }
                else {
                    this.state.locationId = nextLocation.id;
                    this.state.state = "location";
                    this.calculateLocation();
                }
            }
            else {
                if (critParamsTriggered.length > 0) {
                    this.state.state = "jumpandnextcrit";
                    this.state.critParamId = critParamsTriggered[0];
                }
                else if (nextLocation.isEmpty) {
                    this.state.locationId = nextLocation.id;
                    this.state.state = "location";
                    this.calculateLocation();
                }
                else {
                    this.state.state = "jump";
                }
            }
        }
        else if (this.state.state === "jumpandnextcrit") {
            this.state.state = "critonjump";
            var jump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            var qmmImg = (this.state.critParamId !== undefined &&
                jump &&
                jump.paramsChanges[this.state.critParamId].img) ||
                (this.state.critParamId !== undefined &&
                    this.quest.params[this.state.critParamId].img);
            var image_2 = qmmImg
                ? qmmImg.toLowerCase() + ".jpg"
                : this.images
                    .filter(function (x) {
                    return !!x.critParams &&
                        x.critParams.indexOf(_this.state
                            .critParamId) > -1;
                })
                    .map(function (x) { return x.filename; })
                    .shift();
            if (image_2) {
                this.state.imageFilename = image_2;
            }
        }
        else if (this.state.state === "critonlocation") {
            this.state.state = "critonlocationlastmessage";
        }
        else {
            throw new Error("Unknown state " + this.state.state + " in performJump");
        }
    };
    QMPlayer.prototype.getSaving = function () {
        // TODO: Lol
        return JSON.parse(JSON.stringify(this.state));
    };
    QMPlayer.prototype.loadSaving = function (state) {
        // TODO: Same lol
        this.state = JSON.parse(JSON.stringify(state));
    };
    QMPlayer.prototype.calculateLocationShowingTextId = function (location) {
        var locationTextsWithText = location.texts
            .map(function (text, i) {
            return { text: text, i: i };
        })
            .filter(function (x) { return x.text; });
        if (location.textSelectFurmula) {
            if (location.textSelectFurmula) {
                var id = formula_1.parse(location.textSelectFurmula, this.state.paramValues, randomFunc_1.randomFromMathRandom) -
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
                var textNum = Math.floor(Math.random() * locationTextsWithText.length);
                return ((locationTextsWithText[textNum] &&
                    locationTextsWithText[textNum].i) ||
                    0);
            }
        }
        else {
            var textNum = locationTextsWithText.length > 0
                ? this.state.locationVisitCount[location.id] %
                    locationTextsWithText.length
                : 0;
            return ((locationTextsWithText[textNum] &&
                locationTextsWithText[textNum].i) ||
                0);
        }
    };
    QMPlayer.prototype.calculateLocation = function () {
        var _this = this;
        if (this.state.locationId in this.state.locationVisitCount) {
            this.state.locationVisitCount[this.state.locationId]++;
        }
        else {
            this.state.locationVisitCount[this.state.locationId] = 0;
        }
        var location = this.quest.locations.find(function (x) { return x.id === _this.state.locationId; });
        if (!location) {
            throw new Error("Internal error: no state location " + this.state.locationId);
        }
        var locImgId = this.calculateLocationShowingTextId(location);
        var imageFromQmm = location.media[locImgId] && location.media[locImgId].img;
        var imageFromPQI = this.images.find(function (x) {
            return !!x.locationIds &&
                x.locationIds.indexOf(_this.state.locationId) > -1;
        });
        var image = imageFromQmm
            ? imageFromQmm.toLowerCase() + ".jpg"
            : imageFromPQI && imageFromPQI.filename;
        if (image) {
            this.state.imageFilename = image;
        }
        if (location.dayPassed) {
            this.state.daysPassed++;
        }
        var critParamsTriggered = this.calculateParamsUpdate(location.paramsChanges);
        var allJumps = this.quest.jumps
            .filter(function (x) { return x.fromLocationId === _this.state.locationId; })
            .filter(function (jump) {
            // Сразу выкинуть переходы в локации с превышенным лимитом
            var toLocation = _this.quest.locations.find(function (x) { return x.id === jump.toLocationId; });
            if (toLocation) {
                if (toLocation.maxVisits &&
                    _this.state.locationVisitCount[jump.toLocationId] + 1 >=
                        toLocation.maxVisits) {
                    return false;
                }
            }
            if (_this.oldTgeBehaviour) {
                // Это какая-то особенность TGE - не учитывать переходы, которые ведут в локацию
                // где были переходы, а проходимость закончилась.
                // Это вообще дикость какая-то, потому как там вполне может быть
                // критичный параметр завершить квест
                var jumpsFromDestination = _this.quest.jumps.filter(function (x) { return x.fromLocationId === jump.toLocationId; });
                if (jumpsFromDestination.length === 0) {
                    // Но если там вообще переходов не было, то всё ок
                    return true;
                }
                if (jumpsFromDestination.filter(function (x) {
                    return x.jumpingCountLimit &&
                        _this.state.jumpedCount[x.id] >=
                            x.jumpingCountLimit;
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
                : Math.floor(Math.random() * 2) * 2 - 1;
        })
            .map(function (jump) {
            return {
                jump: jump,
                active: (function (jump) {
                    var _loop_3 = function (i) {
                        if (_this.quest.params[i].active) {
                            if (_this.state.paramValues[i] >
                                jump.paramsConditions[i].mustTo ||
                                _this.state.paramValues[i] <
                                    jump.paramsConditions[i].mustFrom) {
                                return { value: false };
                            }
                            if (jump.paramsConditions[i].mustEqualValues
                                .length > 0) {
                                var isEqual = jump.paramsConditions[i].mustEqualValues.filter(function (x) { return x === _this.state.paramValues[i]; });
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
                            if (jump.paramsConditions[i].mustModValues
                                .length > 0) {
                                var isMod = jump.paramsConditions[i].mustModValues.filter(function (x) { return _this.state.paramValues[i] % x === 0; });
                                if (jump.paramsConditions[i]
                                    .mustModValuesMod &&
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
                    for (var i = 0; i < _this.quest.paramsCount; i++) {
                        var state_1 = _loop_3(i);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                    if (jump.formulaToPass) {
                        if (formula_1.parse(jump.formulaToPass, _this.state.paramValues, randomFunc_1.randomFromMathRandom) === 0) {
                            return false;
                        }
                    }
                    if (jump.jumpingCountLimit &&
                        _this.state.jumpedCount[jump.id] >=
                            jump.jumpingCountLimit) {
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
                        j.active = Math.random() < j.jump.prio;
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
                        var rnd = Math.random() * prioSum;
                        for (var _i = 0, jumpsWithNotSoLowPrio_1 = jumpsWithNotSoLowPrio; _i < jumpsWithNotSoLowPrio_1.length; _i++) {
                            var jj = jumpsWithNotSoLowPrio_1[_i];
                            if (jj.jump.prio >= rnd) {
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
        var newActiveJumpsOnlyOneEmpty = newActiveJumpsOnlyEmpty.length > 0
            ? [newActiveJumpsOnlyEmpty[0]]
            : [];
        this.state.possibleJumps = (newJumpsWithoutEmpty.length > 0
            ? newJumpsWithoutEmpty
            : newActiveJumpsOnlyOneEmpty).map(function (x) {
            return {
                active: x.active,
                id: x.jump.id
            };
        });
        var _loop_2 = function (critParam) {
            var gotCritWithChoices = (this_1.quest.params[critParam].type === qmreader_1.ParamType.Провальный ||
                this_1.quest.params[critParam].type ===
                    qmreader_1.ParamType.Смертельный) &&
                this_1.state.possibleJumps.filter(function (x) { return x.active; }).length > 0;
            if (!this_1.oldTgeBehaviour || !gotCritWithChoices) {
                var lastjump = this_1.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
                this_1.state.state = location.isEmpty
                    ? this_1.state.lastJumpId && lastjump && lastjump.description
                        ? "critonlocation"
                        : "critonlocationlastmessage"
                    : "critonlocation";
                this_1.state.critParamId = critParam;
                var qmmImg = location.paramsChanges[critParam].img ||
                    this_1.quest.params[critParam].img;
                var image_3 = qmmImg
                    ? qmmImg.toLowerCase() + ".jpg"
                    : this_1.images
                        .filter(function (x) {
                        return !!x.critParams &&
                            x.critParams.indexOf(critParam) > -1;
                    })
                        .map(function (x) { return x.filename; })
                        .shift();
                if (image_3) {
                    this_1.state.imageFilename = image_3;
                }
            }
        };
        var this_1 = this;
        for (var _a = 0, critParamsTriggered_1 = critParamsTriggered; _a < critParamsTriggered_1.length; _a++) {
            var critParam = critParamsTriggered_1[_a];
            _loop_2(critParam);
        }
        /* А это дикий костыль для пустых локаций и переходов */
        var state = this.getState();
        if (state.choices.length === 1) {
            var jump = this.quest.jumps.find(function (x) { return x.id === state.choices[0].jumpId; });
            var lastjump = this.quest.jumps.find(function (x) { return x.id === _this.state.lastJumpId; });
            var location_3 = this.quest.locations.find(function (x) { return x.id === _this.state.locationId; });
            if (jump &&
                !jump.text &&
                location_3 &&
                ((location_3.isEmpty && (lastjump && !lastjump.description)) ||
                    !state.text) &&
                state.choices[0].active) {
                console.info("Performinig autojump from loc=" + this.state
                    .locationId + " via jump=" + jump.id);
                this.performJump(jump.id);
            }
        }
    };
    ;
    QMPlayer.prototype.SRDateToString = function (daysToAdd, initialDate) {
        if (initialDate === void 0) { initialDate = new Date(); }
        var d = new Date(initialDate.getTime() + 1000 * 60 * 60 * 24 * daysToAdd);
        var months = this.lang === 'eng' ?
            ["January",
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
            ] : [
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
    };
    return QMPlayer;
}());
