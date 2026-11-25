import classNames from "classnames";
import * as React from "react";
import { formatTokens, StringTokenStyle } from "./questReplaceTags.format";
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

  const nbsp = "\u00A0";

  // Preserve historical paragraph indents except when the first visible
  // text on a line is inside <fix>. Ignore empty text tokens from style tags.
  const lineStartsWithFix = (fromIndex: number) => {
    for (let i = fromIndex; i < tags.length; i++) {
      const token = tags[i];
      if (token.type === "newline") {
        return false;
      }
      if (token.type === "text" && token.text.length > 0) {
        return !!token.isFix;
      }
    }
    return false;
  };

  return (
    <>
      <span className="game-text">{lineStartsWithFix(0) ? null : nbsp}</span>
      {tags.map((tag, index) => {
        return renderQuestTextToken(
          tag,
          index,
          onLinkClick,
          tag.type === "text" ? (
            tag.text
          ) : (
            <>
              <br />
              {lineStartsWithFix(index + 1) ? null : nbsp}
            </>
          ),
        );
      })}
    </>
  );
}

/** Renders one formatted token as a styled span with the given content */
export function renderQuestTextToken(
  tag: StringTokenStyle,
  key: React.Key,
  onLinkClick: ((jumps: string[]) => void) | undefined,
  children: React.ReactNode,
) {
  const linkJumps = tag.type === "text" ? tag.links : undefined;
  const onActivate =
    linkJumps && onLinkClick
      ? (e: React.SyntheticEvent) => {
          e.preventDefault();
          e.stopPropagation();
          onLinkClick(linkJumps);
        }
      : undefined;
  return (
    <span
      key={key}
      className={classNames("game-text", {
        "game-fix": tag.isFix,
        "game-clr": tag.type === "text" ? tag.isClr : undefined,
        "game-text-link": !!onActivate,
      })}
      style={{
        color:
          tag.type === "text" && tag.color
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
      {children}
    </span>
  );
}
