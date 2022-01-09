import { Quest } from "../../../../../lib/qmplayer/funcs";

export interface QuestSettingsTabProps {
  quest: Quest;
  setQuest: (newQuest: Quest) => void;
}
