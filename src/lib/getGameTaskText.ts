import { Game } from "../packGameData/defs";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "./qmplayer/defs";
import { SRDateToString } from "./qmplayer/funcs";
import { Player } from "./qmplayer/player";
import { QM } from "./qmreader";
import { substitute } from "./substitution";

export function getGameTaskText(taskText: string, player: Player) {
  return substitute(
    taskText,
    {
      ...player,
      Day: `${DEFAULT_DAYS_TO_PASS_QUEST}`,
      Date: SRDateToString(DEFAULT_DAYS_TO_PASS_QUEST, player.lang),
      CurDate: SRDateToString(0, player.lang),
    },
    [],
    [],
    // tslint:disable-next-line:strict-type-predicates
    (n) => (n !== undefined ? Math.floor(Math.random() * n) : Math.random()),
  );
}
