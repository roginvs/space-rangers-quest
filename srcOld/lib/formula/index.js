"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = __importStar(require("assert"));
var scanner_1 = require("./scanner");
var parser_1 = require("./parser");
var calculator_1 = require("./calculator");
var consts_1 = require("./consts");
exports.MAX_NUMBER = consts_1.MAX_NUMBER;
function parse(str, params, random) {
    if (params === void 0) { params = []; }
    // console.info(`New parsing '${str}'`);
    var tokensAndWhitespace = [];
    var strNoWhitespaces = str.replace(/\r|\n/g, '').replace(/ /g, ''); // Some quests have "10 000" as number
    var scanner = scanner_1.Scanner(strNoWhitespaces);
    while (true) {
        var token = scanner();
        if (token) {
            tokensAndWhitespace.push(token);
            if (token.kind !== "white space token") {
                // console.info(token);
            }
        }
        else {
            break;
        }
    }
    for (var _i = 0, tokensAndWhitespace_1 = tokensAndWhitespace; _i < tokensAndWhitespace_1.length; _i++) {
        var sanityCheckToken = tokensAndWhitespace_1[_i];
        assert.strictEqual(sanityCheckToken.text, strNoWhitespaces.slice(sanityCheckToken.start, sanityCheckToken.end));
        assert.strictEqual(sanityCheckToken.text.length, sanityCheckToken.end - sanityCheckToken.start);
    }
    assert.strictEqual(strNoWhitespaces, tokensAndWhitespace.map(function (x) { return x.text; }).join(""));
    var tokens = tokensAndWhitespace.filter(function (x) { return x.kind !== "white space token"; });
    var ast = parser_1.parseExpression(tokens);
    // console.info(JSON.stringify(ast, null, 4));
    var value = calculator_1.calculateAst(ast, params, random);
    return Math.round(value);
}
exports.parse = parse;
//console.info(parse('2 +  2 * 2 +2+2'))
//console.info(parse('2 + 2 * 2 + 2'))
//console.info(parse("2 in 2 to 3"));
// console.info(parse("[-2]"));
//console.info(parse("[-3;-3;-3..-3]"));
//console.info(parse("3 + [1;3;6..9] - 3"));
//console.info(parse("[p11]-[5..30]*0,4"));
//console.info(parse('[p1] div1000000mod 10',[12346789]))
//console.info(parse('10 000'));
