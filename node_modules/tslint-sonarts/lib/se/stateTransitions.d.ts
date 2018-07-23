import * as ts from "typescript";
import { ProgramState } from "./programStates";
import { SymbolTable } from "../symbols/table";
export declare function applyExecutors(programPoint: ts.Node, state: ProgramState, symbols: SymbolTable, shouldTrackSymbol?: (symbol: ts.Symbol) => boolean): ProgramState;
