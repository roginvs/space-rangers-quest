import classNames from "classnames";
import * as React from "react";
import { QuestSettingsTabProps } from "./props";

export function QuestStringsSettings({ quest, setQuest }: QuestSettingsTabProps) {
  // tslint:disable-next-line:no-useless-cast
  const stringsKeys = ["Ranger", "ToPlanet", "ToStar", "FromPlanet", "FromStar"] as const;
  // tslint:disable-next-line:no-useless-cast
  const legacyStringsKeys = ["Money", "Date"] as const;
  return (
    <div className="p-4">
      {[...stringsKeys, ...legacyStringsKeys].map((key) => (
        <div key={key} className="d-flex align-items-center mb-2">
          <label
            className={
              "form-check-label " + (legacyStringsKeys.find((x) => x === key) ? "text-muted" : "")
            }
            style={{ flexShrink: 0 }}
          >
            {"<"}
            {key}
            {">"}
          </label>

          <input
            className="form-control ml-2"
            value={quest.strings[key]}
            onChange={(e) =>
              setQuest({ ...quest, strings: { ...quest.strings, [key]: e.target.value } })
            }
          />
        </div>
      ))}
    </div>
  );
}
