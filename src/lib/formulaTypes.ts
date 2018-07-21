export const MAX_NUMBER = 2000000000;
export type Params = number[];

export const enum SyntaxKind {
    WhiteSpaceTrivia = "white space",
    NumericLiteral = "numeric",
    OpenBraceToken = "open brace",
    CloseBraceToken = "close brace",
    OpenParenToken = "open paren",
    CloseParenToken = "close paren",
    DotDotToken = "dotdot",
    SemicolonToken = "semicolon",
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
    OrKeyword = "or"
}


export interface Token {
    kind: SyntaxKind;
    start: number;
    end: number;
    text: string;
}







export const enum ExpressionType {
    Number = "number",
    Range = "range",
    Parameter = "parameter",
    Binary = "binary",
    Unary = "unary"
}
export type Expression =
    | NumberExpression
    | RangeExpression
    | ParameterExpression
    | BinaryExpression
    | UnaryExpression;
export interface NumberExpression {
    type: ExpressionType.Number;
    value: number;
}
export interface RangePart {
    from: Expression;
    to?: Expression;
}
export interface RangeExpression {
    type: ExpressionType.Range;
    ranges: RangePart[];
}
export interface ParameterExpression {
    type: ExpressionType.Parameter;
    parameterId: number;
}
export interface BinaryExpression {
    type: ExpressionType.Binary;
    left: Expression;
    right: Expression;
    operator: SyntaxKind;
}
export interface UnaryExpression {
    type: ExpressionType.Unary;
    expression: Expression;
    operator: SyntaxKind;
}
