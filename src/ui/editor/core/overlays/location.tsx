import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";

export function LocationPopup({
  location,
  setLocation,
}: {
  location: DeepImmutable<Location>;
  setLocation: (location: DeepImmutable<Location> | undefined) => void;
}) {
  return (
    <div>
      <textarea
        value={location.texts[0]}
        onChange={(e) => {
          const newLocation = { ...location, texts: [e.target.value, ...location.texts.slice(1)] };
          setLocation(newLocation);
        }}
      />
    </div>
  );
}
