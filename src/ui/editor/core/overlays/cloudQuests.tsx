import classNames from "classnames";
import * as React from "react";
import { writeQmm } from "../../../../lib/qmwriter";
import { CloudQuestsProps, FirebaseCustomQuest } from "../../defs";
import { useOnDocumentKeyUp } from "../hooks";
import { QuestWithName } from "../idb";
import { Overlay } from "../overlay";
import * as pako from "pako";
import { toast } from "react-toastify";
import { parse } from "../../../../lib/qmreader";

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

  const [myQuests, setMyQuests] = React.useState<
    Record<string, FirebaseCustomQuest> | null | string
  >(null);
  React.useEffect(() => {
    getAllMyCustomQuests()
      .then((quests) => {
        setMyQuests(quests || {});
      })
      .catch((e) => {
        setMyQuests(`Error: ${e.message}`);
      });
  }, []);

  const [myQuestToLoad, setMyQuestToLoad] = React.useState("");

  const loadMyQuest = React.useCallback(() => {
    const newQuestData =
      myQuests !== null && typeof myQuests !== "string" ? myQuests[myQuestToLoad] : undefined;
    if (newQuestData) {
      const quest = parse(Buffer.from(pako.ungzip(Buffer.from(newQuestData.quest_qmm_gz))));
      onClose({
        ...quest,
        filename: myQuestToLoad,
      });
    }
  }, [myQuestToLoad, myQuests]);

  const [questName, setQuestName] = React.useState(quest.filename);
  React.useEffect(() => {
    setQuestName(quest.filename);
  }, [quest]);
  const [isPublic, setIsPublic] = React.useState(quest.isPublic);
  React.useEffect(() => {
    setIsPublic(quest.isPublic);
  }, [quest]);

  const [busy, setBusy] = React.useState(false);

  const saveToCloud = React.useCallback(() => {
    if (!questName) {
      return;
    }
    setBusy(true);
    saveCustomQuest(questName, {
      quest_qmm_gz: pako.gzip(writeQmm(quest)),
      isPublic: !!isPublic,
      updatedAt: Date.now(),
    })
      .then(() => {
        setBusy(false);
        onClose({
          ...quest,
          filename: questName,
          isPublic,
        });
        toast(`Сохранено!`);
      })
      .catch((e) => {
        setBusy(false);
        toast(`Ошибка: ${e.message}`);
      });
  }, [busy, saveCustomQuest, questName, isPublic, quest]);

  return (
    <Overlay
      wide={true}
      position="absolute"
      headerText={`Загрузка и выгрузка в облако`}
      onClose={() => onClose(undefined)}
    >
      <div className="row">
        <div className="col-6">
          <div className="mb-3">
            <label>Загрузить из своих:</label>
            {myQuests === null ? (
              <div>Загрузка...</div>
            ) : typeof myQuests === "string" ? (
              <div className="text-danger">{myQuests}</div>
            ) : (
              <div>
                <select
                  className="form-control mb-1"
                  value={myQuestToLoad}
                  size={20}
                  onChange={(e) => setMyQuestToLoad(e.target.value)}
                  onDoubleClick={loadMyQuest}
                >
                  {Object.entries(myQuests)
                    .sort(([aKey, aValue], [bKey, bValue]) => aValue.updatedAt - bValue.updatedAt)
                    .map(([questName, quest]) => (
                      <option value={questName} key={questName}>
                        {questName} {quest.isPublic ? " (публичный)" : ""}
                      </option>
                    ))}
                </select>

                {myQuestToLoad && (
                  <button className="btn btn-secondary w-100" disabled={busy} onClick={loadMyQuest}>
                    Загрузить {myQuestToLoad}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label>Сохранить в облако:</label>
          <input
            className="form-control w-100"
            type="text"
            value={questName}
            onChange={(e) => setQuestName(e.target.value)}
          />

          <label className="form-check-label ml-4">
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Доступен для всех
          </label>

          <button className="btn btn-primary w-100" disabled={busy} onClick={saveToCloud}>
            Сохранить
          </button>
        </div>
      </div>
    </Overlay>
  );
}
