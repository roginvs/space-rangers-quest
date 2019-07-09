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
import { EditorStore, EDITOR_MODES } from "./store";
import { assertNever } from "../../lib/formula/calculator";
import { colors } from "./colors";
import { JumpArrow } from "./jumpArrow";
import { LocationPoint } from "./locationPoint";
import { LOCATION_DROP_RADIUS } from "./consts";
import classnames from "classnames";
import { Hotkeys } from "./hotkeys";

@observer
export class Editor extends React.Component<{
  store: EditorStore;
}> {
  render() {
    const store = this.props.store;
    const quest = this.props.store.quest;
    return (
      <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div>
          {EDITOR_MODES.map(mode => (
            <button
              key={mode}
              className={classnames("btn", store.mode === mode ? "btn-info" : "btn-light")}
              onClick={() => (store.mode = mode)}
            >
              {mode === "move" ? (
                <i className="fa fa-arrows" title="Двигать (2)" />
              ) : mode === "select" ? (
                <i className="fa fa-mouse-pointer" title="Выделять (1)" />
              ) : mode === "newJump" ? (
                <i className="fa fa-arrows-h" title="Новый переход (4)" />
              ) : mode === "newLocation" ? (
                <i className="fa fa-circle" title="Новая локация (3)" />
              ) : (
                assertNever(mode)
              )}
            </button>
          ))}
        </div>
        <div
          style={{
            flexGrow: 1,
            alignSelf: "stretch",
            overflow: "scroll",
          }}
        >
          <svg
            style={{
              width: store.svgWidth,
              height: store.svgHeight,
              position: "relative",
              backgroundColor: colors.background,
              cursor:
                store.mode === "move"
                  ? "move"
                  : store.mode === "select"
                  ? "default"
                  : store.mode === "newLocation"
                  ? "crosshair"
                  : store.mode === "newJump"
                  ? "e-resize"
                  : assertNever(store.mode),
            }}
            onClick={e => {
              if (e.target === e.currentTarget) {
                store.selected = undefined;
              }
            }}
            onMouseMove={e => {
              const selected = store.selected;
              if (!selected) {
                return;
              }
              if (selected.moving) {
                selected.currentX = selected.currentX + e.movementX;
                selected.currentY = selected.currentY + e.movementY;
              }
            }}
            onMouseUp={() => {
              const selected = store.selected;
              if (!selected) {
                return;
              }
              if (selected.moving && selected.type === "location") {
                const loc = quest.locations.find(x => x.id === selected.id);
                if (!loc) {
                  console.warn(`Lost location id=${selected.id}`);
                  store.selected = undefined;
                  return;
                }
                const griddedX =
                  Math.round((selected.currentX - store.grixXoffset) / store.gridX) * store.gridX +
                  store.grixXoffset;
                const griddedY =
                  Math.round((selected.currentY - store.grixYoffset) / store.gridY) * store.gridY +
                  store.grixYoffset;
                if (!quest.locations.find(x => x.locX === griddedX && x.locY === griddedY)) {
                  runInAction(() => {
                    loc.locX = griddedX;
                    loc.locY = griddedY;
                    selected.moving = false;
                  });
                } else {
                  runInAction(() => {
                    loc.locX = selected.initialX;
                    loc.locY = selected.initialY;
                    selected.moving = false;
                  });
                }
              } else if (
                selected.moving &&
                (selected.type === "jump_start" || selected.type === "jump_end")
              ) {
                const jump = quest.jumps.find(x => x.id === selected.id);
                if (!jump) {
                  console.warn(`Lost jump id=${selected.id}`);
                  store.selected = undefined;
                  return;
                }
                selected.moving = false;
                const newLocation = quest.locations.find(
                  loc =>
                    (loc.locX - selected.currentX) ** 2 + (loc.locY - selected.currentY) ** 2 <
                    LOCATION_DROP_RADIUS ** 2,
                );
                if (!newLocation) {
                  return;
                }
                if (selected.type === "jump_start") {
                  jump.fromLocationId = newLocation.id;
                } else {
                  jump.toLocationId = newLocation.id;
                }
              } else {
                console.info("TODO: open info popup");
                selected.moving = false;
              }
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
                <path d="M0,0 L0,6 L9,3 z" fill={colors.jump.arrow} />
              </marker>
            </defs>
            {quest.jumps.map(j => (
              <JumpArrow store={store} jump={j} key={j.id} />
            ))}
            {quest.locations.map(l => (
              <LocationPoint store={store} location={l} key={l.id} />
            ))}
          </svg>
        </div>
        <Hotkeys store={store} />
      </div>
    );
  }
}
