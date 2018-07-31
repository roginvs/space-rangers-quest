"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getBinaryTokenPrecedence(token) {
    switch (token) {
        case "or keyword":
            return 1;
        case "and keyword":
            return 2;
        case "greater than eq token":
        case "less than eq token":
        case "greater than token":
        case "less than token":
        case "equals token":
        case "not equals token":
            return 3;
        case "in keyword":
            return 3;
        case "to keyword":
            return 4;
        case "plus token":
            return 5;
        case "minus token":
            return 6;
        case "asterisk token":
            return 7;
        case "slash token":
        case "div keyword":
        case "mod keyword":
            return 8;
    }
    return 0;
}
function isTokenBinary(token) {
    return getBinaryTokenPrecedence(token) !== 0;
}
function parseParenExpression(tokens) {
    var firstToken = tokens[0];
    if (firstToken.kind === "identifier") {
        if (tokens.length > 1) {
            throw new Error("Unknown token " + tokens[1].text + " at " + tokens[1].start + " for paren");
        }
        var pConst = firstToken.text.slice(0, 1);
        var pNumber = firstToken.text.slice(1);
        var pId = parseInt(pNumber) - 1;
        if (pConst !== "p" || isNaN(pId)) {
            throw new Error("Unknown indentified " + firstToken.text + " at " + firstToken.start);
        }
        var exp = {
            type: "parameter",
            parameterId: pId
        };
        return exp;
    }
    else {
        var ranges = [];
        var i = 0;
        while (i < tokens.length) {
            if (i < tokens.length &&
                tokens[i].kind === "semicolon token") {
                i++;
            }
            if (i >= tokens.length) {
                throw new Error("Expected values at " + i);
            }
            var rangePartStart = i;
            while (i < tokens.length &&
                tokens[i].kind !== "semicolon token") {
                i++;
            }
            var rangePartEnd = i;
            var rangeLeftI = rangePartStart;
            var rangeLeftStart = rangeLeftI;
            while (rangeLeftI < rangePartEnd &&
                tokens[rangeLeftI].kind !== "dotdot token") {
                rangeLeftI++;
            }
            var rangeLeftEnd = rangeLeftI;
            if (rangeLeftEnd === rangePartEnd) {
                ranges.push({
                    from: parseExpression(tokens.slice(rangeLeftStart, rangeLeftEnd))
                });
            }
            else {
                if (tokens[rangeLeftEnd].kind !== "dotdot token") {
                    throw new Error("Expected .. at " + tokens[rangeLeftEnd].start);
                }
                var rangeRightStart = rangeLeftEnd + 1;
                var rangeRightEnd = rangePartEnd;
                if (rangeRightStart === rangeRightEnd) {
                    throw new Error("Expected expression at " + rangeRightStart);
                }
                ranges.push({
                    from: parseExpression(tokens.slice(rangeLeftStart, rangeLeftEnd)),
                    to: parseExpression(tokens.slice(rangeRightStart, rangeRightEnd))
                });
            }
        }
        var exp = {
            type: "range",
            ranges: ranges
        };
        return exp;
    }
}
function makeFlatExpression(tokens) {
    var flatExpression = [];
    var i = 0;
    if (tokens.length === 0) {
        var exp = {
            type: "number",
            value: 0
        };
        return [exp];
    }
    while (i < tokens.length) {
        var token = tokens[i];
        if (getBinaryTokenPrecedence(token.kind)) {
            flatExpression.push(token);
        }
        else if (token.kind === "numeric literal") {
            var exp = {
                type: "number",
                value: parseFloat(token.text.replace(",", "."))
            };
            flatExpression.push(exp);
        }
        else if (token.kind === "open brace token") {
            var braceCount = 1;
            var braceStartPos = i;
            while (braceCount > 0 && i < tokens.length) {
                i++;
                var movedToken = tokens[i];
                braceCount +=
                    movedToken.kind === "open brace token"
                        ? 1
                        : movedToken.kind === "close brace token"
                            ? -1
                            : 0;
            }
            if (braceCount !== 0) {
                throw new Error("Unable to find closing bracked at pos=" + token.start);
            }
            var braceEndPos = i;
            var exp = parseExpression(tokens.slice(braceStartPos + 1, braceEndPos));
            flatExpression.push(exp);
        }
        else if (token.kind === "open paren token") {
            var parenCount = 1;
            var parenStartPos = i;
            while (parenCount > 0 && i < tokens.length) {
                i++;
                var movedToken = tokens[i];
                parenCount +=
                    movedToken.kind === "close paren token" ? -1 : 0;
            }
            if (parenCount !== 0) {
                throw new Error("Unable to find closing paren bracked at pos=" + token.start);
            }
            var parenEndPos = i;
            var insideParens = tokens.slice(parenStartPos + 1, parenEndPos);
            if (insideParens.length === 0) {
                throw new Error("Empry parens at " + token.start);
            }
            var exp = parseParenExpression(insideParens);
            flatExpression.push(exp);
        }
        else {
            throw new Error("Unknown token " + token.text + " at " + token.start + " kind='" + token.kind + "'");
        }
        i++;
    }
    return flatExpression;
}
function parseExpression(tokensInput) {
    var flatExpression = makeFlatExpression(tokensInput);
    function parseFlatExpression(exps) {
        // Zero-length is never provided here
        if (exps.length === 1) {
            var exp = exps[0];
            if ("type" in exp) {
                return exp;
            }
            else {
                throw new Error("Unknown token '" + exp.text + "' at " + exp.start + " for flat exp");
            }
        }
        else if (exps.length === 2) {
            var exp1 = exps[0];
            var exp2 = exps[1];
            if ("kind" in exp1 &&
                exp1.kind === "minus token" &&
                "type" in exp2) {
                var rexp = {
                    type: "unary",
                    expression: exp2,
                    operator: "minus token"
                };
                return rexp;
            }
            else {
                throw new Error("Unknown state");
            }
        }
        else {
            // We have 3 items.
            var lowest = undefined;
            var i = 1;
            while (i + 1 < exps.length) {
                var left_1 = exps[i - 1];
                var middle = exps[i];
                var right_1 = exps[i + 1];
                // console.info(left, middle, right);
                if ("type" in left_1 && "type" in right_1 && "kind" in middle) {
                    var middleKind = middle.kind;
                    if (!isTokenBinary(middleKind)) {
                        throw new Error("Now a binary operator '" + middle.text + "' at " + middle.start);
                    }
                    var prio = getBinaryTokenPrecedence(middleKind);
                    if (!lowest || lowest.prio >= prio) {
                        lowest = {
                            idx: i,
                            prio: prio,
                            oper: middleKind
                        };
                    }
                }
                i++;
            }
            if (!lowest) {
                console.info(exps);
                throw new Error("Unable to find binary operator");
            }
            var left = exps.slice(0, lowest.idx);
            var right = exps.slice(lowest.idx + 1);
            var exp = {
                type: "binary",
                left: parseFlatExpression(left),
                right: parseFlatExpression(right),
                operator: lowest.oper
            };
            return exp;
        }
    }
    return parseFlatExpression(flatExpression);
}
exports.parseExpression = parseExpression;
