import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../../assertNever";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import { Jump } from "../../../../lib/qmreader";
import { checkFormula } from "../checkFormula";
import { getParamStringInfo } from "../hovers/paramsAndChangeConditionsSummary";
import { Overlay } from "../overlay";
import { range } from "../utils";
import { MediaEdit, ParamChangeTypeEdit } from "./common";
import { toast } from "react-toastify";
import { useOnDocumentKeyUp } from "../keypress";

export function JumpOverlay({
  quest,
  initialJump,
  onClose,
}: {
  quest: Quest;
  initialJump: DeepImmutable<Jump>;
  onClose: (jump: DeepImmutable<Jump> | undefined) => void;
}) {
  const [jump, setJump] = React.useState<DeepImmutable<Jump> | undefined>(undefined);

  const [paramId, setParamId] = React.useState(0);

  React.useEffect(() => {
    setJump(initialJump);
    setParamId(0);
  }, [initialJump]);

  const [isPrompting, setIsPrompting] = React.useState(false);
  React.useEffect(() => {
    if (!isPrompting) {
      return;
    }
    const timerId = window.setTimeout(() => setIsPrompting(false), 5000);
    return () => window.clearTimeout(timerId);
  });

  const isChanged = jump !== initialJump;

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

  useOnDocumentKeyUp((e) => {
    console.info(e.key);
    if (e.key === "Escape") {
      onCloseWithPrompt();
    }
  });

  if (!jump) {
    return null;
  }

  return (
    <Overlay
      wide
      position="absolute"
      headerText={`Редактирование перехода P ${jump.id}`}
      onClose={onCloseWithPrompt}
    >
      <div>
        //asd
        <div className="form-inline">
          <div className="ml-3 form-check form-check-inline">
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={jump.dayPassed}
                onChange={(e) => setJump({ ...jump, dayPassed: e.target.checked })}
              />
              Прошел один день
            </label>
          </div>

          <div className="ml-4 form-check form-check-inline">
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={jump.jumpingCountLimit === 0}
                onChange={(e) => setJump({ ...jump, jumpingCountLimit: e.target.checked ? 0 : 1 })}
              />
              Неограниченная проходимость
            </label>
          </div>
          {jump.jumpingCountLimit > 0 && (
            <input
              className={classNames("form-control ml-2")}
              type="number"
              value={jump.jumpingCountLimit}
              onChange={(e) => setJump({ ...jump, jumpingCountLimit: parseInt(e.target.value) })}
            />
          )}

          <button
            className="btn btn-primary ml-auto mr-2"
            disabled={!isChanged}
            onClick={() => onClose(jump)}
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
