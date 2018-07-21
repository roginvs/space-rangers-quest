import { PQImages } from "../pqImages";
import { QM } from "../qmreader";
import { AleaState, Alea } from "../alea";
import { parse } from "../formula";


export interface Player {
    Ranger: string;
    Player: string;
    Money: string;
    FromPlanet: string;
    FromStar: string;
    ToPlanet: string;
    ToStar: string;
    Date: string; // Дата дедлайна
    Day: string; // Кол-во дней
    CurDate: string; // Текущая дата
}


export interface GameState {
    state:
    | "starting"
    | "location"
    | "jump" // Если переход с описанием и следующая локация не пустая
    | "jumpandnextcrit" // Если переход с описанием и следующая локация не пустая, и параметры достигли критичного
    | "critonlocation" // Параметр стал критичным на локации, доступен только один переход далее
    | "critonlocationlastmessage" // Параметр стал критичным на локации, показывается сообщение последнее
    | "critonjump" // Параметр стал критичным на переходе без описания
    | "returnedending";
    critParamId?: number;
    locationId: number;
    lastJumpId: number | undefined;
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
    imageFilename?: string;

    aleaState: AleaState;
}
interface PlayerChoice {
    text: string;
    jumpId: number;
    active: boolean;
}

export interface PlayerState {
    text: string;
    imageFileName?: string;
    paramsState: string[];
    choices: PlayerChoice[];
    gameState: "running" | "fail" | "win" | "dead";
}
const DEFAULT_DAYS_TO_PASS_QUEST = 35;

function initGame(quest: QM, pqimages: PQImages, seed: string): GameState {
    const alea = new Alea(seed);
    for (let i = 0; i < quest.paramsCount; i++) {
        if (quest.params[i].isMoney) {
            const giveMoney = 2000;
            const money =
                quest.params[i].max > giveMoney
                    ? giveMoney
                    : quest.params[i].max;
            quest.params[i].starting = `[${money}]`;
        }
    }

    const startLocation = quest.locations.find(x => x.isStarting);
    if (!startLocation) {
        throw new Error("No start location!");
    }
    const startingParams =quest.params.map((param, index) => {
        return param.active ? parse(param.starting, [], n => alea.random(n)) : 0;
    });
    const startingShowing = quest.params.map(() => true);

    const state: GameState = {
        state: "starting",
        locationId: startLocation.id,
        lastJumpId: undefined,
        possibleJumps: [],
        paramValues: startingParams,
        paramShow: startingShowing,
        jumpedCount: {},
        locationVisitCount: {},
        daysPassed: 0,
        imageFilename: undefined,
        aleaState: alea.exportState()
    };
    return state
}