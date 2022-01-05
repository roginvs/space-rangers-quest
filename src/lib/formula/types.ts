/**
 * Undefined is used here to force param range check
 * Also undefined might be used to indicate that the parameter is disabled
 */
export type ParamValues = ReadonlyArray<number | undefined>;

const MINUS_TOKEN = "minus token";
type SyntaxKindUnaryToken = typeof MINUS_TOKEN;
type SyntaxKindBinaryToken =
  | "less than token"
  | "greater than token"
  | "less than eq token"
  | "greater than eq token"
  | "plus token"
  | typeof MINUS_TOKEN
  | "slash token"
  | "asterisk token"
  | "equals token"
  | "not equals token";
type SyntaxKindBinaryKeyword =
  | "mod keyword"
  | "div keyword"
  | "to keyword"
  | "in keyword"
  | "and keyword"
  | "or keyword";
export type SyntaxKindBinary = SyntaxKindBinaryToken | SyntaxKindBinaryKeyword;
export type SyntaxKind =
  | "white space token"
  | "numeric literal"
  | "open brace token"
  | "close brace token"
  | "open paren token"
  | "close paren token"
  | "dotdot token"
  | "semicolon token"
  | SyntaxKindBinary
  | "identifier"
  | "end token";

export interface Token {
  kind: SyntaxKind;
  start: number;
  end: number;
  text: string;
}

export type ExpressionType = "number" | "range" | "parameter" | "binary" | "unary";

export type Expression =
  | NumberExpression
  | RangeExpression
  | ParameterExpression
  | BinaryExpression
  | UnaryExpression;
interface ExpressionCommon {
  type: ExpressionType;
}
export interface NumberExpression extends ExpressionCommon {
  type: "number";
  value: number;
}
export interface RangePart {
  from: Expression;
  to?: Expression;
}
export interface RangeExpression extends ExpressionCommon {
  type: "range";
  ranges: RangePart[];
}
export interface ParameterExpression extends ExpressionCommon {
  type: "parameter";
  parameterId: number;
}
export interface BinaryExpression extends ExpressionCommon {
  type: "binary";
  left: Expression;
  right: Expression;
  operator: SyntaxKindBinary;
}
export interface UnaryExpression extends ExpressionCommon {
  type: "unary";
  expression: Expression;
  operator: SyntaxKindUnaryToken;
}
