import * as React from "react";
import { Store } from "../store";
import {
  QM,
  Location,
  Jump,
  ParamsChanger,
  JumpParameterCondition,
  ParameterChange,
  ParameterShowingType,
} from "../../lib/qmreader";
import { observer } from "mobx-react";
import { observable, computed, runInAction } from "mobx";
import Popper from "@material-ui/core/Popper";
import { ReferenceObject, PopperOptions, Modifiers } from "popper.js";
import { EditorStore } from "./store";
import { assertNever } from "../../lib/formula/calculator";
import { JUMPS_CONTROL_POINT_DISTANCE, JUMP_MARGIN, JUMP_HOVER_ZONE_WIDTH } from "./consts";
import { colors } from "./colors";
import { InfoPopup, JumpPopupBody } from "./infopopup";

@observer
export class JumpArrow extends React.Component<{
  store: EditorStore;
  jump: Jump;
}> {
  @observable
  hovered = false;

  @observable
  lineRef: SVGPathElement | null = null;

  // @observable
  // popperRef: SVGPathElement | null = null;

  render() {
    const store = this.props.store;
    const quest = this.props.store.quest;
    const jump = this.props.jump;

    const startLoc = quest.locations.find(x => x.id === jump.fromLocationId);
    const endLoc = quest.locations.find(x => x.id === jump.toLocationId);
    if (!startLoc || !endLoc) {
      console.error(`Jump id=${jump.id} unable to find locations`);
      return null;
    }

    const allJumpFromThisLocations = quest.jumps
      .filter(
        x =>
          (x.fromLocationId === jump.fromLocationId && x.toLocationId === jump.toLocationId) ||
          (x.fromLocationId === jump.toLocationId && x.toLocationId === jump.fromLocationId),
      )
      .sort((a, b) => {
        return a.fromLocationId > b.fromLocationId
          ? 1
          : a.fromLocationId < b.fromLocationId
          ? -1
          : a.showingOrder - b.showingOrder;
      });
    const myIndex = allJumpFromThisLocations.findIndex(x => x.id === jump.id);
    if (myIndex < 0) {
      console.error(`Wrong index for jump id=${jump.id}`);
      return null;
    }

    const orientationIsNormal =
      endLoc.locX !== startLoc.locX
        ? endLoc.locX - startLoc.locX > 0
        : endLoc.locY - startLoc.locY > 0;
    const startX = orientationIsNormal ? startLoc.locX : endLoc.locX;
    const endX = orientationIsNormal ? endLoc.locX : startLoc.locX;
    const startY = orientationIsNormal ? startLoc.locY : endLoc.locY;
    const endY = orientationIsNormal ? endLoc.locY : startLoc.locY;
    const allJumpsCount = allJumpFromThisLocations.length;
    const middleVectorX = (endX - startX) / 2;
    const middleVectorY = (endY - startY) / 2;
    const middleX = startX + middleVectorX;
    const middleY = startY + middleVectorY;
    const offsetVectorUnnormalizedX = middleVectorY;
    const offsetVectorUnnormalizedY = -middleVectorX;
    const offsetVectorLength = Math.sqrt(
      offsetVectorUnnormalizedX * offsetVectorUnnormalizedX +
        offsetVectorUnnormalizedY * offsetVectorUnnormalizedY,
    );
    const offsetVectorX =
      (offsetVectorUnnormalizedX / offsetVectorLength) * JUMPS_CONTROL_POINT_DISTANCE;
    const offsetVectorY =
      (offsetVectorUnnormalizedY / offsetVectorLength) * JUMPS_CONTROL_POINT_DISTANCE;

    const offsetVectorCount = myIndex;

    const shiftMultiplier = allJumpsCount > 1 ? (allJumpsCount - 1) / 2 : 0;
    const controlPointX =
      middleX + offsetVectorX * offsetVectorCount - offsetVectorX * shiftMultiplier;
    const controlPointY =
      middleY + offsetVectorY * offsetVectorCount - offsetVectorY * shiftMultiplier;

    const paddedStart = this.lineRef ? this.lineRef.getPointAtLength(JUMP_MARGIN) : undefined;
    const paddedEnd = this.lineRef
      ? this.lineRef.getPointAtLength(this.lineRef.getTotalLength() - JUMP_MARGIN)
      : undefined;

    return (
      <>
        {paddedStart && paddedEnd ? (
          <>
            {/*jump.id === 346 || jump.id === 293 ? (
              <path
                d={[
                  "M",
                  middleX,
                  middleY,
                  "L",
                  startX,
                  startY,
                  //middleX + offsetVectorUnnormalizedX,
                  //middleY + offsetVectorUnnormalizedY,
                ].join(" ")}
                stroke={"green"}
                strokeWidth={5}
                fill="none"
              />
              ) : null*/}
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
              stroke={colors.jump.line}
              strokeWidth={this.hovered && !store.moving ? 3 : 1}
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
              strokeWidth={JUMP_HOVER_ZONE_WIDTH}
              fill="none"
              onMouseEnter={() => {
                // console.info(`Enter jump=${jump.id}`);
                this.hovered = true;
              }}
              onMouseLeave={() => {
                //console.info(`Leave jump=${jump.id}`);
                this.hovered = false;
              }}
              onClick={() => {
                console.info(`Click jump=${jump.id}`);
              }}
            />
          </>
        ) : null}

        {this.hovered && !store.moving ? (
          <InfoPopup anchorEl={this.lineRef}>
            <JumpPopupBody store={this.props.store} jump={jump} />
          </InfoPopup>
        ) : (
          undefined
        )}
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
