import { assertNever } from "../assertNever";
import { StringTokenColor, StringTokenFormat, StringTokenTags } from "./questReplaceTags.split";

export type StringTokenStyle =
  | {
      type: "text";
      text: string;
      isClr?: boolean;
      isFix?: boolean;
      color?: StringTokenColor;
    }
  | { type: "newline"; isFix?: boolean };

export type StringTokens = StringTokenStyle[];

export function formatTokens(parsed: StringTokenTags[]): StringTokens {
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
            });
          }
          if (rightPad) {
            out.push({
              type: "text",
              isClr: clrCount > 0 || undefined,
              isFix: fixCount > 0 || undefined,
              text: rightPad,
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
    } else {
      assertNever(token);
    }
  }

  return out;
}
