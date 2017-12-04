import * as assert from 'assert';

type Arg = string | number;
interface Operation {
    longSymbol: string,
    shortSymbol: string,
    prio: number,
    fBinary: (a: Arg, b: Arg) => Arg
}

export const MAX_NUMBER = 2000000000;


function parseRange(arg: string) {
    return arg.slice(1, arg.length - 1).split(';').map(range => {
        if (range.indexOf('..') > -1) {
            const [low, high] = range.split('..').map(x => parseInt(x));
            if (isNaN(low) || isNaN(high)) {
                throw new Error(`Unknown range part '${range}' in '${arg}'`)
            }
            if (low <= high) {
                return [low, high]
            } else {
                return [high, low]
            }
        } else {
            if (range.indexOf(',') > -1) {
                throw new Error(`Wrong range usage '${arg}': found a ',' symbol`)
            }
            const val = parseInt(range);
            if (isNaN(val)) {
                throw new Error(`Unknown scalar part '${range}' in '${arg}'`)
            }
            return [val, val]
        }
    });
}

function argToNumber(arg: Arg) {
    if (typeof (arg) === 'number') {
        return arg
    } else {
        if (!arg) {
            throw new Error("No string data for argToNumber")
        }

        if (arg[0] === '[') {
            let ranges = parseRange(arg);
            const totalValuesAmount = ranges.reduce((totalItems, range) => {
                const [low, high] = range;
                return totalItems + high - low + 1;
            }, 0);
            let rnd = Math.floor(Math.random() * totalValuesAmount);
            for (const range of ranges) {
                const len = range[1] - range[0] + 1;
                // console.info(`Range=${range[0]}..${range[1]}, rnd=${rnd}, len=${len}`)
                if (rnd >= len) {
                    rnd = rnd - len
                } else {
                    const result = rnd + range[0];
                    debug(0, `Range ${arg} returned random ${result}`);
                    return result;
                }
            }
            throw new Error("Error in finding random value for " + JSON.stringify({
                arg,
                ranges,
                rnd
            }, null, 4))
        } else {
            /*
                Is that code even reachable? String Arg could be returned
                only from "to" operator, and that one returned range
                */
            const r = parseFloat(arg.replace(',', '.'));
            if (isNaN(r)) {
                throw new Error(`Unknown arg = '${arg}'`)
            } else {
                return r;
            }
        }
    }
}

function floorCeil(val: number) {
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
const operations: Operation[] = [
    {
        longSymbol: '/',
        shortSymbol: '/',
        prio: 1,
        fBinary: (a, b) => {
            const numA = argToNumber(a);
            const numB = argToNumber(b);
            if (numB !== 0) {
                return numA / numB
            } else {
                return numA > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        }
    },
    {
        longSymbol: 'div',
        shortSymbol: 'f',
        prio: 1,
        fBinary: (a, b) => {
            const numA = argToNumber(a);
            const numB = argToNumber(b);
            if (numB !== 0) {
                const div = numA / numB;
                return floorCeil(div)
            } else {
                return numA > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        }
    },
    {
        longSymbol: 'mod',
        shortSymbol: 'g',
        prio: 1,
        fBinary: (a, b) => {
            const numA = argToNumber(a);
            const numB = argToNumber(b);
            if (numB !== 0) {
                return numA % numB
            } else {
                return numA > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        }
    },

    {
        longSymbol: '*',
        shortSymbol: '*',
        prio: 2,
        fBinary: (a, b) => {
            return argToNumber(a) * argToNumber(b)
        }
    },
    {
        longSymbol: '-',
        shortSymbol: '-',
        prio: 3,
        fBinary: (a, b) => argToNumber(a) - argToNumber(b),
    },
    {
        longSymbol: '+',
        shortSymbol: '+',
        prio: 4,
        fBinary: (a, b) => argToNumber(a) + argToNumber(b)
    },
    {
        longSymbol: 'to',
        shortSymbol: '$',
        prio: 5,
        fBinary: (a, b) => {
            const rangeA = typeof (a) === 'string' ? parseRange(a) : [[a, a]];
            const rangeB = typeof (b) === 'string' ? parseRange(b) : [[b, b]];
            if (rangeA.length === 0) {
                throw new Error(`Zero length for range ${a}`)
            }
            if (rangeB.length === 0) {
                throw new Error(`Zero length for range ${b}`)
            }
            const rangeAmax = rangeA.reduce((max, range) => range[1] > max ? range[1] : max, 0);
            const rangeBmax = rangeB.reduce((max, range) => range[1] > max ? range[1] : max, 0);
            const rangeAmin = rangeA.reduce((min, range) => range[0] < min ? range[0] : min, MAX_NUMBER);
            const rangeBmin = rangeB.reduce((min, range) => range[0] < min ? range[0] : min, MAX_NUMBER);
            const newRangeMax = rangeAmax > rangeBmax ? rangeAmax : rangeBmax;
            const newRangeMin = rangeAmin < rangeBmin ? rangeAmin : rangeBmin;
            return `[${newRangeMin}..${newRangeMax}]`
        },
    },

    {
        longSymbol: 'in',
        shortSymbol: '#',
        prio: 6,
        fBinary: (a, b) => {
            if (typeof (a) === 'number' && typeof (b) === 'number') {
                return a === b ? 1 : 0
            } else {
                let [val, ranges] =
                    typeof (a) === 'string' && typeof (b) === 'string' ? [argToNumber(a), b] :
                        typeof (a) === 'number' && typeof (b) === 'string' ? [a, b] :
                            typeof (a) === 'string' && typeof (b) === 'number' ? [b, a] :
                                [undefined, undefined];
                if (val === undefined || ranges === undefined) {
                    throw new Error("Internal error: no val or no ranges")
                }
                for (const range of parseRange(ranges)) {
                    if (val >= range[0] && val <= range[1]) {
                        return 1
                    }
                }
                return 0
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
        fBinary: (a, b) => argToNumber(a) >= argToNumber(b) ? 1 : 0
    },
    {
        longSymbol: '<=',
        shortSymbol: 'b',
        prio: 7,
        fBinary: (a, b) => argToNumber(a) <= argToNumber(b) ? 1 : 0
    },
    {
        longSymbol: '>',
        shortSymbol: '>',
        prio: 7,
        fBinary: (a, b) => argToNumber(a) > argToNumber(b) ? 1 : 0
    },
    {
        longSymbol: '<',
        shortSymbol: '<',
        prio: 7,
        fBinary: (a, b) => argToNumber(a) < argToNumber(b) ? 1 : 0
    },
    {
        longSymbol: '=',
        shortSymbol: '=',
        prio: 7,
        fBinary: (a, b) => argToNumber(a) === argToNumber(b) ? 1 : 0
    },
    {
        longSymbol: '<>',
        shortSymbol: 'e',
        prio: 7,
        fBinary: (a, b) => argToNumber(a) !== argToNumber(b) ? 1 : 0
    },

    {
        longSymbol: 'and',
        shortSymbol: '&',
        prio: 8,
        fBinary: (a, b) => argToNumber(a) && argToNumber(b) ? 1 : 0
    },
    {
        longSymbol: 'or',
        shortSymbol: '|',
        prio: 9,
        fBinary: (a, b) => argToNumber(a) || argToNumber(b) ? 1 : 0
    },
]

function findClosingBrackedIndex(str: string, openBrackedIndex: number, type: 'round' | 'square') {
    const open = type === 'round' ? '(' : type === 'square' ? '[' : undefined;
    const close = type === 'round' ? ')' : type === 'square' ? ']' : undefined;
    if (!open || !close) {
        throw new Error(`Internal error: no open or no close bracket`)
    }
    if (str[openBrackedIndex] === open) {
        let opencount = 1;
        for (let i = openBrackedIndex + 1; i < str.length; i++) {
            if (str[i] === open) {
                opencount++;
            } else if (str[i] === close) {
                opencount--;
            }
            if (opencount === 0) {
                return i
            }
        }
        throw new Error(`Closed bracked not found: str='${str}', openIndex=${openBrackedIndex}, opencount=${opencount}`);
    } else {
        throw new Error("Not a bracket")
    }
}

function debug(deep: number, text: string) {
    let prefix = '';
    for (let i = 0; i < deep; i++) {
        prefix += '    ';
    }
    // console.info(prefix + text)
}
type Params = number[];

function parseRecursive(deep: number, str: string, params: Params): number | string {
    debug(deep, `Parsing str='${str}'`)
    if (!str) {
        // return 0
        throw new Error("Empty string!")
    }
    while (str[0] === '(') {
        const i = findClosingBrackedIndex(str, 0, 'round');
        if (i === str.length - 1) {
            str = str.slice(1, str.length - 1)
        } else {
            break
        }
    }
    debug(deep, `After removing covering brackets str='${str}'`)

    let operands: {
        pos: number,
        operation: Operation
    }[] = [];
    let i = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        const operation = operations.filter(x => x.shortSymbol === c).shift();
        if (operation) {
            operands.push({
                pos: i,
                operation
            })
        } else {
            if (c === '(') {
                const closingPos = findClosingBrackedIndex(str, i, 'round');
                i = closingPos;
            } else if (c === '[') {
                const closingPos = findClosingBrackedIndex(str, i, 'square');
                i = closingPos;
            }
        }
    }
    if (str[0] === '[' && str[1] === 'p' && str.indexOf(']') === str.length - 1) {
        debug(deep, `String '${str}' is parameter`);
        let pNum = parseInt(str.slice(2, str.length - 1));
        if (isNaN(pNum)) {
            throw new Error(`Unknown parameter '${str}'`)
        }
        const val = params[pNum - 1];
        if (val === undefined) {
            throw new Error(`Undefined param ${str}`)
        }
        return val
    } else if (str[0] === '[' && str.indexOf(']') === str.length - 1) {
        debug(deep, `String '${str}' is range`);
        return str
    } else if (operands.length === 0) {
        debug(deep, `String '${str}' have no operands`);
        const val = parseFloat(str.replace(',', '.'));
        if (isNaN(val)) {
            throw new Error(`Unknown elementary value '${str}'`)
        }
        return val

    } else {
        const oper = operands
            .sort((a, b) => a.operation.prio - b.operation.prio || a.pos - b.pos)            
            .pop()

        if (!oper) {
            debug(deep, `String '${str}', operands are: ` +
                operands.map(x => `pos=${x.pos} symbol=${x.operation.longSymbol}/${x.operation.shortSymbol}`).join('; '));
            throw new Error("Operand must be defined!")
        }

        const a = str.slice(0, oper.pos);
        const b = str.slice(oper.pos + 1, str.length);

        debug(deep, `String '${str}' have operand ${oper.operation.longSymbol}, ` +
            `will parse '${a}' and '${b}'`);
        if (a) {
            const aparse = parseRecursive(deep + 1, a, params);
            const bparse = parseRecursive(deep + 1, b, params);
            debug(deep, `String '${str}' have one operand ${oper.operation.longSymbol}, ` +
                `will call operand with a='${a}',aparsed='${aparse}',atype=${typeof (aparse)} ` +
                `and b='${b}',bparsed='${bparse}',type=${typeof (bparse)}`);
            if (oper.operation.fBinary) {
                const val = oper.operation.fBinary(aparse, bparse);
                debug(deep, `Operand ${oper.operation.longSymbol} returned '${val}'`)
                return val;
            } else {
                throw new Error(`Usage of ${oper.operation.longSymbol} as Unary in ${str}`)
            }
        } else {
            if (oper.operation.shortSymbol === '-') {
                const bparse = parseRecursive(deep + 1, b, params);
                debug(deep, `String '${str}' have one operand ${oper.operation.longSymbol}, ` +
                    `will call operand with unary '${b}'`);
                return 0 - argToNumber(bparse)
            } else {
                throw new Error(`Usage of ${oper.operation.longSymbol} as Unary in ${str}`)
            }
        }
    }
}

export function parse(str: string, params: Params = []) {
    debug(0, `\nInput=${str}`);
    while (true) {
        let wasOneReplace = false;
        for (const oper of operations.filter(x => x.longSymbol !== x.shortSymbol)) {
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
    str = str.replace(/\r|\n/g,'').replace(/ /g, '');
    debug(0, `Preprocessed=${str}`)
    const parsed = parseRecursive(0, str, params);
    debug(0, `Parsed=${parsed}`);
    const result = Math.round(argToNumber(parsed));
    debug(0, `Result=${result}`)
    return result
}


/*
 TODO:
   to think about unary '-': is it working ok?
*/