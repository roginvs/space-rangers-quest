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
  /*
  paramsSummary.unshift({
    key: "lol",
    leftText: "blablafasd  asd 3 asd asd asd aqweadszxcxvv",
    rightText: "AAAA",
  });
  */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <span>{location.texts.length > 1 ? "M" : ""}</span>
        <span>L {location.id}</span>
      </div>
      <Divider />
      <div>- {shortInfo} -</div>
      <Divider />
      {firstNotEmptyText ? (
        <>
          <div
            style={{
              textAlign: "center",
              color: "#0000EE",
            }}
          >
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
    </div>
  );
}
