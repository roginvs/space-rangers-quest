import * as assert from "assert";
import { Params, Token, SyntaxKind } from "./formulaTypes";
import { Scanner } from "./formulaScanner";
import { parseExpression } from "./formulaParser";
import { calculateAst } from "./formulaCalculator";


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

