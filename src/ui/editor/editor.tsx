import * as React from "react";
import { Store } from "../store";
import { QM, Location, Jump } from "../../lib/qmreader";
import { observer } from "mobx-react";
import { observable } from "mobx";
import Popper from "@material-ui/core/Popper";
import { ReferenceObject, PopperOptions, Modifiers } from "popper.js";

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

function addPaddingToPopper(e: ReferenceObject | null): ReferenceObject | null {
  if (!e) {
    return null;
  }
  const PADDING = 5;
  return {
    clientHeight: e.clientHeight,
    clientWidth: e.clientWidth,
    getBoundingClientRect: () => {
      const eRect = e.getBoundingClientRect();
      return {
        bottom: eRect.bottom + 2 * PADDING,
        top: eRect.top - PADDING,
        height: eRect.height + 2 * PADDING,
        width: eRect.width + 2 * PADDING,
        left: eRect.left - PADDING,
        right: eRect.right + 2 * PADDING,
      };
    },
  };
}
@observer
class InfoPopup extends React.Component<{
  anchorEl: ReferenceObject | null;
  target: Location | Jump;
}> {
  render() {
    const target = this.props.target;
    const popperOptions: Modifiers = {
      flip: {
        enabled: true,
      },
      preventOverflow: {
        enabled: true,
        boundariesElement: "window",
      },
    };
    return (
      <Popper
        open={true}
        anchorEl={addPaddingToPopper(this.props.anchorEl)}
        popperOptions={popperOptions}
      >
        <div className="popover" style={{ position: "static" }}>
          <div className="popover-header">
            Header
            {"locX" in target ? "location" : "jump"}
            id={target.id}
          </div>
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
  lineRef: SVGPathElement | null = null;

  // @observable
  // popperRef: SVGPathElement | null = null;

  render() {
    const { store, quest, jump } = this.props;
    const startLoc = quest.locations.find(x => x.id === jump.fromLocationId);
    const endLoc = quest.locations.find(x => x.id === jump.toLocationId);
    if (!startLoc || !endLoc) {
      console.error(`Jump id=${jump.id} unable to find locations`);
      return null;
    }

    const allJumpFromThisLocations = quest.jumps.filter(
      x =>
        (x.fromLocationId === jump.fromLocationId && x.toLocationId === jump.toLocationId) ||
        (x.fromLocationId === jump.toLocationId && x.toLocationId === jump.fromLocationId),
    );
    const myIndex = allJumpFromThisLocations.findIndex(x => x.id === jump.id);
    if (myIndex < 0) {
      console.error(`Wrong index for jump id=${jump.id}`);
      return null;
    }
    const allJumpsEvenCount = allJumpFromThisLocations.length % 2 === 0;
    const middleVectorX =
      (Math.max(endLoc.locX, startLoc.locX) - Math.min(endLoc.locX, startLoc.locX)) / 2;
    const middleVectorY =
      (Math.max(endLoc.locY, startLoc.locY) - Math.min(endLoc.locY, startLoc.locY)) / 2;
    const middleX = Math.min(endLoc.locX, startLoc.locX) + middleVectorX;
    const middleY = Math.min(endLoc.locY, startLoc.locY) + middleVectorY;
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
    const controlPointX =
      middleX +
      offsetVectorX * offsetVectorCount * offsetVectorSign +
      (allJumpsEvenCount ? offsetVectorX * 0.5 : 0);
    const controlPointY =
      middleY +
      offsetVectorY * offsetVectorCount * offsetVectorSign +
      (allJumpsEvenCount ? offsetVectorY * 0.5 : 0);

    const paddedStart = this.lineRef ? this.lineRef.getPointAtLength(10) : undefined;
    const paddedEnd = this.lineRef
      ? this.lineRef.getPointAtLength(this.lineRef.getTotalLength() - 10)
      : undefined;
    const arrowAnchor = this.lineRef
      ? this.lineRef.getPointAtLength(this.lineRef.getTotalLength() - 20)
      : undefined;

    return (
      <>
        {paddedStart && paddedEnd && arrowAnchor ? (
          <>
            <path
              d={[
                "M",
                paddedStart.x,
                paddedStart.y,
                "Q",
                controlPointX,
                controlPointY,
                paddedEnd.x,
                paddedEnd.y,
              ].join(" ")}
              stroke="black"
              strokeWidth={this.hovered ? 3 : 1}
              fill="none"
              markerEnd="url(#arrowBlack)"
            />
            <path
              d={[
                "M",
                paddedStart.x,
                paddedStart.y,
                "Q",
                controlPointX,
                controlPointY,
                paddedEnd.x,
                paddedEnd.y,
              ].join(" ")}
              stroke="transparent"
              //stroke="yellow"
              strokeWidth={10}
              fill="none"
              onMouseEnter={() => {
                console.info(`Enter jump=${jump.id}`);
                this.hovered = true;
              }}
              onMouseLeave={() => {
                console.info(`Leave jump=${jump.id}`);
                this.hovered = false;
              }}
              onClick={() => {
                console.info(`Click jump=${jump.id}`);
              }}
            />
          </>
        ) : null}
        {/*
        <path
          d={[
            "M",
            Math.min(startLoc.locX, endLoc.locX) - 10,
            Math.min(startLoc.locY, endLoc.locY) - 10,
            "L",
            Math.max(startLoc.locX, endLoc.locX) + 10,
            Math.max(startLoc.locY, endLoc.locY) + 10,
          ].join(" ")}
          stroke="none"
          fill="none"
          ref={popperRef => {
            if (!this.popperRef) {
              this.popperRef = popperRef;
            }
          }}
        />
        */}
        {this.hovered ? <InfoPopup anchorEl={this.lineRef} target={jump} /> : undefined}
        <path
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
          stroke="transparent"
          strokeWidth={1}
          fill="none"
          ref={e => {
            if (!this.lineRef) {
              this.lineRef = e;
            }
          }}
        />
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
        <defs>
          <marker
            id="arrowBlack"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
          </marker>
        </defs>
        {quest.jumps.map(j => (
          <JumpArrow quest={quest} store={store} jump={j} key={j.id} />
        ))}
        {quest.locations.map(l => (
          <LocationPoint quest={quest} store={store} location={l} key={l.id} />
        ))}
      </svg>
    );
  }
}
