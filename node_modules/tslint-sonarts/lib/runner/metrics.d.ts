import * as ts from "typescript";
export default function getMetrics(sourceFile: ts.SourceFile): Metrics;
export interface Metrics {
    ncloc: number[];
    commentLines: number[];
    nosonarLines: number[];
    executableLines: number[];
    functions: number;
    statements: number;
    classes: number;
    complexity: number;
    cognitiveComplexity: number;
}
export declare function findLinesOfCode(sourceFile: ts.SourceFile): number[];
export declare function findCommentLines(sourceFile: ts.SourceFile): {
    commentLines: number[];
    nosonarLines: number[];
};
export declare function findExecutableLines(sourceFile: ts.SourceFile): number[];
export declare function countClasses(sourceFile: ts.SourceFile): number;
export declare function countFunctions(sourceFile: ts.SourceFile): number;
export declare function countStatements(sourceFile: ts.SourceFile): number;
