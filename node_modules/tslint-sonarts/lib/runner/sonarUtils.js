"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// SonarQube's line indexing starts from 1, while TypeScript is 0 based.
function toSonarLine(line) {
    return line + 1;
}
exports.toSonarLine = toSonarLine;
function nodeToSonarLine(node) {
    return toSonarLine(node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line);
}
exports.nodeToSonarLine = nodeToSonarLine;
function stringifyToStream(stream, data) {
    stream.write("[");
    data.forEach((element, index) => {
        stream.write("{");
        let firstProp = true;
        Object.keys(element).forEach(key => {
            const value = element[key];
            if (value !== undefined) {
                if (!firstProp) {
                    stream.write(",");
                }
                stream.write(`"${key}":${JSON.stringify(value)}`);
                firstProp = false;
            }
        });
        stream.write("}");
        if (index + 1 !== data.length) {
            stream.write(",");
        }
    });
    stream.write("]");
}
exports.stringifyToStream = stringifyToStream;
//# sourceMappingURL=sonarUtils.js.map