import * as React from "react";
import { Store } from "../store";
import { QM } from "../../lib/qmreader";
import { observer } from "mobx-react";

const colors = {
  background: "#aaaaaa",
  location: {
    starting: "#5455fd",
    final: "#00ff00",
    intermediate: "#ffffff",
    empty: "#004101",
    fail: "#d10201"
  }
} as const;

@observer
export class Editor extends React.Component<{
  store: Store;
  quest: QM;
}> {
  render() {
    const quest = this.props.quest;
    return (
      <div
        style={{
          width: "100%",
          height: "1000px" /*TODO*/,
          position: "relative",
          backgroundColor: colors.background
        }}
      >
        {quest.locations.map(l => (
          <div
            key={l.id}
            style={{
              position: "absolute",
              left: l.locX,
              top: l.locY,
              borderRadius: "100%",
              width: 10,
              height: 10,
              backgroundColor: l.isStarting
                ? colors.location.starting
                : l.isEmpty
                ? colors.location.empty
                : l.isSuccess
                ? colors.location.final
                : l.isFaily || l.isFailyDeadly
                ? colors.location.fail
                : colors.location.intermediate
            }}
          ></div>
        ))}
      </div>
    );
  }
}
