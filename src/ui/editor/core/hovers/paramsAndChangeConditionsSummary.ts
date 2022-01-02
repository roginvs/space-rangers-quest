import { assertNever } from "../../../../assertNever";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import {
  JumpParameterCondition,
  ParameterChange,
  ParameterShowingType,
} from "../../../../lib/qmreader";
import { range } from "../utils";

export interface JumpLocationParameterConditionSummary {
  key: string;
  leftText: string;
  rightText: string;
}

export function getSummaryForParamsChangeAndConditions(
  quest: Quest,
  paramsChanges: DeepImmutable<ParameterChange[]>,
  paramsConditions: JumpParameterCondition[] | null,
): JumpLocationParameterConditionSummary[] {
  return range(quest.paramsCount)
    .map((paramId) => {
      const change = paramsChanges[paramId];
      const showHideString =
        change.showingType === ParameterShowingType.НеТрогать
          ? ""
          : change.showingType === ParameterShowingType.Показать
          ? " (показать)"
          : change.showingType === ParameterShowingType.Скрыть
          ? " (скрыть)"
          : assertNever(change.showingType);
      const changeString = change.isChangeValue
        ? `:= ${change.change}`
        : change.isChangePercentage
        ? change.change > 0
          ? `+${change.change}%`
          : change.change < 0
          ? `${change.change}%x`
          : ""
        : change.isChangeFormula
        ? `:= ${change.changingFormula}`
        : change.change > 0
        ? `+${change.change}`
        : change.change < 0
        ? `${change.change}`
        : "";
      let conditionString = "";
      const param = quest.params[paramId];

      if (paramsConditions) {
        const conditions = paramsConditions[paramId];
        if (conditions.mustFrom > param.min) {
          conditionString += `>=${conditions.mustFrom} `;
        }
        if (conditions.mustTo < param.max) {
          conditionString += `<=${conditions.mustTo} `;
        }
        if (conditions.mustEqualValues.length > 0) {
          conditionString += conditions.mustEqualValuesEqual ? "==" : "!==";
          conditions.mustEqualValues.forEach((v) => (conditionString += `${v}`));
          conditionString += " ";
        }
        if (conditions.mustModValues.length > 0) {
          conditionString += conditions.mustModValuesMod ? "%" : "!%";
          conditions.mustModValues.forEach((v) => (conditionString += `${v}`));
          conditionString += " ";
        }
      }
      if (!param.active || (!changeString && !showHideString && !conditionString)) {
        return {
          key: `changeandcondition-${paramId}`,
          leftText: "",
          rightText: "",
        };
      }

      return {
        key: `changeandcondition-${paramId}`,
        leftText: `[p${paramId + 1}] (${param.name})${showHideString} ${conditionString}`,
        rightText: changeString,
      };
    })
    .filter((x) => x.leftText || x.rightText);
}
