import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Location } from "../../../lib/qmreader";

export function removeLocation(quest: Quest, location: DeepImmutable<Location>): Quest {
  throw new Error("TODO");
}

export function updateLocation(quest: Quest, newLocation: DeepImmutable<Location>): Quest {
  return {
    ...quest,
    locations: [...quest.locations.filter((l) => l.id !== newLocation.id), newLocation],
  };
}
