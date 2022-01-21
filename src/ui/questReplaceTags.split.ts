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

// tslint:disable-next-line:no-useless-cast
const TAGS = ["clr", "clrEnd", "/clr", "fix", "/fix", "/format", "/color"] as const;

export type PadKind = "left" | "right" | "center";
export interface StringTokenFormat {
  kind: PadKind;
  numberOfSpaces: number;
}

export type TagsString = typeof TAGS[number];

export type StringTokenTags =
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
      format?: StringTokenFormat;
    }
  | {
      type: "color";
      color?: StringTokenColor;
    };

export function splitStringToTokens(str: string) {
  const out: StringTokenTags[] = [];

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

    const formatMatch = str.slice(pos).match(/^\<format=?(left|right|center)?,?(\d+)?\>/);
    if (formatMatch) {
      flushText();

      pos += formatMatch[0].length;

      const whereToPad = formatMatch[1] || undefined;
      const howManyPd = formatMatch[2] ? parseInt(formatMatch[2]) : undefined;

      out.push({
        type: "format",
        format:
          whereToPad !== undefined && howManyPd !== undefined
            ? {
                kind: whereToPad as PadKind,
                numberOfSpaces: howManyPd,
              }
            : undefined,
      });

      continue;
    }

    const colorMatch = str.slice(pos).match(/^\<color=?(\d+)?,?(\d+)?,?(\d+)?\>/);
    if (colorMatch) {
      flushText();

      pos += colorMatch[0].length;

      const r = colorMatch[1] ? parseInt(colorMatch[1]) : undefined;
      const g = colorMatch[2] ? parseInt(colorMatch[2]) : undefined;
      const b = colorMatch[3] ? parseInt(colorMatch[3]) : undefined;
      out.push({
        type: "color",
        color: r !== undefined && g !== undefined && b !== undefined ? { r, g, b } : undefined,
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
