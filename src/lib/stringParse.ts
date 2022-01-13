import { PlayerSubstitute } from "./qmplayer/playerSubstitute";

export type StringToken =
  | {
      type: "text";
      text: string;
      isClr: boolean;
      isFix: boolean;
      format?: {
        kind: "left" | "right" | "center";
        numberOfSpaces: number;
      };
      color?: {
        r: number;
        g: number;
        b: number;
      };
    }
  | {
      type: "ranger";
      kind: PlayerSubstitute;
    };

export function stringParse(str: string): StringToken[] {
  return [];
}
