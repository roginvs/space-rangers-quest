import { assertNever } from "../../../../assertNever";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import {
  JumpParameterCondition,
  ParameterChange,
  ParameterShowingType,
  QMParam,
} from "../../../../lib/qmreader";
import { range } from "../utils";

export interface JumpLocationParameterConditionSummary {
  key: string;
  active: boolean;
  textName: string;
  leftText: string;
  rightText: string;
}

export function getParamStringInfo(
  paramId: number,
  param: DeepImmutable<QMParam>,
  paramChange: DeepImmutable<ParameterChange>,
  paramsCondition: DeepImmutable<JumpParameterCondition> | null,
): JumpLocationParameterConditionSummary {
  const showHideString =
    paramChange.showingType === ParameterShowingType.НеТрогать
      ? ""
      : paramChange.showingType === ParameterShowingType.Показать
      ? " (показать)"
      : paramChange.showingType === ParameterShowingType.Скрыть
      ? " (скрыть)"
      : assertNever(paramChange.showingType);
  const changeString = paramChange.isChangeValue
    ? `:=${paramChange.change}`
    : paramChange.isChangePercentage
    ? paramChange.change > 0
      ? `+${paramChange.change}%`
      : paramChange.change < 0
      ? `${paramChange.change}%`
      : ""
    : paramChange.isChangeFormula
    ? `:=${paramChange.changingFormula}`
    : paramChange.change > 0
    ? `+${paramChange.change}`
    : paramChange.change < 0
    ? `${paramChange.change}`
    : "";
  let conditionString = "";

  const conditions = paramsCondition;
  if (conditions) {
    if (conditions.mustFrom > param.min) {
      conditionString += `>=${conditions.mustFrom} `;
    }
    if (conditions.mustTo < param.max) {
      conditionString += `<=${conditions.mustTo} `;
    }
    // TODO: Make it slightly prettier
    if (conditions.mustEqualValues.length > 0) {
      conditionString += conditions.mustEqualValuesEqual ? "==" : "!=";
      conditionString += conditions.mustEqualValues.map((v) => v.toString()).join(";") + " ";
    }
    if (conditions.mustModValues.length > 0) {
      conditionString += conditions.mustModValuesMod ? "%" : "!%";
      conditionString += conditions.mustModValues.map((v) => v.toString()).join(";") + " ";
    }
  }

  return {
    key: `changeandcondition-${paramId}`,
    active: param.active,
    textName: `[p${paramId + 1}] (${param.name})`,
    leftText: showHideString || conditionString ? `${showHideString} ${conditionString}` : "",
    rightText: changeString,
  };
}

export function getSummaryForParamsChangeAndConditions(
  params: DeepImmutable<QMParam[]>,
  paramsCount: number,
  paramsChanges: DeepImmutable<ParameterChange[]>,
  paramsConditions: DeepImmutable<JumpParameterCondition[]> | null,
): JumpLocationParameterConditionSummary[] {
  return range(paramsCount)
    .map((paramId) => {
      const change = paramsChanges[paramId];
      const param = params[paramId];

      const conditions = paramsConditions ? paramsConditions[paramId] : null;

      return getParamStringInfo(paramId, param, change, conditions);
    })
    .filter((param) => param.active)
    .filter((x) => x.leftText || x.rightText);
}
