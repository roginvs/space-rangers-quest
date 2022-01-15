import { writeQmm } from "../../../lib/qmwriter";
import { QuestWithMetadata } from "./idb";

export function downloadQuest(quest: QuestWithMetadata) {
  const arrayBuffer = writeQmm(quest);
  const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  // TODO: Maybe add minor and major versions?
  // Maybe add current date string?
  link.download = quest.filename ? quest.filename + ".qmm" : "quest.qmm";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
