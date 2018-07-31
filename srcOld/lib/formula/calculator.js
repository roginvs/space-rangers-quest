"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var consts_1 = require("./consts");
function assertNever(x) {
    throw new Error("Unexpected object: " + x);
}
exports.assertNever = assertNever;
function numberMinMax(n) {
    return Math.min(Math.max(n, -consts_1.MAX_NUMBER), consts_1.MAX_NUMBER);
}
function floorCeil(val) {
    return val > 0 ? Math.floor(val) : Math.ceil(val);
}
function pickRandomForRanges(ranges, random) {
    var totalValuesAmount = ranges.reduce(function (totalItems, range) {
        return totalItems + range.to - range.from + 1;
    }, 0);
    var rnd = random(totalValuesAmount);
    //console.info(
    //    `new ranges=[${ranges
    //        .map(x => `${x.from}..${x.to}`)
    //        .join("; ")}] rnd=${rnd} pickedRandom=${pickedRandom} totalValuesAmount=${totalValuesAmount}`
    //);
    for (var _i = 0, ranges_1 = ranges; _i < ranges_1.length; _i++) {
        var range = ranges_1[_i];
        var len = range.to - range.from + 1;
        // console.info(`Range=${range[0]}..${range[1]}, rnd=${rnd}, len=${len}`)
        if (rnd >= len) {
            rnd = rnd - len;
        }
        else {
            var result = rnd + range.from;
            // debug(0, `Range ${arg} returned random ${result}`);
            return result;
        }
    }
    throw new Error("Error in finding random value for " +
        JSON.stringify({
            ranges: ranges,
            rnd: rnd
        }, null, 4));
}
function calculateAst(ast, params, random) {
    if (params === void 0) { params = []; }
    function transformToIntoRanges(node) {
        if (node.type !== "binary" ||
            node.operator !== "to keyword") {
            throw new Error("Wrong usage");
        }
        var valToRanges = function (val) { return [
            {
                from: val,
                to: val
            }
        ]; };
        var left = node.left;
        var right = node.right;
        var leftRanges = left.type === "range"
            ? calculateRange(left)
            : valToRanges(floorCeil(calculateAst(left, params, random)));
        var rightRanges = right.type === "range"
            ? calculateRange(right)
            : valToRanges(floorCeil(calculateAst(right, params, random)));
        var leftRangeMax = Math.max.apply(Math, leftRanges.map(function (x) { return x.to; }).concat([0]));
        var rightRangeMax = Math.max.apply(Math, rightRanges.map(function (x) { return x.to; }).concat([0]));
        var leftRangeMin = Math.min.apply(Math, leftRanges.map(function (x) { return x.from; }).concat([consts_1.MAX_NUMBER]));
        var rightRangeMin = Math.min.apply(Math, rightRanges.map(function (x) { return x.from; }).concat([consts_1.MAX_NUMBER]));
        var newRangeMax = Math.max(leftRangeMax, rightRangeMax);
        var newRangeMin = Math.min(leftRangeMin, rightRangeMin);
        var newRanges = [
            {
                from: newRangeMin,
                to: newRangeMax
            }
        ];
        return newRanges;
    }
    function calculateRange(node) {
        if (node.type !== "range") {
            throw new Error("Wrong usage");
        }
        return node.ranges.map(function (range) {
            var from = floorCeil(calculateAst(range.from, params, random));
            var to = range.to ? floorCeil(calculateAst(range.to, params, random)) : from;
            var reversed = from > to;
            return {
                from: reversed ? to : from,
                to: reversed ? from : to
            };
        });
    }
    if (ast.type === "number") {
        return ast.value;
    }
    else if (ast.type === "parameter") {
        return params[ast.parameterId];
    }
    else if (ast.type === "binary") {
        if (ast.operator === "plus token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return numberMinMax(a + b);
        }
        else if (ast.operator === "minus token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return numberMinMax(a - b);
        }
        else if (ast.operator === "slash token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return numberMinMax(b !== 0 ? a / b : a > 0 ? consts_1.MAX_NUMBER : -consts_1.MAX_NUMBER);
        }
        else if (ast.operator === "div keyword") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            if (b !== 0) {
                var val = a / b;
                return numberMinMax(floorCeil(val));
            }
            else {
                return a > 0 ? consts_1.MAX_NUMBER : -consts_1.MAX_NUMBER;
            }
        }
        else if (ast.operator === "mod keyword") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return numberMinMax(b !== 0 ? a % b : a > 0 ? consts_1.MAX_NUMBER : -consts_1.MAX_NUMBER);
        }
        else if (ast.operator === "asterisk token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return numberMinMax(a * b);
        }
        else if (ast.operator === "to keyword") {
            var newRanges = transformToIntoRanges(ast);
            return pickRandomForRanges(newRanges, random);
        }
        else if (ast.operator === "in keyword") {
            var reversed = ast.left.type === "range" &&
                ast.right.type !== "range";
            var left = reversed ? ast.right : ast.left;
            var right = reversed ? ast.left : ast.right;
            var leftVal = numberMinMax(calculateAst(left, params, random));
            var ranges = right.type === "range"
                ? calculateRange(right)
                : right.type === "binary" &&
                    right.operator === "to keyword"
                    ? transformToIntoRanges(right)
                    : undefined;
            if (ranges) {
                for (var _i = 0, ranges_2 = ranges; _i < ranges_2.length; _i++) {
                    var range = ranges_2[_i];
                    if (leftVal >= range.from && leftVal <= range.to) {
                        return 1;
                    }
                }
                return 0;
            }
            else {
                var rightVal = numberMinMax(calculateAst(ast.right, params, random));
                return leftVal === rightVal ? 1 : 0;
            }
        }
        else if (ast.operator === "greater than eq token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a >= b ? 1 : 0;
        }
        else if (ast.operator === "greater than token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a > b ? 1 : 0;
        }
        else if (ast.operator === "less than eq token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a <= b ? 1 : 0;
        }
        else if (ast.operator === "less than token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a < b ? 1 : 0;
        }
        else if (ast.operator === "equals token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a === b ? 1 : 0;
        }
        else if (ast.operator === "not equals token") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a !== b ? 1 : 0;
        }
        else if (ast.operator === "and keyword") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a && b ? 1 : 0;
        }
        else if (ast.operator === "or keyword") {
            var a = calculateAst(ast.left, params, random);
            var b = calculateAst(ast.right, params, random);
            return a || b ? 1 : 0;
        }
        else {
            return assertNever(ast.operator);
        }
    }
    else if (ast.type === "unary") {
        if (ast.operator === "minus token") {
            return -calculateAst(ast.expression, params, random);
        }
        else {
            return assertNever(ast);
        }
    }
    else if (ast.type === "range") {
        return pickRandomForRanges(calculateRange(ast), random);
    }
    else {
        return assertNever(ast);
    }
}
exports.calculateAst = calculateAst;
