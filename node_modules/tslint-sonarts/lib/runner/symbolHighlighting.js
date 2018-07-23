"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sonarUtils_1 = require("./sonarUtils");
const builder_1 = require("../symbols/builder");
const table_1 = require("../symbols/table");
const navigation_1 = require("../utils/navigation");
function getSymbolHighlighting(sourceFile, program) {
    const symbols = [];
    const symbolTable = builder_1.SymbolTableBuilder.build(sourceFile, program);
    symbolTable.getSymbols().forEach(symbol => {
        const allUsages = symbolTable.allUsages(symbol);
        const declaration = allUsages.find(usage => Boolean(usage.flags & table_1.UsageFlag.DECLARATION));
        if (declaration) {
            const textRange = getTextRange(declaration.node);
            const references = allUsages.filter(usage => !(usage.flags & table_1.UsageFlag.DECLARATION));
            symbols.push(Object.assign({}, textRange, { references: references.map(r => getTextRange(r.node)) }));
        }
    });
    return { symbols };
}
exports.default = getSymbolHighlighting;
function getTextRange(node) {
    const startPosition = navigation_1.startLineAndCharacter(node);
    const endPosition = navigation_1.endLineAndCharacter(node);
    return {
        startLine: sonarUtils_1.toSonarLine(startPosition.line),
        startCol: startPosition.character,
        endLine: sonarUtils_1.toSonarLine(endPosition.line),
        endCol: endPosition.character,
    };
}
//# sourceMappingURL=symbolHighlighting.js.map