import classNames from "classnames";
import * as React from "react";
import { QuestSettingsTabProps } from "./props";

export function QuestVersionSettings({ quest, setQuest }: QuestSettingsTabProps) {
  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-around mb-4 mt-3">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Глав. версия
        </label>
        <input
          className="form-control ml-2 mr-3"
          type="number"
          value={quest.majorVersion}
          onChange={(e) => setQuest({ ...quest, majorVersion: parseInt(e.target.value) })}
        />

        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Пром. версия
        </label>
        <input
          className="form-control ml-2 mr-3"
          type="number"
          value={quest.minorVersion}
          onChange={(e) => setQuest({ ...quest, minorVersion: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label>Комментарий</label>
        <textarea
          style={{
            resize: "none",
          }}
          className={classNames("form-control")}
          rows={12}
          value={quest.changeLogString}
          onChange={(e) => {
            setQuest({ ...quest, changeLogString: e.target.value });
          }}
          placeholder="Комментарии к версии"
        />
      </div>
    </div>
  );
}
