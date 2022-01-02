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
  return <div> TODO</div>;
}
