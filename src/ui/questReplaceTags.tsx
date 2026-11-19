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
  const onLinkClick = props.onLinkClick;

  // Preserve the historical paragraph indent only for ordinary text.
  // A <fix> line must contain exactly the spaces provided by the quest.
  const nbsp = "\u00A0";
  let startsLine = true;

  return (
    <>
      {tags.map((tag, index) => {
        if (tag.type === "newline") {
          startsLine = true;
          return <br key={index} />;
        }

        const indent = startsLine && tag.text.length > 0 && !tag.isFix;
        if (tag.text.length > 0) {
          startsLine = false;
        }

        const linkJumps = tag.links;
        const onActivate =
          linkJumps && onLinkClick
            ? (e: React.SyntheticEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onLinkClick(linkJumps);
              }
            : undefined;
        return (
          <React.Fragment key={index}>
            {indent ? <span className="game-text">{nbsp}</span> : null}
            <span
              className={classNames("game-text", {
                "game-fix": tag.isFix,
                "game-clr": tag.isClr,
                "game-text-link": !!onActivate,
              })}
              style={{
                color: tag.color
                  ? `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})`
                  : undefined,
              }}
              role={onActivate ? "link" : undefined}
              tabIndex={onActivate ? 0 : undefined}
              onClick={onActivate}
              onKeyDown={
                onActivate
                  ? (e) => {
                      if (e.key === "Enter") {
                        onActivate(e);
                      }
                    }
                  : undefined
              }
            >
              {tag.text}
            </span>
          </React.Fragment>
        );
      })}
    </>
  );
}
