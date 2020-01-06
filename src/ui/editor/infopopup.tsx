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
import { Popper } from "react-popper";
import { ReferenceObject, PopperOptions, Modifiers } from "popper.js";
import { EditorStore } from "./store";
import { assertNever } from "../../lib/formula/calculator";
import { range } from "./utils";

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
          conditionString += `>=${conditions.mustFrom} `;
        }
        if (conditions.mustTo < param.max) {
          conditionString += `<=${conditions.mustTo} `;
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

export class JumpPopupBody extends React.Component<{
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
      <div className="popover" style={{ position: "static", minWidth: 300, overflow: "hidden" }}>
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

export class LocationPopupBody extends React.Component<{
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
      <div className="popover" style={{ position: "static", overflow: "hidden" }}>
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
export class InfoPopup extends React.Component<{
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
    // TODO
    return null;
    /*
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
    */
  }
}
