import { SyntaxKind, Token, SyntaxKindBinary } from "./types";

const keywordsToKind: {
  [keyword: string]: SyntaxKindBinary;
} = {
  mod: "mod keyword",
  div: "div keyword",
  to: "to keyword",
  in: "in keyword",
  and: "and keyword",
  or: "or keyword",
};

function addSanityCheckToScanFunc(originalString: string, originalScan: () => Token) {
  let constructedString = "";
  return () => {
    const token = originalScan();
    if (token.end - token.start <= 0 && token.kind !== "end token") {
      throw new Error(
        `Scanner fail: end=${token.end} start=${token.start} str='${originalString}'`,
      );
    }
    if (originalString.slice(token.start, token.end) !== token.text) {
      throw new Error(`Scanner fail: token slice differs`);
    }
    if (token.kind !== "end token") {
      constructedString += token.text;
    } else {
      if (constructedString !== originalString) {
        throw new Error(`Scanner fail: constructed string differs!`);
      }
    }
    return token;
  };
}

export function createScanner(str: string) {
  let pos = 0;
  const end = str.length;

  function isWhitespace(char: string) {
    return char === " " || char === "\n" || char === "\r" || char === "\t";
  }
  function scanWhitespace(): Token {
    const start = pos;
    while (pos < end && isWhitespace(str[pos])) {
      pos++;
    }
    const token: Token = {
      kind: "white space token",
      start,
      end: pos,
      text: str.slice(start, pos),
    };
    return token;
  }
  function isDigit(char: string) {
    return char.length === 1 && "0123456789".indexOf(char) > -1;
  }

  function oneCharTokenToKind(char: string): SyntaxKind | undefined {
    return char === "("
      ? "open brace token"
      : char === ")"
      ? "close brace token"
      : char === "["
      ? "open paren token"
      : char === "]"
      ? "close paren token"
      : char === "/"
      ? "slash token"
      : char === "*"
      ? "asterisk token"
      : char === "+"
      ? "plus token"
      : char === "-"
      ? "minus token"
      : char === "="
      ? "equals token"
      : char === ";"
      ? "semicolon token"
      : undefined;
  }
  function lookAhead(charCount: number = 1) {
    return pos + charCount < end ? str[pos + charCount] : undefined;
  }

  function scanIdentifierOrKeyword(): Token {
    const start = pos;

    let text = "";
    let keywordKind: SyntaxKind | undefined = undefined;
    while (
      pos < end &&
      "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM01234567890_".indexOf(str[pos]) > -1
    ) {
      pos++;
      text = str.slice(start, pos);
      keywordKind =
        text in keywordsToKind ? keywordsToKind[text as keyof typeof keywordsToKind] : undefined;
      if (keywordKind) {
        // Some quests have "[p1] mod1000" (without spaces)
        break;
      }
    }

    const kind: SyntaxKind = keywordKind !== undefined ? keywordKind : "identifier";
    if (start === pos) {
      throw new Error(`Unknown char ${str[pos]}`);
    }
    return {
      kind,
      start,
      end: pos,
      text,
    };
  }

  function scanNumber() {
    let dotSeen = false;
    const start = pos;

    let trailingSpacesStartsAtPos: number | undefined = undefined;
    while (pos < end) {
      let thisCharacterIsASpace = false;
      const char = str[pos];
      if (isDigit(char)) {
        // ok
      } else if (char === "." || char === ",") {
        if (dotSeen) {
          break;
        }
        const nextNextChar = lookAhead();
        if (nextNextChar !== "." && nextNextChar !== ",") {
          dotSeen = true;
        } else {
          break;
        }
        // } else if (char === "-" && pos === start) {
        // Ok here
      } else if (char === " ") {
        thisCharacterIsASpace = true;
      } else {
        break;
      }

      // Allow spaces inside digits but keep spaces as separate token if they are trailing spaces
      if (thisCharacterIsASpace) {
        if (trailingSpacesStartsAtPos === undefined) {
          // Ok, looks like a series of spaces have been begun
          trailingSpacesStartsAtPos = pos;
        } else {
          // Series of spaces is still continues
        }
      } else {
        // Character is not a space and belongs to digit chars set.
        // So, spaces are not a trailing spaces
        trailingSpacesStartsAtPos = undefined;
      }

      pos++;
    }

    if (trailingSpacesStartsAtPos !== undefined) {
      // health check
      if (!str.slice(trailingSpacesStartsAtPos, pos).match(/^\s*$/)) {
        throw new Error(
          `Unknown internal state: trailingSpacesStartsAtPos is set but tail is not spaces`,
        );
      }
      pos = trailingSpacesStartsAtPos;
    }

    const token: Token = {
      kind: "numeric literal",
      start,
      end: pos,
      text: str.slice(start, pos),
    };

    return token;
  }

  function scan(): Token {
    if (pos >= end) {
      return {
        kind: "end token",
        start: pos,
        end: pos,
        text: "",
      };
    }
    const char = str[pos];
    if (isWhitespace(char)) {
      return scanWhitespace();
    }

    const lookAheadChar = lookAhead();
    if (char === "." && lookAheadChar === ".") {
      const token: Token = {
        kind: "dotdot token",
        start: pos,
        end: pos + 2,
        text: char + lookAheadChar,
      };
      pos += 2;
      return token;
    }

    if (char === "<" && lookAheadChar === ">") {
      const token: Token = {
        kind: "not equals token",
        start: pos,
        end: pos + 2,
        text: char + lookAheadChar,
      };
      pos += 2;
      return token;
    }
    if (char === ">" && lookAheadChar === "=") {
      const token: Token = {
        kind: "greater than eq token",
        start: pos,
        end: pos + 2,
        text: char + lookAheadChar,
      };
      pos += 2;
      return token;
    }
    if (char === "<" && lookAheadChar === "=") {
      const token: Token = {
        kind: "less than eq token",
        start: pos,
        end: pos + 2,
        text: char + lookAheadChar,
      };
      pos += 2;
      return token;
    }

    if (char === ">" && lookAheadChar !== "=") {
      const token: Token = {
        kind: "greater than token",
        start: pos,
        end: pos + 1,
        text: char,
      };
      pos++;
      return token;
    }

    if (char === "<" && lookAheadChar !== "=") {
      const token: Token = {
        kind: "less than token",
        start: pos,
        end: pos + 1,
        text: char,
      };
      pos++;
      return token;
    }

    if (
      isDigit(char)
      // || (char === "-" && lookAheadChar && isDigit(lookAheadChar))
    ) {
      return scanNumber();
    }
    const oneCharKind = oneCharTokenToKind(char);
    if (oneCharKind !== undefined) {
      const token: Token = {
        kind: oneCharKind,
        start: pos,
        end: pos + 1,
        text: char,
      };
      pos++;
      return token;
    }

    return scanIdentifierOrKeyword();
  }

  return addSanityCheckToScanFunc(str, scan);
}
