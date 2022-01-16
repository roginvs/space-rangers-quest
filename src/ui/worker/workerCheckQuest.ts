import { CheckQuestRequest, CheckQuestResponce } from "./defs";

import { parse } from "../../lib/qmreader";
import * as pako from "pako";
import {
  GameState,
  initGame,
  performJump,
  Quest,
  getUIState,
  getGameLog,
  GameLog,
  validateWinningLog,
} from "../../lib/qmplayer/funcs";

export async function checkQuest(data: CheckQuestRequest): Promise<CheckQuestResponce> {
  const questArrayBuffer = await fetch(data.questUrl).then((x) => x.arrayBuffer());
  const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))) as Quest;

  for (const proofSeed of Object.keys(data.logs)) {
    const validationResult = validateWinningLog(quest, data.logs[proofSeed]);
    if (validationResult) {
      return "validated";
    }
  }
  return "failed";
}
