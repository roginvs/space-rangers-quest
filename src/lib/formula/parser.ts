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

const MAX_PRECEDENCE = 8;

/**
 * If candidate is binary token on presedence, then return corresponding binary operator
 */
function isTokenBinaryOperator(
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

interface TokenReader {
  current(): Token;
  readNext(): void;
}

function createReaderClassSkipWhitespaces(reader: () => Token): TokenReader {
  let currentToken: Token;

  const readNext = () => {
    currentToken = reader();
    while (currentToken.kind === "white space token") {
      currentToken = reader();
    }
  };

  readNext();

  return {
    current() {
      return currentToken;
    },
    readNext,
  };
}

export function parseExpression(readerFunc: () => Token) {
  const reader = createReaderClassSkipWhitespaces(readerFunc);

  /**
   * Expects current = open paren token
   * Returns when position is after "close paren token"
   */
  function readParenExpression(): Expression {
    reader.readNext();

    if (reader.current().kind === "identifier") {
      const paramRegexpMatch = reader.current().text.match(/^p(\d+)$/);
      if (!paramRegexpMatch) {
        throw new Error(
          `Unknown parameter '${reader.current().text}' at ${reader.current().start}`,
        );
      }
      const pNumber = paramRegexpMatch[1];

      const pId = parseInt(pNumber) - 1;

      const exp: ParameterExpression = {
        type: "parameter",
        parameterId: pId,
      };
      reader.readNext();

      if (reader.current().kind !== "close paren token") {
        throw new Error(
          `Expected ], but got '${reader.current().text}' at ${reader.current().start}`,
        );
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
        } else if (
          reader.current().kind === "close paren token" ||
          reader.current().kind === "semicolon token"
        ) {
          ranges.push({
            from,
          });
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
      if (reader.current().kind === "end token") {
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
    if (currentPriority === 0) {
      const prim = readPrim();
      return prim;
    }

    let left = readExpr(currentPriority - 1);

    while (true) {
      const possibleBinaryTokenKind = reader.current().kind;
      if (possibleBinaryTokenKind === "end token") {
        return left;
      }
      const possibleBinaryToken = isTokenBinaryOperator(currentPriority, possibleBinaryTokenKind);

      if (!possibleBinaryToken) {
        return left;
      }

      reader.readNext();

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

  if (reader.current().kind !== "end token") {
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
