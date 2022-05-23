import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../../../assertNever";
import { DeepImmutable } from "../../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { Jump, JumpParameterCondition, QMParam } from "../../../../../lib/qmreader";
import { getParamStringInfo } from "../../hovers/paramsAndChangeConditionsSummary";
import { Overlay } from "../../overlay";
import { range } from "../../utils";
import { ParamChangeTypeEdit } from "./common";
import { MediaEdit } from "../MediaEdit";
import { toast } from "react-toastify";
import { useOnDocumentKeyUp } from "../../hooks";
import { FormulaInput } from "../../common/formulaInput";

function ParamCondition({
  condition,
  onChange,
  param,
}: {
  condition: DeepImmutable<JumpParameterCondition>;
  param: DeepImmutable<QMParam>;
  onChange: (newValue: DeepImmutable<JumpParameterCondition>) => void;
}) {
  const [mustEqualStr, setMaxEqualStr] = React.useState(condition.mustEqualValues.join(";"));
  const [mustModStr, setMaxModStr] = React.useState(condition.mustModValues.join(";"));
  React.useEffect(() => {
    setMaxEqualStr(condition.mustEqualValues.join(";"));
    setMaxModStr(condition.mustModValues.join(";"));
  }, [condition]);

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center mb-1">
        <label className="form-check-label mr-2">Необходимо: </label>
        <label className="form-check-label">Мин </label>
        <input
          className={classNames(
            "form-control ml-2 w-100",
            param.min === condition.mustFrom ? "text-muted" : "",
          )}
          type="number"
          value={condition.mustFrom}
          min={param.min}
          max={param.max}
          onChange={(e) => onChange({ ...condition, mustFrom: parseInt(e.target.value) })}
        />
        <label className="form-check-label ml-1">Макс </label>
        <input
          className={classNames(
            "form-control ml-2 w-100",
            param.max === condition.mustTo ? "text-muted" : "",
          )}
          type="number"
          value={condition.mustTo}
          min={param.min}
          max={param.max}
          onChange={(e) => onChange({ ...condition, mustTo: parseInt(e.target.value) })}
        />
      </div>

      <div className="d-flex align-items-center mb-1">
        <label className="form-check-label text-nowrap mr-1">
          {condition.mustEqualValuesEqual ? "Равно" : "Не равно"}
        </label>

        <input
          className={classNames("form-control ml-2 w-100")}
          value={mustEqualStr}
          onChange={(e) => setMaxEqualStr(e.target.value)}
          onBlur={(e) => {
            const newValue = e.target.value
              .replace(/ /g, "")
              .split(/;|,/)
              .filter((v) => v !== "")
              .map((v) => parseInt(v));
            onChange({ ...condition, mustEqualValues: newValue });
          }}
          title="Список значений, например: 1;2;3"
        />
        <label
          className="form-check-label ml-1"
          style={{ cursor: "pointer" }}
          onClick={() =>
            onChange({ ...condition, mustEqualValuesEqual: !condition.mustEqualValuesEqual })
          }
          role="button"
          aria-label="Поменять кратно или не кратно"
        >
          <i className="fa fa-exchange" />
        </label>
      </div>

      <div className="d-flex align-items-center mb-1">
        <label className="form-check-label text-nowrap mr-1">
          {condition.mustModValuesMod ? "Кратно" : "Не кратно"}
        </label>

        <input
          className={classNames("form-control ml-2 w-100")}
          value={mustModStr}
          onChange={(e) => setMaxModStr(e.target.value)}
          onBlur={(e) => {
            const newValue = e.target.value
              .replace(/ /g, "")
              .split(/;|,/)
              .filter((v) => v !== "")
              .map((v) => parseInt(v));
            onChange({ ...condition, mustModValues: newValue });
          }}
          title="Список значений, например: 1;2;3"
        />
        <label
          className="form-check-label ml-1"
          style={{ cursor: "pointer" }}
          onClick={() => onChange({ ...condition, mustModValuesMod: !condition.mustModValuesMod })}
          role="button"
          aria-label="Поменять делится или не делится"
        >
          <i className="fa fa-exchange" />
        </label>
      </div>
    </div>
  );
}

export function JumpOverlay({
  quest,
  initialJump,
  onClose,
  enableSaveOnNoChanges,
}: {
  quest: Quest;
  initialJump: DeepImmutable<Jump>;
  onClose: (jump: DeepImmutable<Jump> | undefined) => void;
  enableSaveOnNoChanges: boolean;
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
        <div>Вопрос для совершения перехода:</div>
        <textarea
          className="form-control mb-1"
          rows={2}
          style={{
            resize: "none",
          }}
          value={jump.text}
          onChange={(e) => {
            setJump({
              ...jump,
              text: e.target.value,
            });
          }}
        />

        <div className="row mb-2">
          <div className="col-9">
            <div>Сообщение, выводящееся при выполнении перехода:</div>
            <textarea
              className="form-control mb-1"
              rows={4}
              style={{
                resize: "none",
              }}
              value={jump.description}
              onChange={(e) => {
                setJump({
                  ...jump,
                  description: e.target.value,
                });
              }}
            />
          </div>
          <div className="col-3 pt-4">
            <MediaEdit
              media={jump}
              setMedia={(newMedia) =>
                setJump({
                  ...jump,
                  img: newMedia.img,
                  track: newMedia.track,
                  sound: newMedia.sound,
                })
              }
              vertical
            />
          </div>
        </div>

        <div className="d-flex align-items-center mb-3">
          <label className="form-check-label" style={{ flexShrink: 0 }}>
            Логическое условие
          </label>
          <FormulaInput
            className="form-control w-100 ml-2"
            value={jump.formulaToPass}
            onChange={(newValue) => setJump({ ...jump, formulaToPass: newValue })}
            paramsActive={quest.params}
            allowEmpty
          />
        </div>

        <div className="row mb-1">
          <div className="col-6 d-flex flex-column">
            <select
              className="form-control"
              value={paramId}
              size={17}
              style={{ height: "100%" }}
              onChange={(e) => setParamId(parseInt(e.target.value))}
            >
              {quest.params.map((param, idx) => {
                const summary = getParamStringInfo(
                  idx,
                  param,
                  jump.paramsChanges[idx],
                  jump.paramsConditions[idx],
                );
                return (
                  <option
                    className={
                      param.active
                        ? summary.leftText || summary.rightText
                          ? "font-weight-bold"
                          : ""
                        : "text-muted"
                    }
                    key={idx}
                    value={idx}
                  >
                    {summary.textName}
                    {summary.leftText} {summary.rightText}
                  </option>
                );
              })}
            </select>
            <div className="mt-3">
              <div className="d-flex">
                <div className="mr-2">
                  <label className="mb-0">Порядок показа: {jump.showingOrder}</label>
                  <input
                    type="range"
                    className="form-range w-100"
                    min={0}
                    max={9}
                    value={jump.showingOrder}
                    onChange={(e) => setJump({ ...jump, showingOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="ml-2 d-flex align-items-center">
                  <label className="mb-0 mr-1">Приоритет:</label>
                  <input
                    className={classNames("form-control w-100")}
                    type="number"
                    value={jump.priority}
                    onChange={(e) => setJump({ ...jump, priority: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-6">
            {quest.params[paramId] && jump.paramsConditions[paramId] && (
              <ParamCondition
                param={quest.params[paramId]}
                condition={jump.paramsConditions[paramId]}
                onChange={(newValue) => {
                  setJump({
                    ...jump,
                    paramsConditions: jump.paramsConditions.map((change, i) =>
                      i === paramId ? newValue : change,
                    ),
                  });
                }}
              />
            )}
            {quest.params[paramId] && jump.paramsChanges[paramId] && (
              <ParamChangeTypeEdit
                change={jump.paramsChanges[paramId]}
                param={quest.params[paramId]}
                onChange={(newChange) => {
                  setJump({
                    ...jump,
                    paramsChanges: jump.paramsChanges.map((change, i) =>
                      i === paramId ? newChange : change,
                    ),
                  });
                }}
                paramsActive={quest.params}
              />
            )}
          </div>
        </div>

        <div className="form-inline">
          <div className="ml-3 form-check form-check-inline">
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={jump.alwaysShow}
                onChange={(e) => setJump({ ...jump, alwaysShow: e.target.checked })}
              />
              Всегда показывать
            </label>
          </div>

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
            disabled={!isChanged && !enableSaveOnNoChanges}
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
