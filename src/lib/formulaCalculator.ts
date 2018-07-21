import { SyntaxKind, ExpressionType, MAX_NUMBER, Expression, Params } from "./formulaTypes";

function numberMinMax(n: number) {
    return Math.min(Math.max(n, -MAX_NUMBER), MAX_NUMBER);
}

interface RangeCalculated {
    from: number;
    to: number;
}

function floorCeil(val: number) {
    return val > 0 ? Math.floor(val) : Math.ceil(val);
}

function pickRandomForRanges(ranges: RangeCalculated[], random: () => number) {
    const totalValuesAmount = ranges.reduce((totalItems, range) => {
        return totalItems + range.to - range.from + 1;
    }, 0);
    const pickedRandom = random();
    let rnd = Math.floor(pickedRandom * totalValuesAmount);
    //console.info(
    //    `new ranges=[${ranges
    //        .map(x => `${x.from}..${x.to}`)
    //        .join("; ")}] rnd=${rnd} pickedRandom=${pickedRandom} totalValuesAmount=${totalValuesAmount}`
    //);
    for (const range of ranges) {
        const len = range.to - range.from + 1;
        // console.info(`Range=${range[0]}..${range[1]}, rnd=${rnd}, len=${len}`)
        if (rnd >= len) {
            rnd = rnd - len;
        } else {
            const result = rnd + range.from;
            // debug(0, `Range ${arg} returned random ${result}`);
            return result;
        }
    }
    throw new Error(
        "Error in finding random value for " +
            JSON.stringify(
                {
                    ranges,
                    rnd
                },
                null,
                4
            )
    );
}

export function calculateAst(
    ast: Expression,
    params: Params = [],
    random: () => number
): number {
    function transformToIntoRanges(node: Expression): RangeCalculated[] {
        if (
            node.type !== ExpressionType.Binary ||
            node.operator !== SyntaxKind.ToKeyword
        ) {
            throw new Error("Wrong usage");
        }
        const valToRanges = (val: number) => [
            {
                from: val,
                to: val
            }
        ];

        const left = node.left;
        const right = node.right;
        const leftRanges =
            left.type === ExpressionType.Range
                ? calculateRange(left)
                : valToRanges(floorCeil(calculateAst(left, params, random)));

        const rightRanges =
            right.type === ExpressionType.Range
                ? calculateRange(right)
                : valToRanges(floorCeil(calculateAst(right, params, random)));

        const leftRangeMax = Math.max(...leftRanges.map(x => x.to), 0);
        const rightRangeMax = Math.max(...rightRanges.map(x => x.to), 0);

        const leftRangeMin = Math.min(
            ...leftRanges.map(x => x.from),
            MAX_NUMBER
        );
        const rightRangeMin = Math.min(
            ...rightRanges.map(x => x.from),
            MAX_NUMBER
        );
        const newRangeMax = Math.max(leftRangeMax, rightRangeMax);
        const newRangeMin = Math.min(leftRangeMin, rightRangeMin);
        const newRanges = [
            {
                from: newRangeMin,
                to: newRangeMax
            }
        ];
        return newRanges;
    }
    function calculateRange(node: Expression): RangeCalculated[] {
        if (node.type !== ExpressionType.Range) {
            throw new Error("Wrong usage");
        }
        return node.ranges.map(range => {
            const from = floorCeil(calculateAst(range.from, params, random));
            const to = range.to ? floorCeil(calculateAst(range.to, params, random)) : from;
            const reversed = from > to;
            return {
                from: reversed ? to : from,
                to: reversed ? from : to
            };
        });
    }

    if (ast.type === ExpressionType.Number) {
        return ast.value;
    } else if (ast.type === ExpressionType.Parameter) {
        return params[ast.parameterId];
    } else if (ast.type === ExpressionType.Binary) {
        if (ast.operator === SyntaxKind.PlusToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return numberMinMax(a + b);
        } else if (ast.operator === SyntaxKind.MinusToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return numberMinMax(a - b);
        } else if (ast.operator === SyntaxKind.SlashToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return numberMinMax(
                b !== 0 ? a / b : a > 0 ? MAX_NUMBER : -MAX_NUMBER
            );
        } else if (ast.operator === SyntaxKind.DivKeyword) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            if (b !== 0) {
                const val = a / b;
                return numberMinMax(floorCeil(val));
            } else {
                return a > 0 ? MAX_NUMBER : -MAX_NUMBER;
            }
        } else if (ast.operator === SyntaxKind.ModKeyword) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return numberMinMax(
                b !== 0 ? a % b : a > 0 ? MAX_NUMBER : -MAX_NUMBER
            );
        } else if (ast.operator === SyntaxKind.AsteriskToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return numberMinMax(a * b);
        } else if (ast.operator === SyntaxKind.ToKeyword) {
            const newRanges = transformToIntoRanges(ast);
            return pickRandomForRanges(newRanges, random);
        } else if (ast.operator === SyntaxKind.InKeyword) {
            const reversed =
                ast.left.type === ExpressionType.Range &&
                ast.right.type !== ExpressionType.Range;
            const left = reversed ? ast.right : ast.left;
            const right = reversed ? ast.left : ast.right;

            const leftVal = numberMinMax(calculateAst(left, params, random));
            const ranges =
                right.type === ExpressionType.Range
                    ? calculateRange(right)
                    : right.type === ExpressionType.Binary &&
                      right.operator === SyntaxKind.ToKeyword
                        ? transformToIntoRanges(right)
                        : undefined;
            if (ranges) {
                for (const range of ranges) {
                    if (leftVal >= range.from && leftVal <= range.to) {
                        return 1;
                    }
                }
                return 0;
            } else {
                const rightVal = numberMinMax(
                    calculateAst(ast.right, params, random)
                );
                return leftVal === rightVal ? 1 : 0;
            }
        } else if (ast.operator === SyntaxKind.GreaterThanEqualsToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a >= b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.GreaterThanToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a > b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.LessThanEqualsToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a <= b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.LessThanToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a < b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.EqualsToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a === b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.NotEqualsToken) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a !== b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.AndKeyword) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a && b ? 1 : 0;
        } else if (ast.operator === SyntaxKind.OrKeyword) {
            const a = calculateAst(ast.left, params, random);
            const b = calculateAst(ast.right, params, random);
            return a || b ? 1 : 0;
        } else {
            throw new Error(`Unknown operator '${ast.operator}'`);
        }
    } else if (ast.type === ExpressionType.Unary) {
        if (ast.operator === SyntaxKind.MinusToken) {
            return -calculateAst(ast.expression, params, random);
        } else {
            throw new Error(`Unknown unary operator`);
        }
    } else if (ast.type === ExpressionType.Range) {
        return pickRandomForRanges(calculateRange(ast), random);
    } else {
        throw new Error(`Unknown ast type`);
    }
}





