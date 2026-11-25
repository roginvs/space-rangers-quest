import * as React from "react";
import { renderQuestTextToken } from "../questReplaceTags";
import { formatTokens, splitTokensToParagraphs } from "../questReplaceTags.format";
import { splitStringToTokens } from "../questReplaceTags.split";
import { WaveLine, WordWave } from "../wordWave/wordWave";

const nbsp = "\u00A0";

/** Same as QuestReplaceTags, but changed paragraphs appear with a word wave animation */
export function QuestTextWave(props: { str: string; onLinkClick?: (jumps: string[]) => void }) {
  const { onLinkClick } = props;
  const paragraphs = splitTokensToParagraphs(formatTokens(splitStringToTokens(props.str)));

  const lines = paragraphs.map((paragraph): WaveLine => {
    const firstText = paragraph.find((token) => token.type === "text" && token.text.length > 0);
    const startsWithFix = !!firstText && !!firstText.isFix;
    const newline = paragraph[0] && paragraph[0].type === "newline" ? paragraph[0] : undefined;
    return {
      signature: JSON.stringify(paragraph),
      prefix: renderQuestTextToken(
        newline || { type: "text", text: "" },
        "prefix",
        undefined,
        startsWithFix ? null : nbsp,
      ),
      runs: paragraph.map((token) => ({
        text: token.type === "text" ? token.text : "",
        render: (text, key) => renderQuestTextToken(token, key, onLinkClick, text),
      })),
    };
  });

  return <WordWave lines={lines} />;
}
