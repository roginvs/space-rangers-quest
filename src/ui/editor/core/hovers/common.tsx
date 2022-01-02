import * as React from "react";
import { JumpLocationParameterConditionSummary } from "./paramsAndChangeConditionsSummary";

export function ParamSummary({ summary }: { summary: JumpLocationParameterConditionSummary }) {
  return (
    <div style={{ display: "flex", width: "100%", maxWidth: 300 }}>
      <span>{summary.leftText}</span>
      <span style={{ marginLeft: "auto", flexShrink: 0 }}>{summary.rightText}</span>
    </div>
  );
}
