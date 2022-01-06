import classNames from "classnames";
import * as React from "react";
import { toast } from "react-toastify";
import { DeepImmutable } from "../../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { ParamCritType, ParamType, QMParam } from "../../../../../lib/qmreader";
import { addParameter, removeLastParameter } from "../../actions";
import { FormulaInput } from "../../common/formulaInput";
import { getParamStringInfo } from "../../hovers/paramsAndChangeConditionsSummary";
import { MediaEdit } from "../MediaEdit";
import { QuestSettingsTabProps } from "./props";

function StartingValueInput({
  className,
  value,
  onChange,
  disabled,
}: {
  className: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const visibleValue = value.replace(/^\[/, "").replace(/\]$/, "");

  // match:
  //  - [23]
  //  - [23.45]
  //  - [   23.45 .. 44  ]
  //  - [   23.45 .. 44.55   ]
  // TODO: Should it work with float values at all?
  const isError = !value.match(/^\[\s*\d+(\.\d+)?\s*(\.\.\s*\d+(\.\d+)?\s*)?\]$/);

  return (
    <input
      disabled={disabled}
      className={classNames(className, isError ? "is-invalid" : "")}
      value={visibleValue}
      onChange={(e) => {
        if (!e.target.value) {
          onChange("[0]");
        } else {
          onChange(`[${e.target.value}]`);
        }
      }}
      title={isError ? "Формат либо число, либо диапазон например 10..20" : ""}
    />
  );
}

function QuestParamSettings({
  param,
  setParam,
  quest,
}: {
  param: DeepImmutable<QMParam>;
  setParam: (newParam: DeepImmutable<QMParam>) => void;
  quest: Quest;
}) {
  const paramTypeNames = ["Обычный", "Провальный", "Успешный", "Смертельный"];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <label className="form-check-label ml-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={param.active}
            onChange={(e) =>
              setParam({
                ...param,
                active: !param.active,
              })
            }
          />
          Включен
        </label>

        <label className="form-check-label ml-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={param.isMoney}
            onChange={(e) => {
              if (!param.isMoney) {
                const paramIdMoney = quest.params.findIndex((p, pId) => p.isMoney);
                if (paramIdMoney !== -1) {
                  toast(`Параметр [p${paramIdMoney + 1}] уже является деньгами игрока`);
                  return;
                }
              }
              setParam({
                ...param,
                isMoney: !param.isMoney,
              });
            }}
            disabled={!param.active}
          />
          Деньги игрока
        </label>

        <label className="form-check-label ml-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={param.showWhenZero}
            onChange={(e) =>
              setParam({
                ...param,
                showWhenZero: !param.showWhenZero,
              })
            }
            disabled={!param.active}
          />
          Показывать при нуле
        </label>
      </div>
      <div className="d-flex align-items-center mb-2">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Рабочее название
        </label>
        <input
          disabled={!param.active}
          className="form-control w-100 ml-2"
          value={param.name}
          onChange={(e) => setParam({ ...param, name: e.target.value })}
        />
      </div>

      <div className="d-flex align-items-center justify-content-around mb-2">
        {paramTypeNames.map((typeName, typeIndex) => (
          <label className="form-check-label ml-4">
            <input
              className="form-check-input"
              type="radio"
              disabled={!param.active}
              checked={param.type === typeIndex}
              onChange={() =>
                setParam({
                  ...param,
                  type: typeIndex,
                })
              }
            />
            {typeName}
          </label>
        ))}
      </div>

      <div className="d-flex align-items-center justify-content-around mb-2 mt-3">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Мин
        </label>
        <input
          disabled={!param.active}
          className="form-control ml-2 mr-3"
          type="number"
          value={param.min}
          onChange={(e) => setParam({ ...param, min: parseInt(e.target.value) })}
        />

        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Макс
        </label>
        <input
          disabled={!param.active}
          className="form-control ml-2 mr-3"
          type="number"
          value={param.max}
          onChange={(e) => setParam({ ...param, max: parseInt(e.target.value) })}
        />
      </div>

      <div className="d-flex align-items-center mb-2">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Стартовое значение
        </label>
        <StartingValueInput
          disabled={!param.active}
          className="form-control w-100 ml-2"
          value={param.starting}
          onChange={(newValue) => setParam({ ...param, starting: newValue })}
        />
      </div>

      {param.type !== ParamType.Обычный ? (
        <>
          <div className="d-flex align-items-center justify-content-around mt-3 mb-2">
            <label className="form-check-label ml-4 mr-2">
              <input
                className="form-check-input"
                type="radio"
                disabled={!param.active}
                checked={param.critType === ParamCritType.Минимум}
                onChange={(e) =>
                  setParam({
                    ...param,
                    critType: ParamCritType.Минимум,
                  })
                }
              />
              Критичный минимум
            </label>

            <label className="form-check-label ml-4">
              <input
                className="form-check-input"
                type="radio"
                disabled={!param.active}
                checked={param.critType === ParamCritType.Максимум}
                onChange={(e) =>
                  setParam({
                    ...param,
                    critType: ParamCritType.Максимум,
                  })
                }
              />
              Критичный максимум
            </label>
          </div>

          <textarea
            style={{
              resize: "none",
            }}
            className={classNames("form-control h-100")}
            rows={4}
            value={param.critValueString}
            onChange={(e) => {
              setParam({ ...param, critValueString: e.target.value });
            }}
          />
          <MediaEdit
            media={param}
            setMedia={(media) =>
              setParam({ ...param, img: media.img, track: media.track, sound: media.sound })
            }
          />
        </>
      ) : null}
    </div>
  );
}

export function QuestParamsSettings({ quest, setQuest }: QuestSettingsTabProps) {
  const [paramId, setParamId] = React.useState(0);

  return (
    <>
      <div className="row mt-3">
        <div className="col-4">
          <select
            className="form-control"
            value={paramId}
            size={20}
            onChange={(e) => setParamId(parseInt(e.target.value))}
          >
            {quest.params.map((param, idx) => {
              const textName = `[p${idx + 1}] (${param.name})`;
              return (
                <option className={param.active ? "" : "text-muted"} value={idx} key={idx}>
                  {textName}
                </option>
              );
            })}
          </select>

          <div className="mt-2 d-flex justify-content-center">
            <button
              className="btn btn-danger mr-2"
              disabled={quest.params.length <= 1 || paramId !== quest.paramsCount - 1}
              onClick={() => {
                setQuest(removeLastParameter(quest));
                setParamId(paramId - 1);
              }}
              title={
                quest.params.length === 0
                  ? "Нет параметров"
                  : quest.params.length === 1
                  ? "Нельзя удалить единственный параметр"
                  : paramId !== quest.paramsCount - 1
                  ? "Удалить можно только последний параметр"
                  : ""
              }
            >
              Удалить параметр
            </button>

            <button
              className="btn btn-light mr-2"
              onClick={() => {
                setQuest(addParameter(quest));
                setParamId(quest.paramsCount);
              }}
            >
              Добавить параметр
            </button>
          </div>
        </div>

        <div className="col-4">
          <QuestParamSettings
            param={quest.params[paramId]}
            setParam={(newParam) => {
              setQuest({
                ...quest,
                params: quest.params.map((param, idx) => (idx === paramId ? newParam : param)),
              });
            }}
            quest={quest}
          />
        </div>
      </div>
    </>
  );
}
