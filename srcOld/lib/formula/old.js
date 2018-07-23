"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MAX_NUMBER = 2000000000;
function parseRange(arg) {
    return arg.slice(1, arg.length - 1).split(';').map(function (range) {
        if (range.indexOf('..') > -1) {
            var _a = range.split('..').map(function (x) { return parseInt(x); }), low = _a[0], high = _a[1];
            if (isNaN(low) || isNaN(high)) {
                throw new Error("Unknown range part '" + range + "' in '" + arg + "'");
            }
            if (low <= high) {
                return [low, high];
            }
            else {
                return [high, low];
            }
        }
        else {
            if (range.indexOf(',') > -1) {
                throw new Error("Wrong range usage '" + arg + "': found a ',' symbol");
            }
            var val = parseInt(range);
            if (isNaN(val)) {
                throw new Error("Unknown scalar part '" + range + "' in '" + arg + "'");
            }
            return [val, val];
        }
    });
}
function argToNumber(arg, random) {
    if (typeof (arg) === 'number') {
        return arg;
    }
    else {
        if (!arg) {
            throw new Error("No string data for argToNumber");
        }
        if (arg[0] === '[') {
            var ranges = parseRange(arg);
            var totalValuesAmount = ranges.reduce(function (totalItems, range) {
                var low = range[0], high = range[1];
                return totalItems + high - low + 1;
            }, 0);
            var pickedRandom = random();
            var rnd = Math.floor(pickedRandom * totalValuesAmount);
            // console.info(`old ranges=[${ranges.map(x => `${x[0]}..${x[1]}`).join('; ')}] rnd=${rnd} pickedRandom=${pickedRandom} totalValuesAmount=${totalValuesAmount}`);
            for (var _i = 0, ranges_1 = ranges; _i < ranges_1.length; _i++) {
                var range = ranges_1[_i];
                var len = range[1] - range[0] + 1;
                // console.info(`Range=${range[0]}..${range[1]}, rnd=${rnd}, len=${len}`)
                if (rnd >= len) {
                    rnd = rnd - len;
                }
                else {
                    var result = rnd + range[0];
                    debug(0, "Range " + arg + " returned random " + result);
                    return result;
                }
            }
            throw new Error("Error in finding random value for " + JSON.stringify({
                arg: arg,
                ranges: ranges,
                rnd: rnd
            }, null, 4));
        }
        else {
            /*
                Is that code even reachable? String Arg could be returned
                only from "to" operator, and that one returned range
                */
            var r = parseFloat(arg.replace(',', '.'));
            if (isNaN(r)) {
                throw new Error("Unknown arg = '" + arg + "'");
            }
            else {
                return r;
            }
        }
    }
}
function floorCeil(val) {
    return val > 0 ? Math.floor(val) : Math.ceil(val);
}
/*
Highest prio

/, div, mod             / f g                   1
*                       *                       2
-                       -                       3
+                       +                       4
to                      $                       5
in                      #                       6
>=, <=, >, <, =, <>     c, b, >, <, =, e        7
and                     &                       8
or                      |                       9

*/
// TODO: Some side-effect like '10 mod 0.5'
var operations = [
    {
        longSymbol: '/',
        shortSymbol: '/',
        prio: 1,
        fBinary: function (a, b, random) {
            var numA = argToNumber(a, random);
            var numB = argToNumber(b, random);
            if (numB !== 0) {
                return numA / numB;
            }
            else {
                return numA > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        }
    },
    {
        longSymbol: 'div',
        shortSymbol: 'f',
        prio: 1,
        fBinary: function (a, b, random) {
            var numA = argToNumber(a, random);
            var numB = argToNumber(b, random);
            if (numB !== 0) {
                var div = numA / numB;
                return floorCeil(div);
            }
            else {
                return numA > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        }
    },
    {
        longSymbol: 'mod',
        shortSymbol: 'g',
        prio: 1,
        fBinary: function (a, b, random) {
            var numA = argToNumber(a, random);
            var numB = argToNumber(b, random);
            if (numB !== 0) {
                return numA % numB;
            }
            else {
                return numA > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        }
    },
    {
        longSymbol: '*',
        shortSymbol: '*',
        prio: 2,
        fBinary: function (a, b, random) {
            return argToNumber(a, random) * argToNumber(b, random);
        }
    },
    {
        longSymbol: '-',
        shortSymbol: '-',
        prio: 3,
        fBinary: function (a, b, random) { return argToNumber(a, random) - argToNumber(b, random); },
    },
    {
        longSymbol: '+',
        shortSymbol: '+',
        prio: 4,
        fBinary: function (a, b, random) { return argToNumber(a, random) + argToNumber(b, random); }
    },
    {
        longSymbol: 'to',
        shortSymbol: '$',
        prio: 5,
        fBinary: function (a, b, random) {
            var rangeA = typeof (a) === 'string' ? parseRange(a) : [[a, a]];
            var rangeB = typeof (b) === 'string' ? parseRange(b) : [[b, b]];
            if (rangeA.length === 0) {
                throw new Error("Zero length for range " + a);
            }
            if (rangeB.length === 0) {
                throw new Error("Zero length for range " + b);
            }
            var rangeAmax = rangeA.reduce(function (max, range) { return range[1] > max ? range[1] : max; }, 0);
            var rangeBmax = rangeB.reduce(function (max, range) { return range[1] > max ? range[1] : max; }, 0);
            var rangeAmin = rangeA.reduce(function (min, range) { return range[0] < min ? range[0] : min; }, MAX_NUMBER);
            var rangeBmin = rangeB.reduce(function (min, range) { return range[0] < min ? range[0] : min; }, MAX_NUMBER);
            var newRangeMax = rangeAmax > rangeBmax ? rangeAmax : rangeBmax;
            var newRangeMin = rangeAmin < rangeBmin ? rangeAmin : rangeBmin;
            return "[" + newRangeMin + ".." + newRangeMax + "]";
        },
    },
    {
        longSymbol: 'in',
        shortSymbol: '#',
        prio: 6,
        fBinary: function (a, b, random) {
            if (typeof (a) === 'number' && typeof (b) === 'number') {
                return a === b ? 1 : 0;
            }
            else {
                var _a = typeof (a) === 'string' && typeof (b) === 'string' ? [argToNumber(a, random), b] :
                    typeof (a) === 'number' && typeof (b) === 'string' ? [a, b] :
                        typeof (a) === 'string' && typeof (b) === 'number' ? [b, a] :
                            [undefined, undefined], val = _a[0], ranges = _a[1];
                if (val === undefined || ranges === undefined) {
                    throw new Error("Internal error: no val or no ranges");
                }
                for (var _i = 0, _b = parseRange(ranges); _i < _b.length; _i++) {
                    var range = _b[_i];
                    if (val >= range[0] && val <= range[1]) {
                        return 1;
                    }
                }
                return 0;
            }
            /*
            const rangeA =  ? parseRange(a) : [[a, a]];
            const rangeB = typeof (b) === 'string' ? parseRange(b) : [[b, b]];
            */
        }
    },
    {
        longSymbol: '>=',
        shortSymbol: 'c',
        prio: 7,
        fBinary: function (a, b, random) { return argToNumber(a, random) >= argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: '<=',
        shortSymbol: 'b',
        prio: 7,
        fBinary: function (a, b, random) { return argToNumber(a, random) <= argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: '>',
        shortSymbol: '>',
        prio: 7,
        fBinary: function (a, b, random) { return argToNumber(a, random) > argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: '<',
        shortSymbol: '<',
        prio: 7,
        fBinary: function (a, b, random) { return argToNumber(a, random) < argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: '=',
        shortSymbol: '=',
        prio: 7,
        fBinary: function (a, b, random) { return argToNumber(a, random) === argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: '<>',
        shortSymbol: 'e',
        prio: 7,
        fBinary: function (a, b, random) { return argToNumber(a, random) !== argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: 'and',
        shortSymbol: '&',
        prio: 8,
        fBinary: function (a, b, random) { return argToNumber(a, random) && argToNumber(b, random) ? 1 : 0; }
    },
    {
        longSymbol: 'or',
        shortSymbol: '|',
        prio: 9,
        fBinary: function (a, b, random) { return argToNumber(a, random) || argToNumber(b, random) ? 1 : 0; }
    },
];
function findClosingBrackedIndex(str, openBrackedIndex, type) {
    var open = type === 'round' ? '(' : type === 'square' ? '[' : undefined;
    var close = type === 'round' ? ')' : type === 'square' ? ']' : undefined;
    if (!open || !close) {
        throw new Error("Internal error: no open or no close bracket");
    }
    if (str[openBrackedIndex] === open) {
        var opencount = 1;
        for (var i = openBrackedIndex + 1; i < str.length; i++) {
            if (str[i] === open) {
                opencount++;
            }
            else if (str[i] === close) {
                opencount--;
            }
            if (opencount === 0) {
                return i;
            }
        }
        throw new Error("Closed bracked not found: str='" + str + "', openIndex=" + openBrackedIndex + ", opencount=" + opencount);
    }
    else {
        throw new Error("Not a bracket");
    }
}
function debug(deep, text) {
    var prefix = '';
    for (var i = 0; i < deep; i++) {
        prefix += '    ';
    }
    // console.info(prefix + text)
}
function parseRecursive(deep, str, params, random) {
    debug(deep, "Parsing str='" + str + "'");
    if (!str) {
        // return 0
        throw new Error("Empty string!");
    }
    while (str[0] === '(') {
        var i_1 = findClosingBrackedIndex(str, 0, 'round');
        if (i_1 === str.length - 1) {
            str = str.slice(1, str.length - 1);
        }
        else {
            break;
        }
    }
    debug(deep, "After removing covering brackets str='" + str + "'");
    var operands = [];
    var i = 0;
    var _loop_1 = function (i_2) {
        var c = str[i_2];
        var operation = operations.filter(function (x) { return x.shortSymbol === c; }).shift();
        if (operation) {
            operands.push({
                pos: i_2,
                operation: operation
            });
        }
        else {
            if (c === '(') {
                var closingPos = findClosingBrackedIndex(str, i_2, 'round');
                i_2 = closingPos;
            }
            else if (c === '[') {
                var closingPos = findClosingBrackedIndex(str, i_2, 'square');
                i_2 = closingPos;
            }
        }
        out_i_1 = i_2;
    };
    var out_i_1;
    for (var i_2 = 0; i_2 < str.length; i_2++) {
        _loop_1(i_2);
        i_2 = out_i_1;
    }
    if (str[0] === '[' && str[1] === 'p' && str.indexOf(']') === str.length - 1) {
        debug(deep, "String '" + str + "' is parameter");
        var pNum = parseInt(str.slice(2, str.length - 1));
        if (isNaN(pNum)) {
            throw new Error("Unknown parameter '" + str + "'");
        }
        var val = params[pNum - 1];
        if (val === undefined) {
            throw new Error("Undefined param " + str);
        }
        return val;
    }
    else if (str[0] === '[' && str.indexOf(']') === str.length - 1) {
        debug(deep, "String '" + str + "' is range");
        return str;
    }
    else if (operands.length === 0) {
        debug(deep, "String '" + str + "' have no operands");
        var val = parseFloat(str.replace(',', '.'));
        if (isNaN(val)) {
            throw new Error("Unknown elementary value '" + str + "'");
        }
        return val;
    }
    else {
        var oper = operands
            .sort(function (a, b) { return a.operation.prio - b.operation.prio || a.pos - b.pos; })
            .pop();
        if (!oper) {
            debug(deep, "String '" + str + "', operands are: " +
                operands.map(function (x) { return "pos=" + x.pos + " symbol=" + x.operation.longSymbol + "/" + x.operation.shortSymbol; }).join('; '));
            throw new Error("Operand must be defined!");
        }
        var a = str.slice(0, oper.pos);
        var b = str.slice(oper.pos + 1, str.length);
        debug(deep, "String '" + str + "' have operand " + oper.operation.longSymbol + ", " +
            ("will parse '" + a + "' and '" + b + "'"));
        if (a) {
            var aparse = parseRecursive(deep + 1, a, params, random);
            var bparse = parseRecursive(deep + 1, b, params, random);
            debug(deep, "String '" + str + "' have one operand " + oper.operation.longSymbol + ", " +
                ("will call operand with a='" + a + "',aparsed='" + aparse + "',atype=" + typeof (aparse) + " ") +
                ("and b='" + b + "',bparsed='" + bparse + "',type=" + typeof (bparse)));
            if (oper.operation.fBinary) {
                var val = oper.operation.fBinary(aparse, bparse, random);
                debug(deep, "Operand " + oper.operation.longSymbol + " returned '" + val + "'");
                return val;
            }
            else {
                throw new Error("Usage of " + oper.operation.longSymbol + " as Unary in " + str);
            }
        }
        else {
            if (oper.operation.shortSymbol === '-') {
                var bparse = parseRecursive(deep + 1, b, params, random);
                debug(deep, "String '" + str + "' have one operand " + oper.operation.longSymbol + ", " +
                    ("will call operand with unary '" + b + "'"));
                return 0 - argToNumber(bparse, random);
            }
            else {
                throw new Error("Usage of " + oper.operation.longSymbol + " as Unary in " + str);
            }
        }
    }
}
function parse(str, params, random) {
    if (params === void 0) { params = []; }
    if (random === void 0) { random = Math.random; }
    debug(0, "\nInput=" + str);
    while (true) {
        var wasOneReplace = false;
        for (var _i = 0, _a = operations.filter(function (x) { return x.longSymbol !== x.shortSymbol; }); _i < _a.length; _i++) {
            var oper = _a[_i];
            if (str.indexOf(oper.longSymbol) > -1) {
                wasOneReplace = true;
                // debug(0, `Replace newStr=${str} long=${oper.longSymbol} short=${oper.shortSymbol}`);
                str = str.replace(oper.longSymbol, oper.shortSymbol);
            }
        }
        if (!wasOneReplace) {
            break;
        }
    }
    str = str.replace(/\r|\n/g, '').replace(/ /g, '');
    debug(0, "Preprocessed=" + str);
    var parsed = parseRecursive(0, str, params, random);
    debug(0, "Parsed=" + parsed);
    var result = Math.round(argToNumber(parsed, random));
    debug(0, "Result=" + result);
    return result;
}
/*
 TODO:
   to think about unary '-': is it working ok?
*/
console.info(parse('10 000'));
console.info(parse('[2h5]'));
