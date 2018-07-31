import * as ts from "typescript";
import * as tslint from "tslint";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    apply(sourceFile: ts.SourceFile): tslint.RuleFailure[];
}
