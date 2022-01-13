import { PlayerSubstitute } from "./qmplayer/playerSubstitute";

export interface StringTokenFormat {
  kind: "left" | "right" | "center";
  numberOfSpaces: number;
}
export interface StringTokenColor {
  r: number;
  g: number;
  b: number;
}
export type StringTokenCalculated =
  | {
      type: "text";
      text: string;
      isClr?: boolean;
      isFix?: boolean;
      format?: StringTokenFormat;
      color?: StringTokenColor;
    }
  | {
      type: "ranger";
      kind: PlayerSubstitute;
    };

export type StringToken =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "clr" | "clrEnd" | "fix" | "fixEnd" | "colorEnd" | "formatEnd" | "diamond";
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
      paramIndex: number;
    }
  | {
      type: "paramstr";
      paramIndex: number;
      paramValueExpression?: string;
    }
  | {
      type: "formula";
      formula: string;
    }
  | {
      type: "ranger";
      player: keyof PlayerSubstitute;
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
    if (str[pos] === "<" && str[pos + 1] === ">") {
      flushText();
      out.push({ type: "diamond" });
      pos += 2;
      continue;
    }

    for (const candidate of PLAYER_KEYS_TO_REPLACE) {
      const candidateWithBrackes = `<${candidate}>`;
      let found = false;
      if (str.slice(pos, pos + candidateWithBrackes.length) === candidateWithBrackes) {
        flushText();
        out.push({ type: "ranger", player: candidate });
        pos += candidateWithBrackes.length;
        found = true;
      }
      if (found) {
        continue;
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
