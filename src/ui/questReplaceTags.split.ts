export interface StringTokenColor {
  r: number;
  g: number;
  b: number;
}

export type StringTokenCalculated = {
  type: "text";
  text: string;
  isClr?: boolean;
  isFix?: boolean;
  color?: StringTokenColor;
};

const TAGS = ["clr", "clrEnd", "fix", "/fix", "/format", "/color"] as const;

export type PadKind = "left" | "right" | "center";
export interface StringTokenFormat {
  kind: PadKind;
  numberOfSpaces: number;
}

export type TagsString = typeof TAGS[number];

export type StringToken =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tag";
      tag: TagsString;
    }
  | {
      type: "format";
      format: StringTokenFormat;
    }
  | {
      type: "color";
      color: StringTokenColor;
    };

export function splitStringToTokens(str: string) {
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
    let simpleTagFound = false;
    for (const candidate of TAGS) {
      const candidateWithBrackes = `<${candidate}>`;

      if (str.slice(pos, pos + candidateWithBrackes.length) === candidateWithBrackes) {
        flushText();
        out.push({ type: "tag", tag: candidate });
        pos += candidateWithBrackes.length;
        simpleTagFound = true;
        continue;
      }
    }
    if (simpleTagFound) {
      continue;
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
    // And by default feeding text
    if (pos < str.length) {
      text = text + str[pos];
      pos++;
    }
  }
  flushText();

  return out;
}
