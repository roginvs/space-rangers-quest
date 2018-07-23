import * as ts from "typescript";
import { TreeVisitor } from "../utils/visitor";
export declare function getOverallCognitiveComplexity(node: ts.SourceFile): number;
export declare class FunctionCollector extends TreeVisitor {
    functionComplexities: {
        functionNode: ts.FunctionLikeDeclaration;
        complexity: number;
        nodes: ComplexityNode[];
    }[];
    visitNode(node: ts.Node): void;
}
export declare type ComplexityNode = {
    node: ts.Node;
    complexity: number;
};
