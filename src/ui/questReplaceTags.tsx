import classNames from "classnames";
import * as React from "react";
import { formatTokens } from "./questReplaceTags.format";
import { splitStringToTokens } from "./questReplaceTags.split";

export function QuestReplaceTags(props: { str: string }) {
  const tags = formatTokens(splitStringToTokens(props.str));

  const nbsp = "\u00A0";

  return (
    <>
      <span className="game-text">{nbsp}</span>
      {tags.map((tag, index) => (
        <span
          key={index}
          className={classNames("game-text", {
            "game-fix": tag.isFix,
            "text-success": tag.type === "text" ? tag.isClr : undefined,
          })}
          // TODO color
        >
          {tag.type === "text" ? (
            tag.text
          ) : (
            <>
              <br />
              {nbsp}
            </>
          )}
        </span>
      ))}
    </>
  );
}
