import classNames from "classnames";
import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Media, ParameterChange, ParameterShowingType, QMParam } from "../../../../lib/qmreader";
import { checkFormula } from "../checkFormula";

export function MediaEdit({ media, setMedia }: { media: Media; setMedia: (media: Media) => void }) {
  return (
    <div className="row">
      <div className="col-4">
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Иллюстрация"
            value={media.img}
            onChange={(e) => setMedia({ ...media, img: e.target.value })}
          />
        </div>
      </div>

      <div className="col-4">
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Фоновый трек"
            value={media.track}
            onChange={(e) => setMedia({ ...media, track: e.target.value })}
          />
        </div>
      </div>

      <div className="col-4">
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Звуковой эффект"
            value={media.sound}
            onChange={(e) => setMedia({ ...media, track: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

interface ParamChangeProps {
  change: DeepImmutable<ParameterChange>;
  param: DeepImmutable<QMParam>;
  onChange: (newChange: DeepImmutable<ParameterChange>) => void;
}
export function ParamChangeTypeEdit({ change, onChange, param }: ParamChangeProps) {
  return (
    <>
      <div className="row">
        <div className="col-6">
          <div className="row form-group">
            <div className="col-6 form-check xform-check-inline">
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  value="option1"
                  checked={
                    !change.isChangePercentage && !change.isChangeValue && !change.isChangeFormula
                  }
                  onClick={() =>
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
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  value="option2/"
                  checked={change.isChangePercentage}
                  onClick={() =>
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
              <label className="form-check-label">
                {" "}
                <input
                  className="form-check-input"
                  type="radio"
                  value="option3"
                  checked={change.isChangeValue}
                  onClick={() =>
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
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  value="option4"
                  checked={change.isChangeFormula}
                  onClick={() =>
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
            <input
              className={classNames(
                "form-control w-100",
                checkFormula(change.changingFormula) ? "is-invalid" : "",
              )}
              value={change.changingFormula}
              onChange={(e) => onChange({ ...change, changingFormula: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="d-flex justify-content-center">
        <div className="form-check form-check-inline">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              value="option1"
              checked={change.showingType === ParameterShowingType.НеТрогать}
              onClick={() => onChange({ ...change, showingType: ParameterShowingType.НеТрогать })}
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
              onClick={() => onChange({ ...change, showingType: ParameterShowingType.Скрыть })}
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
              onClick={() => onChange({ ...change, showingType: ParameterShowingType.Показать })}
            />
            Показать
          </label>
        </div>
      </div>
    </>
  );
}
