import * as React from "react";
import { Store } from "../store";
import { QM, Location } from "../../lib/qmreader";
import { observer } from "mobx-react";
import { observable } from "mobx";

const colors = {
  background: "#aaaaaa",
  location: {
    starting: "#5455fd",
    final: "#00ff00",
    intermediate: "#ffffff",
    empty: "#004101",
    fail: "#d10201",
  },
} as const;

@observer
class LocationPoint extends React.Component<{
  store: Store;
  quest: QM;
  location: Location;
}> {
  @observable
  hovered = false;

  render() {
    const { store, quest, location } = this.props;
    return (
      <div
        key={location.id}
        onMouseEnter={() => (this.hovered = true)}
        onMouseLeave={() => (this.hovered = false)}
        style={{
          position: "absolute",
          left: location.locX,
          top: location.locY,
          borderRadius: "100%",
          width: 10,
          height: 10,
          backgroundColor: location.isStarting
            ? colors.location.starting
            : location.isEmpty
            ? colors.location.empty
            : location.isSuccess
            ? colors.location.final
            : location.isFaily || location.isFailyDeadly
            ? colors.location.fail
            : colors.location.intermediate,
          border: this.hovered ? "3px solid black" : undefined,
          cursor: "pointer",
        }}
      ></div>
    );
  }
}
@observer
export class Editor extends React.Component<{
  store: Store;
  quest: QM;
}> {
  render() {
    const store = this.props.store;
    const quest = this.props.quest;
    return (
      <div
        style={{
          width: "100%",
          height: "1000px" /*TODO*/,
          position: "relative",
          backgroundColor: colors.background,
        }}
      >
        {quest.locations.map(l => (
          <LocationPoint quest={quest} store={store} location={l} />
        ))}
      </div>
    );
  }
}
