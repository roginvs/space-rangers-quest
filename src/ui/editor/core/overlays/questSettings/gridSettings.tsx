import classNames from "classnames";
import * as React from "react";
import { QuestSettingsTabProps } from "./props";

const gridWidths = [0x1e, 0x16, 0x0f, 0x0a];
const gridHeights = [0x18, 0x12, 0x0c, 0x08];

export function QuestGridSettings({ quest, setQuest }: QuestSettingsTabProps) {
  const gridNames = ["Мелкий", "Средний", "Крупный", "Самый крупный"];
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-center">По ширине</div>
        <div className="d-flex align-items-center justify-content-center mb-2">
          {gridWidths.map((gridValue, gridIndex) => (
            <label key={gridIndex} className="form-check-label ml-4 mr-4">
              <input
                className="form-check-input"
                type="radio"
                checked={quest.widthSize === gridValue}
                onChange={() =>
                  setQuest({
                    ...quest,
                    widthSize: gridValue,
                  })
                }
              />
              {gridNames[gridIndex]}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-center">По высоте</div>
        <div className="d-flex align-items-center justify-content-center mb-2">
          {gridHeights.map((gridValue, gridIndex) => (
            <label key={gridIndex} className="form-check-label ml-4 mr-4">
              <input
                className="form-check-input"
                type="radio"
                checked={quest.heightSize === gridValue}
                onChange={() =>
                  setQuest({
                    ...quest,
                    heightSize: gridValue,
                  })
                }
              />
              {gridNames[gridIndex]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
