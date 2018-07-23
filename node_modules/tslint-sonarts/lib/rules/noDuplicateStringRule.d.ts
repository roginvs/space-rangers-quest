import * as tslint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.AbstractRule {
    static metadata: SonarRuleMetaData;
    static readonly DEFAULT_THRESHOLD: number;
    static readonly MIN_LENGTH: number;
    private readonly threshold;
    static message(times: number): string;
    apply(sourceFile: ts.SourceFile): tslint.RuleFailure[];
}
