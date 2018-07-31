import * as tslint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    private static readonly DEFAULT_MAX;
    private readonly max;
    static message(functionSize: number, max: number): string;
    apply(sourceFile: ts.SourceFile): tslint.RuleFailure[];
}
