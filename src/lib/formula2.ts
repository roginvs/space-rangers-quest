import * as assert from 'assert';

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
    OrKeyword = "or",    
}

const keywordsToKind = {
    "mod": SyntaxKind.ModKeyword,
    "div": SyntaxKind.DivKeyword,
    "to": SyntaxKind.ToKeyword,
    "in": SyntaxKind.InKeyword,
    "and": SyntaxKind.AndKeyword,
    "or": SyntaxKind.OrKeyword,
}

interface Token {
    kind: SyntaxKind,
    start: number,
    end: number,
    text: string,
}

const enum ExpressionType {
    Number = 'number',
    Range = 'range',
    Parameter = 'parameter',
    Binary = 'binary',
    Unary = 'unary',
}

function Scanner(str: string) {
    let pos = 0;
    let end = str.length;

    type LastCharCheck = (char: string, text: string) => boolean;

    function isWhitespace(char: string) {
        return char === ' ' || char === '\n' || char === '\r' || char === '\t'
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
        }
    }
    function isDigit(char: string) {
        return char.length === 1 && '0123456789'.indexOf(char) > -1
    }

    function oneCharTokenToKind(char: string) {
        return char === '(' ? SyntaxKind.OpenBraceToken :
        char === ')' ? SyntaxKind.CloseBraceToken :
        char === '[' ? SyntaxKind.OpenParenToken :
        char === ']' ? SyntaxKind.CloseParenToken :
        char === '/' ? SyntaxKind.SlashToken :
        char === '*' ? SyntaxKind.AsteriskToken :
        char === '+' ? SyntaxKind.PlusToken :
        char === '-' ? SyntaxKind.MinusToken  :
        char === '=' ? SyntaxKind.EqualsToken :
        undefined
    } 
    function lookAhead(charCount: number = 1) {
        return pos + charCount < end ? str[pos + charCount] : undefined
    }

    function scanIdentifierOrKeyword(): Token | undefined {     
        const start = pos;
        
        while (pos < end && 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM01234567890_'.indexOf(str[pos]) > -1) {
            pos++;
        }
        const text = str.slice(start, pos);
        const kind = keywordsToKind[text as keyof typeof keywordsToKind] || SyntaxKind.Identifier;
        return {
            kind,
            start,
            end: pos,
            text,
        }        
    }

    function scanNumber() {
        let dotSeen = false;
        const start = pos;

        while (pos < end) {            
            const char = str[pos];
            if (isDigit(char)) {
                // ok
            } else if (char === '.') {
                if (dotSeen) {
                    break
                }
                const nextNextChar = lookAhead();
                if (nextNextChar !== '.') {
                    dotSeen = true;                    
                } else {                    
                    break
                }
            } else {
                break
            }

            pos++;
        }        
        const token = {
            kind: SyntaxKind.NumericLiteral,
            start,
            end: pos,
            text: str.slice(start, pos),
        }        
        return token
    }

    function scan(): Token | undefined {
        if (pos >= end) {
            return undefined
        }
        const char = str[pos];
        if (isWhitespace(char)) {
            return scanWhitespace()
        }

        const lookAheadChar = lookAhead();        
        if (char === '.' && lookAheadChar === '.') {
            const token = {
                kind: SyntaxKind.DotDotToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            }
            pos += 2;
            return token
        }

        if (char === '>' && lookAheadChar !== '=') {
            const token = {
                kind: SyntaxKind.GreaterThanToken,
                start: pos,
                end: pos + 1,
                text: char
            }
            pos++;
            return token;
        }

        if (char === '<' && lookAheadChar !== '=') {
            const token = {
                kind: SyntaxKind.LessThanToken,
                start: pos,
                end: pos + 1,
                text: char
            }
            pos++;
            return token;
        }
        if (char === '>' && lookAheadChar === '=') {
            const token = {
                kind: SyntaxKind.GreaterThanEqualsToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            }
            pos += 2;
            return token;
        }
        if (char === '<' && lookAheadChar === '=') {
            const token = {
                kind: SyntaxKind.LessThanEqualsToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            }
            pos += 2;
            return token;
        }

        if (char === '<' && lookAheadChar === '>') {
            const token = {
                kind: SyntaxKind.NotEqualsToken,
                start: pos,
                end: pos + 2,
                text: char + lookAheadChar
            }
            pos += 2;
            return token;
        }

        if (isDigit(char)) {
           return scanNumber();        
        }
        const oneCharKind = oneCharTokenToKind(char);
        if (oneCharKind !== undefined) {
            const token = {
                kind: oneCharKind as SyntaxKind, // why it not able to understand this
                start: pos,
                end: pos + 1,
                text: char
            }
            pos++;
            return token
        } 

        return scanIdentifierOrKeyword()
    }
    return scan;
}

function tokenStreamToAst(tokens: Token[]) {
    //
}

export function parse(str: string, params: Params = []) {
    const tokensAndWhitespace: Token[] = [];
    const scanner = Scanner(str);
    while (true) {
        const token = scanner();
        if (token) {
            tokensAndWhitespace.push(token);
   //         console.info(token);
        } else {
            break
        }
    }
    for (const sanityCheckToken of tokensAndWhitespace) {
        assert.strictEqual(sanityCheckToken.text, str.slice(sanityCheckToken.start, sanityCheckToken.end));
        assert.strictEqual(sanityCheckToken.text.length, sanityCheckToken.end - sanityCheckToken.start);
    }
//    console.info(str);
//    console.info(tokensAndWhitespace.map(x => x.text).join(''))
    assert.strictEqual(str, tokensAndWhitespace.map(x => x.text).join(''));
    const tokens = tokensAndWhitespace.filter(x => x.kind !== SyntaxKind.WhiteSpaceTrivia);
    // console.info(tokens);
}


parse('2 + (3 + 4 / 2) - [2..4] + (5 mod 2) - (10 div 3)  + ([p32] > [p23] - 2 >= 3 - 4 < 2 - 5 <= 2 + 2 = 3 - 4 <> 5) + 2*3 - 6/5 + [p12] in [2..6] + [2..3] to [1..3] + 2 to [1..5] + 2 and 4 + 4 or 27')
