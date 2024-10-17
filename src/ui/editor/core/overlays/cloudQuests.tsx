import classNames from "classnames";
import * as React from "react";
import { writeQmm } from "../../../../lib/qmwriter";
import { CloudQuestsProps, FirebaseCustomQuest } from "../../defs";
import { useOnDocumentKeyUp } from "../hooks";
import { QuestWithMetadata } from "../idb";
import { Overlay } from "../overlay";
import * as pako from "pako";
import { toast } from "react-toastify";
import { parse } from "../../../../lib/qmreader";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { copyToClipboard } from "../../../copyToClipboard";

export function CloudQuestsOverlay({
  quest,
  onClose,
  saveCustomQuest,
  loadCustomQuest,
  getAllMyCustomQuests,
  getMyUserId,
}: {
  quest: QuestWithMetadata;
  onClose: (newQuest: QuestWithMetadata | undefined) => void;
} & CloudQuestsProps) {
  useOnDocumentKeyUp((e) => {
    if (e.key === "Escape") {
      onClose(undefined);
    }
  });

  const myUserId = getMyUserId();

  const [myQuests, setMyQuests] = React.useState<
    Record<string, FirebaseCustomQuest> | null | string
  >(null);
  const loadMyQuests = React.useCallback(() => {
    getAllMyCustomQuests()
      .then((quests) => {
        setMyQuests(quests || {});
      })
      .catch((e) => {
        setMyQuests(`Error: ${e.message}`);
      });
  }, []);

  const [questFromMyList, setQuestFromMyList] = React.useState("");
  React.useEffect(() => {
    if (myQuests !== null && typeof myQuests === "object") {
      const firstQuest = Object.keys(myQuests)[0];
      if (firstQuest) {
        setQuestFromMyList(firstQuest);
      }
    }
  }, [myQuests]);

  const loadMyQuest = React.useCallback(() => {
    const newQuestData =
      myQuests !== null && typeof myQuests !== "string" ? myQuests[questFromMyList] : undefined;
    if (newQuestData) {
      const quest = parse(
        Buffer.from(pako.ungzip(Buffer.from(newQuestData.quest_qmm_gz_base64, "base64"))),
      );
      onClose({
        ...quest,
        filename: questFromMyList,
        isPublic: newQuestData.isPublic,
      });
    }
  }, [questFromMyList, myQuests]);
  const removeMyQuest = React.useCallback(() => {
    if (questFromMyList) {
      if (!confirm("Точно удалить?")) {
        return;
      }
      setMyQuests(null);
      saveCustomQuest(questFromMyList, null)
        .then(() => loadMyQuests())
        .catch((e) => {
          toast(`Ошибка ${e.message}`);
        });
    }
  }, [questFromMyList]);

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
      quest_qmm_gz_base64: Buffer.from(pako.gzip(writeQmm(quest))).toString("base64"),
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

  const makeQuestPublicUrl = React.useCallback(
    (targetQuestName: string) =>
      myUserId
        ? `${location.origin}/#/userquest/${myUserId}/${encodeURIComponent(targetQuestName)}`
        : null,
    [myUserId],
  );

  const publicQuestUrl = isPublic && questName ? makeQuestPublicUrl(questName) : undefined;

  const [activeTab, setActiveTab] = React.useState<"main" | "list">("main");
  React.useEffect(() => {
    if (activeTab === "list") {
      loadMyQuests();
    }
  }, [loadMyQuests, activeTab]);

  const [linkToLoad, setLinkToLoad] = React.useState("");

  const loadFromLink = React.useCallback(() => {
    const [userquest, userId, questName] = linkToLoad.split("/").slice(-3);
    if (userquest === "userquest" && userId && questName) {
      setBusy(true);
      loadCustomQuest(userId, decodeURIComponent(questName))
        .then((data) => {
          setBusy(false);
          if (!data) {
            toast(`Не найдено`);
            return;
          }

          const quest = parse(
            Buffer.from(pako.ungzip(Buffer.from(data.quest_qmm_gz_base64, "base64"))),
          );
          onClose({
            ...quest,
            filename: decodeURIComponent(questName),
            isPublic: true,
          });
        })
        .catch((e) => {
          setBusy(false);
          toast(`Ошибка: ${e.message}`);
        });
    } else {
      toast(`Неправильная ссылка`);
    }
  }, [linkToLoad]);

  return (
    <Overlay
      wide={true}
      position="absolute"
      headerText={`Загрузка и выгрузка в облако`}
      onClose={() => onClose(undefined)}
    >
      <Nav tabs>
        <NavItem>
          <NavLink
            className={classNames({ active: activeTab === "main" })}
            onClick={() => setActiveTab("main")}
          >
            По ссылке
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            className={classNames({ active: activeTab === "list" })}
            onClick={() => setActiveTab("list")}
          >
            Список моих квестов
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="main" className="pt-2">
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

            {publicQuestUrl ? (
              <div
                onClick={() => {
                  copyToClipboard(publicQuestUrl);
                  toast("Скопировано в буфер!");
                }}
                style={{
                  cursor: "pointer",
                }}
                className="mt-1 mb-1"
              >
                {publicQuestUrl}
              </div>
            ) : null}

            <button
              className="btn btn-primary w-100 mt-2 mb-4"
              disabled={busy}
              onClick={saveToCloud}
            >
              Сохранить
            </button>

            <label>Открыть квест из ссылки:</label>
            <input
              className="form-control w-100"
              type="text"
              value={linkToLoad}
              onChange={(e) => setLinkToLoad(e.target.value)}
              title="Ссылка на квест в облаке"
            />

            <button
              className="btn btn-secondary w-100 mt-2 mb-4"
              disabled={busy}
              onClick={loadFromLink}
            >
              Открыть
            </button>
          </div>
        </TabPane>

        <TabPane tabId="list" className="pt-2">
          <div className="mb-3">
            <label>Открыть из своих:</label>
            {myQuests === null ? (
              <div>Загрузка...</div>
            ) : typeof myQuests === "string" ? (
              <div className="text-danger">{myQuests}</div>
            ) : (
              <div>
                <select
                  className="form-control mb-1"
                  value={questFromMyList}
                  size={20}
                  onChange={(e) => setQuestFromMyList(e.target.value)}
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

                {questFromMyList && (
                  <>
                    <div
                      className="mt-1 mb-3 text-center"
                      onClick={() => {
                        copyToClipboard(makeQuestPublicUrl(questFromMyList) || "");
                        toast("Скопировано в буфер!");
                      }}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      {makeQuestPublicUrl(questFromMyList)}
                    </div>
                    <div className="d-flex justify-content-center">
                      <button
                        className="btn btn-primary mr-2"
                        disabled={busy}
                        onClick={loadMyQuest}
                      >
                        Открыть {questFromMyList}
                      </button>
                      <button
                        className="btn btn-danger ml-2"
                        disabled={busy}
                        onClick={removeMyQuest}
                      >
                        Удалить {questFromMyList}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </TabPane>
      </TabContent>
    </Overlay>
  );
}
