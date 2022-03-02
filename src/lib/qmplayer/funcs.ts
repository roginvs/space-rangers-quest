import {
  QM,
  Location,
  ParamType,
  ParameterShowingType,
  ParamCritType,
  ParameterChange,
  HEADER_QM_2,
  HEADER_QM_3,
  HEADER_QM_4,
  Jump,
  HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR,
} from "../qmreader";
import { AleaState, Alea } from "../alea";
import { calculate } from "../formula";
import { DeepImmutable } from "./deepImmutable";
import { RandomFunc } from "../randomFunc";
import { substitute } from "../substitution";
import { JUMP_I_AGREE, JUMP_NEXT, JUMP_GO_BACK_TO_SHIP, DEFAULT_DAYS_TO_PASS_QUEST } from "./defs";
import { assertNever } from "../../assertNever";
import * as assert from "assert";
import { Player, Lang, DEFAULT_RUS_PLAYER } from "./player";

export type Quest = DeepImmutable<QM>;

export interface GameLogStep {
  dateUnix: number;
  jumpId: number;
}
export type GameLog = DeepImmutable<{
  aleaSeed: string;
  performedJumps: GameLogStep[];
}>;
export type GameState = DeepImmutable<{
  state:
    | "starting"
    | "location"
    | "jump" // Если переход с описанием и следующая локация не пустая
    | "jumpandnextcrit" // Если переход с описанием и следующая локация не пустая, и параметры достигли критичного
    | "critonlocation" // Параметр стал критичным на локации, доступен только один переход далее
    | "critonlocationlastmessage" // Параметр стал критичным на локации, показывается сообщение последнее
    | "critonjump" // Параметр стал критичным на переходе без описания
    | "returnedending";
  critParamId: number | null;
  locationId: number;
  lastJumpId: number | null;
  possibleJumps: {
    id: number;
    active: boolean;
  }[];
  paramValues: number[];
  paramShow: boolean[];
  jumpedCount: {
    [jumpId: number]: number;
  };
  locationVisitCount: {
    [locationId: number]: number;
  };
  daysPassed: number;
  imageName: string | null;
  trackName: string | null;
  soundName: string | null;

  aleaState: AleaState;
}> &
  GameLog;

interface PlayerChoice {
  text: string;
  jumpId: number;
  active: boolean;
}

export interface PlayerState {
  text: string;
  imageName: string | null;
  trackName: string | null;
  soundName: string | null;
  paramsState: string[];
  choices: PlayerChoice[];
  gameState: "running" | "fail" | "win" | "dead";
}

export function initGame(quest: Quest, seed: string): GameState {
  const alea = new Alea(seed);

  const startLocation = quest.locations.find((x) => x.isStarting);
  if (!startLocation) {
    throw new Error("No start location!");
  }
  const startingParams = quest.params.map((param, index) => {
    if (!param.active) {
      return 0;
    }
    if (param.isMoney) {
      const giveMoney = 2000;
      const money = param.max > giveMoney ? giveMoney : param.max;
      const starting = `[${money}]`;
      return calculate(starting, [], alea.random);
    }
    return calculate(param.starting.replace("h", ".."), [], alea.random);
  });
  const startingShowing = quest.params.map(() => true);

  const state: GameState = {
    state: "starting",
    locationId: startLocation.id,
    lastJumpId: null,
    critParamId: null,
    possibleJumps: [],
    paramValues: startingParams,
    paramShow: startingShowing,
    jumpedCount: {},
    locationVisitCount: {},
    daysPassed: 0,
    imageName: null,
    trackName: null,
    soundName: null,
    aleaState: alea.exportState(),
    aleaSeed: seed,
    performedJumps: [],
  };

  return state;
}

export const TRACK_NAME_RESET_DEFAULT_MUSIC = "Quest";

export function SRDateToString(
  daysToAdd: number,
  lang: Lang,
  initialDate: Date = new Date(), // TODO: use it
) {
  const d = new Date(initialDate.getTime() + 1000 * 60 * 60 * 24 * daysToAdd);
  const months =
    lang === "eng"
      ? [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]
      : [
          "Января",
          "Февраля",
          "Марта",
          "Апреля",
          "Мая",
          "Июня",
          "Июля",
          "Августа",
          "Сентября",
          "Октября",
          "Ноября",
          "Декабря",
        ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 1000}`;
}

/** This function is almost the same as substitute but it takes quest and state */
function replace(
  str: string,
  quest: Quest,
  state: GameState,
  player: Player,
  diamondIndex: number | undefined,
  /** 
   Calling this random affects only visual representation of the game.
   It is used in few quests for example to make some random number on location description.
   */
  random: RandomFunc,
) {
  return substitute(
    str,
    {
      Day: `${DEFAULT_DAYS_TO_PASS_QUEST - state.daysPassed}`,
      Date: SRDateToString(DEFAULT_DAYS_TO_PASS_QUEST, player.lang),
      CurDate: SRDateToString(state.daysPassed, player.lang),
      ...player,
    },
    state.paramValues,
    quest.params,
    random,
    diamondIndex,
  );
}

function getParamsState(quest: Quest, state: GameState, player: Player, random: RandomFunc) {
  const paramsState: string[] = [];
  for (let i = 0; i < quest.paramsCount; i++) {
    if (state.paramShow[i] && quest.params[i].active) {
      const val = state.paramValues[i];
      const param = quest.params[i];
      if (val !== 0 || param.showWhenZero) {
        for (const range of param.showingInfo) {
          if (val >= range.from && val <= range.to) {
            const str = replace(range.str, quest, state, player, i, random);
            paramsState.push(str);
            break;
          }
        }
      }
    }
  }
  return paramsState;
}

function replaceSpecialTrackName(trackName: string | null) {
  if (trackName === TRACK_NAME_RESET_DEFAULT_MUSIC) {
    return null;
  }
  return trackName;
}

function calculateLocationShowingTextId(
  location: DeepImmutable<Location>,
  state: GameState,
  random: RandomFunc,
  showDebug: boolean,
) {
  const locationTextsWithText = location.texts
    .map((text, i) => {
      return { text, i };
    })
    .filter((x) => x.text);

  if (location.isTextByFormula) {
    if (location.textSelectFormula) {
      const id = calculate(location.textSelectFormula, state.paramValues, random) - 1;
      if (location.texts[id]) {
        return id;
      } else {
        if (showDebug) {
          console.warn(`Location id=${location.id} formula result textid=${id}, but no text`);
        }
        return 0; // Tge 4 and 5 shows different here. We will show location text 0
      }
    } else {
      if (showDebug) {
        console.warn(`Location id=${location.id} text by formula is set, but no formula`);
      }
      const textNum = random(locationTextsWithText.length);

      return (locationTextsWithText[textNum] && locationTextsWithText[textNum].i) || 0;
    }
  } else {
    const textNum =
      locationTextsWithText.length > 0
        ? state.locationVisitCount[location.id] % locationTextsWithText.length
        : 0;
    return (locationTextsWithText[textNum] && locationTextsWithText[textNum].i) || 0;
  }
}

export function getUIState(
  quest: Quest,
  state: GameState,
  player: Player,
  showDebug = false,
): PlayerState {
  const alea = new Alea(state.aleaState.slice());
  const random = alea.random;

  const texts =
    player.lang === "rus"
      ? {
          iAgree: "Я берусь за это задание",
          next: "Далее",
          goBackToShip: "Вернуться на корабль",
        }
      : {
          iAgree: "I agree",
          next: "Next",
          goBackToShip: "Go back to ship",
        };

  if (state.state === "starting") {
    return {
      text: replace(quest.taskText, quest, state, player, undefined, random),
      paramsState: [],
      choices: [
        {
          jumpId: JUMP_I_AGREE,
          text: texts.iAgree,
          active: true,
        },
      ],
      gameState: "running",
      imageName: null,
      trackName: null,
      soundName: null,
    };
  } else if (state.state === "jump") {
    const jump = quest.jumps.find((x) => x.id === state.lastJumpId);
    if (!jump) {
      throw new Error(`Internal error: no last jump id=${state.lastJumpId}`);
    }
    return {
      text: replace(jump.description, quest, state, player, undefined, alea.random),
      paramsState: getParamsState(quest, state, player, random),
      choices: [
        {
          jumpId: JUMP_NEXT,
          text: texts.next,
          active: true,
        },
      ],
      gameState: "running",
      imageName: state.imageName,
      trackName: replaceSpecialTrackName(state.trackName),
      soundName: state.soundName,
    };
  } else if (state.state === "location" || state.state === "critonlocation") {
    const location = quest.locations.find((x) => x.id === state.locationId);
    if (!location) {
      throw new Error(`Internal error: no state loc id=${state.locationId}`);
    }

    const locTextId = calculateLocationShowingTextId(location, state, random, showDebug);
    const locationOwnText = location.texts[locTextId] || "";

    const lastJump = quest.jumps.find((x) => x.id === state.lastJumpId);

    const text =
      location.isEmpty && lastJump && lastJump.description ? lastJump.description : locationOwnText;

    return {
      text: replace(text, quest, state, player, undefined, alea.random),
      paramsState: getParamsState(quest, state, player, random),
      choices:
        state.state === "location"
          ? location.isFaily || location.isFailyDeadly
            ? []
            : location.isSuccess
            ? [
                {
                  jumpId: JUMP_GO_BACK_TO_SHIP,
                  text: texts.goBackToShip,
                  active: true,
                },
              ]
            : state.possibleJumps.map((x) => {
                const jump = quest.jumps.find((y) => y.id === x.id);
                if (!jump) {
                  throw new Error(`Internal error: no jump ${x.id} in possible jumps`);
                }
                return {
                  text:
                    replace(jump.text, quest, state, player, undefined, alea.random) || texts.next,
                  jumpId: x.id,
                  active: x.active,
                };
              })
          : [
              {
                // critonlocation
                jumpId: JUMP_NEXT,
                text: texts.next,
                active: true,
              },
            ],

      gameState: location.isFailyDeadly ? "dead" : location.isFaily ? "fail" : "running",
      imageName: state.imageName,
      trackName: replaceSpecialTrackName(state.trackName),
      soundName: state.soundName,
    };
  } else if (state.state === "critonjump") {
    const critId = state.critParamId;
    const jump = quest.jumps.find((x) => x.id === state.lastJumpId);

    if (critId === null || !jump) {
      throw new Error(`Internal error: crit=${critId} lastjump=${state.lastJumpId}`);
    }
    const param = quest.params[critId];
    return {
      text: replace(
        jump.paramsChanges[critId].critText || quest.params[critId].critValueString,
        quest,
        state,
        player,
        undefined,
        alea.random,
      ),
      paramsState: getParamsState(quest, state, player, random),
      choices:
        param.type === ParamType.Успешный
          ? [
              {
                jumpId: JUMP_GO_BACK_TO_SHIP,
                text: texts.goBackToShip,
                active: true,
              },
            ]
          : [],
      gameState:
        param.type === ParamType.Успешный
          ? "running"
          : param.type === ParamType.Провальный
          ? "fail"
          : "dead",
      imageName: state.imageName,
      trackName: replaceSpecialTrackName(state.trackName),
      soundName: state.soundName,
    };
  } else if (state.state === "jumpandnextcrit") {
    const critId = state.critParamId;
    const jump = quest.jumps.find((x) => x.id === state.lastJumpId);
    if (critId === null || !jump) {
      throw new Error(`Internal error: crit=${critId} lastjump=${state.lastJumpId}`);
    }

    // const param = quest.params[critId];
    return {
      text: replace(jump.description, quest, state, player, undefined, alea.random),
      paramsState: getParamsState(quest, state, player, random),
      choices: [
        {
          jumpId: JUMP_NEXT,
          text: texts.next,
          active: true,
        },
      ],
      gameState: "running",
      imageName: state.imageName,
      trackName: replaceSpecialTrackName(state.trackName),
      soundName: state.soundName,
    };
  } else if (state.state === "critonlocationlastmessage") {
    const critId = state.critParamId;
    const location = quest.locations.find((x) => x.id === state.locationId);

    if (critId === null) {
      throw new Error(`Internal error: no critId`);
    }
    if (!location) {
      throw new Error(`Internal error: no crit state location ${state.locationId}`);
    }
    const param = quest.params[critId];

    return {
      text: replace(
        location.paramsChanges[critId].critText || quest.params[critId].critValueString,
        quest,
        state,
        player,
        undefined,
        alea.random,
      ),
      paramsState: getParamsState(quest, state, player, random),
      choices:
        param.type === ParamType.Успешный
          ? [
              {
                jumpId: JUMP_GO_BACK_TO_SHIP,
                text: texts.goBackToShip,
                active: true,
              },
            ]
          : [],
      gameState:
        param.type === ParamType.Успешный
          ? "running"
          : param.type === ParamType.Провальный
          ? "fail"
          : "dead",
      imageName: state.imageName,
      trackName: replaceSpecialTrackName(state.trackName),
      soundName: state.soundName,
    };
  } else if (state.state === "returnedending") {
    return {
      text: replace(quest.successText, quest, state, player, undefined, alea.random),
      paramsState: [],
      choices: [],
      gameState: "win",
      imageName: null,
      trackName: null,
      soundName: null,
    };
  } else {
    return assertNever(state.state);
  }
}

function calculateParamsUpdate(
  quest: Quest,
  stateOriginal: GameState,
  random: RandomFunc,
  paramsChanges: ReadonlyArray<ParameterChange>,
) {
  const critParamsTriggered: number[] = [];
  let state = stateOriginal;
  const oldValues = state.paramValues.slice(0, quest.paramsCount);
  const newValues = state.paramValues.slice(0, quest.paramsCount);

  for (let i = 0; i < quest.paramsCount; i++) {
    const change = paramsChanges[i];
    if (change.showingType === ParameterShowingType.Показать) {
      const paramShow = state.paramShow.slice();
      paramShow[i] = true;
      state = {
        ...state,
        paramShow,
      };
    } else if (change.showingType === ParameterShowingType.Скрыть) {
      const paramShow = state.paramShow.slice();
      paramShow[i] = false;
      state = {
        ...state,
        paramShow,
      };
    }

    if (change.isChangeValue) {
      newValues[i] = change.change;
    } else if (change.isChangePercentage) {
      newValues[i] = Math.round((oldValues[i] * (100 + change.change)) / 100);
    } else if (change.isChangeFormula) {
      if (change.changingFormula) {
        newValues[i] = calculate(change.changingFormula, oldValues, random);
      }
    } else {
      newValues[i] = oldValues[i] + change.change;
    }

    const param = quest.params[i];
    if (newValues[i] > param.max) {
      newValues[i] = param.max;
    }
    if (newValues[i] < param.min) {
      newValues[i] = param.min;
    }

    if (newValues[i] !== oldValues[i] && param.type !== ParamType.Обычный) {
      if (
        (param.critType === ParamCritType.Максимум && newValues[i] === param.max) ||
        (param.critType === ParamCritType.Минимум && newValues[i] === param.min)
      ) {
        critParamsTriggered.push(i);
      }
    }
  }
  state = {
    ...state,
    paramValues: newValues,
  };
  return { state, critParamsTriggered };
}

export function performJump(
  jumpId: number,
  quest: Quest,
  stateOriginal: GameState,
  dateUnix = new Date().getTime(),
  showDebug = true,
): GameState {
  const alea = new Alea(stateOriginal.aleaState.slice());
  const random = alea.random;
  const performedJumps: typeof stateOriginal.performedJumps = [
    ...stateOriginal.performedJumps,
    {
      dateUnix,
      jumpId,
    },
  ];
  let state = {
    ...stateOriginal,
    performedJumps,
  };

  // Clear sound name before jump
  state = {
    ...state,
    soundName: null,
  };

  state = performJumpInternal(jumpId, quest, state, random, showDebug);
  return {
    ...state,
    aleaState: alea.exportState(),
  };
}
function performJumpInternal(
  jumpId: number,
  quest: Quest,
  stateOriginal: GameState,
  random: RandomFunc,
  showDebug: boolean,
): GameState {
  if (jumpId === JUMP_GO_BACK_TO_SHIP) {
    return {
      ...stateOriginal,
      state: "returnedending",
    };
  }

  let state = stateOriginal;

  /*
   // Before for unknown reasons it used media from last jump
   // TODO: Test how original game behaves with media

   const lastJumpMedia = quest.jumps.find((x) => x.id === state.lastJumpId);
   if (lastJumpMedia && lastJumpMedia.img) {
     state = {
       ...state,
       imageName: lastJumpMedia.img,
     };
   }
  */

  const jumpMedia = quest.jumps.find((x) => x.id === jumpId);
  state = {
    ...state,
    imageName: jumpMedia?.img || state.imageName,
    trackName: replaceSpecialTrackName(jumpMedia?.track || state.trackName),
    soundName: jumpMedia?.sound || state.soundName,
  };

  if (state.state === "starting") {
    state = {
      ...state,
      state: "location",
    };
    state = calculateLocation(quest, state, random, showDebug);
  } else if (state.state === "jump") {
    const jump = quest.jumps.find((x) => x.id === state.lastJumpId);
    if (!jump) {
      throw new Error(`Internal error: no jump ${state.lastJumpId}`);
    }
    state = {
      ...state,
      locationId: jump.toLocationId,
      state: "location",
    };
    state = calculateLocation(quest, state, random, showDebug);
  } else if (state.state === "location") {
    if (!state.possibleJumps.find((x) => x.id === jumpId)) {
      throw new Error(
        `Jump ${jumpId} is not in list in that location. Possible jumps=${state.possibleJumps
          .map((x) => `${x.id}(${x.active})`)
          .join(",")}`,
      );
    }
    const jump = quest.jumps.find((x) => x.id === jumpId);
    if (!jump) {
      throw new Error(`"Internal Error: no jump id=${jumpId} from possible jump list`);
    }
    state = {
      ...state,
      lastJumpId: jumpId,
    };
    if (jump.dayPassed) {
      state = {
        ...state,
        daysPassed: state.daysPassed + 1,
      };
    }
    state = {
      ...state,
      jumpedCount: {
        ...state.jumpedCount,
        [jumpId]: (state.jumpedCount[jumpId] || 0) + 1,
      },
    };

    const paramsUpdate = calculateParamsUpdate(quest, state, random, jump.paramsChanges);
    state = paramsUpdate.state;
    const critParamsTriggered = paramsUpdate.critParamsTriggered;

    const nextLocation = quest.locations.find((x) => x.id === jump.toLocationId);
    if (!nextLocation) {
      throw new Error(`Internal error: no next location ${jump.toLocationId}`);
    }

    if (!jump.description) {
      if (critParamsTriggered.length > 0) {
        const critParamId = critParamsTriggered[0];
        state = {
          ...state,
          state: "critonjump",
          critParamId,
        };

        state = {
          ...state,
          imageName:
            jump.paramsChanges[critParamId].img || quest.params[critParamId].img || state.imageName,
          trackName: replaceSpecialTrackName(
            jump.paramsChanges[critParamId].track ||
              quest.params[critParamId].track ||
              state.trackName,
          ),
          soundName:
            jump.paramsChanges[critParamId].sound ||
            quest.params[critParamId].sound ||
            state.soundName,
        };
      } else {
        state = {
          ...state,
          locationId: nextLocation.id,
          state: "location",
        };
        state = calculateLocation(quest, state, random, showDebug);
      }
    } else {
      if (critParamsTriggered.length > 0) {
        state = {
          ...state,
          state: "jumpandnextcrit",
          critParamId: critParamsTriggered[0],
        };
      } else if (nextLocation.isEmpty) {
        state = {
          ...state,
          locationId: nextLocation.id,
          state: "location",
        };
        state = calculateLocation(quest, state, random, showDebug);
      } else {
        state = {
          ...state,
          state: "jump",
        };
      }
    }
  } else if (state.state === "jumpandnextcrit") {
    state = {
      ...state,
      state: "critonjump",
    };
    const jump = quest.jumps.find((x) => x.id === state.lastJumpId);

    state = {
      ...state,
      imageName:
        state.critParamId !== null
          ? (jump && jump.paramsChanges[state.critParamId].img) ||
            quest.params[state.critParamId].img ||
            state.imageName
          : state.imageName,
      trackName: replaceSpecialTrackName(
        state.critParamId !== null
          ? (jump && jump.paramsChanges[state.critParamId].track) ||
              quest.params[state.critParamId].track ||
              state.trackName
          : state.trackName,
      ),
      soundName:
        state.critParamId !== null
          ? (jump && jump.paramsChanges[state.critParamId].sound) ||
            quest.params[state.critParamId].sound ||
            state.soundName
          : state.soundName,
    };
  } else if (state.state === "critonlocation") {
    state = {
      ...state,
      state: "critonlocationlastmessage",
    };
  } else {
    throw new Error(`Unknown state ${state.state} in performJump`);
  }

  return state;
}

function calculateLocation(
  quest: Quest,
  stateOriginal: GameState,
  random: RandomFunc,
  showDebug: boolean,
): GameState {
  if (stateOriginal.state !== "location") {
    throw new Error(`Internal error: expecting "location" state`);
  }

  let state = stateOriginal;
  state = {
    ...state,
    locationVisitCount: {
      ...state.locationVisitCount,
      [state.locationId]:
        // tslint:disable-next-line:strict-type-predicates
        state.locationVisitCount[state.locationId] !== undefined
          ? state.locationVisitCount[state.locationId] + 1
          : 0, // TODO : change to 1
    },
  };

  const location = quest.locations.find((x) => x.id === state.locationId);
  if (!location) {
    throw new Error(`Internal error: no state location ${state.locationId}`);
  }

  const locImgId = calculateLocationShowingTextId(location, state, random, showDebug);

  state = {
    ...state,
    imageName: (location.media[locImgId] && location.media[locImgId].img) || state.imageName,
    trackName: replaceSpecialTrackName(
      (location.media[locImgId] && location.media[locImgId].track) || state.trackName,
    ),
    soundName: (location.media[locImgId] && location.media[locImgId].sound) || state.soundName,
  };

  if (location.dayPassed) {
    state = {
      ...state,
      daysPassed: state.daysPassed + 1,
    };
  }

  const paramsUpdate = calculateParamsUpdate(quest, state, random, location.paramsChanges);
  state = paramsUpdate.state;
  const critParamsTriggered = paramsUpdate.critParamsTriggered;

  const oldTgeBehaviour =
    quest.header === HEADER_QM_2 ||
    quest.header === HEADER_QM_3 ||
    quest.header === HEADER_QM_4 ||
    quest.header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR;

  const allJumpsFromThisLocation = quest.jumps
    .filter((x) => x.fromLocationId === state.locationId)
    .filter((jump) => {
      // Сразу выкинуть переходы в локации с превышенным лимитом
      const toLocation = quest.locations.find((x) => x.id === jump.toLocationId);
      if (toLocation) {
        if (
          toLocation.maxVisits &&
          state.locationVisitCount[jump.toLocationId] + 1 >= toLocation.maxVisits
        ) {
          return false;
        }
      }

      if (oldTgeBehaviour) {
        // Это какая-то особенность TGE - не учитывать переходы, которые ведут в локацию
        // где были переходы, а проходимость закончилась.
        // Это вообще дикость какая-то, потому как там вполне может быть
        // критичный параметр завершить квест
        const jumpsFromDestination = quest.jumps.filter(
          (x) => x.fromLocationId === jump.toLocationId,
        );
        if (jumpsFromDestination.length === 0) {
          // Но если там вообще переходов не было, то всё ок
          return true;
        }
        if (
          jumpsFromDestination.filter(
            (x) => x.jumpingCountLimit && state.jumpedCount[x.id] >= x.jumpingCountLimit,
          ).length === jumpsFromDestination.length
        ) {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    });

  function isJumpActive(jump: DeepImmutable<Jump>) {
    for (let i = 0; i < quest.paramsCount; i++) {
      if (quest.params[i].active) {
        if (
          state.paramValues[i] > jump.paramsConditions[i].mustTo ||
          state.paramValues[i] < jump.paramsConditions[i].mustFrom
        ) {
          return false;
        }
        if (jump.paramsConditions[i].mustEqualValues.length > 0) {
          const isEqual = jump.paramsConditions[i].mustEqualValues.filter(
            (x) => x === state.paramValues[i],
          );
          if (jump.paramsConditions[i].mustEqualValuesEqual && isEqual.length === 0) {
            return false;
          }
          if (!jump.paramsConditions[i].mustEqualValuesEqual && isEqual.length !== 0) {
            return false;
          }
        }
        if (jump.paramsConditions[i].mustModValues.length > 0) {
          const isMod = jump.paramsConditions[i].mustModValues.filter(
            (x) => state.paramValues[i] % x === 0,
          );
          if (jump.paramsConditions[i].mustModValuesMod && isMod.length === 0) {
            return false;
          }
          if (!jump.paramsConditions[i].mustModValuesMod && isMod.length !== 0) {
            return false;
          }
        }
      }
    }
    if (jump.formulaToPass) {
      if (calculate(jump.formulaToPass, state.paramValues, random) === 0) {
        return false;
      }
    }
    if (jump.jumpingCountLimit && state.jumpedCount[jump.id] >= jump.jumpingCountLimit) {
      return false;
    }
    return true;
  }

  // Если есть такие же тексты - то спорный по весам
  // Если текст один - то по вероятности

  /* Own sorting realization to keep sorting "unstable" random, but with same random between browsers */
  const allJumpsFromThisLocationSortered = _sortJumps(allJumpsFromThisLocation, random);

  /*
    console.info('-------------');
    console.info('all', allJumpsFromThisLocation.map(x => `id=${x.id} prio=${x.showingOrder}`).join(', '));
    console.info('sorted', allJumpsFromThisLocationSortered.map(x => `id=${x.id} prio=${x.showingOrder}`).join(', '));
    */

  const allPossibleJumps = allJumpsFromThisLocationSortered.map((jump) => {
    return {
      jump,
      active: isJumpActive(jump),
    };
  });

  const possibleJumpsWithSameTextGrouped: {
    jump: DeepImmutable<Jump>;
    active: boolean;
  }[] = [];

  const seenTexts: {
    [text: string]: boolean;
  } = {};
  for (const j of allPossibleJumps) {
    if (!seenTexts[j.jump.text]) {
      seenTexts[j.jump.text] = true;
      const jumpsWithSameText = allPossibleJumps.filter((x) => x.jump.text === j.jump.text);
      if (jumpsWithSameText.length === 1) {
        if (j.jump.priority < 1 && j.active) {
          const ACCURACY = 1000;
          j.active = random(ACCURACY) < j.jump.priority * ACCURACY;
          // console.info(`Jump ${j.jump.text} is now ${j.active} by random`)
        }
        if (j.active || j.jump.alwaysShow) {
          possibleJumpsWithSameTextGrouped.push(j);
        }
      } else {
        const jumpsActiveWithSameText = jumpsWithSameText.filter((x) => x.active);
        if (jumpsActiveWithSameText.length > 0) {
          const maxPrio = jumpsActiveWithSameText.reduce(
            (max, jump) => (jump.jump.priority > max ? jump.jump.priority : max),
            0,
          );
          const jumpsWithNotSoLowPrio = jumpsActiveWithSameText.filter(
            (x) => x.jump.priority * 100 >= maxPrio,
          );
          const prioSum = jumpsWithNotSoLowPrio
            .map((x) => x.jump.priority)
            .reduce((sum, i) => i + sum, 0);
          const ACCURACY = 1000000;
          let rnd = (random(ACCURACY) / ACCURACY) * prioSum;
          for (const jj of jumpsWithNotSoLowPrio) {
            if (jj.jump.priority >= rnd || jj === jumpsWithNotSoLowPrio.slice(-1).pop()) {
              possibleJumpsWithSameTextGrouped.push(jj);
              break;
            } else {
              rnd = rnd - jj.jump.priority;
            }
          }
        } else {
          const alLeastOneWithAlwaysShow = jumpsWithSameText
            .filter((x) => x.jump.alwaysShow)
            .shift();
          if (alLeastOneWithAlwaysShow) {
            possibleJumpsWithSameTextGrouped.push(alLeastOneWithAlwaysShow);
          }
        }
      }
    }
  }
  /*
    const newActiveJumpsWithoutEmpty = newJumps.filter(x => x.active && x.jump.text);
    const newActiveJumpsOnlyEmpty = newJumps.filter(x => x.active && !x.jump.text);
    const newActiveJumpsOnlyOneEmpty = newActiveJumpsOnlyEmpty.length > 0 ? [newActiveJumpsOnlyEmpty[0]] : [];
    
    this.state.possibleJumps = (newActiveJumpsWithoutEmpty.length > 0 ?
        newJumps.filter(x => x.jump.text) :
        newActiveJumpsOnlyOneEmpty)
        .map(x => {
            return {
                active: x.active,
                id: x.jump.id
            }
        })
        */
  const newJumpsWithoutEmpty = possibleJumpsWithSameTextGrouped.filter((x) => x.jump.text);
  const newActiveJumpsOnlyEmpty = possibleJumpsWithSameTextGrouped.filter(
    (x) => x.active && !x.jump.text,
  );
  const newActiveJumpsOnlyOneEmpty =
    newActiveJumpsOnlyEmpty.length > 0 ? [newActiveJumpsOnlyEmpty[0]] : [];

  const statePossibleJumps = (
    newJumpsWithoutEmpty.length > 0 ? newJumpsWithoutEmpty : newActiveJumpsOnlyOneEmpty
  ).map((x) => {
    return {
      active: x.active,
      id: x.jump.id,
    };
  });
  state = {
    ...state,
    possibleJumps: statePossibleJumps,
  };

  for (const critParam of critParamsTriggered) {
    const gotFailyCritWithChoices =
      (quest.params[critParam].type === ParamType.Провальный ||
        quest.params[critParam].type === ParamType.Смертельный) &&
      state.possibleJumps.filter((x) => x.active).length > 0;
    if (oldTgeBehaviour && gotFailyCritWithChoices) {
      // Do nothing because some jumps allows this
    } else {
      const lastjump = quest.jumps.find((x) => x.id === state.lastJumpId);

      state = {
        ...state,
        state: location.isEmpty
          ? state.lastJumpId && lastjump && lastjump.description
            ? "critonlocation"
            : "critonlocationlastmessage"
          : "critonlocation",
        critParamId: critParam,
      };

      state = {
        ...state,
        imageName:
          location.paramsChanges[critParam].img || quest.params[critParam].img || state.imageName,
        trackName: replaceSpecialTrackName(
          location.paramsChanges[critParam].track ||
            quest.params[critParam].track ||
            state.trackName,
        ),
        soundName:
          location.paramsChanges[critParam].sound ||
          quest.params[critParam].sound ||
          state.soundName,
      };
    }
  }

  // calculateLocation is always called when state.state === "location", but state.state can change

  /* А это дикий костыль для пустых локаций и переходов */
  if (state.state === "location" && state.possibleJumps.length === 1) {
    const lonenyCurrentJumpInPossible = state.possibleJumps[0];
    const lonenyCurrentJump = quest.jumps.find((x) => x.id === lonenyCurrentJumpInPossible.id);
    if (!lonenyCurrentJump) {
      throw new Error(`Unable to find jump id=${lonenyCurrentJumpInPossible.id}`);
    }
    const lastJump = quest.jumps.find((x) => x.id === state.lastJumpId);

    const locTextId = calculateLocationShowingTextId(location, state, random, showDebug);
    const locationOwnText = location.texts[locTextId] || "";

    //console.info(
    //    `\noldTgeBehaviour=${oldTgeBehaviour} locationOwnText=${locationOwnText} isEmpty=${location.isEmpty} id=${location.id} `+
    //    `lastJump=${!!lastJump} lastJumpDesc=${lastJump ? lastJump.description : "<nojump>"}`
    //);
    const needAutoJump =
      lonenyCurrentJumpInPossible.active &&
      !lonenyCurrentJump.text &&
      (location.isEmpty ? (lastJump ? !lastJump.description : true) : !locationOwnText);
    if (needAutoJump) {
      if (showDebug) {
        console.info(
          `Performinig autojump from loc=${state.locationId} via jump=${lonenyCurrentJump.id}`,
        );
      }
      state = performJumpInternal(lonenyCurrentJump.id, quest, state, random, showDebug);
    }
  } else if (state.state === "critonlocation") {
    // Little bit copy-paste from branch above
    const lastJump = quest.jumps.find((x) => x.id === state.lastJumpId);
    const locTextId = calculateLocationShowingTextId(location, state, random, showDebug);
    const locationOwnText = location.texts[locTextId] || "";
    const locationDoNotHaveText = location.isEmpty
      ? lastJump
        ? !lastJump.description
        : true
      : !locationOwnText;
    if (locationDoNotHaveText) {
      state = {
        ...state,
        state: "critonlocationlastmessage",
      };
    }
  }

  return state;
}

/*
export function validateState(
    quest: Quest,
    stateOriginal: GameState,
    images: PQImages = []
) {
    try {
        let state = initGame(quest, stateOriginal.aleaSeed);
        for (const performedJump of stateOriginal.performedJumps) {
            state = performJump(
                performedJump.jumpId,
                quest,
                state,
                images,
                performedJump.dateUnix
            );
        }
        assert.deepStrictEqual(stateOriginal, state);
        return true;
    } catch (e) {
        console.info(e);
        return false;
    }
}
*/

export function getGameLog(state: GameState): GameLog {
  return {
    aleaSeed: state.aleaSeed,
    performedJumps: state.performedJumps,
  };
}

export function validateWinningLog(quest: Quest, gameLog: GameLog, showDebug = false) {
  let state = initGame(quest, gameLog.aleaSeed);
  for (const performedJump of gameLog.performedJumps) {
    const uiState = getUIState(quest, state, DEFAULT_RUS_PLAYER, showDebug);

    if (uiState.choices.find((x) => x.jumpId === performedJump.jumpId)) {
      if (showDebug) {
        console.info(`Validate jumping jumpId=${performedJump.jumpId}`);
      }
      state = performJump(performedJump.jumpId, quest, state, performedJump.dateUnix, showDebug);
    } else {
      if (showDebug) {
        console.info(`Validate=false jumpId=${performedJump.jumpId} not found`);
      }
      return false;
    }
  }

  const uiState = getUIState(quest, state, DEFAULT_RUS_PLAYER);
  if (uiState.gameState !== "win") {
    if (showDebug) {
      console.info(`Validate=false, not a win state`);
    }
    return false;
  }
  if (showDebug) {
    console.info(`Validate=true`);
  }
  return true;
}

export function _sortJumps<
  T extends {
    showingOrder: number;
  },
>(input: T[], random: RandomFunc): T[] {
  const output = input.slice();
  for (let i = 0; i < output.length; i++) {
    let minumumShowingOrder: number | undefined = undefined;
    let minimumIndexes: number[] = [];
    for (let ii = i; ii < output.length; ii++) {
      const curElement = output[ii];
      if (minumumShowingOrder === undefined || curElement.showingOrder < minumumShowingOrder) {
        minumumShowingOrder = curElement.showingOrder;
        minimumIndexes = [ii];
      } else if (curElement.showingOrder === minumumShowingOrder) {
        minimumIndexes.push(ii);
      }
    }

    const minimumIndex =
      minimumIndexes.length === 1
        ? minimumIndexes[0]
        : minimumIndexes[random(minimumIndexes.length)];
    // console.info(`i=${i} minimumIndex=${minimumIndex} minimumIndexes=`,minimumIndexes);
    const swap = output[i];
    output[i] = output[minimumIndex];
    output[minimumIndex] = swap;
  }
  return output;
}
