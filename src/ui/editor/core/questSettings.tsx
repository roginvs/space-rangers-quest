import classNames from "classnames";
import * as React from "react";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Overlay } from "./overlay";

export function QuestSettings({
  initialQuest,
  onClose,
}: {
  initialQuest: Quest;
  onClose: (newQuest: Quest | undefined) => void;
}) {
  const [quest, setQuest] = React.useState(initialQuest);

  React.useEffect(() => {
    setQuest(initialQuest);
  }, [initialQuest]);

  const [isPrompting, setIsPrompting] = React.useState(false);
  React.useEffect(() => {
    if (!isPrompting) {
      return;
    }
    const timerId = window.setTimeout(() => setIsPrompting(false), 5000);
    return () => window.clearTimeout(timerId);
  });

  const isChanged = quest !== initialQuest;

  const onCloseWithPrompt = React.useCallback(() => {
    if (!isChanged) {
      onClose(undefined);
      return;
    }

    if (isPrompting) {
      onClose(undefined);
    } else {
      setIsPrompting(true);
    }
  }, [isChanged, isPrompting]);

  return (
    <Overlay
      wide
      position="absolute"
      headerText={`Общая информация по квесту`}
      onClose={onCloseWithPrompt}
    >
      <div>
        <div className="d-flex">
          <div />
          <button
            className="btn btn-primary ml-auto mr-2"
            disabled={!isChanged}
            onClick={() => onClose(quest)}
          >
            Сохранить
          </button>
          <button className="btn btn-danger" onClick={onCloseWithPrompt}>
            {!isPrompting ? "Закрыть" : "Точно закрыть?"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
