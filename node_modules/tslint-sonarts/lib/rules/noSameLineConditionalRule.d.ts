import * as Lint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends Lint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
