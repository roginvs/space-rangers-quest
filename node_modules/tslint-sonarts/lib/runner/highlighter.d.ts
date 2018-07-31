import * as ts from "typescript";
export default function getHighlighting(sourceFile: ts.SourceFile): {
    highlights: HighlightedToken[];
};
export declare type SonarTypeOfText = "constant" | "comment" | "structured_comment" | "keyword" | "string";
export interface HighlightedToken {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
    textType: SonarTypeOfText;
}
