import * as ts from "typescript";
import { ControlFlowGraph } from "./cfg";
export declare function build(statements: ts.Statement[]): ControlFlowGraph | undefined;
