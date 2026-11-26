import { StringTokens } from "./questReplaceTags.format";

export interface TokensParagraph {
  /** Index of the first token of this paragraph in the formatted tokens */
  start: number;
  tokens: StringTokens;
}

/**
 * Splits formatted tokens into paragraphs by newline tokens. Every paragraph except
 * the first one starts with its newline token. Because styles are already resolved,
 * tags which span several lines keep their style on every paragraph.
 */
export function splitTokensToParagraphs(tokens: StringTokens): TokensParagraph[] {
  const paragraphs: TokensParagraph[] = [{ start: 0, tokens: [] }];
  tokens.forEach((token, index) => {
    if (token.type === "newline") {
      paragraphs.push({ start: index, tokens: [token] });
    } else {
      paragraphs[paragraphs.length - 1].tokens.push(token);
    }
  });
  return paragraphs;
}

/**
 * A paragraph counts as changed only when its characters change. Tags are not compared:
 * for example a quest highlights a part of a line with <clr> without changing any character.
 */
export function paragraphSignature(tokens: StringTokens) {
  return tokens.map((token) => (token.type === "text" ? token.text : "")).join("");
}
