import * as ts from "typescript";
export default function getSymbolHighlighting(sourceFile: ts.SourceFile, program: ts.Program): {
    symbols: SymbolHighlighting[];
};
export interface TextRange {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
}
export interface SymbolHighlighting extends TextRange {
    references: TextRange[];
}
