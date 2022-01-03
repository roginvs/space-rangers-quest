import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";
import { Overlay } from "../overlay";

export function LocationOverlay({
  location,
  setLocation,
}: {
  location: DeepImmutable<Location>;
  setLocation: (location: DeepImmutable<Location> | undefined) => void;
}) {
  const [localLocation, setLocalLocation] = React.useState<DeepImmutable<Location> | undefined>(
    undefined,
  );
  React.useEffect(() => {
    setLocalLocation(location);
  }, [location]);

  const onClose = React.useCallback(() => {
    //TODO promt to save changes
    setLocation(undefined);
  }, []);

  if (!localLocation) {
    return null;
  }

  return (
    <Overlay wide position="absolute" headerText="Редактирование локации" onClose={onClose}>
      <div>
        <div className="row">
          <div className="col-6">
            <div className="text-center">L {location.id}</div>
            <form className="form-inline  d-flex flex-nowrap">
              <label>Описание</label>
              <select className="form-control">
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </select>
              <button className="btn btn-light">Submit</button>
              <button className="btn btn-light">Submit</button>
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
        <button onClick={onClose}>Закрыть</button>
        <button onClick={() => setLocation(localLocation)}>Сохранить</button>
      </div>
    </Overlay>
  );
}
