"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigation_1 = require("../utils/navigation");
const sonarUtils_1 = require("./sonarUtils");
function getCpdTokens(sourceFile) {
    const cpdTokens = [];
    const tokens = navigation_1.toTokens(sourceFile);
    tokens.forEach(token => {
        let text = token.getText();
        if (text.length === 0) {
            // for EndOfFileToken and JsxText tokens containing only whitespaces
            return;
        }
        if (text.startsWith('"') || text.startsWith("'") || text.startsWith("`")) {
            text = "LITERAL";
        }
        const startPosition = navigation_1.startLineAndCharacter(token);
        const endPosition = navigation_1.endLineAndCharacter(token);
        cpdTokens.push({
            startLine: sonarUtils_1.toSonarLine(startPosition.line),
            startCol: startPosition.character,
            endLine: sonarUtils_1.toSonarLine(endPosition.line),
            endCol: endPosition.character,
            image: text,
        });
    });
    return { cpdTokens };
}
exports.default = getCpdTokens;
//# sourceMappingURL=cpd.js.map