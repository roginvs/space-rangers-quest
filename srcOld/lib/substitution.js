"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var formula_1 = require("./formula");
exports.clr = '<clr>';
exports.clrEnd = '<clrEnd>';
exports.PLAYER_KEYS_TO_REPLACE = ["Ranger",
    "Player",
    "FromPlanet",
    "FromStar",
    "ToPlanet",
    "ToStar",
    "Money",
    "Date",
    "Day",
    "CurDate"]; // TODO: Maybe move from here
function substitute(str, player, params, random, diamondIndex) {
    if (diamondIndex !== undefined) {
        str = str.replace(/<>/g, "[p" + (diamondIndex + 1) + "]");
    }
    while (true) {
        var m = str.match(/{[^}]*}/);
        if (!m) {
            break;
        }
        var formulaWithBrackets = m[0];
        var result = formula_1.parse(formulaWithBrackets.slice(1, formulaWithBrackets.length - 1), params, random);
        str = str.replace(formulaWithBrackets, "" + exports.clr + result + exports.clrEnd);
    }
    for (var _i = 0, PLAYER_KEYS_TO_REPLACE_1 = exports.PLAYER_KEYS_TO_REPLACE; _i < PLAYER_KEYS_TO_REPLACE_1.length; _i++) {
        var k = PLAYER_KEYS_TO_REPLACE_1[_i];
        while (str.indexOf("<" + k + ">") > -1) {
            str = str.replace("<" + k + ">", "" + exports.clr + player[k] + exports.clrEnd);
        }
    }
    for (var ii = 0; ii < params.length; ii++) {
        while (str.indexOf("[p" + (ii + 1) + "]") > -1) {
            str = str.replace("[p" + (ii + 1) + "]", "" + exports.clr + params[ii] + exports.clrEnd);
        }
    }
    return str;
}
exports.substitute = substitute;
