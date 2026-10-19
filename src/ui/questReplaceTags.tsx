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
 *   - <link=Jump name;Another jump name> Click me </link>
 *     The whole chain of jumps is performed on a single click.
 *     The link does not add any visual formatting by itself,
 *     only the mouse cursor becomes a pointer.
 */
export function QuestReplaceTags(props: { str: string; onLinkClick?: (jumps: string[]) => void }) {
  const tags = formatTokens(splitStringToTokens(props.str));

  const nbsp = "\u00A0";

  return (
    <>
      <span className="game-text">{nbsp}</span>
      {tags.map((tag, index) => {
        const linkJumps = tag.type === "text" && props.onLinkClick ? tag.links : undefined;
        const isLink = linkJumps !== undefined;
        return (
          <span
            key={index}
            className={classNames("game-text", {
              "game-fix": tag.isFix,
              "game-clr": tag.type === "text" ? tag.isClr : undefined,
              "game-text-link": isLink,
            })}
            style={{
              color:
                tag.type === "text" && tag.color
                  ? `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})`
                  : undefined,
            }}
            // The link visually looks exactly like a normal text,
            // only the mouse cursor changes. Clicking starts the jump chain.
            onClick={
              isLink
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (props.onLinkClick && linkJumps) {
                      props.onLinkClick(linkJumps);
                    }
                  }
                : undefined
            }
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
        );
      })}
    </>
  );
}
