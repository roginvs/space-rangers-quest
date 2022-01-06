import classNames from "classnames";
import * as React from "react";
import { DeepImmutable } from "../../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { QMParam } from "../../../../../lib/qmreader";
import { addParameter, removeLastParameter } from "../../actions";
import { getParamStringInfo } from "../../hovers/paramsAndChangeConditionsSummary";
import { QuestSettingsTabProps } from "./props";

function QuestParamSettings({
  param,
  setParam,
}: {
  param: DeepImmutable<QMParam>;
  setParam: (newParam: DeepImmutable<QMParam>) => void;
}) {
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
    </div>
  );
}

export function QuestParamsSettings({ quest, setQuest }: QuestSettingsTabProps) {
  const [paramId, setParamId] = React.useState(0);

  return (
    <>
      <div className="row mt-3">
        <div className="col-6">
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

        <div className="col-6">
          <QuestParamSettings
            param={quest.params[paramId]}
            setParam={(newParam) => {
              setQuest({
                ...quest,
                params: quest.params.map((param, idx) => (idx === paramId ? newParam : param)),
              });
            }}
          />
        </div>
      </div>
    </>
  );
}
