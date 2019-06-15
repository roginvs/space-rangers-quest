import { parse } from "./formula";
// import { Lang } from './qmplayer/player';
import { RandomFunc } from "./randomFunc";
import { PlayerSubstitute } from "./qmplayer/funcs";
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
  "CurDate"
]; // TODO: Maybe move from here

export function substitute(
  str: string,
  player: PlayerSubstitute,
  params: ReadonlyArray<number>,
  random: RandomFunc,
  diamondIndex?: number
) {
  if (diamondIndex !== undefined) {
    str = str.replace(/<>/g, `[p${diamondIndex + 1}]`);
  }
  while (true) {
    const m = str.match(/{[^}]*}/);
    if (!m) {
      break;
    }
    const formulaWithBrackets = m[0];
    const result = parse(
      formulaWithBrackets.slice(1, formulaWithBrackets.length - 1),
      params,
      random
    );
    str = str.replace(formulaWithBrackets, `${clr}${result}${clrEnd}`);
  }
  for (const k of PLAYER_KEYS_TO_REPLACE) {
    while (str.indexOf(`<${k}>`) > -1) {
      str = str.replace(`<${k}>`, `${clr}${player[k]}${clrEnd}`);
    }
  }
  for (let ii = 0; ii < params.length; ii++) {
    while (str.indexOf(`[p${ii + 1}]`) > -1) {
      str = str.replace(`[p${ii + 1}]`, `${clr}${params[ii]}${clrEnd}`);
    }
  }

  return str;
}
