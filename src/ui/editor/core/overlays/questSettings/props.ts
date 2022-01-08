import { Quest } from "../../../../../lib/qmplayer/funcs";
import { QuestWithName } from "../../idb";

export interface QuestSettingsTabProps {
  quest: QuestWithName;
  setQuest: (newQuest: QuestWithName) => void;
}
