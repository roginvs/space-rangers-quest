import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../../../assertNever";
import { DeepImmutable } from "../../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { Location, LocationType } from "../../../../../lib/qmreader";
import { getParamStringInfo } from "../../hovers/paramsAndChangeConditionsSummary";
import { Overlay } from "../../overlay";
import { range } from "../../utils";
import { ParamChangeTypeEdit } from "./common";
import { MediaEdit } from "../MediaEdit";
import { toast } from "react-toastify";
import { useOnDocumentKeyUp } from "../../hooks";
import { FormulaInput } from "../../common/formulaInput";

export function LocationOverlay({
  quest,
  initialLocation,
  onClose,
  enableSaveOnNoChanges,
}: {
  quest: Quest;
  initialLocation: DeepImmutable<Location>;
  onClose: (location: DeepImmutable<Location> | undefined) => void;
  enableSaveOnNoChanges: boolean;
}) {
  const [location, setLocation] = React.useState<DeepImmutable<Location> | undefined>(undefined);
  const [textIndex, setTextIndex] = React.useState(0);
  const [paramId, setParamId] = React.useState(0);

  React.useEffect(() => {
    setLocation(initialLocation);
    setTextIndex(0);
    setParamId(0);
  }, [initialLocation]);

  const [isPrompting, setIsPrompting] = React.useState(false);
  React.useEffect(() => {
    if (!isPrompting) {
      return;
    }
    const timerId = window.setTimeout(() => setIsPrompting(false), 5000);
    return () => window.clearTimeout(timerId);
  });

  const isChanged = location !== initialLocation;

  const onCloseWithPrompt = React.useCallback(() => {
    if (!isChanged) {
      onClose(undefined);
      return;
    }

    if (isPrompting) {
      onClose(undefined);
    } else {
      setIsPrompting(true);
    }
  }, [isChanged, isPrompting]);

  useOnDocumentKeyUp((e) => {
    if (e.key === "Escape") {
      onCloseWithPrompt();
    }
  });

  if (!location) {
    return null;
  }

  return (
    <Overlay
      wide
      position="absolute"
      headerText={`Редактирование локации L ${location.id}`}
      onClose={onCloseWithPrompt}
    >
      <div>
        <div className="row mb-2">
          <div className="col-6">
            <form className="form-inline  d-flex flex-nowrap">
              <div className="btn-group" role="group">
                {range(location.texts.length).map((i) => (
                  <button
                    type="button"
                    className={classNames(
                      "btn",
                      i === textIndex ? "btn-primary" : "btn-light",
                      location.texts[i] ? "font-weight-bold" : "text-muted",
                    )}
                    onClick={() => setTextIndex(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-light ml-2"
                onClick={() => {
                  setLocation({
                    ...location,
                    texts: [...location.texts, ""],
                    media: [
                      ...location.media,
                      { img: undefined, track: undefined, sound: undefined },
                    ],
                  });
                  setTextIndex(location.texts.length);
                }}
                title="Добавить"
                aria-label="Добавить"
              >
                <i className="fa fa-plus fa-fw" />
              </button>
              <button
                className="btn btn-light ml-2"
                disabled={textIndex !== location.texts.length - 1 || textIndex === 0}
                onClick={() => {
                  setLocation({
                    ...location,
                    texts: location.texts.slice(0, location.texts.length - 1),
                    media: location.media.slice(0, location.media.length - 1),
                  });
                  setTextIndex(location.texts.length - 2);
                }}
                title="Удалить"
                aria-label="Удалить"
              >
                <i className="fa fa-minus fa-fw" />
              </button>
            </form>
          </div>
          <div className="col-6">
            <form className="form-inline  d-flex flex-nowrap">
              <select
                className="form-control ml-2"
                value={location.isTextByFormula ? "formula" : "serial"}
                onChange={(e) =>
                  setLocation({ ...location, isTextByFormula: e.target.value === "formula" })
                }
                title={
                  location.isTextByFormula ? "Пустая формула означает выбирать случайно" : undefined
                }
              >
                <option value={"serial"}>Выбирать по порядку</option>
                <option value={"formula"}>Выбирать по формуле</option>
              </select>
              {location.isTextByFormula && (
                <FormulaInput
                  className="form-control ml-2 flex-fill"
                  value={location.textSelectFormula}
                  onChange={(newValue) => setLocation({ ...location, textSelectFormula: newValue })}
                  paramsActive={quest.params}
                  allowEmpty
                />
              )}
            </form>
          </div>
        </div>

        <textarea
          className="form-control mb-1"
          rows={7}
          style={{
            resize: "none",
          }}
          value={location.texts[textIndex] || ""}
          onChange={(e) => {
            const newLocation = {
              ...location,
              texts: location.texts.map((text, index) =>
                index === textIndex ? e.target.value : text,
              ),
            };
            setLocation(newLocation);
          }}
        />

        <MediaEdit
          media={
            location.media[textIndex] || { img: undefined, track: undefined, sound: undefined }
          }
          setMedia={(newMedia) => {
            // Doing this way to create missing media (if any)
            const medias = [...location.media];
            medias[textIndex] = newMedia;
            range(textIndex).forEach((i) => {
              if (!medias[i]) {
                medias[i] = { img: undefined, track: undefined, sound: undefined };
              }
            });
            setLocation({
              ...location,
              media: medias,
            });
          }}
        />

        <div className="row mb-3">
          <div className="col-6">
            <select
              className="form-control"
              value={paramId}
              size={16}
              style={{ height: "100%" }}
              onChange={(e) => setParamId(parseInt(e.target.value))}
            >
              {quest.params.map((param, idx) => {
                const summary = getParamStringInfo(idx, param, location.paramsChanges[idx], null);
                return (
                  <option
                    className={
                      param.active
                        ? summary.leftText || summary.rightText
                          ? "font-weight-bold"
                          : ""
                        : "text-muted"
                    }
                    value={idx}
                    key={idx}
                  >
                    {summary.textName}
                    {summary.leftText} {summary.rightText}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="col-6">
            {quest.params[paramId] && location.paramsChanges[paramId] && (
              <ParamChangeTypeEdit
                change={location.paramsChanges[paramId]}
                param={quest.params[paramId]}
                onChange={(newChange) => {
                  setLocation({
                    ...location,
                    paramsChanges: location.paramsChanges.map((change, i) =>
                      i === paramId ? newChange : change,
                    ),
                  });
                }}
                paramsActive={quest.params}
              />
            )}
          </div>
        </div>

        <div className="form-inline">
          <label className="mr-1">Тип локации </label>
          <select
            className="form-control"
            value={(location.isStarting
              ? LocationType.Starting
              : location.isSuccess
              ? LocationType.Success
              : location.isEmpty
              ? LocationType.Empty
              : location.isFailyDeadly
              ? LocationType.Deadly
              : location.isFaily
              ? LocationType.Faily
              : LocationType
            ).toString()}
            onChange={(e) => {
              const newLocationType = parseInt(e.target.value) as LocationType;
              if (newLocationType === LocationType.Ordinary) {
                setLocation({
                  ...location,
                  isStarting: false,
                  isSuccess: false,
                  isEmpty: false,
                  isFaily: false,
                  isFailyDeadly: false,
                });
              } else if (newLocationType === LocationType.Success) {
                setLocation({
                  ...location,
                  isStarting: false,
                  isSuccess: true,
                  isEmpty: false,
                  isFaily: false,
                  isFailyDeadly: false,
                });
              } else if (newLocationType === LocationType.Starting) {
                const alreadyExistingStarting = quest.locations.find((loc) => loc.isStarting);
                if (alreadyExistingStarting && alreadyExistingStarting.id !== location.id) {
                  toast(`Уже есть локация с типом "Начало" id: ${alreadyExistingStarting.id}`);
                } else {
                  setLocation({
                    ...location,
                    isStarting: true,
                    isSuccess: false,
                    isEmpty: false,
                    isFaily: false,
                    isFailyDeadly: false,
                  });
                }
              } else if (newLocationType === LocationType.Deadly) {
                setLocation({
                  ...location,
                  isStarting: false,
                  isSuccess: false,
                  isEmpty: false,
                  isFaily: true, // Yes, this should be set
                  isFailyDeadly: true,
                });
              } else if (newLocationType === LocationType.Faily) {
                setLocation({
                  ...location,
                  isStarting: false,
                  isSuccess: false,
                  isEmpty: false,
                  isFaily: true,
                  isFailyDeadly: false,
                });
              } else if (newLocationType === LocationType.Empty) {
                setLocation({
                  ...location,
                  isStarting: false,
                  isSuccess: false,
                  isEmpty: true,
                  isFaily: false,
                  isFailyDeadly: false,
                });
              } else {
                assertNever(newLocationType);
              }
            }}
          >
            <option value={LocationType.Ordinary}>Промежуточная</option>
            <option value={LocationType.Starting}>Стартовая</option>
            <option value={LocationType.Empty}>Пустая</option>
            <option value={LocationType.Success}>Победная</option>
            <option value={LocationType.Faily}>Провальная</option>
            <option value={LocationType.Deadly}>Смертельная</option>
          </select>

          <div className="ml-3 form-check form-check-inline">
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={location.dayPassed}
                onChange={(e) => setLocation({ ...location, dayPassed: e.target.checked })}
              />
              Прошел один день
            </label>
          </div>

          <div className="ml-4 form-check form-check-inline">
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={location.maxVisits === 0}
                onChange={(e) => setLocation({ ...location, maxVisits: e.target.checked ? 0 : 1 })}
              />
              Неограниченная проходимость
            </label>
          </div>
          {location.maxVisits > 0 && (
            <input
              className={classNames("form-control ml-2")}
              type="number"
              value={location.maxVisits}
              onChange={(e) => setLocation({ ...location, maxVisits: parseInt(e.target.value) })}
            />
          )}

          <button
            className="btn btn-primary ml-auto mr-2"
            disabled={!isChanged && !enableSaveOnNoChanges}
            onClick={() => onClose(location)}
          >
            Сохранить
          </button>
          <button className="btn btn-danger" onClick={onCloseWithPrompt}>
            {!isPrompting ? "Закрыть" : "Точно закрыть?"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
