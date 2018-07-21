import * as assert from "assert";

export const MAX_NUMBER = 2000000000;
type Params = number[];

/*
tokens:

(
)
+
-
*
/
<>
[p1]
[] range


*/
const enum SyntaxKind {
    // Eof,
    WhiteSpaceTrivia = "white space",
    NumericLiteral = "numeric",
    OpenBraceToken = "open brace",
    CloseBraceToken = "close brace",
    OpenParenToken = "open paren",
    CloseParenToken = "close paren",
    DotDotToken = "dotdot",
    SemicolonToken = "semicolon",
    LessThanToken = "less than",
    GreaterThanToken = "greater than",
    LessThanEqualsToken = "less than eq",
    GreaterThanEqualsToken = "greater than eq",
    PlusToken = "plus",
    MinusToken = "minus",
    SlashToken = "slash",
    AsteriskToken = "asterisk",
    EqualsToken = "equals",
    NotEqualsToken = "not equals",
    Identifier = "identifier",
    ModKeyword = "mod",
    DivKeyword = "div",
    ToKeyword = "to",
    InKeyword = "in",
    AndKeyword = "and",
    OrKeyword = "or"
}

const keywordsToKind = {
    mod: SyntaxKind.ModKeyword,
    div: SyntaxKind.DivKeyword,
    to: SyntaxKind.ToKeyword,
    in: SyntaxKind.InKeyword,
    and: SyntaxKind.AndKeyword,
    or: SyntaxKind.OrKeyword
};

interface Token {
    kind: SyntaxKind;
    start: number;
    end: number;
    text: string;
}

function Scanner(str: string) {
    let pos = 0;
    let end = str.length;

    type LastCharCheck = (char: string, text: string) => boolean;

    function isWhitespace(char: string) {
        return char === " " || char === "\n" || char === "\r" || char === "\t";
    }
    function scanWhitespace(): Token {
        const start = pos;
        while (pos < end && isWhitespace(str[pos])) {
            pos++;
        }
        return {
            kind: SyntaxKind.WhiteSpaceTrivia,
            start,
            end: pos,
            text: str.slice(start, pos)
        };
    }
    function isDigit(char: string) {
        return char.length === 1 && "0123456789".indexOf(char) > -1;
    }

    function oneCharTokenToKind(char: string) {
        return char === "("
            ? SyntaxKind.OpenBraceToken
            : char === ")"
                ? SyntaxKind.CloseBraceToken
                : char === "["
                    ? SyntaxKind.OpenParenToken
                    : char === "]"
                        ? SyntaxKind.CloseParenToken
                        : char === "/"
                            ? SyntaxKind.SlashToken
                            : char === "*"
                                ? SyntaxKind.AsteriskToken
                                : char === "+"
                                    ? SyntaxKind.PlusToken
                                    : char === "-"
                                        ? SyntaxKind.MinusToken
                                        : char === "="
                                            ? SyntaxKind.EqualsToken
                                            : char === ";"
                                                ? SyntaxKind.SemicolonToken
                                                : undefined;
    }
    function lookAhead(charCount: number = 1) {
        return pos + charCount < end ? str[pos + charCount] : undefined;
    }

    function scanIdentifierOrKeyword(): Token | undefined {
        const start = pos;

        while (
            pos < end &&
            "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM01234567890_".indexOf(
                str[pos]
            ) > -1
        ) {
            pos++;
        }
        const text = str.slice(start, pos);
        const kind =
            keywordsToKind[text as keyof typeof keywordsToKind] ||
            SyntaxKind.Identifier;
        return {
            kind,
            start,
            end: pos,
            text
        };
    }

    function scanNumber() {
        let dotSeen = false;
        const start = pos;

        while (pos < end) {
            const char = str[pos];
            if (isDigit(char)) {
                // ok
            } else if (char === "." || char === ",") {
                if (dotSeen) {
                    break;
                }
                const nextNextChar = lookAhead();
                if (nextNextChar !== "." && nextNextChar !== ",") {
                    dotSeen = true;
                } else {
                    break;
                }
                // } else if (char === "-" && pos === start) {
                // Ok here
            } else {
                break;
            }

            pos++;
        }
        const token = {
            kind: SyntaxKind.NumericLiteral,
            start,
            end: pos,
            text: str.slice(start, pos)
        };
        return token;
    }

    function scan(): Token | undefined {
        if (pos >= end) {
            return undefined;
        }
        const char = str[pos];
        if (isWhitespace(char)) {
            return scanWhitespace();
        }

        const lookAheadChar = lookAhead();
        if (char === "." && lookAheadChar === ".") {
            const token = {
                kind: SyntaxKind.DotDotToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }

        if (char === "<" && lookAheadChar === ">") {
            const token = {
                kind: SyntaxKind.NotEqualsToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }
        if (char === ">" && lookAheadChar === "=") {
            const token = {
                kind: SyntaxKind.GreaterThanEqualsToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }
        if (char === "<" && lookAheadChar === "=") {
            const token = {
                kind: SyntaxKind.LessThanEqualsToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }

        if (char === ">" && lookAheadChar !== "=") {
            const token = {
                kind: SyntaxKind.GreaterThanToken,
                start: pos,
                end: pos + 1,
                text: char
            };
            pos++;
            return token;
        }

        if (char === "<" && lookAheadChar !== "=") {
            const token = {
                kind: SyntaxKind.LessThanToken,
                start: pos,
                end: pos + 1,
                text: char
            };
            pos++;
            return token;
        }

        if (
            isDigit(char)
            // || (char === "-" && lookAheadChar && isDigit(lookAheadChar))
        ) {
            return scanNumber();
        }
        const oneCharKind = oneCharTokenToKind(char);
        if (oneCharKind !== undefined) {
            const token = {
                kind: oneCharKind as SyntaxKind, // why it not able to understand this
                start: pos,
                end: pos + 1,
                text: char
            };
            pos++;
            return token;
        }

        return scanIdentifierOrKeyword();
    }
    return scan;
}

const enum ExpressionType {
    Number = "number",
    Range = "range",
    Parameter = "parameter",
    Binary = "binary",
    Unary = "unary"
}
type Expression =
    | NumberExpression
    | RangeExpression
    | ParameterExpression
    | BinaryExpression
    | UnaryExpression;
interface NumberExpression {
    type: ExpressionType.Number;
    value: number;
}
interface Range {
    from: Expression;
    to?: Expression;
}
interface RangeExpression {
    type: ExpressionType.Range;
    ranges: Range[];
}
interface ParameterExpression {
    type: ExpressionType.Parameter;
    parameterId: number;
}
interface BinaryExpression {
    type: ExpressionType.Binary;
    left: Expression;
    right: Expression;
    operator: SyntaxKind;
}
interface UnaryExpression {
    type: ExpressionType.Unary;
    expression: Expression;
    operator: SyntaxKind;
}

type TokenOrExpression = Token | Expression;
function getBinaryTokenPrecedence(token: SyntaxKind) {
    switch (token) {
        case SyntaxKind.OrKeyword:
            return 1;
        case SyntaxKind.AndKeyword:
            return 2;
        case SyntaxKind.GreaterThanEqualsToken:
        case SyntaxKind.LessThanEqualsToken:
        case SyntaxKind.GreaterThanToken:
        case SyntaxKind.LessThanToken:
        case SyntaxKind.EqualsToken:
        case SyntaxKind.NotEqualsToken:
            return 3;
        case SyntaxKind.InKeyword:
            return 3;
        case SyntaxKind.ToKeyword:
            return 4;

        case SyntaxKind.PlusToken:
            return 5;
        case SyntaxKind.MinusToken:
            return 6;

        case SyntaxKind.AsteriskToken:
            return 7;

        case SyntaxKind.SlashToken:
        case SyntaxKind.DivKeyword:
        case SyntaxKind.ModKeyword:
            return 8;
    }
    return 0;
}

function parseParenExpression(tokens: Token[]) {
    const firstToken = tokens[0];
    if (firstToken.kind === SyntaxKind.Identifier) {
        if (tokens.length > 1) {
            throw new Error(
                `Unknown token ${tokens[1].text} at ${tokens[1].start}`
            );
        }
        const pConst = firstToken.text.slice(0, 1);
        const pNumber = firstToken.text.slice(1);
        const pId = parseInt(pNumber) - 1;
        if (pConst !== "p" || isNaN(pId)) {
            throw new Error(
                `Unknown indentified ${firstToken.text} at ${firstToken.start}`
            );
        }
        const exp: ParameterExpression = {
            type: ExpressionType.Parameter,
            parameterId: pId
        };
        return exp;
    } else {
        const ranges: Range[] = [];

        let i = 0;
        while (i < tokens.length) {
            if (
                i < tokens.length &&
                tokens[i].kind === SyntaxKind.SemicolonToken
            ) {
                i++;
            }
            if (i >= tokens.length) {
                throw new Error(`Expected values at ${i}`);
            }

            const rangePartStart = i;
            while (
                i < tokens.length &&
                tokens[i].kind !== SyntaxKind.SemicolonToken
            ) {
                i++;
            }
            const rangePartEnd = i;

            let rangeLeftI = rangePartStart;
            const rangeLeftStart = rangeLeftI;
            while (
                rangeLeftI < rangePartEnd &&
                tokens[rangeLeftI].kind !== SyntaxKind.DotDotToken
            ) {
                rangeLeftI++;
            }
            const rangeLeftEnd = rangeLeftI;
            if (rangeLeftEnd === rangePartEnd) {
                ranges.push({
                    from: parseExpression(
                        tokens.slice(rangeLeftStart, rangeLeftEnd)
                    )
                });
            } else {
                if (tokens[rangeLeftEnd].kind !== SyntaxKind.DotDotToken) {
                    throw new Error(
                        `Expected .. at ${tokens[rangeLeftEnd].start}`
                    );
                }
                const rangeRightStart = rangeLeftEnd + 1;
                const rangeRightEnd = rangePartEnd;
                if (rangeRightStart === rangeRightEnd) {
                    throw new Error(
                        `Expected expression at ${rangeRightStart}`
                    );
                }
                ranges.push({
                    from: parseExpression(
                        tokens.slice(rangeLeftStart, rangeLeftEnd)
                    ),
                    to: parseExpression(
                        tokens.slice(rangeRightStart, rangeRightEnd)
                    )
                });
            }
        }
        const exp: RangeExpression = {
            type: ExpressionType.Range,
            ranges
        };
        return exp;
    }
}

function makeFlatExpression(tokens: Token[]) {
    let flatExpression: TokenOrExpression[] = [];
    let i = 0;
    if (tokens.length === 0) {
        const exp: NumberExpression = {
            type: ExpressionType.Number,
            value: 0
        };
        return [exp];
    }
    while (i < tokens.length) {
        const token = tokens[i];
        if (getBinaryTokenPrecedence(token.kind)) {
            flatExpression.push(token);
        } else if (token.kind === SyntaxKind.NumericLiteral) {
            const exp: NumberExpression = {
                type: ExpressionType.Number,
                value: parseFloat(token.text.replace(",", "."))
            };
            flatExpression.push(exp);
        } else if (token.kind === SyntaxKind.OpenBraceToken) {
            let braceCount = 1;
            const braceStartPos = i;
            while (braceCount > 0 && i < tokens.length) {
                i++;
                const movedToken = tokens[i];
                braceCount +=
                    movedToken.kind === SyntaxKind.OpenBraceToken
                        ? 1
                        : movedToken.kind === SyntaxKind.CloseBraceToken
                            ? -1
                            : 0;
            }
            if (braceCount !== 0) {
                throw new Error(
                    `Unable to find closing bracked at pos=${token.start}`
                );
            }
            const braceEndPos = i;
            const exp = parseExpression(
                tokens.slice(braceStartPos + 1, braceEndPos)
            );
            flatExpression.push(exp);
        } else if (token.kind === SyntaxKind.OpenParenToken) {
            let parenCount = 1;
            const parenStartPos = i;
            while (parenCount > 0 && i < tokens.length) {
                i++;
                const movedToken = tokens[i];
                parenCount +=
                    movedToken.kind === SyntaxKind.CloseParenToken ? -1 : 0;
            }
            if (parenCount !== 0) {
                throw new Error(
                    `Unable to find closing paren bracked at pos=${token.start}`
                );
            }
            const parenEndPos = i;
            const insideParens = tokens.slice(parenStartPos + 1, parenEndPos);
            if (insideParens.length === 0) {
                throw new Error(`Empry parens at ${token.start}`);
            }
            const exp = parseParenExpression(insideParens);
            flatExpression.push(exp);
        } else {
            throw new Error(`Unknown token ${token.text} at ${token.start}`);
        }

        i++;
    }
    return flatExpression;
}

function parseExpression(tokensInput: Token[]): Expression {
    const flatExpression = makeFlatExpression(tokensInput);

    function parseFlatExpression(exps: TokenOrExpression[]): Expression {
        // Zero-length is never provided here
        if (exps.length === 1) {
            const exp = exps[0];
            if ("type" in exp) {
                return exp;
            } else {
                throw new Error(`Unknown token '${exp.text}' at ${exp.start} `);
            }
        } else if (exps.length === 2) {
            const exp1 = exps[0];
            const exp2 = exps[1];
            if (
                "kind" in exp1 &&
                exp1.kind === SyntaxKind.MinusToken &&
                "type" in exp2
            ) {
                const rexp: UnaryExpression = {
                    type: ExpressionType.Unary,
                    expression: exp2,
                    operator: SyntaxKind.MinusToken
                };
                return rexp;
            } else {
                throw new Error(`Unknown state`);
            }
        } else {
            // We have 3 items.
            let lowest:
                | {
                      idx: number;
                      prio: number;
                      oper: SyntaxKind;
                  }
                | undefined = undefined;
            let i = 1;

            while (i + 1 < exps.length) {
                const left = exps[i - 1];
                const middle = exps[i];
                const right = exps[i + 1];
                // console.info(left, middle, right);
                if ("type" in left && "type" in right && "kind" in middle) {
                    const prio = getBinaryTokenPrecedence(middle.kind);
                    if (!prio) {
                        throw new Error(
                            `Now a binary operator '${middle.text}' at ${
                                middle.start
                            }`
                        );
                    }
                    if (!lowest || lowest.prio >= prio) {
                        lowest = {
                            idx: i,
                            prio,
                            oper: middle.kind
                        };
                    }
                }
                i++;
            }
            if (!lowest) {
                console.info(exps);
                throw new Error(`Unable to find binary operator`);
            }
            const left = exps.slice(0, lowest.idx);
            const right = exps.slice(lowest.idx + 1);
            const exp: BinaryExpression = {
                type: ExpressionType.Binary,
                left: parseFlatExpression(left),
                right: parseFlatExpression(right),
                operator: lowest.oper
            };
            return exp;
        }
    }
    return parseFlatExpression(flatExpression);
}

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

function calculateAst(
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

export function parse(str: string, params: Params = [], random = Math.random) {
    // console.info(`New parsing '${str}'`);
    const tokensAndWhitespace: Token[] = [];
    const scanner = Scanner(str);
    while (true) {
        const token = scanner();
        if (token) {
            tokensAndWhitespace.push(token);
            if (token.kind !== SyntaxKind.WhiteSpaceTrivia) {
                // console.info(token);
            }
        } else {
            break;
        }
    }
    for (const sanityCheckToken of tokensAndWhitespace) {
        assert.strictEqual(
            sanityCheckToken.text,
            str.slice(sanityCheckToken.start, sanityCheckToken.end)
        );
        assert.strictEqual(
            sanityCheckToken.text.length,
            sanityCheckToken.end - sanityCheckToken.start
        );
    }

    assert.strictEqual(str, tokensAndWhitespace.map(x => x.text).join(""));
    const tokens = tokensAndWhitespace.filter(
        x => x.kind !== SyntaxKind.WhiteSpaceTrivia
    );

    const ast = parseExpression(tokens);
    // console.info(JSON.stringify(ast, null, 4));
    const value = calculateAst(ast, params, random);
    return Math.round(value);
}

//console.info(parse('2 +  2 * 2 +2+2'))
//console.info(parse('2 + 2 * 2 + 2'))
//console.info(parse("2 in 2 to 3"));

// console.info(parse("[-2]"));
//console.info(parse("[-3;-3;-3..-3]"));
//console.info(parse("3 + [1;3;6..9] - 3"));
//console.info(parse("[p11]-[5..30]*0,4"));

