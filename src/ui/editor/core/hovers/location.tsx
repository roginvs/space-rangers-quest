import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";

export function LocationHover({ location }: { location: DeepImmutable<Location> }) {
  return <div>Location text: {location.texts[0]}</div>;
}
