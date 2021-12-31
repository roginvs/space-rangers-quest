import { parse } from "./formula";
// import { Lang } from './qmplayer/player';
import { RandomFunc } from "./randomFunc";
import { PlayerSubstitute } from "./qmplayer/playerSubstitute";
import { QM, QMParamShowInfo } from "./qmreader";
import { DeepImmutable } from "./qmplayer/deepImmutable";
import { Game } from "../packGameData";
import { Player } from "./qmplayer/player";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "./qmplayer/defs";
import { SRDateToString } from "./qmplayer/funcs";
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
 *    <>        -> diamongIndex (if provided)
 *   {1+2}      -> parse formula, using random
 *   <Ranger>   -> player.Ranger
 *   [p22]      -> params[21]
 *   [d1]       -> Param 1 text with current value
 *   [d1:440 + 4]   -> Param 1 text with value = 444 (see tests for supported cases)
 *
 * All replaced values have <clr>...<clrEnd> around them
 *
 *
 * TODO: Use scanning method, go char by char
 */
export function substitute(
  str: string,
  player: PlayerSubstitute,
  paramValues: ReadonlyArray<number>,
  paramShowInfos: DeepImmutable<QMParamShowInfo[]>,
  random: RandomFunc,
  diamondIndex?: number,
) {
  if (diamondIndex !== undefined) {
    str = str.replace(/<>/g, `[p${diamondIndex + 1}]`);
  }

  while (true) {
    const matchPlain = str.match(/\[d(\d+)\]/);
    if (matchPlain) {
      const paramIndex = parseInt(matchPlain[1]) - 1;
      const paramValue = paramValues[paramIndex];

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
          str = str.split(matchPlain[0]).join(clr + paramString + clrEnd);
          break;
        }
      }
    } else {
      break;
    }
  }

  while (true) {
    const m = str.match(/{[^}]*}/);
    if (!m) {
      break;
    }
    const formulaWithBrackets = m[0];
    const result = parse(
      formulaWithBrackets.slice(1, formulaWithBrackets.length - 1),
      paramValues,
      random,
    );
    str = str.replace(formulaWithBrackets, `${clr}${result}${clrEnd}`);
  }
  for (const k of PLAYER_KEYS_TO_REPLACE) {
    while (str.indexOf(`<${k}>`) > -1) {
      str = str.replace(`<${k}>`, `${clr}${player[k]}${clrEnd}`);
    }
  }
  for (let ii = 0; ii < paramValues.length; ii++) {
    while (str.indexOf(`[p${ii + 1}]`) > -1) {
      str = str.replace(`[p${ii + 1}]`, `${clr}${paramValues[ii]}${clrEnd}`);
    }
  }

  return str;
}
