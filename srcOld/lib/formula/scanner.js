"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var keywordsToKind = {
    mod: "mod keyword",
    div: "div keyword",
    to: "to keyword",
    in: "in keyword",
    and: "and keyword",
    or: "or keyword",
};
function Scanner(str) {
    var pos = 0;
    var end = str.length;
    function isWhitespace(char) {
        return char === " " || char === "\n" || char === "\r" || char === "\t";
    }
    function scanWhitespace() {
        var start = pos;
        while (pos < end && isWhitespace(str[pos])) {
            pos++;
        }
        var token = {
            kind: "white space token",
            start: start,
            end: pos,
            text: str.slice(start, pos)
        };
        return token;
    }
    function isDigit(char) {
        return char.length === 1 && "0123456789".indexOf(char) > -1;
    }
    function oneCharTokenToKind(char) {
        return char === "("
            ? "open brace token"
            : char === ")"
                ? "close brace token"
                : char === "["
                    ? "open paren token"
                    : char === "]"
                        ? "close paren token"
                        : char === "/"
                            ? "slash token"
                            : char === "*"
                                ? "asterisk token"
                                : char === "+"
                                    ? "plus token"
                                    : char === "-"
                                        ? "minus token"
                                        : char === "="
                                            ? "equals token"
                                            : char === ";"
                                                ? "semicolon token"
                                                : undefined;
    }
    function lookAhead(charCount) {
        if (charCount === void 0) { charCount = 1; }
        return pos + charCount < end ? str[pos + charCount] : undefined;
    }
    function scanIdentifierOrKeyword() {
        var start = pos;
        var text = '';
        var keywordKind = undefined;
        while (pos < end &&
            "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM01234567890_".indexOf(str[pos]) > -1) {
            pos++;
            text = str.slice(start, pos);
            keywordKind = text in keywordsToKind ? keywordsToKind[text] : undefined;
            if (keywordKind) {
                // Some quests have "[p1] mod1000" (without spaces)
                break;
            }
        }
        var kind = keywordKind !== undefined ? keywordKind :
            "identifier";
        return {
            kind: kind,
            start: start,
            end: pos,
            text: text
        };
    }
    function scanNumber() {
        var dotSeen = false;
        var start = pos;
        while (pos < end) {
            var char = str[pos];
            if (isDigit(char)) {
                // ok
            }
            else if (char === "." || char === ",") {
                if (dotSeen) {
                    break;
                }
                var nextNextChar = lookAhead();
                if (nextNextChar !== "." && nextNextChar !== ",") {
                    dotSeen = true;
                }
                else {
                    break;
                }
                // } else if (char === "-" && pos === start) {
                // Ok here
            }
            else {
                break;
            }
            pos++;
        }
        var token = {
            kind: "numeric literal",
            start: start,
            end: pos,
            text: str.slice(start, pos)
        };
        return token;
    }
    function scan() {
        if (pos >= end) {
            return undefined;
        }
        var char = str[pos];
        if (isWhitespace(char)) {
            return scanWhitespace();
        }
        var lookAheadChar = lookAhead();
        if (char === "." && lookAheadChar === ".") {
            var token = {
                kind: "dotdot token",
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }
        if (char === "<" && lookAheadChar === ">") {
            var token = {
                kind: "not equals token",
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }
        if (char === ">" && lookAheadChar === "=") {
            var token = {
                kind: "greater than eq token",
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }
        if (char === "<" && lookAheadChar === "=") {
            var token = {
                kind: "less than eq token",
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            };
            pos += 2;
            return token;
        }
        if (char === ">" && lookAheadChar !== "=") {
            var token = {
                kind: "greater than token",
                start: pos,
                end: pos + 1,
                text: char
            };
            pos++;
            return token;
        }
        if (char === "<" && lookAheadChar !== "=") {
            var token = {
                kind: "less than token",
                start: pos,
                end: pos + 1,
                text: char
            };
            pos++;
            return token;
        }
        if (isDigit(char)
        // || (char === "-" && lookAheadChar && isDigit(lookAheadChar))
        ) {
            return scanNumber();
        }
        var oneCharKind = oneCharTokenToKind(char);
        if (oneCharKind !== undefined) {
            var token = {
                kind: oneCharKind,
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
exports.Scanner = Scanner;
