import { Scanner } from "./scanner";
import {
  Token,
  Expression,
  NumberExpression,
  SyntaxKind,
  ParameterExpression,
  RangePart,
  RangeExpression,
  SyntaxKindBinary,
} from "./types";
import { assertNever } from "./calculator";

type TokenOrEnd =
  | Token
  | {
      kind: "end";
      start: number;
      end: number;
      text: string;
    };
interface TokenReader {
  current(): TokenOrEnd;
  readNext(): void;
}

const MAX_PRECEDENCE = 8;

/**
 * If candidate is binary token on presedence, then return corresponding binary token
 */
function getBinaryTokenByPrecedence(
  presedence: number,
  candidate: SyntaxKind,
): SyntaxKindBinary | undefined {
  switch (presedence) {
    // TODO: Why or/and have different prio?
    case 8:
      return candidate === "or keyword" ? "or keyword" : undefined;
    case 7:
      return candidate === "and keyword" ? "and keyword" : undefined;
    case 6:
      return candidate === "greater than eq token"
        ? "greater than eq token"
        : candidate === "less than eq token"
        ? "less than eq token"
        : candidate === "greater than token"
        ? "greater than token"
        : candidate === "less than token"
        ? "less than token"
        : candidate === "equals token"
        ? "equals token"
        : candidate === "not equals token"
        ? "not equals token"
        : candidate === "in keyword"
        ? "in keyword"
        : undefined;

    case 5:
      return undefined /* here was "in keyword */;
    case 4:
      return candidate === "to keyword" ? "to keyword" : undefined;
    case 3:
      return candidate === "plus token"
        ? "plus token"
        : candidate === "minus token"
        ? "minus token"
        : undefined;

    case 2:
      return candidate === "asterisk token"
        ? "asterisk token"
        : candidate === "slash token"
        ? "slash token"
        : undefined;

    case 1:
      return candidate === "div keyword"
        ? "div keyword"
        : candidate === "mod keyword"
        ? "mod keyword"
        : undefined;

    default:
      throw new Error(`Unknown presedence ${presedence}`);
  }
}

function createReaderClass(reader: () => Token | undefined): TokenReader {
  let currentToken: Token | undefined = reader();
  let lastToken: Token | undefined;
  const readNextToken = () => {
    lastToken = currentToken;
    currentToken = reader();
  };
  return {
    current() {
      return (
        currentToken ||
        (lastToken
          ? {
              kind: "end",
              start: lastToken.end + 1,
              end: lastToken.end + 1,
              text: "",
            }
          : {
              kind: "end",
              start: 0,
              end: 0,
              text: "",
            })
      );
    },
    readNext() {
      readNextToken();
      while (currentToken && currentToken.kind === "white space token") {
        readNextToken();
      }
      //console.info(`readNext kind=${currentToken?.kind} pos=${currentToken?.start}`)
    },
  };
}

function createReaderFromArray(tokensInput: Token[]) {
  let i = 0;
  return createReaderClass(() => {
    const t = tokensInput[i];
    i++;
    return t;
  });
}
export function parseExpression(tokensInput: Token[]): Expression {
  //const reader = createReaderClass(readerBase);
  const reader = createReaderFromArray(tokensInput);

  return parseExpression2(reader);
}

function parseExpressionReader(readerFunc: () => Token | undefined) {
  const reader = createReaderClass(readerFunc);
  return parseExpression2(reader);
}

function parseExpression2(reader: TokenReader) {
  /**
   * Expects current = open paren token
   * Returns when position is after "clsoe paren token"
   */
  function readParenExpression(): Expression {
    reader.readNext();

    const start = reader.current();

    if (start.kind === "identifier") {
      const paramRegexpMatch = start.text.match(/^p(\d+)$/);
      if (!paramRegexpMatch) {
        throw new Error(`Unknown parameter '${start.text}' at ${start.start}`);
      }
      const pNumber = paramRegexpMatch[1];

      const pId = parseInt(pNumber) - 1;

      const exp: ParameterExpression = {
        type: "parameter",
        parameterId: pId,
      };
      reader.readNext();

      if (reader.current().kind !== "close paren token") {
        throw new Error(`Expected ], but got '${start.text}' at ${start.start}`);
      }
      reader.readNext();

      return exp;
    } else {
      const ranges: RangePart[] = [];

      while (true) {
        if (reader.current().kind === "semicolon token") {
          reader.readNext();
          continue;
        }

        if (reader.current().kind === "close paren token") {
          reader.readNext();
          break;
        }

        const from = readExpr();
        if (reader.current().kind === "dotdot token") {
          reader.readNext();
          const to = readExpr();

          ranges.push({
            from,
            to,
          });
        } else if (reader.current().kind === "close paren token") {
          ranges.push({
            from,
          });
          reader.readNext();
          break;
        } else if (reader.current().kind === "semicolon token") {
          ranges.push({
            from,
          });
          reader.readNext();
        } else {
          throw new Error(
            `Unexpected token inside paren '${reader.current().text}' pos=${
              reader.current().start
            } `,
          );
        }
      }

      const expr: RangeExpression = {
        type: "range",
        ranges,
      };

      return expr;

      /*
      while (true) {
        // @TODO Refactor this, what if we have [;;;] or [;2;3..4;;] ?

        const from = readExpr();
        if (reader.current().kind === "dotdot token") {
          reader.readNext();
          const to = readExpr();

          ranges.push({
            from: from,
            to: to,
          });
          if (reader.current().kind === "close paren token") {
            const expr: RangeExpression = {
              type: "range",
              ranges,
            };
            reader.readNext();
            return expr;
          } else if (reader.current().kind === "dotdot token") {
            throw new Error(
              `Unexpected .. after range '${reader.current().text}' pos=${reader.current().start} `,
            );
          }
        } else if (reader.current().kind === "semicolon token") {
          reader.readNext();
          ranges.push({
            from: from,
          });
        } else if (reader.current().kind === "close paren token") {
          ranges.push({
            from: from,
          });
          reader.readNext();
          const expr: RangeExpression = {
            type: "range",
            ranges,
          };
          return expr;
        } else {
          throw new Error(
            `Unexpected token inside paren '${reader.current().text}' pos=${
              reader.current().start
            } `,
          );
        }
       
        }
         */
    }
  }

  function readPrim(): Expression {
    const primStartToken = reader.current();

    if (primStartToken.kind === "numeric literal") {
      const expr: Expression = {
        type: "number",
        value: parseFloat(primStartToken.text.replace(",", ".").replace(/ /g, "")),
      };
      reader.readNext();
      return expr;
    } else if (primStartToken.kind === "open paren token") {
      const expr = readParenExpression();
      return expr;
    } else if (primStartToken.kind === "open brace token") {
      reader.readNext();
      const expr = readExpr();
      if (reader.current().kind !== "close brace token") {
        throw new Error(
          `Expected close brace token but got ${reader.current().text} at ${
            reader.current().start
          }`,
        );
      }
      reader.readNext();
      return expr;
    } else if (primStartToken.kind === "minus token") {
      reader.readNext();
      const innerExpr = readPrim();
      const expr: Expression = {
        type: "unary",
        expression: innerExpr,
        operator: "minus token",
      };
      return expr;
    } else {
      if (reader.current().kind === "end") {
        throw new Error(`Expected value at ${reader.current().start}`);
      } else {
        throw new Error(
          `Expecting primary value at ${reader.current().start} but got '${
            reader.current().text
          }' kind=${reader.current().kind}`,
        );
      }
    }
  }

  function readExpr(currentPriority = MAX_PRECEDENCE): Expression {
    /*
    console.info(
      `readExpr current=${reader.current().text} prio=${currentPriority} pos=${
        reader.current().start
      }`,
    );
    */

    if (currentPriority === 0) {
      const prim = readPrim();
      return prim;
    }

    let left = readExpr(currentPriority - 1);

    while (true) {
      /*
      console.info(
        `cur=${reader.current().kind} start${reader.current().start} '${
          reader.current().text
        }' prio=${currentPriority}`,
      );
      */

      const possibleBinaryTokenKind = reader.current().kind;
      if (possibleBinaryTokenKind === "end") {
        return left;
      }
      const possibleBinaryToken = getBinaryTokenByPrecedence(
        currentPriority,
        possibleBinaryTokenKind,
      );

      if (!possibleBinaryToken) {
        return left;
      }

      reader.readNext();
      /*
      console.info(
        `   cur=${reader.current().kind} start${reader.current().start} '${
          reader.current().text
        }' prio=${currentPriority}`,
      );
*/

      const right = readExpr(currentPriority - 1);

      const newLeft: Expression = {
        type: "binary",
        operator: possibleBinaryToken,
        left,
        right,
      };
      left = newLeft;
    }
  }

  const expr = readExpr();

  if (reader.current().kind !== "end") {
    throw new Error(
      `Unexpected data at ${reader.current().start}: '${reader.current().text}' kind=${
        reader.current().kind
      }`,
    );
  }

  return expr;
}

// const scanner = Scanner("1 + 2*5*(5-4)");
//const scanner = Scanner("1 + 2*5");
//const scanner = Scanner("2+(2 *2 +3   )+4");
/*
const scanner = Scanner("3 + [ -10 ..  -12; -3]");

const exp = parseExpressionReader(scanner);
console.info(exp);
*/
