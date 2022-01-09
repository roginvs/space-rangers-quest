import classNames from "classnames";
import * as React from "react";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { WhenDone } from "../../../../../lib/qmreader";
import { QuestSettingsTabProps } from "./props";

/*
type QuestNumberFlags<ALL extends keyof Quest = keyof Quest> = Quest[ALL] extends number
  ? ALL
  : never;
*/
type QuestNumberFlags = "givingRace" | "playerRace" | "playerCareer" | "planetRace";
function CheckboxFlagsSet<T extends QuestNumberFlags>({
  quest,
  setQuest,
  labels,
  questKey,
}: {
  quest: Quest;
  setQuest: (newQuest: Quest) => void;
  labels: (string | null)[];
  questKey: T;
}) {
  return (
    <div className="d-flex justify-content-center flex-wrap">
      {labels.map((label, i) => {
        if (label === null) {
          return null;
        }
        const isChecked = !!(quest[questKey] & (1 << i));
        const toggle = () => {
          const oldValue: number = quest[questKey];
          const newValue = isChecked ? oldValue - (1 << i) : oldValue + (1 << i);
          setQuest({ ...quest, [questKey]: newValue });
        };
        return (
          <div className="ml-3 form-check form-check-inline" key={i}>
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isChecked}
                onChange={toggle}
              />
              {label}
            </label>
          </div>
        );
      })}
    </div>
  );
}

export function QuestMainSettings({ quest, setQuest }: QuestSettingsTabProps) {
  const givingRaceNames = ["Малоки", "Пеленги", "Люди", "Фэяне", "Гаальцы"];
  const playerRaceNames = ["Малок", "Пеленг", "Человек", "Фэянин", "Гаалец"];
  const planetRaceNames = ["Малоки", "Пеленги", "Люди", "Фэяне", "Гаальцы", null, "Незаселённая"];
  const playerCareerNames = ["Торговец", "Пират", "Воин"];

  return (
    <>
      <div className="row mt-3 mb-3">
        <div className="col-3">
          <div className="text-center">Раса, дающаяя квест</div>
          <CheckboxFlagsSet
            quest={quest}
            setQuest={setQuest}
            questKey="givingRace"
            labels={givingRaceNames}
          />
        </div>
        <div className="col-3">
          <div className="text-center">Раса игрока</div>
          <CheckboxFlagsSet
            quest={quest}
            setQuest={setQuest}
            questKey="playerRace"
            labels={playerRaceNames}
          />
        </div>
        <div className="col-3">
          <div className="text-center">Статус игрока</div>
          <CheckboxFlagsSet
            quest={quest}
            setQuest={setQuest}
            questKey="playerCareer"
            labels={playerCareerNames}
          />
        </div>
        <div className="col-3">
          <div className="text-center">На чьей планете выполняется</div>
          <CheckboxFlagsSet
            quest={quest}
            setQuest={setQuest}
            questKey="planetRace"
            labels={planetRaceNames}
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-4">
          <div className="mr-2">
            <label className="mb-0">
              <span>Отношение после выполнения: </span>
              <span
                className={
                  quest.reputationChange > 0
                    ? "text-success"
                    : quest.reputationChange < 0
                    ? "text-danger"
                    : ""
                }
              >
                {quest.reputationChange > 0 ? "+" : ""}
                {quest.reputationChange}%
              </span>
            </label>
            <input
              type="range"
              className="form-range w-100"
              min={-100}
              max={100}
              value={quest.reputationChange}
              onChange={(e) => setQuest({ ...quest, reputationChange: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="col-4">
          <div className="mr-2">
            <label className="mb-0">
              <span>Сложность квеста: </span>
              <span>{quest.hardness}%</span>
            </label>
            <input
              type="range"
              className="form-range w-100"
              min={0}
              max={100}
              value={quest.hardness}
              onChange={(e) => setQuest({ ...quest, hardness: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="col-4 d-flex align-items-center">
          <div className="ml-3 form-check form-check-inline">
            <label className="form-check-label" title="Не нужно лететь обратно на планету">
              <input
                className="form-check-input"
                type="checkbox"
                checked={quest.whenDone === WhenDone.OnFinish}
                onChange={(e) =>
                  setQuest({
                    ...quest,
                    whenDone:
                      quest.whenDone === WhenDone.OnReturn ? WhenDone.OnFinish : WhenDone.OnReturn,
                  })
                }
              />
              Завершение сразу после выполнения
            </label>
          </div>
        </div>
      </div>
      <div className="text-center">
        <label className="mr-3">Обязательные: {"<ToPlanet> <ToStar> (<Date> или <Day>)"}</label>
        <label>Необязательные: {"<Ranger> <Money> <FromPlanet> <FromStar>"}</label>
      </div>
      <div className="row mb-3">
        <div className="col-6">
          <textarea
            style={{
              resize: "none",
            }}
            className={classNames("form-control h-100")}
            rows={12}
            value={quest.taskText}
            onChange={(e) => {
              setQuest({ ...quest, taskText: e.target.value });
            }}
            placeholder="Текст задания"
          />
        </div>

        <div className="col-6">
          <textarea
            style={{
              resize: "none",
            }}
            className={classNames("form-control h-100")}
            rows={12}
            value={quest.successText}
            onChange={(e) => {
              setQuest({ ...quest, successText: e.target.value });
            }}
            placeholder="Текст поздравления"
          />
        </div>
      </div>
    </>
  );
}
