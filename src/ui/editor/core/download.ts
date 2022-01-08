import { writeQmm } from "../../../lib/qmwriter";
import { QuestWithName } from "./idb";

export function downloadQuest(quest: QuestWithName) {
  const arrayBuffer = writeQmm(quest);
  const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  // TODO: Maybe add minor and major versions?
  link.download = quest.filename ? quest.filename + ".qmm" : "quest.qmm";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
