import { assertNever } from "../assertNever";
import { StringTokenColor, StringTokenFormat, StringTokenTags } from "./questReplaceTags.split";

export type StringTokenStyle =
  | {
      type: "text";
      text: string;
      isClr?: boolean;
      isFix?: boolean;
      color?: StringTokenColor;
      /**
       * When this text is inside a `<link=...>...</link>`, the list of jump
       * names to perform on click. Presence does not change the visual.
       */
      links?: string[];
    }
  | { type: "newline"; isFix?: boolean };

export type StringTokens = StringTokenStyle[];

export function formatTokens(rawParsed: StringTokenTags[]): StringTokens {
  // Drop dangling linkStart tokens (never closed with </link>):
  // they are ignored, and the text after them renders as a normal text
  const parsed = (() => {
    const openStack: number[] = [];
    const closedIndexes = new Set<number>();
    for (let i = 0; i < rawParsed.length; i++) {
      const token = rawParsed[i];
      if (token.type === "linkStart") {
        openStack.push(i);
      } else if (token.type === "linkEnd") {
        const started = openStack.pop();
        if (started !== undefined) {
          closedIndexes.add(started);
        }
      }
    }
    if (openStack.length === 0) {
      return rawParsed;
    }
    return rawParsed.filter(
      (token, index) => token.type !== "linkStart" || closedIndexes.has(index),
    );
  })();

  const out: StringTokens = [];

  let clrCount = 0;
  let fixCount = 0;

  let format:
    | undefined
    | {
        format: StringTokenFormat;
        startedAt: number;
      } = undefined;

  let color: StringTokenColor | undefined = undefined;

  let linkJumps: string[] | undefined = undefined;
  let linkDepth = 0;

  for (const token of parsed) {
    if (token.type === "text") {
      token.text.split(/\r\n|\n/).forEach((line, index, arr) => {
        const haveNext = index !== arr.length - 1;

        out.push({
          type: "text",
          text: line,
          isClr: clrCount > 0 || undefined,
          isFix: fixCount > 0 || undefined,
          color,
          links: linkDepth > 0 && linkJumps ? linkJumps : undefined,
        });

        if (haveNext) {
          out.push({
            type: "newline",
            isFix: fixCount > 0 || undefined,
          });
        }
      });
    } else if (token.type === "format") {
      if (!format && token.format) {
        format = {
          format: token.format,
          startedAt: out.length,
        };
      }
    } else if (token.type === "color") {
      if (!color && token.color) {
        color = token.color;
      }
    } else if (token.type === "tag") {
      const tag = token.tag;
      if (tag === "/color") {
        color = undefined;
      } else if (tag === "/fix") {
        fixCount--;
      } else if (tag === "/format") {
        if (format) {
          let length = 0;
          for (const token of out.slice(format.startedAt)) {
            length += token.type === "text" ? token.text.length : 0;
          }
          const padNeeded = Math.max(0, format.format.numberOfSpaces - length);

          const leftPad = padNeeded
            ? format.format.kind === "left"
              ? new Array(padNeeded).fill(" ").join("")
              : format.format.kind === "center"
              ? new Array(Math.floor(padNeeded / 2)).fill(" ").join("")
              : ""
            : "";
          const rightPad = padNeeded
            ? format.format.kind === "right"
              ? new Array(padNeeded).fill(" ").join("")
              : format.format.kind === "center"
              ? new Array(Math.ceil(padNeeded / 2)).fill(" ").join("")
              : ""
            : "";

          if (leftPad) {
            out.splice(format.startedAt, 0, {
              type: "text",
              isClr: clrCount > 0 || undefined,
              isFix: fixCount > 0 || undefined,
              text: leftPad,
              ...(linkJumps ? { links: linkJumps } : {}),
            });
          }
          if (rightPad) {
            out.push({
              type: "text",
              isClr: clrCount > 0 || undefined,
              isFix: fixCount > 0 || undefined,
              text: rightPad,
              ...(linkJumps ? { links: linkJumps } : {}),
            });
          }
        }
        format = undefined;
      } else if (tag === "clr") {
        clrCount++;
      } else if (tag === "clrEnd" || tag === "/clr") {
        clrCount--;
      } else if (tag === "fix") {
        fixCount++;
      } else {
        assertNever(tag);
      }
    } else if (token.type === "linkStart") {
      linkDepth++;
      if (linkDepth === 1 && token.jumps.length > 0) {
        linkJumps = token.jumps.slice();
      }
      // Nested links are not supported: the outer area stays active until its end.
    } else if (token.type === "linkEnd") {
      linkDepth--;
      if (linkDepth <= 0) {
        linkDepth = 0;
        linkJumps = undefined;
      }
    } else {
      assertNever(token);
    }
  }

  return out;
}
