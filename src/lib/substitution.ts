import { parse } from './formula';
import { Player } from './qmplayer';
export const clr = '<clr>';
export const clrEnd = '<clrEnd>';

export function substitute(str: string, player: Player, params: number[], diamondIndex?: number) {
    if (diamondIndex !== undefined) {
        str = str.replace(/<>/g,
            `[p${diamondIndex + 1}]`);
    }
    while (true) {
        const m = str.match(/{[^}]*}/);
        if (!m) {
            break;
        }
        const formulaWithBrackets = m[0];
        const result = parse(formulaWithBrackets.slice(1, formulaWithBrackets.length - 1),
            params);
        str = str.replace(formulaWithBrackets, `${clr}${result}${clrEnd}`);
    }
    for (const k of Object.keys(player) as (keyof Player)[]) {
        while (str.indexOf(`<${k}>`) > -1) {
            str = str.replace(`<${k}>`, `${clr}${player[k]}${clrEnd}`);
        }
    }
    for (let ii = 0; ii < params.length; ii++) {
        while (str.indexOf(`[p${ii + 1}]`) > -1) {
            str = str.replace(`[p${ii + 1}]`,
                `${clr}${params[ii]}${clrEnd}`);
        }
    }

    return str
}