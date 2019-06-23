import * as React from "react";
import { Store } from "../store";
import { QM, Location, Jump } from "../../lib/qmreader";
import { observer } from "mobx-react";
import { observable } from "mobx";
import Popper from "@material-ui/core/Popper";
import { ReferenceObject } from "popper.js";

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
class InfoPopup extends React.Component<{
  anchorEl: ReferenceObject | null;
  target: Location | Jump;
}> {
  render() {
    const target = this.props.target;
    return (
      <Popper open={true} anchorEl={this.props.anchorEl} popperOptions={{}}>
        <div className="popover" style={{ position: "static", margin: 10 }}>
          <div className="popover-header">Header id={target.id}</div>
          <div className="popover-body">
            The content of the Popper
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            XXX .
          </div>
        </div>
      </Popper>
    );
  }
}
@observer
class LocationPoint extends React.Component<{
  store: Store;
  quest: QM;
  location: Location;
}> {
  @observable
  hovered = false;

  @observable
  ref: SVGCircleElement | null = null;

  render() {
    const { store, quest, location } = this.props;
    return (
      <>
        <circle
          key={location.id}
          onMouseEnter={() => (this.hovered = true)}
          onMouseLeave={() => (this.hovered = false)}
          cx={location.locX}
          cy={location.locY}
          fill={
            location.isStarting
              ? colors.location.starting
              : location.isEmpty
              ? colors.location.empty
              : location.isSuccess
              ? colors.location.final
              : location.isFaily || location.isFailyDeadly
              ? colors.location.fail
              : colors.location.intermediate
          }
          stroke={this.hovered ? "black" : undefined}
          r={7}
          style={{
            cursor: "pointer",
          }}
          ref={e => {
            if (!this.ref) {
              this.ref = e;
            }
          }}
        />
        {this.hovered ? <InfoPopup anchorEl={this.ref} target={location} /> : undefined}
      </>
    );
  }
}

@observer
class JumpArrow extends React.Component<{
  store: Store;
  quest: QM;
  jump: Jump;
}> {
  @observable
  hovered = false;

  render() {
    const { store, quest, jump } = this.props;
    return null;
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
      <svg
        style={{
          width: "100%",
          height: "1000px" /*TODO*/,
          position: "relative",
          backgroundColor: colors.background,
        }}
      >
        {quest.locations.map(l => (
          <LocationPoint quest={quest} store={store} location={l} key={l.id} />
        ))}
        {quest.jumps.map(j => (
          <JumpArrow quest={quest} store={store} jump={j} key={j.id} />
        ))}
      </svg>
    );
  }
}
