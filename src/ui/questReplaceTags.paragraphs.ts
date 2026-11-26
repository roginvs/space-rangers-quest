import { StringTokens, StringTokenStyle } from "./questReplaceTags.format";

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

/** Length-prefixed, so any text can be inside */
const str = (value: string) => `${value.length}:${value}`;

function tokenSignature(token: StringTokenStyle) {
  if (token.type === "newline") {
    return `n${token.isFix ? "f" : ""}`;
  }
  const color = token.color ? `${token.color.r},${token.color.g},${token.color.b}` : "";
  const links = token.links ? `${token.links.length}:${token.links.map(str).join("")}` : "-";
  return `t${token.isClr ? "c" : ""}${token.isFix ? "f" : ""}/${color}/${links}/${str(token.text)}`;
}

/**
 * Two paragraphs with the same signature look and behave the same.
 * It covers styles and links, not only the text: for example a quest can
 * highlight a part of a line with <clr> without changing any character.
 */
export function paragraphSignature(tokens: StringTokens) {
  return tokens.map(tokenSignature).join(" ");
}
