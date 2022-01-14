import classNames from "classnames";
import * as React from "react";
import { CloudQuestsProps } from "../../defs";
import { useOnDocumentKeyUp } from "../hooks";
import { QuestWithName } from "../idb";
import { Overlay } from "../overlay";

export function CloudQuestsOverlay({
  quest,
  onClose,
  saveCustomQuest,
  loadCustomQuest,
  getAllMyCustomQuests,
}: {
  quest: QuestWithName;
  onClose: (newQuest: QuestWithName | undefined) => void;
} & CloudQuestsProps) {
  useOnDocumentKeyUp((e) => {
    if (e.key === "Escape") {
      onClose(undefined);
    }
  });

  return (
    <Overlay
      wide={false}
      position="absolute"
      headerText={`Загрузка и выгрузка в облако`}
      onClose={() => onClose(undefined)}
    >
      <div className="text-center p-4">TODO</div>
    </Overlay>
  );
}
