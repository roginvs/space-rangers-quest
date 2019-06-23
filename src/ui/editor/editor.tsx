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

  @observable
  ref: SVGPathElement | null = null;

  render() {
    const { store, quest, jump } = this.props;
    const startLoc = quest.locations.find(x => x.id === jump.fromLocationId);
    const endLoc = quest.locations.find(x => x.id === jump.toLocationId);
    if (!startLoc || !endLoc) {
      console.error(`Jump id=${jump.id} unable to find locations`);
      return null;
    }
    const myIndex = quest.jumps
      .filter(x => x.fromLocationId === jump.fromLocationId && x.toLocationId === jump.toLocationId)
      .findIndex(x => x.id === jump.id);
    if (myIndex < 0) {
      console.error(`Wrong index for jump id=${jump.id}`);
      return null;
    }
    const middleVectorX = (endLoc.locX - startLoc.locX) / 2;
    const middleVectorY = (endLoc.locY - startLoc.locY) / 2;
    const middleX = startLoc.locX + middleVectorX;
    const middleY = startLoc.locY + middleVectorY;
    const offsetVectorUnnormalizedX = middleVectorY;
    const offsetVectorUnnormalizedY = -middleVectorX;
    const offsetVectorLength = Math.sqrt(
      offsetVectorUnnormalizedX * offsetVectorUnnormalizedX +
        offsetVectorUnnormalizedY * offsetVectorUnnormalizedY,
    );
    const offsetVectorX = (offsetVectorUnnormalizedX / offsetVectorLength) * 30;
    const offsetVectorY = (offsetVectorUnnormalizedY / offsetVectorLength) * 30;

    const offsetVectorCount = Math.floor((myIndex + 1) / 2);
    const offsetVectorSign = myIndex % 2 === 0 ? 1 : -1;
    const controlPointX = middleX + offsetVectorX * offsetVectorCount * offsetVectorSign;
    const controlPointY = middleY + offsetVectorY * offsetVectorCount * offsetVectorSign;
    return (
      <>
        <path
          onMouseEnter={() => (this.hovered = true)}
          onMouseLeave={() => (this.hovered = false)}
          d={[
            "M",
            startLoc.locX,
            startLoc.locY,
            "Q",
            controlPointX,
            controlPointY,
            endLoc.locX,
            endLoc.locY,
          ].join(" ")}
          stroke="black"
          fill="transparent"
          ref={e => {
            if (!this.ref) {
              this.ref = e;
            }
          }}
        />
        {this.hovered ? <InfoPopup anchorEl={this.ref} target={jump} /> : undefined}
      </>
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
