import * as ts from "typescript";
export declare function createService(rootFileNames: string[], options: ts.CompilerOptions, cache: FileCache): ts.LanguageService;
export declare class FileCache {
    private files;
    newContent(update: {
        file: string;
        content: string;
    }): void;
    version(file: string): string;
    retrieveContent(file: string): string | undefined;
}
