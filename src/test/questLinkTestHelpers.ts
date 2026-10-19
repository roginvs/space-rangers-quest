import { Quest } from "../lib/qmplayer/funcs";
import { ParameterShowingType } from "../lib/qmreader";

export function makeParameterChange() {
  return {
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
}

export function makeParamCondition() {
  return {
    mustFrom: -100,
    mustTo: 100,
    mustEqualValues: [],
    mustEqualValuesEqual: false,
    mustModValues: [],
    mustModValuesMod: false,
  };
}

export function makeLocation(id: number, texts: string[], extra: object = {}) {
  return Object.assign(
    {
      dayPassed: false,
      id,
      isStarting: false,
      isSuccess: false,
      isFaily: false,
      isFailyDeadly: false,
      isEmpty: false,
      texts,
      media: texts.map(() => ({ img: undefined, sound: undefined, track: undefined })),
      isTextByFormula: false,
      textSelectFormula: "",
      maxVisits: 0,
      locX: 0,
      locY: 0,
    },
    extra,
  );
}

export function makeJump(id: number, fromLocationId: number, toLocationId: number, text: string) {
  return {
    priority: 1,
    dayPassed: false,
    id,
    fromLocationId,
    toLocationId,
    alwaysShow: false,
    jumpingCountLimit: 0,
    showingOrder: 5,
    paramsChanges: [] as object[],
    paramsConditions: [] as object[],
    formulaToPass: "",
    text,
    description: "",
  };
}

/** Minimal quest with one param and the door-room-key scenario */
export function makeTestQuest() {
  const quest: any = {
    givingRace: 31,
    whenDone: 1,
    planetRace: 64,
    playerCareer: 7,
    playerRace: 31,
    defaultJumpCountLimit: 0,
    hardness: 50,
    paramsCount: 1,
    majorVersion: 1,
    minorVersion: 0,
    screenSizeX: 1920,
    screenSizeY: 1009,
    reputationChange: 0,
    widthSize: 10,
    heightSize: 8,
    strings: {
      ToStar: "<ToStar>",
      ToPlanet: "<ToPlanet>",
      Date: "<Date>",
      Money: "<Money>",
      FromPlanet: "<FromPlanet>",
      FromStar: "<FromStar>",
      Ranger: "<Ranger>",
    },
    locationsCount: 6,
    jumpsCount: 7,
    successText: "success",
    taskText: "task",
    header: 1111111116,
    params: [
      {
        min: 0,
        max: 100,
        type: 0,
        showWhenZero: true,
        critType: 0,
        active: true,
        isMoney: false,
        name: "Count",
        starting: "7",
        critValueString: "",
        showingInfo: [],
        img: undefined,
        sound: undefined,
        track: undefined,
      },
    ],
    locations: [],
    jumps: [],
  };

  quest.locations = [
    makeLocation(1, ["Начало. Дверь: <link=Открыть дверь>открыть</link>."], {
      isStarting: true,
    }),
    makeLocation(2, ["Дверь открыта"]),
    makeLocation(3, ["Вы в комнате"]),
    makeLocation(4, ["Ключ у вас"], {
      isSuccess: true,
    }),
    makeLocation(5, ["Окно"]),
    makeLocation(6, ["Дубликат"]),
  ];

  quest.jumps = [
    // has formatting tags inside, the link name does not
    makeJump(1, 1, 2, "<clr>Открыть дверь<clrEnd>"),
    makeJump(2, 2, 3, "Войти в комнату"),
    makeJump(3, 3, 4, "Взять ключ"),
    // The "missing second jump": exists from loc 1 but not after the first jump
    makeJump(4, 1, 5, "Открыть окно"),
    makeJump(5, 3, 6, "Осмотреть ключ"),
    // Inactive jump (formula always false)
    Object.assign(makeJump(6, 1, 6, "Скрытый переход"), {
      formulaToPass: "0",
      alwaysShow: true,
    }),
    // Substitution of parameters in the choice text
    makeJump(7, 1, 5, "[p1] правок"),
  ];

  for (const location of quest.locations) {
    location.paramsChanges = [makeParameterChange()];
  }
  for (const jump of quest.jumps) {
    jump.paramsChanges = [makeParameterChange()];
    jump.paramsConditions = [makeParamCondition()];
  }

  return quest as Quest;
}
