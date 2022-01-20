import classNames from "classnames";
import * as React from "react";
import { formatTokens } from "./questReplaceTags.format";
import { splitStringToTokens } from "./questReplaceTags.split";

/**
 * Renders text, understand tags:
 *   - <clr> highlight me <clrEnd>
 *   - <clr> highlight me too </clr>
 *   - <fix> use monospace font </fix>
 *   - <format=left,30>  add spaced in the left (or right or center) </format>
 *   - <color=R,G,B> Use color </color>
 */
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
            "game-clr": tag.type === "text" ? tag.isClr : undefined,
          })}
          style={{
            color:
              tag.type === "text" && tag.color
                ? `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})`
                : undefined,
          }}
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
