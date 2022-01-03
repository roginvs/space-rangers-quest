import * as React from "react";
import { JumpLocationParameterConditionSummary } from "./paramsAndChangeConditionsSummary";

export function ParamSummary({ summary }: { summary: JumpLocationParameterConditionSummary }) {
  return (
    <div className="d-flex" style={{ display: "flex", maxWidth: 400, overflow: "hidden" }}>
      <div
        style={{
          whiteSpace: "pre",
          flexShrink: 100,
          overflow: "hidden",
          marginRight: 4,
        }}
      >
        {summary.textName} {summary.leftText}
      </div>
      <div style={{ marginLeft: "auto", flexShrink: 0 }}>{summary.rightText}</div>
    </div>
  );
}

export function Divider() {
  return <div>----------------------------------------------</div>;
}

export function ParamsSummaryColumns({
  paramsSummary,
}: {
  paramsSummary: JumpLocationParameterConditionSummary[];
}) {
  if (paramsSummary.length <= 6) {
    return (
      <>
        {paramsSummary.map((summary) => (
          <ParamSummary key={summary.key} summary={summary} />
        ))}
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-evenly",
      }}
    >
      <div>
        {paramsSummary.map((summary, index) =>
          index % 2 === 0 ? <ParamSummary key={summary.key} summary={summary} /> : null,
        )}
      </div>
      <div>
        {paramsSummary.map((summary, index) =>
          index % 2 !== 0 ? <ParamSummary key={summary.key} summary={summary} /> : null,
        )}
      </div>
    </div>
  );
}
