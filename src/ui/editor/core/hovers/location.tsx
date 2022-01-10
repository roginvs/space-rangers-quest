import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import { Location } from "../../../../lib/qmreader";
import { Divider, ParamsSummaryColumns, ParamSummary } from "./common";
import { getSummaryForParamsChangeAndConditions } from "./paramsAndChangeConditionsSummary";

export function LocationHover({
  quest,
  location,
}: {
  quest: Quest;
  location: DeepImmutable<Location>;
}) {
  const shortInfo = location.isStarting
    ? "Стартовая локация"
    : location.isSuccess
    ? "Победная локация"
    : location.isFailyDeadly
    ? "Смертельная локация"
    : location.isFaily
    ? "Провальная локация"
    : location.isEmpty
    ? "Пустая локация"
    : location.texts.length === 0
    ? "Пустая локация (нет теста)"
    : "Промежуточная локация";

  const firstNotEmptyText = location.texts.find((text) => text);

  const MAX_TEXT_CHARS = 300;

  const paramsSummary = getSummaryForParamsChangeAndConditions(
    quest.params,
    quest.paramsCount,
    location.paramsChanges,
    null,
  );

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="w-100 d-flex flex-row justify-content-between">
        <span>{location.texts.filter((text) => text).length > 1 ? "M" : ""}</span>
        <span>L {location.id}</span>
      </div>
      <Divider />
      <div>- {shortInfo} -</div>
      <Divider />
      {firstNotEmptyText ? (
        <>
          <div className="text-center text-primary">
            {firstNotEmptyText.slice(0, MAX_TEXT_CHARS)}{" "}
            {firstNotEmptyText.length > MAX_TEXT_CHARS ? "..." : ""}
          </div>
          <Divider />
        </>
      ) : null}
      {paramsSummary.length > 0 && (
        <>
          <ParamsSummaryColumns paramsSummary={paramsSummary} />
          <Divider />
        </>
      )}
      {location.dayPassed && <div>Прошел один день</div>}
      {location.maxVisits > 0 ? (
        <div>Проходимость: {location.maxVisits}</div>
      ) : (
        <div>Проходимость неограниченная</div>
      )}
    </div>
  );
}
