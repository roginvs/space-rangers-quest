import classNames from "classnames";
import * as React from "react";
import { DeepImmutable } from "../../../../../lib/qmplayer/deepImmutable";
import {
  ParameterChange,
  ParameterShowingType,
  ParamType,
  QMParam,
  QMParamIsActive,
} from "../../../../../lib/qmreader";
import { FormulaInput } from "../../common/formulaInput";
import { MediaEdit } from "../MediaEdit";

interface ParamChangeProps {
  change: DeepImmutable<ParameterChange>;
  param: DeepImmutable<QMParam>;
  paramsActive: DeepImmutable<QMParamIsActive[]>;
  onChange: (newChange: DeepImmutable<ParameterChange>) => void;
}
export function ParamChangeTypeEdit({ change, onChange, param, paramsActive }: ParamChangeProps) {
  return (
    <div className="d-flex flex-column">
      <div className="row">
        <div className="col-6">
          <div className="row form-group">
            <div className="col-6 form-check xform-check-inline">
              <label className="form-check-label ml-3">
                <input
                  className="form-check-input"
                  type="radio"
                  value="option1"
                  checked={
                    !change.isChangePercentage && !change.isChangeValue && !change.isChangeFormula
                  }
                  onChange={() =>
                    onChange({
                      ...change,
                      isChangePercentage: false,
                      isChangeValue: false,
                      isChangeFormula: false,
                    })
                  }
                />
                Единицы
              </label>
            </div>
            <div className="col-6 form-check xform-check-inline">
              <label className="form-check-label ml-3">
                <input
                  className="form-check-input"
                  type="radio"
                  value="option2/"
                  checked={change.isChangePercentage}
                  onChange={() =>
                    onChange({
                      ...change,
                      isChangePercentage: true,
                      isChangeValue: false,
                      isChangeFormula: false,
                    })
                  }
                />
                Проценты
              </label>
            </div>
          </div>
          <div className="row form-group">
            <div className="col-6 form-check xform-check-inline">
              <label className="form-check-label ml-3">
                {" "}
                <input
                  className="form-check-input"
                  type="radio"
                  value="option3"
                  checked={change.isChangeValue}
                  onChange={() =>
                    onChange({
                      ...change,
                      isChangePercentage: false,
                      isChangeValue: true,
                      isChangeFormula: false,
                    })
                  }
                />
                Значение
              </label>
            </div>
            <div className="col-6 form-check xform-check-inline">
              <label className="form-check-label ml-3">
                <input
                  className="form-check-input"
                  type="radio"
                  value="option4"
                  checked={change.isChangeFormula}
                  onChange={() =>
                    onChange({
                      ...change,
                      isChangePercentage: false,
                      isChangeValue: false,
                      isChangeFormula: true,
                    })
                  }
                />
                Выражение
              </label>
            </div>
          </div>
        </div>
        <div className="col-6">
          {!change.isChangeFormula && !change.isChangeValue && !change.isChangePercentage ? (
            <input
              type="range"
              className="form-range w-100"
              min={param.min - param.max}
              max={param.max - param.min}
              value={change.change}
              onChange={(e) => onChange({ ...change, change: parseInt(e.target.value) })}
            />
          ) : change.isChangeValue ? (
            <input
              type="range"
              className="form-range w-100"
              min={param.min}
              max={param.max}
              value={change.change}
              onChange={(e) => onChange({ ...change, change: parseInt(e.target.value) })}
            />
          ) : change.isChangePercentage ? (
            <input
              type="range"
              className="form-range w-100"
              min={-100}
              max={+100}
              value={change.change}
              onChange={(e) => onChange({ ...change, change: parseInt(e.target.value) })}
            />
          ) : change.isChangeFormula ? (
            <input type="range" className="form-range w-100" max={2} min={0} value={1} disabled />
          ) : null}

          {!change.isChangeFormula ? (
            <input
              type="number"
              className={classNames("form-control w-100")}
              value={change.change}
              onChange={(e) => onChange({ ...change, change: parseInt(e.target.value) })}
            />
          ) : (
            <FormulaInput
              className="form-control w-100"
              value={change.changingFormula}
              onChange={(newValue) => onChange({ ...change, changingFormula: newValue })}
              paramsActive={paramsActive}
            />
          )}
        </div>
      </div>

      <div className="d-flex justify-content-center mb-3">
        <div className="form-check form-check-inline">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              value="option1"
              checked={change.showingType === ParameterShowingType.НеТрогать}
              onChange={() => onChange({ ...change, showingType: ParameterShowingType.НеТрогать })}
            />
            Не трогать
          </label>
        </div>
        <div className="form-check form-check-inline">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              value="option1"
              checked={change.showingType === ParameterShowingType.Скрыть}
              onChange={() => onChange({ ...change, showingType: ParameterShowingType.Скрыть })}
            />
            Скрыть
          </label>
        </div>
        <div className="form-check form-check-inline">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              value="option1"
              checked={change.showingType === ParameterShowingType.Показать}
              onChange={() => onChange({ ...change, showingType: ParameterShowingType.Показать })}
            />
            Показать
          </label>
        </div>
      </div>

      <ParamCritTypeEdit
        param={param}
        onChange={onChange}
        change={change}
        paramsActive={paramsActive}
      />
    </div>
  );
}

export function ParamCritTypeEdit({ change, onChange, param }: ParamChangeProps) {
  const isCrit = param.type !== ParamType.Обычный;
  if (!isCrit) {
    return null;
  }

  return (
    <div className="h-100 d-flex flex-column">
      <textarea
        style={{
          resize: "none",
        }}
        className={classNames(
          "form-control h-100",
          !change.critText || change.critText === param.critValueString ? "text-muted" : "",
        )}
        rows={3}
        value={change.critText || param.critValueString}
        onChange={(e) => {
          onChange({ ...change, critText: e.target.value });
        }}
      />
      <MediaEdit
        media={change}
        setMedia={(media) =>
          onChange({ ...change, img: media.img, track: media.track, sound: media.sound })
        }
      />
    </div>
  );
}
