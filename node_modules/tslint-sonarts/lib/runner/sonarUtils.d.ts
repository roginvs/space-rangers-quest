/// <reference types="node" />
import * as ts from "typescript";
export declare function toSonarLine(line: number): number;
export declare function nodeToSonarLine(node: ts.Node): number;
export declare function stringifyToStream(stream: NodeJS.WritableStream, data: any[]): void;
