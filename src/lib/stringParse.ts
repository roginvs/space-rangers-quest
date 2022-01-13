import { Tag } from "reactstrap";
import { PlayerSubstitute } from "./qmplayer/playerSubstitute";

export type PadKind = "left" | "right" | "center";
export interface StringTokenFormat {
  kind: PadKind;
  numberOfSpaces: number;
}
export interface StringTokenColor {
  r: number;
  g: number;
  b: number;
}

const EASY_TAGS = ["clr", "clrEnd", "fix", "/fix", "/format", "/color", ""] as const;

export type PlayerString = keyof PlayerSubstitute;
export type TagsString = typeof EASY_TAGS[number];

export type StringToken =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tag";
      tag: PlayerString | TagsString;
    }
  | {
      type: "format";
      format: StringTokenFormat;
    }
  | {
      type: "color";
      color: StringTokenColor;
    }
  | {
      type: "param";
      paramNumber: number;
    }
  | {
      type: "paramstr";
      paramNumber: number;
      paramValueExpression?: string;
    }
  | {
      type: "formula";
      formula: string;
    };

const PLAYER_KEYS_TO_REPLACE: (keyof PlayerSubstitute)[] = [
  "Ranger",
  "Player",
  "FromPlanet",
  "FromStar",
  "ToPlanet",
  "ToStar",
  "Money",
  "Date",
  "Day",
  "CurDate",
];

export function stringParse(str: string): StringToken[] {
  const out: StringToken[] = [];

  let pos = 0;
  let text = "";

  const flushText = () => {
    if (text.length > 0) {
      out.push({ type: "text", text });
      text = "";
    }
  };

  while (pos < str.length) {
    for (const candidate of [...PLAYER_KEYS_TO_REPLACE, ...EASY_TAGS]) {
      const candidateWithBrackes = `<${candidate}>`;
      let found = false;
      if (str.slice(pos, pos + candidateWithBrackes.length) === candidateWithBrackes) {
        flushText();
        out.push({ type: "tag", tag: candidate });
        pos += candidateWithBrackes.length;
        found = true;
      }
      if (found) {
        continue;
      }
    }

    const formatMatch = str.slice(pos).match(/^\<format=(left|right|center),(\d+)\>/);
    if (formatMatch) {
      flushText();

      pos += formatMatch[0].length;

      const whereToPad = formatMatch[1];
      const howManyPd = parseInt(formatMatch[2]);

      out.push({
        type: "format",
        format: {
          kind: whereToPad as PadKind,
          numberOfSpaces: howManyPd,
        },
      });

      continue;
    }

    const colorMatch = str.slice(pos).match(/^\<color=(\d+),(\d+),(\d+)\>/);
    if (colorMatch) {
      flushText();

      pos += colorMatch[0].length;

      const r = parseInt(colorMatch[1]);
      const g = parseInt(colorMatch[2]);
      const b = parseInt(colorMatch[3]);
      out.push({
        type: "color",
        color: { r, g, b },
      });
      continue;
    }

    const paramMatch = str.slice(pos).match(/^\[p(\d+)\]/);
    if (paramMatch) {
      flushText();
      pos += paramMatch[0].length;

      const paramNumber = parseInt(paramMatch[1]);
      out.push({
        type: "param",
        paramNumber,
      });

      continue;
    }

    const formulaMatch = str.slice(pos).match(/^{[^}]*}/);
    if (formulaMatch) {
      flushText();
      pos += formulaMatch[0].length;

      const formulaWithBrackets = formulaMatch[0];
      out.push({
        type: "formula",
        formula: formulaWithBrackets.slice(1, formulaWithBrackets.length - 1),
      });

      continue;
    }

    if (str[pos] === "[" && str[pos + 1] === "d") {
      let scanPos = pos + 2;

      while (true) {
        const currentChar = str[scanPos];
        if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(currentChar) === -1) {
          break;
        }
        scanPos++;
      }
      const paramNum = parseInt(str.substring(pos + 2, scanPos));
      if (str[scanPos] === "]") {
        scanPos++;
        flushText();
        pos = scanPos;
        out.push({
          type: "paramstr",
          paramNumber: paramNum,
        });
        continue;
      } else if (str[scanPos] === ":") {
        scanPos++;

        let squareBracketsCount = 0;
        let formulaStartIndex = scanPos;
        let formulaEndIndex = scanPos;
        while (true) {
          if (str[scanPos] === "[") {
            squareBracketsCount++;
          } else if (str[scanPos] === "]") {
            if (squareBracketsCount === 0) {
              formulaEndIndex = scanPos;
              scanPos++;
              break;
            } else {
              squareBracketsCount--;
            }
          }

          if (scanPos < str.length - 1) {
            scanPos++;
          } else {
            console.warn(`No closing bracket found in '${str}' at ${scanPos}`);
            text = text + str.slice(pos, pos + scanPos);
            pos = scanPos + 1;
            flushText();
            break;
          }
        }
        if (formulaEndIndex > formulaStartIndex) {
          const formulaWithMaybeCurlyBrackets = str.substring(formulaStartIndex, formulaEndIndex);

          let formula = formulaWithMaybeCurlyBrackets;
          const insideCurlyBracketsMatch = formulaWithMaybeCurlyBrackets.match(/\s*\{(.*)\}\s*/);
          if (insideCurlyBracketsMatch) {
            formula = insideCurlyBracketsMatch[1];
          }

          flushText();
          pos = scanPos;
          out.push({
            type: "paramstr",
            paramNumber: paramNum,
            paramValueExpression: formula,
          });
          continue;
        }
      }
    }

    // And by default feeding text
    if (pos < str.length) {
      text = text + str[pos];
      pos++;
    }
  }
  flushText();

  return out;
}
