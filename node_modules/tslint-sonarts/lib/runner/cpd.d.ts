import * as ts from "typescript";
export default function getCpdTokens(sourceFile: ts.SourceFile): {
    cpdTokens: CpdToken[];
};
export interface CpdToken {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
    image: string;
}
