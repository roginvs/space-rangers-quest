import * as tslint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    static MESSAGE_INC: string;
    static MESSAGE_DEC: string;
    apply(sourceFile: ts.SourceFile): tslint.RuleFailure[];
}
