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

  const conflictoryString =
    conflictingJumps.length > 0 ? `Спорный с приоритетом ${jump.priority}` : "";
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

  // TODO
}
