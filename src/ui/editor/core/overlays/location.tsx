import classNames from "classnames";
import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import { Location } from "../../../../lib/qmreader";
import { checkFormula } from "../checkFormula";
import { Overlay } from "../overlay";
import { range } from "../utils";
import { MediaEdit } from "./common";

export function LocationOverlay({
  quest,
  initialLocation,
  onClose,
}: {
  quest: Quest;
  initialLocation: DeepImmutable<Location>;
  onClose: (location: DeepImmutable<Location> | undefined) => void;
}) {
  const [location, setLocation] = React.useState<DeepImmutable<Location> | undefined>(undefined);
  const [textIndex, setTextIndex] = React.useState(0);
  const [paramId, setParamId] = React.useState(0);

  React.useEffect(() => {
    setLocation(initialLocation);
    setTextIndex(0);
    setParamId(0);
  }, [initialLocation]);

  const onCloseWithPrompt = React.useCallback(() => {
    //TODO promt to save changes
    onClose(undefined);
  }, []);

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
              <select
                className="form-control ml-2"
                value={textIndex}
                onChange={(e) => setTextIndex(parseInt(e.target.value))}
              >
                {range(location.texts.length).map((i) => (
                  <option value={i}>Описание {i + 1}</option>
                ))}
              </select>
              <button
                className="btn btn-light ml-2"
                onClick={() => {
                  setLocation({
                    ...location,
                    texts: [...location.texts, ""],
                    media: [...location.media, { img: "", track: "", sound: "" }],
                  });
                  setTextIndex(location.texts.length);
                }}
              >
                Добавить
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
              >
                Удалить
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
              >
                <option value={"serial"}>Выбирать по порядку</option>
                <option value={"formula"}>Выбирать по формуле</option>
              </select>
              {location.isTextByFormula && (
                <input
                  className={classNames(
                    "form-control ml-2 flex-fill",
                    checkFormula(location.textSelectFormula) ? "is-invalid" : "",
                  )}
                  value={location.textSelectFormula}
                  onChange={(e) => setLocation({ ...location, textSelectFormula: e.target.value })}
                />
              )}
            </form>
          </div>
        </div>

        <textarea
          className="form-control mb-1"
          rows={10}
          value={location.texts[textIndex]}
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
          media={location.media[textIndex]}
          setMedia={(newMedia) =>
            setLocation({
              ...location,
              media: location.media.map((media, i) => (i === textIndex ? newMedia : media)),
            })
          }
        />

        <div className="row">
          <div className="col-6">
            <div className="overflow-auto" style={{ minHeight: 200 }}>
              <select
                className="form-control"
                value={paramId}
                size={10}
                onChange={(e) => setParamId(parseInt(e.target.value))}
              >
                {quest.params.map((param, idx) => (
                  <option className={param.active ? "" : "text-muted"} value={idx}>
                    [p{idx + 1}] {param.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button onClick={onCloseWithPrompt}>Закрыть</button>
        <button onClick={() => onClose(location)}>Сохранить</button>
      </div>
    </Overlay>
  );
}
