import { SyntaxKind, Token } from "./formulaTypes";

const keywordsToKind = {
    mod: SyntaxKind.ModKeyword,
    div: SyntaxKind.DivKeyword,
    to: SyntaxKind.ToKeyword,
    in: SyntaxKind.InKeyword,
    and: SyntaxKind.AndKeyword,
    or: SyntaxKind.OrKeyword
};

export function Scanner(str: string) {
    let pos = 0;
    let end = str.length;
    
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

        let text = '';
        let keywordKind :SyntaxKind | undefined = undefined;
        while (
            pos < end &&
            "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM01234567890_".indexOf(
                str[pos]
            ) > -1
        ) {
            pos++;
            text = str.slice(start, pos);
            keywordKind = text in keywordsToKind ? keywordsToKind[text as keyof typeof keywordsToKind] : undefined;
            if (keywordKind) {
                // Some quests have "[p1] mod1000" (without spaces)
                break
            }
        }
        
        const kind =
            keywordKind !== undefined ? keywordKind :
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
