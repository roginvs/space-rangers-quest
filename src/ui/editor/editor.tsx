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
import { observable, computed } from "mobx";
import Popper from "@material-ui/core/Popper";
import { ReferenceObject, PopperOptions, Modifiers } from "popper.js";
import { EditorStore } from "./store";
import { assertNever } from "../../lib/formula/calculator";

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

function range(n: number) {
  return new Array(n).fill(0).map((zero, index) => index);
}
const Divider = () => <div className="text-center">---</div>;

function getSummaryForParamsChangeAndConditions(
  store: EditorStore,
  target: {
    paramsConditions?: JumpParameterCondition[];
    paramsChanges: ParameterChange[];
  },
): React.ReactNode[] {
  const quest = store.quest;
  return range(quest.paramsCount)
    .map(paramId => {
      const change = target.paramsChanges[paramId];
      const showHideString =
        change.showingType === ParameterShowingType.НеТрогать
          ? ""
          : change.showingType === ParameterShowingType.Показать
          ? " (показать)"
          : change.showingType === ParameterShowingType.Скрыть
          ? " (скрыть)"
          : assertNever(change.showingType);
      const changeString = change.isChangeValue
        ? `:=${change.change}`
        : change.isChangePercentage
        ? change.change > 0
          ? `+${change.change}%`
          : change.change < 0
          ? `${change.change}%x`
          : ""
        : change.isChangeFormula
        ? `:='${change.changingFormula}'`
        : change.change > 0
        ? `+${change.change}`
        : change.change < 0
        ? `${change.change}`
        : "";
      let conditionString = "";
      const param = quest.params[paramId];
      const paramsConditions = target.paramsConditions;
      if (paramsConditions) {
        const conditions = paramsConditions[paramId];
        if (conditions.mustFrom > param.min) {
          conditionString += `>${conditions.mustFrom} `;
        }
        if (conditions.mustTo < param.max) {
          conditionString += `<${conditions.mustTo} `;
        }
        if (conditions.mustEqualValues.length > 0) {
          conditionString += conditions.mustEqualValuesEqual ? "==" : "!==";
          conditions.mustEqualValues.forEach(v => (conditionString += `${v}`));
          conditionString += " ";
        }
        if (conditions.mustModValues.length > 0) {
          conditionString += conditions.mustModValuesMod ? "%" : "!%";
          conditions.mustModValues.forEach(v => (conditionString += `${v}`));
          conditionString += " ";
        }
      }
      if (!changeString && !showHideString && !conditionString) {
        return null;
      }
      return (
        <div style={{ display: "flex" }} key={`changeandcondition-${paramId}`}>
          <span>
            [p{paramId + 1}] ({param.name}){showHideString} {conditionString}
          </span>
          <span style={{ marginLeft: "auto", flexShrink: 0 }}>{changeString}</span>
        </div>
      );
    })
    .filter(x => x !== null);
}

class LocationPopupBody extends React.Component<{
  store: EditorStore;
  location: Location;
}> {
  render() {
    const location = this.props.location;
    const texts = location.texts.filter(x => x);
    const shortInfo = location.isStarting
      ? "Стартовая локация"
      : location.isSuccess
      ? "Победная локация"
      : location.isFailyDeadly
      ? "Смертельная локация"
      : location.isFaily
      ? "Провальная локация"
      : location.isEmpty
      ? "Пустая локация (флаг)"
      : texts.length === 0
      ? "Пустая локация"
      : "Промежуточная локация";
    const paramsInfo = getSummaryForParamsChangeAndConditions(this.props.store, location);

    const firstText = texts.shift();
    return (
      <div className="popover" style={{ position: "static" }}>
        <div className="popover-header" style={{ textAlign: "center" }}>
          <div>
            id={location.id} {shortInfo}
          </div>
        </div>
        <div className="popover-body">
          {firstText ? (
            <div
              className="text-center text-primary"
              style={{ maxHeight: "15em", overflow: "hidden" }}
            >
              {firstText}
            </div>
          ) : null}

          {paramsInfo.length > 0 ? (
            <>
              {firstText ? <Divider /> : null}
              {paramsInfo}
            </>
          ) : null}

          {location.dayPassed || location.maxVisits ? (
            <>
              {" "}
              <Divider />
              {location.maxVisits ? (
                <div className="text-center">Не более {location.maxVisits} раз</div>
              ) : (
                ""
              )}
              {location.dayPassed && <div className="text-center">Прошел один день</div>}
            </>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}
class JumpPopupBody extends React.Component<{
  store: EditorStore;
  jump: Jump;
}> {
  render() {
    const jump = this.props.jump;
    const conflictingJumps = this.props.store.quest.jumps.filter(
      x => x.fromLocationId === jump.fromLocationId && x.text === jump.text && x.id !== jump.id,
    );
    const conflictoryString =
      conflictingJumps.length > 0 ? `Спорный с приоритетом ${jump.priority}` : "";
    const shortInfo = jump.text
      ? jump.description
        ? "Переход с описанием"
        : "Переход без описания"
      : jump.description
      ? "Пустой переход с описанием"
      : "Пустой переход без описания";

    const paramsInfo = getSummaryForParamsChangeAndConditions(this.props.store, this.props.jump);
    return (
      <div className="popover" style={{ position: "static", minWidth: 300 }}>
        <div className="popover-header" style={{ textAlign: "center" }}>
          <div>
            id={jump.id} {shortInfo}
          </div>
          <div>{conflictoryString}</div>
        </div>
        <div className="popover-body">
          <div className="text-center text-primary">{jump.text}</div>
          {jump.description ? (
            <>
              <div className="text-center text-primary">-></div>
              <div className="text-center text-primary">{jump.description}</div>{" "}
            </>
          ) : null}
          {paramsInfo.length > 0 ? (
            <>
              {jump.text || jump.description ? <Divider /> : null}
              {paramsInfo}
            </>
          ) : null}
          {jump.formulaToPass ? (
            <>
              <Divider />
              <div className="text-center">{jump.formulaToPass}</div>
            </>
          ) : null}
          <Divider />
          {jump.jumpingCountLimit ? (
            <div className="text-center">Не более {jump.jumpingCountLimit} переходов</div>
          ) : (
            ""
          )}
          {jump.alwaysShow ? <div className="text-center">Всегда показывать</div> : ""}
          {jump.dayPassed ? <div className="text-center">Прошел один день</div> : ""}
        </div>
      </div>
    );
  }
}
@observer
class InfoPopup extends React.Component<{
  anchorEl: ReferenceObject | null;
}> {
  render() {
    const modifiers: Modifiers = {
      flip: {
        enabled: true,
      },
      preventOverflow: {
        enabled: true,
        boundariesElement: "viewport",
      },
    };
    return (
      <Popper
        open={true}
        anchorEl={addPaddingToPopper(this.props.anchorEl)}
        popperOptions={{
          placement: "right",
        }}
        modifiers={modifiers}
      >
        {this.props.children}
      </Popper>
    );
  }
}
@observer
class LocationPoint extends React.Component<{
  store: EditorStore;
  location: Location;
}> {
  @observable
  hovered = false;

  @observable
  ref: SVGCircleElement | null = null;

  render() {
    // const quest = this.props.store.quest;
    const location = this.props.location;
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
        {this.hovered ? (
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

@observer
class JumpArrow extends React.Component<{
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

    const allJumpsCount = allJumpFromThisLocations.length;
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

    const offsetVectorCount = myIndex;

    const shiftMultiplier = allJumpsCount > 1 ? (allJumpsCount - 1) / 2 : 0;
    const controlPointX =
      middleX + offsetVectorX * offsetVectorCount - offsetVectorX * shiftMultiplier;
    const controlPointY =
      middleY + offsetVectorY * offsetVectorCount - offsetVectorY * shiftMultiplier;

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

        {this.hovered ? (
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

@observer
export class Editor extends React.Component<{
  store: EditorStore;
}> {
  render() {
    const store = this.props.store;
    const quest = this.props.store.quest;
    return (
      <svg
        style={{
          width: store.svgWidth,
          height: store.svgHeight,
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
          <JumpArrow store={store} jump={j} key={j.id} />
        ))}
        {quest.locations.map(l => (
          <LocationPoint store={store} location={l} key={l.id} />
        ))}
      </svg>
    );
  }
}
