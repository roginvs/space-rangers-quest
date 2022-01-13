import { assertNever } from "../assertNever";
import { calculate } from "./formula";
import { ParamValues } from "./formula/types";
import { DeepImmutable } from "./qmplayer/deepImmutable";
import { PlayerSubstitute } from "./qmplayer/playerSubstitute";
import { QMParamShowInfo } from "./qmreader";
import { RandomFunc } from "./randomFunc";
import { stringParse, StringTokenColor, StringTokenFormat } from "./stringParse";

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
      kind: keyof PlayerSubstitute;
    };

export function stringCalculate(
  str: string,

  paramValues: ParamValues,
  paramShowInfos: DeepImmutable<QMParamShowInfo[]>,
  random: RandomFunc,
  diamondIndex?: number,
): StringTokenCalculated[] {
  const out: StringTokenCalculated[] = [];

  const parsed = stringParse(str);
  let clrCount = 0;
  let fixCount = 0;
  let format: StringTokenFormat | undefined = undefined;
  let color: StringTokenColor | undefined = undefined;

  for (const token of parsed) {
    if (token.type === "text") {
      out.push({
        type: "text",
        text: token.text,
        isClr: clrCount > 0,
        isFix: fixCount > 0,
        format,
        color,
      });
    } else if (token.type === "format") {
      if (!format) {
        format = token.format;
      }
    } else if (token.type === "color") {
      if (!color) {
        color = token.color;
      }
    } else if (token.type === "tag") {
      const tag = token.tag;
      if (tag === "/color") {
        color = undefined;
      } else if (tag === "/fix") {
        fixCount--;
      } else if (tag === "/format") {
        format = undefined;
      } else if (tag === "") {
        // This is diamond
        const paramValue = diamondIndex !== undefined ? paramValues[diamondIndex] : undefined;
        if (paramValue !== undefined) {
          out.push({
            type: "text",
            isClr: true,
            text: `${paramValue}`,
          });
        } else {
          out.push({
            type: "text",
            text: "<>",
          });
        }
      } else if (tag === "clr") {
        clrCount++;
      } else if (tag === "clrEnd") {
        clrCount--;
      } else if (tag === "fix") {
        fixCount++;
      } else if (tag === "lang") {
        // LOL what
        out.push({
          type: "text",
          text: "<lang>",
        });
      } else if (
        tag === "Ranger" ||
        tag === "Player" ||
        tag === "Money" ||
        tag === "FromPlanet" ||
        tag === "FromStar" ||
        tag === "ToPlanet" ||
        tag === "ToStar" ||
        tag === "Date" ||
        tag === "Day" ||
        tag === "CurDate"
      ) {
        out.push({
          type: "ranger",
          kind: tag,
        });
      } else {
        assertNever(tag);
      }
    } else if (token.type === "formula") {
      const value = calculate(token.formula, paramValues, random);
      out.push({
        type: "text",
        text: `${value}`,
        isClr: true,
      });
    } else if (token.type === "param") {
      const value = paramValues[token.paramNumber - 1];
      out.push({
        type: "text",
        text: `${value}`,
        isClr: true,
      });
    } else if (token.type === "paramstr") {
      const paramIndex = token.paramNumber - 1;
      const paramValue =
        token.paramValueExpression !== undefined
          ? calculate(token.paramValueExpression, paramValues, random)
          : paramValues[paramIndex];
      if (paramValue === undefined) {
        out.push({
          type: "text",
          text: "UNKNOWN_PARAM",
        });
      } else {
        // TODO: This is very similar to getParamsState function, maybe better to refactor
        for (const range of paramShowInfos[paramIndex].showingInfo) {
          if (paramValue >= range.from && paramValue <= range.to) {
            const newTextTokens = stringCalculate(
              range.str,
              paramValues,
              paramShowInfos,
              random,
              diamondIndex,
            );
            out.push(...newTextTokens);
          }
        }
      }
    } else {
      assertNever(token);
    }
  }

  return out;
}
