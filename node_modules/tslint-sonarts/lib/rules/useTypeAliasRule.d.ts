import * as tslint from "tslint";
import * as ts from "typescript";
import { RuleFailure } from "tslint";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.TypedRule {
    static metadata: SonarRuleMetaData;
    static NUMBER_OF_TYPES_THRESHOLD: number;
    static REPEATED_USAGE_THRESHOLD: number;
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
