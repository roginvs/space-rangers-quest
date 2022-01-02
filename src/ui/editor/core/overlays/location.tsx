import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";

export function LocationOverlayContent({
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

  if (!localLocation) {
    return null;
  }
  return (
    <div>
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
      <button onClick={() => setLocation(undefined)}>Закрыть</button>
      <button onClick={() => setLocation(localLocation)}>Сохранить</button>
    </div>
  );
}
