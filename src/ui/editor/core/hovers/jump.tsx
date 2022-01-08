import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import { Jump, Location } from "../../../../lib/qmreader";
import { Divider, ParamsSummaryColumns, ParamSummary } from "./common";
import { getSummaryForParamsChangeAndConditions } from "./paramsAndChangeConditionsSummary";

export function JumpHover({ quest, jump }: { quest: Quest; jump: DeepImmutable<Jump> }) {
  const conflictingJumps = quest.jumps.filter(
    (x) => x.fromLocationId === jump.fromLocationId && x.text === jump.text && x.id !== jump.id,
  );

  const priorityString =
    conflictingJumps.length > 0
      ? `Спорный с приоритетом ${jump.priority}`
      : jump.priority !== 1
      ? `Вероятность ${jump.priority}`
      : "";

  const shortInfo = jump.text
    ? jump.description
      ? "Переход с описанием"
      : "Переход без описания"
    : jump.description
    ? "Пустой переход с описанием"
    : "Пустой переход без описания";

  const paramsSummary = getSummaryForParamsChangeAndConditions(
    quest.params,
    quest.paramsCount,
    jump.paramsChanges,
    jump.paramsConditions,
  );

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="w-100 d-flex flex-row justify-content-between">
        <span> </span>
        <span>P {jump.id}</span>
      </div>
      <div>- {shortInfo} -</div>
      <div>{priorityString}</div>
      <Divider />
      {jump.text || jump.description ? (
        <>
          <div className="text-center text-primary">{jump.text}</div>
          {jump.description ? (
            <>
              <div className="text-center text-primary">{"->"}</div>
              <div className="text-center text-primary">{jump.description}</div>
            </>
          ) : null}
          <Divider />
        </>
      ) : null}
      {jump.formulaToPass ? (
        <>
          <div className="text-center">{jump.formulaToPass}</div>
          <Divider />
        </>
      ) : null}
      {paramsSummary.length > 0 && (
        <>
          <ParamsSummaryColumns paramsSummary={paramsSummary} />
          <Divider />
        </>
      )}

      {jump.dayPassed && <div>Прошел один день</div>}
      {jump.jumpingCountLimit > 0 ? (
        <div>Проходимость: {jump.jumpingCountLimit}</div>
      ) : (
        <div>Проходимость неограниченная</div>
      )}
      {jump.alwaysShow && <div>Всегда показывать</div>}
    </div>
  );
}
