import * as ts from "typescript";
import { ControlFlowGraph } from "../cfg/cfg";
import { ProgramState } from "./programStates";
import { SymbolTable } from "../symbols/table";
export declare type ProgramNodes = Map<ts.Node, ProgramState[]>;
export interface ExecutionResult {
    programNodes: ProgramNodes;
    branchingProgramNodes: ProgramNodes;
    visits: number;
}
export declare function execute(cfg: ControlFlowGraph, symbols: SymbolTable, initialState: ProgramState, shouldTrackSymbol?: (symbol: ts.Symbol) => boolean): ExecutionResult | undefined;
