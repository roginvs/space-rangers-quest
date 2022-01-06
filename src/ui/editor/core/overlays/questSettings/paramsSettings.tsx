import classNames from "classnames";
import * as React from "react";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { getParamStringInfo } from "../../hovers/paramsAndChangeConditionsSummary";
import { QuestSettingsTabProps } from "./props";

export function QuestParamsSettings({ quest, setQuest }: QuestSettingsTabProps) {
  const [paramId, setParamId] = React.useState(0);

  return (
    <>
      <div className="row">
        <div className="col-6">
          <select
            className="form-control"
            value={paramId}
            size={16}
            style={{ height: "100%" }}
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
              disabled={quest.params.length === 1 || paramId !== quest.paramsCount - 1}
            >
              Удалить параметр
            </button>

            <button className="btn btn-light mr-2">Добавить параметр</button>
          </div>
        </div>
      </div>
    </>
  );
}
