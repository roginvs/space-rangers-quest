import * as React from "react";
import { QuestReplaceTags } from "../questReplaceTags";
import { formatTokens } from "../questReplaceTags.format";
import { splitStringToTokens } from "../questReplaceTags.split";
import { useWordWave, WordWaveMemory } from "../wordWave/wordWave";
import { splitTokensToParagraphs } from "./questPlay.text.paragraphs";

/**
 * Same as QuestReplaceTags, but words of the changed paragraphs fade in with a wave.
 * The markup is QuestReplaceTags markup, only the text of tokens is wrapped into word spans,
 * so every link is still a single element.
 *
 * @param memory Keeps paragraphs of the previous text, pass the same ref on every render
 */
export function QuestTextWave(props: {
  str: string;
  onLinkClick?: (jumps: string[]) => void;
  memory: WordWaveMemory;
}) {
  const paragraphs = splitTokensToParagraphs(formatTokens(splitStringToTokens(props.str)));
  const lines = useWordWave(
    paragraphs.map((paragraph) => ({
      signature: JSON.stringify(paragraph.tokens),
      runs: paragraph.tokens.map((token) => (token.type === "text" ? token.text : "")),
    })),
    props.memory,
  );

  const tokensContent: React.ReactNode[][] = [];
  paragraphs.forEach((paragraph, lineIndex) =>
    lines[lineIndex].forEach((content, run) => {
      tokensContent[paragraph.start + run] = content;
    }),
  );

  return (
    <QuestReplaceTags
      str={props.str}
      onLinkClick={props.onLinkClick}
      renderText={(text, index) => tokensContent[index] || text}
    />
  );
}
