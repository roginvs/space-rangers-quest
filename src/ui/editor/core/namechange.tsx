import classNames from "classnames";
import * as React from "react";
import { QuestName } from "./idb";
import { useOnDocumentKeyUp } from "./hooks";

export function QuestName({
  quest,
  setQuest,
}: {
  quest: QuestName;
  setQuest: (newQuest: QuestName) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(quest.filename);
  React.useEffect(() => {
    setName(quest.filename);
    setIsEditing(false);
  }, [quest.filename]);

  const updateName = React.useCallback(() => {
    setQuest({ ...quest, filename: name });
    setIsEditing(false);
  }, [name]);

  useOnDocumentKeyUp((e) => {
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  });

  return !isEditing ? (
    <label
      className={classNames("mb-0 ml-2 mr-2", !quest.filename ? "text-muted" : "")}
      onClick={() => {
        setIsEditing(true);
        setName(quest.filename);
      }}
      title="Имя файла квеста"
      style={{ cursor: "pointer", paddingRight: 10, whiteSpace: "pre" }}
    >
      {quest.filename || "noname"}
    </label>
  ) : (
    <input
      type="text"
      className="form-control"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={updateName}
      onKeyPress={(e) => {
        console.info(e.key);
        if (e.key === "Enter") {
          updateName();
        }
      }}
    />
  );
}
