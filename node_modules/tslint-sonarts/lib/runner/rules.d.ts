import * as ts from "typescript";
import * as tslint from "tslint";
export declare function getIssues(ruleConfigs: tslint.IOptions[], program: ts.Program, sourceFile: ts.SourceFile): {
    issues: any[];
};
export declare function executeRule(rule: tslint.IRule, sourceFile: ts.SourceFile, program: ts.Program): tslint.RuleFailure[];
