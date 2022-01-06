import classNames from "classnames";
import * as React from "react";
import { QuestSettingsTabProps } from "./props";

export function QuestJumpSettings({ quest, setQuest }: QuestSettingsTabProps) {
  return (
    <div className="p-4">
      <div className="ml-3">Проходимость переходов по-умолчанию</div>
      <div className="form-inline">
        <div className="ml-4 form-check form-check-inline">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="checkbox"
              checked={quest.defaultJumpCountLimit === 0}
              onChange={(e) =>
                setQuest({ ...quest, defaultJumpCountLimit: e.target.checked ? 0 : 1 })
              }
            />
            Неограниченная
          </label>
        </div>
        {quest.defaultJumpCountLimit > 0 && (
          <input
            className={classNames("form-control ml-2")}
            type="number"
            value={quest.defaultJumpCountLimit}
            onChange={(e) =>
              setQuest({ ...quest, defaultJumpCountLimit: parseInt(e.target.value) })
            }
          />
        )}
      </div>
    </div>
  );
}
