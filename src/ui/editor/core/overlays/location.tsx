import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";
import { Overlay } from "../overlay";
import { range } from "../utils";

export function LocationOverlay({
  initialLocation: initialLocation,
  onClose: onClose,
}: {
  initialLocation: DeepImmutable<Location>;
  onClose: (location: DeepImmutable<Location> | undefined) => void;
}) {
  const [location, setLocation] = React.useState<DeepImmutable<Location> | undefined>(undefined);
  const [textIndex, setTextIndex] = React.useState(0);
  React.useEffect(() => {
    setLocation(initialLocation);
    setTextIndex(0);
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
        <div className="row mb-4">
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
                  className="form-control ml-2 flex-fill"
                  value={location.textSelectFormula}
                  onChange={(e) => setLocation({ ...location, textSelectFormula: e.target.value })}
                />
              )}
            </form>
          </div>
        </div>

        <textarea
          className="form-control"
          rows={10}
          value={location.texts[0]}
          onChange={(e) => {
            const newLocation = {
              ...location,
              texts: [e.target.value, ...location.texts.slice(1)],
            };
            setLocation(newLocation);
          }}
        />

        <button onClick={onCloseWithPrompt}>Закрыть</button>
        <button onClick={() => onClose(location)}>Сохранить</button>
      </div>
    </Overlay>
  );
}
