import * as ts from "typescript";
/**
 *
 * @param first
 * @param second
 * @param ignoreLiterals when true, two nodes are considered equivalent even if string or numeric literals have different value
 */
export default function areEquivalent(first: ts.Node | ts.Node[], second: ts.Node | ts.Node[], ignoreLiterals?: boolean): boolean;
