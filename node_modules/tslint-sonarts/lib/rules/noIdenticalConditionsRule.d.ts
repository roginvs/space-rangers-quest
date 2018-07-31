import * as tslint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    static formatMessage(expression: string, line: number): string;
    apply(sourceFile: ts.SourceFile): tslint.RuleFailure[];
}
