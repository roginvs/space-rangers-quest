import * as assert from "assert";
import { Params, Token, SyntaxKind } from "./types";
import { Scanner } from "./scanner";
import { parseExpression } from "./parser";
import { calculateAst } from "./calculator";
import { RandomFunc } from "../randomFunc";

export { MAX_NUMBER } from "./consts";

export function parse(str: string, params: Params = [], random: RandomFunc) {
  // console.info(`New parsing '${str}'`);
  const tokensAndWhitespace: Token[] = [];
  const strNoWhitespaces = str.replace(/\r|\n/g, "").replace(/ /g, ""); // Some quests have "10 000" as number
  const scanner = Scanner(strNoWhitespaces);
  while (true) {
    const token = scanner();
    if (token) {
      tokensAndWhitespace.push(token);
      if (token.kind !== "white space token") {
        // console.info(token);
      }
    } else {
      break;
    }
  }
  for (const sanityCheckToken of tokensAndWhitespace) {
    assert.strictEqual(
      sanityCheckToken.text,
      strNoWhitespaces.slice(sanityCheckToken.start, sanityCheckToken.end),
    );
    assert.strictEqual(sanityCheckToken.text.length, sanityCheckToken.end - sanityCheckToken.start);
  }

  assert.strictEqual(strNoWhitespaces, tokensAndWhitespace.map(x => x.text).join(""));
  const tokens = tokensAndWhitespace.filter(x => x.kind !== "white space token");

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

//console.info(parse('[p1] div1000000mod 10',[12346789]))
//console.info(parse('10 000'));
