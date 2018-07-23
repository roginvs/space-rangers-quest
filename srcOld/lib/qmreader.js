"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCATION_TEXTS = 10;
var Reader = /** @class */ (function () {
    function Reader(data) {
        this.data = data;
        this.i = 0;
    }
    Reader.prototype.int32 = function () {
        var result = this.data.readInt32LE(this.i);
        /*
        this.data[this.i] +
                      this.data[this.i + 1] * 0x100 +
                    this.data[this.i + 2] * 0x10000 +
                    this.data[this.i + 3] * 0x1000000;
                    */
        this.i += 4;
        return result;
    };
    Reader.prototype.readString = function () {
        var ifString = this.int32();
        if (ifString) {
            var strLen = this.int32();
            var str = this.data
                .slice(this.i, this.i + strLen * 2)
                .toString("utf16le");
            this.i += strLen * 2;
            return str;
        }
        else {
            return "";
        }
    };
    Reader.prototype.byte = function () {
        return this.data[this.i++];
    };
    Reader.prototype.dwordFlag = function (expected) {
        var val = this.int32();
        if (expected !== undefined && val !== expected) {
            throw new Error("Expecting " + expected + ", but get " + val + " at position " + (this.i -
                4));
        }
    };
    Reader.prototype.float64 = function () {
        var val = this.data.readDoubleLE(this.i);
        this.i += 8;
        return val;
    };
    Reader.prototype.seek = function (n) {
        this.i += n;
    };
    Reader.prototype.isNotEnd = function () {
        if (this.data.length === this.i) {
            return undefined;
        }
        else {
            return ("Not an end! We are at " +
                ("0x" + Number(this.i).toString(16) + ", file len=0x" + Number(this.data.length).toString(16) + " ") +
                (" left=0x" + Number(this.data.length - this.i).toString(16)));
        }
    };
    Reader.prototype.debugShowHex = function (n) {
        if (n === void 0) { n = 300; }
        console.info("Data at 0x" + Number(this.i).toString(16) + "\n");
        var s = "";
        for (var i = 0; i < n; i++) {
            s =
                s +
                    ("0" + Number(this.data[this.i + i]).toString(16)).slice(-2) +
                    ":";
            if (i % 16 === 15) {
                s = s + "\n";
            }
        }
        console.info(s);
    };
    return Reader;
}());
var PlayerRace;
(function (PlayerRace) {
    PlayerRace[PlayerRace["\u041C\u0430\u043B\u043E\u043A\u0438"] = 1] = "\u041C\u0430\u043B\u043E\u043A\u0438";
    PlayerRace[PlayerRace["\u041F\u0435\u043B\u0435\u043D\u0433\u0438"] = 2] = "\u041F\u0435\u043B\u0435\u043D\u0433\u0438";
    PlayerRace[PlayerRace["\u041B\u044E\u0434\u0438"] = 4] = "\u041B\u044E\u0434\u0438";
    PlayerRace[PlayerRace["\u0424\u0435\u044F\u043D\u0435"] = 8] = "\u0424\u0435\u044F\u043D\u0435";
    PlayerRace[PlayerRace["\u0413\u0430\u0430\u043B\u044C\u0446\u044B"] = 16] = "\u0413\u0430\u0430\u043B\u044C\u0446\u044B";
})(PlayerRace || (PlayerRace = {}));
var PlanetRace;
(function (PlanetRace) {
    PlanetRace[PlanetRace["\u041C\u0430\u043B\u043E\u043A\u0438"] = 1] = "\u041C\u0430\u043B\u043E\u043A\u0438";
    PlanetRace[PlanetRace["\u041F\u0435\u043B\u0435\u043D\u0433\u0438"] = 2] = "\u041F\u0435\u043B\u0435\u043D\u0433\u0438";
    PlanetRace[PlanetRace["\u041B\u044E\u0434\u0438"] = 4] = "\u041B\u044E\u0434\u0438";
    PlanetRace[PlanetRace["\u0424\u0435\u044F\u043D\u0435"] = 8] = "\u0424\u0435\u044F\u043D\u0435";
    PlanetRace[PlanetRace["\u0413\u0430\u0430\u043B\u044C\u0446\u044B"] = 16] = "\u0413\u0430\u0430\u043B\u044C\u0446\u044B";
    PlanetRace[PlanetRace["\u041D\u0435\u0437\u0430\u0441\u0435\u043B\u0435\u043D\u043D\u0430\u044F"] = 64] = "\u041D\u0435\u0437\u0430\u0441\u0435\u043B\u0435\u043D\u043D\u0430\u044F";
})(PlanetRace || (PlanetRace = {}));
var WhenDone;
(function (WhenDone) {
    WhenDone[WhenDone["OnReturn"] = 0] = "OnReturn";
    WhenDone[WhenDone["OnFinish"] = 1] = "OnFinish";
})(WhenDone || (WhenDone = {}));
var PlayerCareer;
(function (PlayerCareer) {
    PlayerCareer[PlayerCareer["\u0422\u043E\u0440\u0433\u043E\u0432\u0435\u0446"] = 1] = "\u0422\u043E\u0440\u0433\u043E\u0432\u0435\u0446";
    PlayerCareer[PlayerCareer["\u041F\u0438\u0440\u0430\u0442"] = 2] = "\u041F\u0438\u0440\u0430\u0442";
    PlayerCareer[PlayerCareer["\u0412\u043E\u0438\u043D"] = 4] = "\u0412\u043E\u0438\u043D";
})(PlayerCareer || (PlayerCareer = {}));
exports.HEADER_QM_2 = 0x423a35d2; // 24 parameters
exports.HEADER_QM_3 = 0x423a35d3; // 48 parameters
exports.HEADER_QM_4 = 0x423a35d4; // 96 parameters
exports.HEADER_QMM_6 = 0x423a35d6;
exports.HEADER_QMM_7 = 0x423a35d7;
function parseBase(r, header) {
    if (header === exports.HEADER_QMM_6 || header === exports.HEADER_QMM_7) {
        var majorVersion = header === exports.HEADER_QMM_7 ? r.int32() : undefined;
        var minorVersion = header === exports.HEADER_QMM_7 ? r.int32() : undefined;
        var changeLogString = header === exports.HEADER_QMM_7 ? r.readString() : undefined;
        var givingRace = r.byte();
        var whenDone = r.byte();
        var planetRace = r.byte();
        var playerCareer = r.byte();
        var playerRace = r.byte();
        var reputationChange = r.int32();
        var screenSizeX = r.int32(); // In pixels
        var screenSizeY = r.int32(); // In pixels
        var widthSize = r.int32(); // Grid width, from small to big 1E-16-0F-0A
        var heigthSize = r.int32(); // Grid heigth, from small to big 18-12-0C-08
        var defaultJumpCountLimit = r.int32();
        var hardness = r.int32();
        var paramsCount = r.int32();
        return {
            givingRace: givingRace,
            whenDone: whenDone,
            planetRace: planetRace,
            playerCareer: playerCareer,
            playerRace: playerRace,
            defaultJumpCountLimit: defaultJumpCountLimit,
            hardness: hardness,
            paramsCount: paramsCount,
            changeLogString: changeLogString,
            majorVersion: majorVersion,
            minorVersion: minorVersion,
            screenSizeX: screenSizeX,
            screenSizeY: screenSizeY
        };
    }
    else {
        var paramsCount = header === exports.HEADER_QM_3
            ? 48
            : header === exports.HEADER_QM_2
                ? 24
                : header === exports.HEADER_QM_4 ? 96 : undefined;
        if (!paramsCount) {
            throw new Error("Unknown header " + header);
        }
        r.dwordFlag();
        var givingRace = r.byte();
        var whenDone = r.byte();
        r.dwordFlag();
        var planetRace = r.byte();
        r.dwordFlag();
        var playerCareer = r.byte();
        r.dwordFlag();
        var playerRace = r.byte();
        var reputationChange = r.int32();
        r.dwordFlag();
        r.dwordFlag();
        r.dwordFlag();
        r.dwordFlag();
        r.dwordFlag();
        var defaultJumpCountLimit = r.int32();
        var hardness = r.int32();
        return {
            givingRace: givingRace,
            whenDone: whenDone,
            planetRace: planetRace,
            playerCareer: playerCareer,
            playerRace: playerRace,
            defaultJumpCountLimit: defaultJumpCountLimit,
            hardness: hardness,
            paramsCount: paramsCount,
            // TODO
            screenSizeX: 200,
            screenSizeY: 200
        };
    }
}
var ParamType;
(function (ParamType) {
    ParamType[ParamType["\u041E\u0431\u044B\u0447\u043D\u044B\u0439"] = 0] = "\u041E\u0431\u044B\u0447\u043D\u044B\u0439";
    ParamType[ParamType["\u041F\u0440\u043E\u0432\u0430\u043B\u044C\u043D\u044B\u0439"] = 1] = "\u041F\u0440\u043E\u0432\u0430\u043B\u044C\u043D\u044B\u0439";
    ParamType[ParamType["\u0423\u0441\u043F\u0435\u0448\u043D\u044B\u0439"] = 2] = "\u0423\u0441\u043F\u0435\u0448\u043D\u044B\u0439";
    ParamType[ParamType["\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u044B\u0439"] = 3] = "\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u044B\u0439";
})(ParamType = exports.ParamType || (exports.ParamType = {}));
var ParamCritType;
(function (ParamCritType) {
    ParamCritType[ParamCritType["\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C"] = 0] = "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C";
    ParamCritType[ParamCritType["\u041C\u0438\u043D\u0438\u043C\u0443\u043C"] = 1] = "\u041C\u0438\u043D\u0438\u043C\u0443\u043C";
})(ParamCritType = exports.ParamCritType || (exports.ParamCritType = {}));
function parseParam(r) {
    var min = r.int32();
    var max = r.int32();
    r.int32();
    var type = r.byte();
    r.int32();
    var showWhenZero = !!r.byte();
    var critType = r.byte();
    var active = !!r.byte();
    var showingRangesCount = r.int32();
    var isMoney = !!r.byte();
    var name = r.readString();
    var param = {
        min: min,
        max: max,
        type: type,
        showWhenZero: showWhenZero,
        critType: critType,
        active: active,
        showingRangesCount: showingRangesCount,
        isMoney: isMoney,
        name: name,
        showingInfo: [],
        starting: "",
        critValueString: "",
        img: undefined,
        sound: undefined,
        track: undefined
    };
    for (var i = 0; i < showingRangesCount; i++) {
        var from = r.int32();
        var to = r.int32();
        var str = r.readString();
        param.showingInfo.push({
            from: from,
            to: to,
            str: str
        });
    }
    param.critValueString = r.readString();
    param.starting = r.readString();
    return param;
}
function parseParamQmm(r) {
    var min = r.int32();
    var max = r.int32();
    // console.info(`Param min=${min} max=${max}`)
    var type = r.byte();
    //r.debugShowHex(16);
    var unknown1 = r.byte();
    var unknown2 = r.byte();
    var unknown3 = r.byte();
    if (unknown1 !== 0) {
        console.warn("Unknown1 is params is not zero");
    }
    if (unknown2 !== 0) {
        console.warn("Unknown2 is params is not zero");
    }
    if (unknown3 !== 0) {
        console.warn("Unknown3 is params is not zero");
    }
    var showWhenZero = !!r.byte();
    var critType = r.byte();
    var active = !!r.byte();
    var showingRangesCount = r.int32();
    var isMoney = !!r.byte();
    var name = r.readString();
    var param = {
        min: min,
        max: max,
        type: type,
        showWhenZero: showWhenZero,
        critType: critType,
        active: active,
        showingRangesCount: showingRangesCount,
        isMoney: isMoney,
        name: name,
        showingInfo: [],
        starting: "",
        critValueString: "",
        img: undefined,
        sound: undefined,
        track: undefined
    };
    // console.info(`Ranges=${showingRangesCount}`)
    for (var i = 0; i < showingRangesCount; i++) {
        var from = r.int32();
        var to = r.int32();
        var str = r.readString();
        param.showingInfo.push({
            from: from,
            to: to,
            str: str
        });
    }
    param.critValueString = r.readString();
    param.img = r.readString();
    param.sound = r.readString();
    param.track = r.readString();
    param.starting = r.readString();
    return param;
}
function parseBase2(r, isQmm) {
    var ToStar = r.readString();
    var Parsec = isQmm ? undefined : r.readString();
    var Artefact = isQmm ? undefined : r.readString();
    var ToPlanet = r.readString();
    var Date = r.readString();
    var Money = r.readString();
    var FromPlanet = r.readString();
    var FromStar = r.readString();
    var Ranger = r.readString();
    var locationsCount = r.int32();
    var jumpsCount = r.int32();
    var successText = r.readString();
    var taskText = r.readString();
    var unknownText = isQmm ? undefined : r.readString();
    return {
        strings: {
            ToStar: ToStar,
            Parsec: Parsec,
            Artefact: Artefact,
            ToPlanet: ToPlanet,
            Date: Date,
            Money: Money,
            FromPlanet: FromPlanet,
            FromStar: FromStar,
            Ranger: Ranger
        },
        locationsCount: locationsCount,
        jumpsCount: jumpsCount,
        successText: successText,
        taskText: taskText
    };
}
var ParameterShowingType;
(function (ParameterShowingType) {
    ParameterShowingType[ParameterShowingType["\u041D\u0435\u0422\u0440\u043E\u0433\u0430\u0442\u044C"] = 0] = "\u041D\u0435\u0422\u0440\u043E\u0433\u0430\u0442\u044C";
    ParameterShowingType[ParameterShowingType["\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C"] = 1] = "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C";
    ParameterShowingType[ParameterShowingType["\u0421\u043A\u0440\u044B\u0442\u044C"] = 2] = "\u0421\u043A\u0440\u044B\u0442\u044C";
})(ParameterShowingType = exports.ParameterShowingType || (exports.ParameterShowingType = {}));
var ParameterChangeType;
(function (ParameterChangeType) {
    ParameterChangeType[ParameterChangeType["Value"] = 0] = "Value";
    ParameterChangeType[ParameterChangeType["Summ"] = 1] = "Summ";
    ParameterChangeType[ParameterChangeType["Percentage"] = 2] = "Percentage";
    ParameterChangeType[ParameterChangeType["Formula"] = 3] = "Formula";
})(ParameterChangeType = exports.ParameterChangeType || (exports.ParameterChangeType = {}));
var LocationType;
(function (LocationType) {
    LocationType[LocationType["Ordinary"] = 0] = "Ordinary";
    LocationType[LocationType["Starting"] = 1] = "Starting";
    LocationType[LocationType["Empty"] = 2] = "Empty";
    LocationType[LocationType["Success"] = 3] = "Success";
    LocationType[LocationType["Faily"] = 4] = "Faily";
    LocationType[LocationType["Deadly"] = 5] = "Deadly";
})(LocationType = exports.LocationType || (exports.LocationType = {}));
function parseLocation(r, paramsCount) {
    var dayPassed = !!r.int32();
    r.seek(8);
    var id = r.int32();
    var isStarting = !!r.byte();
    var isSuccess = !!r.byte();
    var isFaily = !!r.byte();
    var isFailyDeadly = !!r.byte();
    var isEmpty = !!r.byte();
    var paramsChanges = [];
    for (var i = 0; i < paramsCount; i++) {
        r.seek(12);
        var change = r.int32();
        var showingType = r.byte();
        r.seek(4);
        var isChangePercentage = !!r.byte();
        var isChangeValue = !!r.byte();
        var isChangeFormula = !!r.byte();
        var changingFormula = r.readString();
        r.seek(10);
        var critText = r.readString();
        paramsChanges.push({
            change: change,
            showingType: showingType,
            isChangePercentage: isChangePercentage,
            isChangeValue: isChangeValue,
            isChangeFormula: isChangeFormula,
            changingFormula: changingFormula,
            critText: critText,
            img: undefined,
            track: undefined,
            sound: undefined
        });
    }
    var texts = [];
    var media = [];
    for (var i = 0; i < exports.LOCATION_TEXTS; i++) {
        texts.push(r.readString());
        media.push({ img: undefined, sound: undefined, track: undefined });
    }
    var isTextByFormula = !!r.byte();
    r.seek(4);
    r.readString();
    r.readString();
    var textSelectFurmula = r.readString();
    return {
        dayPassed: dayPassed,
        id: id,
        isEmpty: isEmpty,
        isFaily: isFaily,
        isFailyDeadly: isFailyDeadly,
        isStarting: isStarting,
        isSuccess: isSuccess,
        paramsChanges: paramsChanges,
        texts: texts,
        media: media,
        isTextByFormula: isTextByFormula,
        textSelectFurmula: textSelectFurmula,
        maxVisits: 0,
        // TODO
        locX: 50,
        locY: 50
    };
}
function parseLocationQmm(r, paramsCount) {
    var dayPassed = !!r.int32();
    var locX = r.int32(); /* In pixels */
    var locY = r.int32(); /* In pixels */
    var id = r.int32();
    var maxVisits = r.int32();
    var type = r.byte();
    var isStarting = type === LocationType.Starting;
    var isSuccess = type === LocationType.Success;
    var isFaily = type === LocationType.Faily;
    var isFailyDeadly = type === LocationType.Deadly;
    var isEmpty = type === LocationType.Empty;
    var paramsChanges = [];
    for (var i = 0; i < paramsCount; i++) {
        paramsChanges.push({
            change: 0,
            showingType: ParameterShowingType.НеТрогать,
            isChangePercentage: false,
            isChangeValue: false,
            isChangeFormula: false,
            changingFormula: "",
            critText: "",
            img: undefined,
            track: undefined,
            sound: undefined
        });
    }
    var affectedParamsCount = r.int32();
    for (var i = 0; i < affectedParamsCount; i++) {
        var paramN = r.int32();
        var change = r.int32();
        var showingType = r.byte();
        var changeType = r.byte();
        var isChangePercentage = changeType === ParameterChangeType.Percentage;
        var isChangeValue = changeType === ParameterChangeType.Value;
        var isChangeFormula = changeType === ParameterChangeType.Formula;
        var changingFormula = r.readString();
        var critText = r.readString();
        var img = r.readString();
        var sound = r.readString();
        var track = r.readString();
        paramsChanges[paramN - 1] = {
            change: change,
            showingType: showingType,
            isChangePercentage: isChangePercentage,
            isChangeFormula: isChangeFormula,
            isChangeValue: isChangeValue,
            changingFormula: changingFormula,
            critText: critText,
            img: img,
            track: track,
            sound: sound
        };
    }
    var texts = [];
    var media = [];
    var locationTexts = r.int32();
    for (var i = 0; i < locationTexts; i++) {
        var text = r.readString();
        texts.push(text);
        var img = r.readString();
        var sound = r.readString();
        var track = r.readString();
        media.push({ img: img, track: track, sound: sound });
    }
    var isTextByFormula = !!r.byte();
    var textSelectFurmula = r.readString();
    // console.info(isTextByFormula, textSelectFurmula)
    // r.debugShowHex(0); // must be 3543
    return {
        dayPassed: dayPassed,
        id: id,
        isEmpty: isEmpty,
        isFaily: isFaily,
        isFailyDeadly: isFailyDeadly,
        isStarting: isStarting,
        isSuccess: isSuccess,
        paramsChanges: paramsChanges,
        texts: texts,
        media: media,
        isTextByFormula: isTextByFormula,
        textSelectFurmula: textSelectFurmula,
        maxVisits: maxVisits,
        locX: locX,
        locY: locY
    };
}
function parseJump(r, paramsCount) {
    var prio = r.float64();
    var dayPassed = !!r.int32();
    var id = r.int32();
    var fromLocationId = r.int32();
    var toLocationId = r.int32();
    r.seek(1);
    var alwaysShow = !!r.byte();
    var jumpingCountLimit = r.int32();
    var showingOrder = r.int32();
    var paramsChanges = [];
    var paramsConditions = [];
    for (var i = 0; i < paramsCount; i++) {
        r.seek(4);
        var mustFrom = r.int32();
        var mustTo = r.int32();
        var change = r.int32();
        var showingType = r.int32();
        r.seek(1);
        var isChangePercentage = !!r.byte();
        var isChangeValue = !!r.byte();
        var isChangeFormula = !!r.byte();
        var changingFormula = r.readString();
        var mustEqualValuesCount = r.int32();
        var mustEqualValuesEqual = !!r.byte();
        var mustEqualValues = [];
        //console.info(`mustEqualValuesCount=${mustEqualValuesCount}`)
        for (var ii = 0; ii < mustEqualValuesCount; ii++) {
            mustEqualValues.push(r.int32());
            //  console.info('pushed');
        }
        //console.info(`eq=${mustEqualValuesNotEqual} values = ${mustEqualValues.join(', ')}`)
        var mustModValuesCount = r.int32();
        //console.info(`mustModValuesCount=${mustModValuesCount}`)
        var mustModValuesMod = !!r.byte();
        var mustModValues = [];
        for (var ii = 0; ii < mustModValuesCount; ii++) {
            mustModValues.push(r.int32());
        }
        var critText = r.readString();
        // console.info(`Param ${i} crit text =${critText}`)
        paramsChanges.push({
            change: change,
            showingType: showingType,
            isChangeFormula: isChangeFormula,
            isChangePercentage: isChangePercentage,
            isChangeValue: isChangeValue,
            changingFormula: changingFormula,
            critText: critText,
            img: undefined,
            track: undefined,
            sound: undefined
        });
        paramsConditions.push({
            mustFrom: mustFrom,
            mustTo: mustTo,
            mustEqualValues: mustEqualValues,
            mustEqualValuesEqual: mustEqualValuesEqual,
            mustModValues: mustModValues,
            mustModValuesMod: mustModValuesMod
        });
    }
    var formulaToPass = r.readString();
    var text = r.readString();
    var description = r.readString();
    return {
        prio: prio,
        dayPassed: dayPassed,
        id: id,
        fromLocationId: fromLocationId,
        toLocationId: toLocationId,
        alwaysShow: alwaysShow,
        jumpingCountLimit: jumpingCountLimit,
        showingOrder: showingOrder,
        paramsChanges: paramsChanges,
        paramsConditions: paramsConditions,
        formulaToPass: formulaToPass,
        text: text,
        description: description,
        img: undefined,
        track: undefined,
        sound: undefined
    };
}
function parseJumpQmm(r, paramsCount, questParams) {
    //r.debugShowHex()
    var prio = r.float64();
    var dayPassed = !!r.int32();
    var id = r.int32();
    var fromLocationId = r.int32();
    var toLocationId = r.int32();
    var alwaysShow = !!r.byte();
    var jumpingCountLimit = r.int32();
    var showingOrder = r.int32();
    var paramsChanges = [];
    var paramsConditions = [];
    for (var i = 0; i < paramsCount; i++) {
        paramsChanges.push({
            change: 0,
            showingType: ParameterShowingType.НеТрогать,
            isChangeFormula: false,
            isChangePercentage: false,
            isChangeValue: false,
            changingFormula: "",
            critText: "",
            img: undefined,
            track: undefined,
            sound: undefined
        });
        paramsConditions.push({
            mustFrom: questParams[i].min,
            mustTo: questParams[i].max,
            mustEqualValues: [],
            mustEqualValuesEqual: false,
            mustModValues: [],
            mustModValuesMod: false
        });
    }
    var affectedConditionsParamsCount = r.int32();
    for (var i = 0; i < affectedConditionsParamsCount; i++) {
        var paramId = r.int32();
        var mustFrom = r.int32();
        var mustTo = r.int32();
        var mustEqualValuesCount = r.int32();
        var mustEqualValuesEqual = !!r.byte();
        var mustEqualValues = [];
        //console.info(`mustEqualValuesCount=${mustEqualValuesCount}`)
        for (var ii = 0; ii < mustEqualValuesCount; ii++) {
            mustEqualValues.push(r.int32());
            //  console.info('pushed');
        }
        var mustModValuesCount = r.int32();
        var mustModValuesMod = !!r.byte();
        var mustModValues = [];
        for (var ii = 0; ii < mustModValuesCount; ii++) {
            mustModValues.push(r.int32());
        }
        paramsConditions[paramId - 1] = {
            mustFrom: mustFrom,
            mustTo: mustTo,
            mustEqualValues: mustEqualValues,
            mustEqualValuesEqual: mustEqualValuesEqual,
            mustModValues: mustModValues,
            mustModValuesMod: mustModValuesMod
        };
    }
    var affectedChangeParamsCount = r.int32();
    for (var i = 0; i < affectedChangeParamsCount; i++) {
        var paramId = r.int32();
        var change = r.int32();
        var showingType = r.byte();
        var changingType = r.byte();
        var isChangePercentage = changingType === ParameterChangeType.Percentage;
        var isChangeValue = changingType === ParameterChangeType.Value;
        var isChangeFormula = changingType === ParameterChangeType.Formula;
        var changingFormula = r.readString();
        var critText = r.readString();
        var img_1 = r.readString();
        var sound_1 = r.readString();
        var track_1 = r.readString();
        // console.info(`Param ${i} crit text =${critText}`)
        paramsChanges[paramId - 1] = {
            change: change,
            showingType: showingType,
            isChangeFormula: isChangeFormula,
            isChangePercentage: isChangePercentage,
            isChangeValue: isChangeValue,
            changingFormula: changingFormula,
            critText: critText,
            img: img_1,
            track: track_1,
            sound: sound_1
        };
    }
    var formulaToPass = r.readString();
    var text = r.readString();
    var description = r.readString();
    var img = r.readString();
    var sound = r.readString();
    var track = r.readString();
    return {
        prio: prio,
        dayPassed: dayPassed,
        id: id,
        fromLocationId: fromLocationId,
        toLocationId: toLocationId,
        alwaysShow: alwaysShow,
        jumpingCountLimit: jumpingCountLimit,
        showingOrder: showingOrder,
        paramsChanges: paramsChanges,
        paramsConditions: paramsConditions,
        formulaToPass: formulaToPass,
        text: text,
        description: description,
        img: img,
        track: track,
        sound: sound
    };
}
function parse(data) {
    var r = new Reader(data);
    var header = r.int32();
    var base = parseBase(r, header);
    var isQmm = header === exports.HEADER_QMM_6 || header === exports.HEADER_QMM_7;
    var params = [];
    for (var i = 0; i < base.paramsCount; i++) {
        params.push(isQmm ? parseParamQmm(r) : parseParam(r));
    }
    var base2 = parseBase2(r, isQmm);
    var locations = [];
    for (var i = 0; i < base2.locationsCount; i++) {
        locations.push(isQmm
            ? parseLocationQmm(r, base.paramsCount)
            : parseLocation(r, base.paramsCount));
    }
    var jumps = [];
    for (var i = 0; i < base2.jumpsCount; i++) {
        jumps.push(isQmm
            ? parseJumpQmm(r, base.paramsCount, params)
            : parseJump(r, base.paramsCount));
    }
    if (r.isNotEnd()) {
        throw new Error(r.isNotEnd());
    }
    var base3 = {
        header: header,
    };
    return __assign({}, base, base2, base3, { params: params,
        locations: locations,
        jumps: jumps });
}
exports.parse = parse;
function getImagesListFromQmm(qmmQuest) {
    var images = {};
    var tracks = [];
    var sounds = [];
    var addImg = function (name, place) {
        if (!name) {
            return;
        }
        if (images[name]) {
            images[name].push(place);
        }
        else {
            images[name] = [place];
        }
    };
    qmmQuest.params.map(function (p, pid) {
        addImg(p.img, "Param p" + pid);
        tracks.push(p.track);
        sounds.push(p.sound);
    });
    var _loop_1 = function (l) {
        l.media.map(function (x) { return x.img; }).map(function (x) { return addImg(x, "Loc " + l.id); });
        tracks.concat.apply(tracks, l.media.map(function (x) { return x.track; }));
        sounds.concat.apply(sounds, l.media.map(function (x) { return x.sound; }));
        l.paramsChanges.map(function (p, pid) {
            l.media
                .map(function (x) { return x.img; })
                .map(function (x) { return addImg(x, "Loc " + l.id + " p" + (pid + 1)); });
            tracks.push(p.track);
            sounds.push(p.sound);
        });
    };
    for (var _i = 0, _a = qmmQuest.locations; _i < _a.length; _i++) {
        var l = _a[_i];
        _loop_1(l);
    }
    qmmQuest.jumps.map(function (j, jid) {
        addImg(j.img, "Jump " + jid);
        tracks.push(j.track);
        sounds.push(j.sound);
        j.paramsChanges.map(function (p, pid) {
            addImg(p.img, "Jump " + jid + " p" + pid);
            tracks.push(p.track);
            sounds.push(p.sound);
        });
    });
    tracks = tracks.filter(function (x) { return x; });
    sounds = sounds.filter(function (x) { return x; });
    return Object.keys(images);
}
exports.getImagesListFromQmm = getImagesListFromQmm;
