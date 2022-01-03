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
      headerText="Редактирование локации"
      onClose={onCloseWithPrompt}
    >
      <div>
        <div className="row mb-2">
          <div className="col-6">
            <div className="text-center">L {location.id}</div>
            <form className="form-inline  d-flex flex-nowrap">
              <label>Описание</label>
              <select
                className="form-control ml-2"
                value={textIndex}
                onChange={(e) => setTextIndex(parseInt(e.target.value))}
              >
                {range(location.texts.length).map((i) => (
                  <option value={i}>{i + 1}</option>
                ))}
              </select>
              <button
                className="btn btn-light ml-auto"
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
          <div className="col-6">todo</div>
        </div>
        {/*
        <textarea
          value={localLocation.texts[0]}
          onChange={(e) => {
            const newLocation = {
              ...localLocation,
              texts: [e.target.value, ...location.texts.slice(1)],
            };
            setLocalLocation(newLocation);
          }}
        />
        */}
        <button onClick={onCloseWithPrompt}>Закрыть</button>
        <button onClick={() => onClose(location)}>Сохранить</button>
      </div>
    </Overlay>
  );
}
