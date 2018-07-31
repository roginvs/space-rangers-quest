import * as tslint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    private readonly threshold;
    apply(sourceFile: ts.SourceFile): tslint.RuleFailure[];
    static DEFAULT_THRESHOLD: number;
}
