import * as assert from "assert";
import { ParamValues, Token, SyntaxKind } from "./types";
import { createScanner } from "./scanner";
import { parseExpression } from "./parser";
import { calculateAst } from "./calculator";
import { RandomFunc } from "../randomFunc";

export { MAX_NUMBER } from "./consts";

export function parse(str: string) {
  const strNoLineBreaks = str.replace(/\r|\n/g, " ");
  const scanner = createScanner(strNoLineBreaks);
  const ast = parseExpression(scanner);
  // console.info(JSON.stringify(ast, null, 4));
  return ast;
}
export function calculate(str: string, params: ParamValues = [], random: RandomFunc) {
  const ast = parse(str);
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
