import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import {
  Jump,
  JumpId,
  JumpParameterCondition,
  Location,
  LocationId,
  ParamCritType,
  ParameterChange,
  ParameterShowingType,
  ParamType,
  QMParam,
} from "../../../lib/qmreader";

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

function createDefaultParamChange(): ParameterChange {
  return {
    change: 0,
    changingFormula: "",
    critText: "",
    isChangeFormula: false,
    isChangePercentage: false,
    isChangeValue: false,
    showingType: ParameterShowingType.НеТрогать,
    sound: undefined,
    track: undefined,
    img: undefined,
  };
}

function createLocationId(quest: Quest) {
  let newLocationId = 1;
  while (quest.locations.find((l) => l.id === newLocationId)) {
    newLocationId++;
  }
  return newLocationId as LocationId;
}

export function createLocation(quest: Quest, locX: number, locY: number) {
  const newLocation: DeepImmutable<Location> = {
    id: createLocationId(quest),
    dayPassed: false,
    isStarting: false,
    isSuccess: false,
    isEmpty: false,
    isFaily: false,
    isFailyDeadly: false,
    isTextByFormula: false,
    locX,
    locY,
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
    paramsChanges: quest.params.map(() => createDefaultParamChange()),
  };
  return newLocation;
}
export function duplicateLocation(
  quest: Quest,
  location: DeepImmutable<Location>,
  newlocX: number,
  newlocY: number,
) {
  const newLocation: DeepImmutable<Location> = {
    ...location,
    id: createLocationId(quest),
    locX: newlocX,
    locY: newlocY,
  };
  return {
    ...quest,
    locations: [...quest.locations, newLocation],
  };
}

function createJumpId(quest: Quest) {
  let newJumpId = 1;
  while (quest.jumps.find((j) => j.id === newJumpId)) {
    newJumpId++;
  }
  return newJumpId as JumpId;
}

export function createJump(quest: Quest, fromLocationId: LocationId, toLocationId: LocationId) {
  const newJump: DeepImmutable<Jump> = {
    id: createJumpId(quest),
    alwaysShow: false,
    dayPassed: false,
    description: "",
    formulaToPass: "",
    fromLocationId,
    toLocationId,
    img: undefined,
    sound: undefined,
    track: undefined,
    jumpingCountLimit: quest.defaultJumpCountLimit,
    priority: 1,
    showingOrder: 5,
    text: "",
    paramsConditions: quest.params.map((param) => ({
      mustEqualValues: [],
      mustEqualValuesEqual: false,
      mustFrom: param.min,
      mustTo: param.max,
      mustModValues: [],
      mustModValuesMod: false,
    })),
    paramsChanges: quest.params.map(() => createDefaultParamChange()),
  };
  return newJump;
}

export function duplicateJump(
  quest: Quest,
  jump: DeepImmutable<Jump>,
  fromLocationId: LocationId,
  toLocationId: LocationId,
) {
  const newJump: DeepImmutable<Jump> = {
    ...jump,
    id: createJumpId(quest),
    fromLocationId,
    toLocationId,
  };
  return {
    ...quest,
    jumps: [...quest.jumps, newJump],
  };
}

export function addParameter(quest: Quest): Quest {
  const newParam: DeepImmutable<QMParam> = {
    active: true,
    min: 0,
    max: 100,
    type: ParamType.Обычный,
    showWhenZero: true,
    critType: ParamCritType.Минимум,
    isMoney: false,
    name: `Параметр ${quest.paramsCount + 1}`,
    starting: "[0]",
    critValueString: `Сообщение достижения критического значения параметром ${
      quest.paramsCount + 1
    }`,
    showingInfo: [
      {
        from: 0,
        to: 100,
        str: `Параметр ${quest.paramsCount + 1}: <>`,
      },
    ],
    img: undefined,
    sound: undefined,
    track: undefined,
  };

  const createParameterChange = () => {
    const change: ParameterChange = {
      change: 0,
      isChangePercentage: false,
      isChangeValue: false,
      isChangeFormula: false,
      changingFormula: "",
      showingType: ParameterShowingType.НеТрогать,
      critText: "",
      img: undefined,
      sound: undefined,
      track: undefined,
    };
    return change;
  };

  const createParameterCondition = () => {
    const condition: JumpParameterCondition = {
      mustFrom: 0,
      mustTo: 0,
      mustEqualValues: [],
      mustEqualValuesEqual: true,
      mustModValues: [],
      mustModValuesMod: true,
    };
    return condition;
  };

  return {
    ...quest,
    paramsCount: quest.paramsCount + 1,
    params: [...quest.params, newParam],
    locations: quest.locations.map((l) => ({
      ...l,
      paramsChanges: [...l.paramsChanges, createParameterChange()],
    })),
    jumps: quest.jumps.map((j) => ({
      ...j,
      paramsChanges: [...j.paramsChanges, createParameterChange()],
      paramsConditions: [...j.paramsConditions, createParameterCondition()],
    })),
  };
}

export function removeLastParameter(quest: Quest): Quest {
  if (quest.paramsCount === 0) {
    throw new Error(`Нет параметоров вообще`);
  }

  return {
    ...quest,
    paramsCount: quest.paramsCount - 1,
    params: quest.params.slice(0, quest.paramsCount - 1),
    locations: quest.locations.map((l) => ({
      ...l,
      paramsChanges: l.paramsChanges.slice(0, quest.paramsCount - 1),
    })),
    jumps: quest.jumps.map((j) => ({
      ...j,
      paramsConditions: j.paramsConditions.slice(0, quest.paramsCount - 1),
      paramsChanges: j.paramsChanges.slice(0, quest.paramsCount - 1),
    })),
  };
}

export function removeJump(quest: Quest, jumpId: JumpId): Quest {
  return {
    ...quest,
    jumps: quest.jumps.filter((j) => j.id !== jumpId),
  };
}

export function removeLocation(quest: Quest, locationId: LocationId): Quest {
  return {
    ...quest,
    locations: quest.locations.filter((l) => l.id !== locationId),
    jumps: quest.jumps.filter(
      (j) => j.fromLocationId !== locationId && j.toLocationId !== locationId,
    ),
  };
}

export function fixJumpParamMinMax(quest: Quest): Quest {
  return {
    ...quest,
    jumps: quest.jumps.map((j) => ({
      ...j,
      paramsConditions: j.paramsConditions.map((p, idx) => ({
        ...p,
        mustFrom: Math.max(p.mustFrom, quest.params[idx].min),
        mustTo: Math.min(p.mustTo, quest.params[idx].max),
      })),
    })),
  };
}
