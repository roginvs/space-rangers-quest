import { Token, RangePart, Expression, SyntaxKind, ParameterExpression, ExpressionType, BinaryExpression, UnaryExpression, RangeExpression, NumberExpression } from "./formulaTypes";


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
        const ranges: RangePart[] = [];

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

export function parseExpression(tokensInput: Token[]): Expression {
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

