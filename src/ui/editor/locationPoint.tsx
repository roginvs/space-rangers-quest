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
import { LOCATION_RADIUS } from "./consts";
import { InfoPopup, LocationPopupBody } from "./infopopup";
import { colors } from "./colors";

@observer
export class LocationPoint extends React.Component<{
  store: EditorStore;
  location: Location;
}> {
  @observable
  hovered = false;

  @observable
  ref: SVGCircleElement | null = null;

  render() {
    const store = this.props.store;
    // const quest = this.props.store.quest;
    const location = this.props.location;

    const iAmSelected =
      store.selected && store.selected.type === "location" && store.selected.id === location.id;
    const myX =
      store.selected &&
      store.selected.type === "location" &&
      store.selected.id === location.id &&
      store.moving
        ? store.selected.currentX
        : location.locX;
    const myY =
      store.selected &&
      store.selected.type === "location" &&
      store.selected.id === location.id &&
      store.moving
        ? store.selected.currentY
        : location.locY;

    return (
      <>
        <circle
          onMouseEnter={() => {
            // console.info(`Enter location=${location.id}`);
            this.hovered = true;
          }}
          onMouseLeave={() => {
            // console.info(`Leave location=${location.id}`);
            this.hovered = false;
          }}
          onClick={e => {
            // e.stopPropagation();
          }}
          onMouseDown={e => {
            store.selected = {
              type: "location",
              id: location.id,
              initialX: location.locX,
              initialY: location.locY,
              currentX: location.locX,
              currentY: location.locY,
              moving: e.shiftKey || store.mode === "move",
            };
          }}
          cx={myX}
          cy={myY}
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
          opacity={iAmSelected ? 0.5 : 1}
          stroke={this.hovered && !store.moving ? "black" : undefined}
          strokeDasharray={iAmSelected ? 4 : undefined}
          r={LOCATION_RADIUS}
          style={{
            cursor: store.mode === "select" ? "pointer" : undefined,
          }}
          ref={e => {
            if (!this.ref) {
              this.ref = e;
            }
          }}
        />
        {this.hovered && !store.moving ? (
          <InfoPopup anchorEl={this.ref}>
            <LocationPopupBody store={this.props.store} location={location} />
          </InfoPopup>
        ) : (
          undefined
        )}
      </>
    );
  }
}
