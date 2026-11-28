import { CheckQuestRequest, CheckQuestResponce } from "./defs";

import { loadQuestFromUrl } from "../../lib/parseQuestGz";
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
  const quest = (await loadQuestFromUrl(data.questUrl)) as Quest;

  for (const proofSeed of Object.keys(data.logs)) {
    const validationResult = validateWinningLog(quest, data.logs[proofSeed]);
    if (validationResult) {
      return "validated";
    }
  }
  return "failed";
}
