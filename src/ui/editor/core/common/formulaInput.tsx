import classNames from "classnames";
import * as React from "react";

export function FormulaInput({}: {
  className: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className={classNames(
        "form-control w-100",
        checkFormula(change.changingFormula) ? "is-invalid" : "",
      )}
      value={change.changingFormula}
      onChange={(e) => onChange({ ...change, changingFormula: e.target.value })}
    />
  );
}
