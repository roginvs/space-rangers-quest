import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Jump, Location, LocationId, ParameterShowingType } from "../../../lib/qmreader";

export function removeLocation(quest: Quest, location: DeepImmutable<Location>): Quest {
  throw new Error("TODO");
}

export function updateLocation(quest: Quest, newLocation: DeepImmutable<Location>): Quest {
  return {
    ...quest,
    locations: [...quest.locations.filter((l) => l.id !== newLocation.id), newLocation],
  };
}

export function updateJump(quest: Quest, newJump: DeepImmutable<Jump>): Quest {
  return {
    ...quest,
    jumps: [...quest.jumps.filter((j) => j.id !== newJump.id), newJump],
  };
}

export function createLocation(quest: Quest, locX: number, locY: number) {
  let newLocationId = 1;
  while (quest.locations.find((l) => l.id === newLocationId)) {
    newLocationId++;
  }
  const newLocation: DeepImmutable<Location> = {
    id: newLocationId as LocationId,
    dayPassed: false,
    isStarting: false,
    isSuccess: false,
    isEmpty: false,
    isFaily: false,
    isFailyDeadly: false,
    isTextByFormula: false,
    locX: locX,
    locY: locY,
    maxVisits: 0,
    texts: [""],
    media: [
      {
        img: undefined,
        sound: undefined,
        track: undefined,
      },
    ],
    textSelectFormula: "",
    paramsChanges: quest.params.map(() => ({
      change: 0,
      changingFormula: "",
      critText: "",
      critTextFormula: "",
      isChangeFormula: false,
      isChangePercentage: false,
      isChangeValue: false,
      showingType: ParameterShowingType.НеТрогать,
      sound: undefined,
      track: undefined,
      img: undefined,
    })),
  };
  return newLocation;
}
