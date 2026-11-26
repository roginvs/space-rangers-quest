import * as React from "react";
import { QuestReplaceTags } from "../questReplaceTags";
import { formatTokens } from "../questReplaceTags.format";
import { paragraphSignature, splitTokensToParagraphs } from "../questReplaceTags.paragraphs";
import { splitStringToTokens } from "../questReplaceTags.split";
import { useWordWave, WordWaveMemory } from "../wordWave/wordWave";

/**
 * Same as QuestReplaceTags, but words of the changed paragraphs fade in with a wave.
 *
 * @param prevParagraphs Optional storage for paragraphs of the previous text,
 *   needed when this component is remounted on every text change
 */
export function QuestTextWave(props: {
  str: string;
  onLinkClick?: (jumps: string[]) => void;
  prevParagraphs?: WordWaveMemory;
}) {
  const paragraphs = splitTokensToParagraphs(formatTokens(splitStringToTokens(props.str)));
  const renderRun = useWordWave(
    paragraphs.map((paragraph) => ({
      signature: paragraphSignature(paragraph.tokens),
      runs: paragraph.tokens.map((token) => (token.type === "text" ? token.text : "")),
    })),
    props.prevParagraphs,
  );

  // QuestReplaceTags parses the same string with the same functions, so its token
  // indexes are the same as here: token `start + run` is run `run` of the paragraph
  const tokenParagraph: { line: number; run: number }[] = [];
  paragraphs.forEach((paragraph, line) =>
    paragraph.tokens.forEach((_, run) => {
      tokenParagraph[paragraph.start + run] = { line, run };
    }),
  );

  return (
    <QuestReplaceTags
      str={props.str}
      onLinkClick={props.onLinkClick}
      renderText={(text, index) => {
        const pos = tokenParagraph[index];
        return pos ? renderRun(pos.line, pos.run) : text;
      }}
    />
  );
}
