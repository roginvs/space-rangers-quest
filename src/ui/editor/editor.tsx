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
import { colors } from "./colors";
import { JumpArrow } from "./jumpArrow";
import { LocationPoint } from "./locationPoint";

@observer
export class Editor extends React.Component<{
  store: EditorStore;
}> {
  render() {
    const store = this.props.store;
    const quest = this.props.store.quest;
    return (
      <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div>Header</div>
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
              } else {
                console.info("TODO");
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
      </div>
    );
  }
}
