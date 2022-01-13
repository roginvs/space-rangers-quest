import { calculate } from "./formula";
import { RandomFunc } from "./randomFunc";
import { PlayerSubstitute } from "./qmplayer/playerSubstitute";
import { QMParamShowInfo } from "./qmreader";
import { DeepImmutable } from "./qmplayer/deepImmutable";
import { ParamValues } from "./formula/types";

export const clr = "<clr>";
export const clrEnd = "<clrEnd>";

export const PLAYER_KEYS_TO_REPLACE: (keyof PlayerSubstitute)[] = [
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
]; // TODO: Maybe move from here

/**
 * Replaces:
 *    <>        -> value of parameter with index = diamongIndex (if provided)
 *   {1+2}      -> parse formula, using random
 *   <Ranger>   -> player.Ranger and others
 *   [p22]      -> Value of parameter
 *   [d1]       -> Param 1 text with current value
 *   [d1:440 + 4]   -> Param 1 text with value = 444 (see tests for supported cases)
 *
 * All replaced values have <clr>...<clrEnd> around them
 *
 *
 * TODO: Use scanning method, go char by char.
 * Do not use .replace due to side-effect of special chars
 *
 *
 */
export function substitute(
  str: string,
  player: PlayerSubstitute,
  paramValues: ParamValues,
  paramShowInfos: DeepImmutable<QMParamShowInfo[]>,
  random: RandomFunc,
  diamondIndex?: number,
) {
  if (diamondIndex !== undefined) {
    str = str.replace(/<>/g, `[p${diamondIndex + 1}]`);
  }

  let searchPosition = 0;
  while (true) {
    const dIndex = str.indexOf("[d", searchPosition);
    if (dIndex === -1) {
      break;
    }
    let paramIndexStr = "";
    let scanIndex = dIndex + 2;

    while (true) {
      const currentChar = str[scanIndex];
      if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(currentChar) === -1) {
        break;
      }
      scanIndex++;
    }

    paramIndexStr = str.substring(dIndex + 2, scanIndex);
    if (paramIndexStr === "") {
      console.warn(`No param index found in '${str}' at ${dIndex}`);
      searchPosition = scanIndex;
      continue;
    }
    const paramIndex = parseInt(paramIndexStr) - 1;

    let paramValue = paramValues[paramIndex];

    if (paramValue === undefined) {
      scanIndex++;
      str = str.slice(0, dIndex) + clr + "UNKNOWN_PARAM" + clrEnd + str.slice(scanIndex);
      continue;
    }

    if (str[scanIndex] === "]") {
      // Just keep param value as is
      scanIndex++;
    } else if (str[scanIndex] === ":") {
      // Replace param value with formula
      scanIndex++;
      const formulaStartIndex = scanIndex;
      let formulaEndIndex = formulaStartIndex;
      while (str[scanIndex] === " ") {
        scanIndex++;
      }

      // And here goes the formula parsing
      // TODO: Use parse() method without throwing errors
      // So, parse() should read the expression and return the index where it ends
      // Now we just using naive implementation and counting square brackets
      let squareBracketsCount = 0;
      while (true) {
        if (str[scanIndex] === "[") {
          squareBracketsCount++;
        } else if (str[scanIndex] === "]") {
          if (squareBracketsCount === 0) {
            formulaEndIndex = scanIndex;
            scanIndex++;
            break;
          } else {
            squareBracketsCount--;
          }
        }
        scanIndex++;
        if (scanIndex > str.length) {
          console.warn(`No closing bracket found in '${str}' at ${formulaStartIndex}`);
          break;
        }
      }
      const formulaWithMaybeCurlyBrackets = str.substring(formulaStartIndex, formulaEndIndex);

      let formula = formulaWithMaybeCurlyBrackets;
      const insideCurlyBracketsMatch = formulaWithMaybeCurlyBrackets.match(/\s*\{(.*)\}\s*/);
      if (insideCurlyBracketsMatch) {
        formula = insideCurlyBracketsMatch[1];
      }

      paramValue = calculate(formula, paramValues, random);
    } else {
      console.warn(`Unknown symbol in '${str}' at ${scanIndex}`);
      break;
    }

    // TODO: This is very similar to getParamsState function, maybe better to refactor
    for (const range of paramShowInfos[paramIndex].showingInfo) {
      if (paramValue >= range.from && paramValue <= range.to) {
        const paramString = substitute(
          range.str,
          player,
          paramValues,
          paramShowInfos,
          random,
          diamondIndex,
        );
        str = str.slice(0, dIndex) + clr + paramString + clrEnd + str.slice(scanIndex);
        break;
      }
    }

    searchPosition = scanIndex;
  }

  while (true) {
    const m = str.match(/{[^}]*}/);
    if (!m) {
      break;
    }
    const formulaWithBrackets = m[0];
    const result = calculate(
      formulaWithBrackets.slice(1, formulaWithBrackets.length - 1),
      paramValues,
      random,
    );
    str = str.replace(formulaWithBrackets, `${clr}${result}${clrEnd}`);
  }
  for (const k of PLAYER_KEYS_TO_REPLACE) {
    str = str.split(`<${k}>`).join(`${clr}${player[k]}${clrEnd}`);
  }
  for (let ii = 0; ii < paramValues.length; ii++) {
    while (str.indexOf(`[p${ii + 1}]`) > -1) {
      str = str.replace(`[p${ii + 1}]`, `${clr}${paramValues[ii]}${clrEnd}`);
    }
  }

  return str;
}
