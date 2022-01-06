import classNames from "classnames";
import * as React from "react";
import { calculate } from "../../../../lib/formula";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { QMParamIsActive } from "../../../../lib/qmreader";
import { randomFromMathRandom } from "../../../../lib/randomFunc";

export function checkFormula(str: string, params: DeepImmutable<QMParamIsActive[]>) {
  try {
    // We know that calculate will never fail for all param values, so lets provide some dummy values
    // If param is not active then we provide undefined to force calculate to fail

    calculate(
      str,
      params.map((param) => (param.active ? 0 : undefined)),
      randomFromMathRandom,
    );
  } catch (e: any) {
    console.info(e);
    return `${e.message}` || "error";
  }
  return null;
}

export function FormulaInput({
  className,
  value,
  onChange,
  paramsActive,
  allowEmpty,
  disabled,
}: {
  className: string;
  value: string;
  onChange: (value: string) => void;
  paramsActive: DeepImmutable<QMParamIsActive[]>;
  allowEmpty?: boolean;
  disabled?: boolean;
}) {
  const isError = allowEmpty && !value ? null : checkFormula(value, paramsActive);
  return (
    <input
      disabled={disabled}
      className={classNames(className, isError ? "is-invalid" : "")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={isError || undefined}
    />
  );
}
