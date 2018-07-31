import * as tslint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
export declare class Rule extends tslint.Rules.TypedRule {
    static metadata: SonarRuleMetaData;
    private static readonly DEFAULT_MAX;
    static message(parametersNumber: number, max: number): string;
    private readonly max;
    applyWithProgram(sourceFile: ts.SourceFile): tslint.RuleFailure[];
}
