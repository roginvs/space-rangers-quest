import {
    QM,
    LOCATION_TEXTS,
    Location,
    ParameterShowingType,
    ParamType,
    ParamCritType,
    Jump,
    getImagesListFromQmm,
    ParameterChange
} from "../qmreader";
import { parse } from "../formula";
import { substitute } from "../substitution";
import { JUMP_I_AGREE, JUMP_NEXT, JUMP_GO_BACK_TO_SHIP} from "./defs";
import { PQImages } from "../pqImages";
import { randomFromMathRandom } from "../randomFunc";

export { JUMP_I_AGREE, JUMP_NEXT, JUMP_GO_BACK_TO_SHIP } from './defs';


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

    randomSeed: number;
}
interface PlayerChoice {
    text: string;
    jumpId: number;
    active: boolean;
}

interface PlayerState {
    text: string;
    imageFileName?: string;
    paramsState: string[];
    choices: PlayerChoice[];
    gameState: "running" | "fail" | "win" | "dead";
}
const DEFAULT_DAYS_TO_PASS_QUEST = 35;

export class QMPlayer {
    private state!: GameState;

//    private locationsIds = this.quest.locations.map(x => x.id);
//    private jumpsIds = this.quest.jumps.map(x => x.id);
    constructor(
        private quest: QM,   
        private images: PQImages = [],
        private lang: "rus" | "eng",
        private oldTgeBehaviour: boolean
    ) {
        for (let i = 0; i < this.quest.paramsCount; i++) {
            if (this.quest.params[i].isMoney) {
                const giveMoney = 2000;
                const money =
                    this.quest.params[i].max > giveMoney
                        ? giveMoney
                        : this.quest.params[i].max;
                this.quest.params[i].starting = `[${money}]`;
            }
        }
        this.start();
    }

    private texts = this.lang === "rus"
        ? {
            iAgree: "Я берусь за это задание",
            next: "Далее",
            goBackToShip: "Вернуться на корабль"
        }
        : {
            iAgree: "I agree",
            next: "Next",
            goBackToShip: "Go back to ship"
        };

    start() {
        const startLocation = this.quest.locations.find(x => x.isStarting);
        if (!startLocation) {
            throw new Error("No start location!");
        }
        const startingParams = this.quest.params.map((param, index) => {
            return param.active ? parse(param.starting, [], randomFromMathRandom) : 0;
        });
        const startingShowing = this.quest.params.map(() => true);

        this.state = {
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
            randomSeed: 0,
        };
    }

    private replace(str: string, diamondIndex?: number) {
        return substitute(
            str,
            {                                
                Ranger: this.lang === "rus" ? "Греф" : "Ranger",
                Player: this.lang === "rus" ? "Греф" : "Player",
                FromPlanet: this.lang === "rus" ? "Земля" : "FromPlanet",
                FromStar: this.lang === "rus" ? "Солнечная" : "FromStar",
                ToPlanet: this.lang === "rus" ? "Боннасис" : "ToPlanet",
                ToStar: this.lang === "rus" ? "Процион" : "ToStar",
                Money: "65535",
                Day: `${DEFAULT_DAYS_TO_PASS_QUEST - this.state.daysPassed}`,
                Date: this.SRDateToString(DEFAULT_DAYS_TO_PASS_QUEST),
                CurDate: this.SRDateToString(this.state.daysPassed),
                lang: "rus"
            },
            this.state.paramValues,
            randomFromMathRandom,
            diamondIndex
        );
    }
    private getParamsState() {
        const paramsState: string[] = [];
        for (let i = 0; i < this.quest.paramsCount; i++) {
            if (this.state.paramShow[i] && this.quest.params[i].active) {
                const val = this.state.paramValues[i];
                const param = this.quest.params[i];
                if (val !== 0 || param.showWhenZero) {
                    for (const range of param.showingInfo) {
                        if (val >= range.from && val <= range.to) {
                            let str = this.replace(range.str, i);                            
                            paramsState.push(str);                            
                            break;
                        }
                    }
                }
            }
        }
        return paramsState;
    }
    public getAllImagesToPreload() {
        const imagesPQI = this.images.map(x => x.filename);
        const imagesQmm = getImagesListFromQmm(this.quest).map(
            x => x.toLowerCase() + ".jpg"
        );
        let uniq: { [name: string]: boolean } = {};
        for (const img of [...imagesPQI, ...imagesQmm]) {
            uniq[img] = true;
        }
        return Object.keys(uniq);
    }

    public getState(): PlayerState {
        if (this.state.state === "starting") {
            return {
                text: this.replace(this.quest.taskText),
                paramsState: [],
                choices: [
                    {
                        jumpId: JUMP_I_AGREE,
                        text: this.texts.iAgree,
                        active: true
                    }
                ],
                gameState: "running"
            };
        } else if (this.state.state === "jump") {
            const jump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );
            if (!jump) {
                throw new Error(`Internal error: no last jump id=${this.state.lastJumpId}`);
            }
            return {
                text: this.replace(jump.description),
                paramsState: this.getParamsState(),
                choices: [
                    {
                        jumpId: JUMP_NEXT,
                        text: this.texts.next,
                        active: true
                    }
                ],
                gameState: "running",
                imageFileName: this.state.imageFilename
            };
        } else if (
            this.state.state === "location" ||
            this.state.state === "critonlocation"
        ) {
            const location = this.quest.locations.find(
                x => x.id === this.state.locationId
            );
            if (!location) {
                throw new Error(`Internal error: no state loc id=${this.state.locationId}`);
            }

            const locTextId = this.calculateLocationShowingTextId(location);
            const textInOptions = location.texts[locTextId] || "";

            const lastJump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );

            const text =
                location.isEmpty && lastJump && lastJump.description
                    ? lastJump.description
                    : textInOptions;

            return {
                text: this.replace(text),
                paramsState: this.getParamsState(),
                choices:
                    this.state.state === "location"
                        ? location.isFaily || location.isFailyDeadly
                            ? []
                            : location.isSuccess
                                ? [
                                    {
                                        jumpId: JUMP_GO_BACK_TO_SHIP,
                                        text: this.texts.goBackToShip,
                                        active: true
                                    }
                                ]
                                : this.state.possibleJumps.map(x => {
                                    const jump = this.quest.jumps.find(
                                        y => y.id === x.id
                                    );
                                    if (!jump) {
                                        throw new Error(`Internal error: no jump ${x.id} in possible jumps`);
                                    }
                                    return {
                                        text:
                                            this.replace(jump.text) ||
                                            this.texts.next,
                                        jumpId: x.id,
                                        active: x.active
                                    };
                                })
                        : [
                            {
                                // critonlocation
                                jumpId: JUMP_NEXT,
                                text: this.texts.next,
                                active: true
                            }
                        ],

                gameState: location.isFailyDeadly
                    ? "dead"
                    : location.isFaily ? "fail" : "running",
                imageFileName: this.state.imageFilename
            };
        } else if (this.state.state === "critonjump") {
            const critId = this.state.critParamId;
            const jump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );

            if (critId === undefined || !jump) {
                throw new Error(
                    `Internal error: crit=${critId} lastjump=${this.state
                        .lastJumpId}`
                );
            }
            const param = this.quest.params[critId];
            return {
                text: this.replace(
                    jump.paramsChanges[critId].critText ||
                    this.quest.params[critId].critValueString
                ),
                paramsState: this.getParamsState(),
                choices:
                    param.type === ParamType.Успешный
                        ? [
                            {
                                jumpId: JUMP_GO_BACK_TO_SHIP,
                                text: this.texts.goBackToShip,
                                active: true
                            }
                        ]
                        : [],
                gameState:
                    param.type === ParamType.Успешный
                        ? "running"
                        : param.type === ParamType.Провальный ? "fail" : "dead",
                imageFileName: this.state.imageFilename
            };
        } else if (this.state.state === "jumpandnextcrit") {
            const critId = this.state.critParamId;
            const jump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );
            if (critId === undefined || !jump) {
                throw new Error(
                    `Internal error: crit=${critId} lastjump=${this.state
                        .lastJumpId}`
                );
            }

            const param = this.quest.params[critId];
            return {
                text: this.replace(jump.description),
                paramsState: this.getParamsState(),
                choices: [
                    {
                        jumpId: JUMP_NEXT,
                        text: this.texts.next,
                        active: true
                    }
                ],
                gameState: "running",
                imageFileName: this.state.imageFilename
            };
        } else if (this.state.state === "critonlocationlastmessage") {
            const critId = this.state.critParamId;
            const location = this.quest.locations.find(
                x => x.id === this.state.locationId
            );

            if (critId === undefined) {
                throw new Error(`Internal error: no critId`);
            }
            if (!location) {
                throw new Error(`Internal error: no crit state location ${this.state.locationId}`);
            }
            const param = this.quest.params[critId];

            return {
                text: this.replace(
                    location.paramsChanges[critId].critText ||
                    this.quest.params[critId].critValueString
                ),
                paramsState: this.getParamsState(),
                choices:
                    param.type === ParamType.Успешный
                        ? [
                            {
                                jumpId: JUMP_GO_BACK_TO_SHIP,
                                text: this.texts.goBackToShip,
                                active: true
                            }
                        ]
                        : [],
                gameState:
                    param.type === ParamType.Успешный
                        ? "running"
                        : param.type === ParamType.Провальный ? "fail" : "dead",
                imageFileName: this.state.imageFilename
            };
        } else if (this.state.state === "returnedending") {
            return {
                text: this.replace(this.quest.successText),
                paramsState: [],
                choices: [],
                gameState: "win"
            };
        } else {
            throw new Error(`Unknown state ${this.state.state} in getState`);
        }
    }

    private calculateParamsUpdate(paramsChanges: ParameterChange[]) {
        let critParamsTriggered: number[] = [];
        let oldValues = this.state.paramValues.slice(0, this.quest.paramsCount);
        let newValues = this.state.paramValues.slice(0, this.quest.paramsCount);

        for (let i = 0; i < this.quest.paramsCount; i++) {
            const change = paramsChanges[i];
            if (change.showingType === ParameterShowingType.Показать) {
                this.state.paramShow[i] = true;
            } else if (change.showingType === ParameterShowingType.Скрыть) {
                this.state.paramShow[i] = false;
            }

            if (change.isChangeValue) {
                newValues[i] = change.change;
            } else if (change.isChangePercentage) {
                newValues[i] = Math.round(
                    oldValues[i] * (100 + change.change) / 100
                );
            } else if (change.isChangeFormula) {
                if (change.changingFormula) {
                    newValues[i] = parse(change.changingFormula, oldValues, randomFromMathRandom);
                }
            } else {
                newValues[i] = oldValues[i] + change.change;
            }

            const param = this.quest.params[i];
            if (newValues[i] > param.max) {
                newValues[i] = param.max;
            }
            if (newValues[i] < param.min) {
                newValues[i] = param.min;
            }

            if (
                newValues[i] !== oldValues[i] &&
                param.type !== ParamType.Обычный
            ) {
                if (
                    (param.critType === ParamCritType.Максимум &&
                        newValues[i] === param.max) ||
                    (param.critType === ParamCritType.Минимум &&
                        newValues[i] === param.min)
                ) {
                    critParamsTriggered.push(i);
                }
            }
        }
        this.state.paramValues = newValues;
        return critParamsTriggered;
    }

    performJump(jumpId: number) {
        if (jumpId === JUMP_GO_BACK_TO_SHIP) {
            this.state.state = "returnedending";
            return;
        }

        const jumpForImg = this.quest.jumps.find(
            x => x.id === this.state.lastJumpId
        );
        const image =
            jumpForImg && jumpForImg.img
                ? jumpForImg.img.toLowerCase() + ".jpg"
                : this.images
                    .filter(
                    x => !!x.jumpIds && x.jumpIds.indexOf(jumpId) > -1
                    )
                    .map(x => x.filename)
                    .shift();
        if (image) {
            this.state.imageFilename = image;
        }

        if (this.state.state === "starting") {
            this.state.state = "location";
            this.calculateLocation();
        } else if (this.state.state === "jump") {
            const jump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );
            if (!jump) {
                throw new Error(`Internal error: no just ${this.state.lastJumpId}`);
            }
            this.state.locationId = jump.toLocationId;
            this.state.state = "location";
            this.calculateLocation();
        } else if (this.state.state === "location") {
            if (!this.state.possibleJumps.find(x => x.id === jumpId)) {
                throw new Error(
                    `Jump ${jumpId} is not in list in that location`
                );
            }
            const jump = this.quest.jumps.find(x => x.id === jumpId);
            if (!jump) {
                throw new Error(`"Internal Error: no jump id=${jumpId} from possible jump list`);
            }
            this.state.lastJumpId = jumpId;
            if (jump.dayPassed) {
                this.state.daysPassed++;
            }
            if (!(jumpId in this.state.jumpedCount)) {
                this.state.jumpedCount[jumpId] = 1;
            } else {
                this.state.jumpedCount[jumpId]++;
            }

            const critParamsTriggered = this.calculateParamsUpdate(
                jump.paramsChanges
            );

            const nextLocation = this.quest.locations.find(
                x => x.id === jump.toLocationId
            );
            if (!nextLocation) {
                throw new Error(`Internal error: no next location ${jump.toLocationId}`);
            }

            if (!jump.description) {
                if (critParamsTriggered.length > 0) {
                    this.state.state = "critonjump";
                    this.state.critParamId = critParamsTriggered[0];
                    const qmmImage =
                        (this.state.critParamId !== undefined &&
                            jump.paramsChanges[this.state.critParamId].img) ||
                        this.quest.params[this.state.critParamId].img;
                    const image = qmmImage
                        ? qmmImage.toLowerCase() + ".jpg"
                        : this.images
                            .filter(
                            x =>
                                !!x.critParams &&
                                x.critParams.indexOf(this.state
                                    .critParamId as number) > -1
                            )
                            .map(x => x.filename)
                            .shift();
                    if (image) {
                        this.state.imageFilename = image;
                    }
                } else {
                    this.state.locationId = nextLocation.id;
                    this.state.state = "location";
                    this.calculateLocation();
                }
            } else {
                if (critParamsTriggered.length > 0) {
                    this.state.state = "jumpandnextcrit";
                    this.state.critParamId = critParamsTriggered[0];
                } else if (nextLocation.isEmpty) {
                    this.state.locationId = nextLocation.id;
                    this.state.state = "location";
                    this.calculateLocation();
                } else {
                    this.state.state = "jump";
                }
            }
        } else if (this.state.state === "jumpandnextcrit") {
            this.state.state = "critonjump";
            const jump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );
            const qmmImg =
                (this.state.critParamId !== undefined &&
                    jump &&
                    jump.paramsChanges[this.state.critParamId].img) ||
                (this.state.critParamId !== undefined &&
                    this.quest.params[this.state.critParamId].img);
            const image = qmmImg
                ? qmmImg.toLowerCase() + ".jpg"
                : this.images
                    .filter(
                    x =>
                        !!x.critParams &&
                        x.critParams.indexOf(this.state
                            .critParamId as number) > -1
                    )
                    .map(x => x.filename)
                    .shift();

            if (image) {
                this.state.imageFilename = image;
            }
        } else if (this.state.state === "critonlocation") {
            this.state.state = "critonlocationlastmessage";
        } else {
            throw new Error(`Unknown state ${this.state.state} in performJump`);
        }
    }

    getSaving() {
        // TODO: Lol
        return JSON.parse(JSON.stringify(this.state)) as GameState;
    }
    loadSaving(state: GameState) {
        // TODO: Same lol
        this.state = JSON.parse(JSON.stringify(state)) as GameState;
    }

    private calculateLocationShowingTextId(location: Location) {
        const locationTextsWithText = location.texts
            .map((text, i) => {
                return { text, i };
            })
            .filter(x => x.text);

        if (location.textSelectFurmula) {
            if (location.textSelectFurmula) {
                const id =
                    parse(location.textSelectFurmula, this.state.paramValues, randomFromMathRandom) -
                    1;
                if (location.texts[id]) {
                    return id;
                } else {
                    console.warn(`Location id=${location.id} formula result textid=${id}, but no text`)
                    return 0; // Tge 4 and 5 shows different here. We will show location text 0
                }
            } else {
                console.warn(`Location id=${location.id} text by formula is set, but no formula`);
                const textNum = Math.floor(
                    Math.random() * locationTextsWithText.length
                );
                return (
                    (locationTextsWithText[textNum] &&
                        locationTextsWithText[textNum].i) ||
                    0
                );
            }
        } else {
            const textNum =
                locationTextsWithText.length > 0
                    ? this.state.locationVisitCount[location.id] %
                    locationTextsWithText.length
                    : 0;

            return (
                (locationTextsWithText[textNum] &&
                    locationTextsWithText[textNum].i) ||
                0
            );
        }
    }
    private calculateLocation() {
        if (this.state.locationId in this.state.locationVisitCount) {
            this.state.locationVisitCount[this.state.locationId]++;
        } else {
            this.state.locationVisitCount[this.state.locationId] = 0;
        }
        const location = this.quest.locations.find(
            x => x.id === this.state.locationId
        );
        if (!location) {
            throw new Error(`Internal error: no state location ${this.state.locationId}`);
        }

        const locImgId = this.calculateLocationShowingTextId(location);
        const imageFromQmm =
            location.media[locImgId] && location.media[locImgId].img;
        const imageFromPQI = this.images.find(
            x =>
                !!x.locationIds &&
                x.locationIds.indexOf(this.state.locationId) > -1
        );
        const image = imageFromQmm
            ? imageFromQmm.toLowerCase() + ".jpg"
            : imageFromPQI && imageFromPQI.filename;
        if (image) {
            this.state.imageFilename = image;
        }
        if (location.dayPassed) {
            this.state.daysPassed++;
        }

        const critParamsTriggered = this.calculateParamsUpdate(
            location.paramsChanges
        );

        const allJumps = this.quest.jumps
            .filter(x => x.fromLocationId === this.state.locationId)
            .filter(jump => {
                // Сразу выкинуть переходы в локации с превышенным лимитом
                const toLocation = this.quest.locations.find(
                    x => x.id === jump.toLocationId
                );
                if (toLocation) {
                    if (
                        toLocation.maxVisits &&
                        this.state.locationVisitCount[jump.toLocationId] + 1 >=
                        toLocation.maxVisits
                    ) {
                        return false;
                    }
                }

                if (this.oldTgeBehaviour) {
                    // Это какая-то особенность TGE - не учитывать переходы, которые ведут в локацию
                    // где были переходы, а проходимость закончилась.
                    // Это вообще дикость какая-то, потому как там вполне может быть
                    // критичный параметр завершить квест
                    const jumpsFromDestination = this.quest.jumps.filter(
                        x => x.fromLocationId === jump.toLocationId
                    );
                    if (jumpsFromDestination.length === 0) {
                        // Но если там вообще переходов не было, то всё ок
                        return true;
                    }
                    if (
                        jumpsFromDestination.filter(
                            x =>
                                x.jumpingCountLimit &&
                                this.state.jumpedCount[x.id] >=
                                x.jumpingCountLimit
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

        // Если есть такие же тексты - то спорный по весам
        // Если текст один - то по вероятности
        const possibleJumps = allJumps
            .sort((a, b) => {
                return a.showingOrder !== b.showingOrder
                    ? a.showingOrder - b.showingOrder
                    : Math.floor(Math.random() * 2) * 2 - 1;
            })
            .map(jump => {
                return {
                    jump,
                    active: (jump => {
                        for (let i = 0; i < this.quest.paramsCount; i++) {
                            if (this.quest.params[i].active) {
                                if (
                                    this.state.paramValues[i] >
                                    jump.paramsConditions[i].mustTo ||
                                    this.state.paramValues[i] <
                                    jump.paramsConditions[i].mustFrom
                                ) {
                                    return false;
                                }
                                if (
                                    jump.paramsConditions[i].mustEqualValues
                                        .length > 0
                                ) {
                                    const isEqual = jump.paramsConditions[
                                        i
                                    ].mustEqualValues.filter(
                                        x => x === this.state.paramValues[i]
                                        );
                                    if (
                                        jump.paramsConditions[i]
                                            .mustEqualValuesEqual &&
                                        isEqual.length === 0
                                    ) {
                                        return false;
                                    }
                                    if (
                                        !jump.paramsConditions[i]
                                            .mustEqualValuesEqual &&
                                        isEqual.length !== 0
                                    ) {
                                        return false;
                                    }
                                }
                                if (
                                    jump.paramsConditions[i].mustModValues
                                        .length > 0
                                ) {
                                    const isMod = jump.paramsConditions[
                                        i
                                    ].mustModValues.filter(
                                        x => this.state.paramValues[i] % x === 0
                                        );
                                    if (
                                        jump.paramsConditions[i]
                                            .mustModValuesMod &&
                                        isMod.length === 0
                                    ) {
                                        return false;
                                    }
                                    if (
                                        !jump.paramsConditions[i]
                                            .mustModValuesMod &&
                                        isMod.length !== 0
                                    ) {
                                        return false;
                                    }
                                }
                            }
                        }
                        if (jump.formulaToPass) {
                            if (
                                parse(
                                    jump.formulaToPass,
                                    this.state.paramValues,
                                    randomFromMathRandom
                                ) === 0
                            ) {
                                return false;
                            }
                        }
                        if (
                            jump.jumpingCountLimit &&
                            this.state.jumpedCount[jump.id] >=
                            jump.jumpingCountLimit
                        ) {
                            return false;
                        }
                        return true;
                    })(jump)
                };
            });

        let newJumps: {
            jump: Jump;
            active: boolean;
        }[] = [];

        let seenTexts: {
            [text: string]: boolean;
        } = {};
        for (const j of possibleJumps) {
            if (!seenTexts[j.jump.text]) {
                seenTexts[j.jump.text] = true;
                const jumpsWithSameText = possibleJumps.filter(
                    x => x.jump.text === j.jump.text
                );
                if (jumpsWithSameText.length === 1) {
                    if (j.jump.prio < 1 && j.active) {
                        j.active = Math.random() < j.jump.prio;
                        // console.info(`Jump ${j.jump.text} is now ${j.active} by random`)
                    }
                    if (j.active || j.jump.alwaysShow) {
                        newJumps.push(j);
                    }
                } else {
                    const jumpsActiveWithSameText = jumpsWithSameText.filter(
                        x => x.active
                    );
                    if (jumpsActiveWithSameText.length > 0) {
                        const maxPrio = jumpsActiveWithSameText.reduce(
                            (max, jump) =>
                                jump.jump.prio > max ? jump.jump.prio : max,
                            0
                        );
                        const jumpsWithNotSoLowPrio = jumpsActiveWithSameText.filter(
                            x => x.jump.prio * 100 >= maxPrio
                        );
                        const prioSum = jumpsWithNotSoLowPrio
                            .map(x => x.jump.prio)
                            .reduce((sum, i) => i + sum, 0);
                        let rnd = Math.random() * prioSum;
                        for (const jj of jumpsWithNotSoLowPrio) {
                            if (jj.jump.prio >= rnd) {
                                newJumps.push(jj);
                                break;
                            } else {
                                rnd = rnd - jj.jump.prio;
                            }
                        }
                    } else {
                        const alLeastOneWithAlwaysShow = jumpsWithSameText
                            .filter(x => x.jump.alwaysShow)
                            .shift();
                        if (alLeastOneWithAlwaysShow) {
                            newJumps.push(alLeastOneWithAlwaysShow);
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
        const newJumpsWithoutEmpty = newJumps.filter(x => x.jump.text);
        const newActiveJumpsOnlyEmpty = newJumps.filter(
            x => x.active && !x.jump.text
        );
        const newActiveJumpsOnlyOneEmpty =
            newActiveJumpsOnlyEmpty.length > 0
                ? [newActiveJumpsOnlyEmpty[0]]
                : [];

        this.state.possibleJumps = (newJumpsWithoutEmpty.length > 0
            ? newJumpsWithoutEmpty
            : newActiveJumpsOnlyOneEmpty
        ).map(x => {
            return {
                active: x.active,
                id: x.jump.id
            };
        });

        for (const critParam of critParamsTriggered) {
            const gotCritWithChoices =
                (this.quest.params[critParam].type === ParamType.Провальный ||
                    this.quest.params[critParam].type ===
                    ParamType.Смертельный) &&
                this.state.possibleJumps.filter(x => x.active).length > 0;
            if (!this.oldTgeBehaviour || !gotCritWithChoices) {
                const lastjump = this.quest.jumps.find(
                    x => x.id === this.state.lastJumpId
                );
                this.state.state = location.isEmpty
                    ? this.state.lastJumpId && lastjump && lastjump.description
                        ? "critonlocation"
                        : "critonlocationlastmessage"
                    : "critonlocation";
                this.state.critParamId = critParam;

                const qmmImg =
                    location.paramsChanges[critParam].img ||
                    this.quest.params[critParam].img;
                const image = qmmImg
                    ? qmmImg.toLowerCase() + ".jpg"
                    : this.images
                        .filter(
                        x =>
                            !!x.critParams &&
                            x.critParams.indexOf(critParam) > -1
                        )
                        .map(x => x.filename)
                        .shift();
                if (image) {
                    this.state.imageFilename = image;
                }
            }
        }

        /* А это дикий костыль для пустых локаций и переходов */
        const state = this.getState();
        if (state.choices.length === 1) {
            const jump = this.quest.jumps.find(
                x => x.id === state.choices[0].jumpId
            );
            const lastjump = this.quest.jumps.find(
                x => x.id === this.state.lastJumpId
            );
            const location = this.quest.locations.find(
                x => x.id === this.state.locationId
            );
            if (
                jump &&
                !jump.text &&
                location &&
                ((location.isEmpty && (lastjump && !lastjump.description)) ||
                    !state.text) &&
                state.choices[0].active
            ) {
                console.info(
                    `Performinig autojump from loc=${this.state
                        .locationId} via jump=${jump.id}`
                );
                this.performJump(jump.id);
            }
        }
    };

    private SRDateToString(daysToAdd: number, initialDate: Date = new Date()) {
        const d = new Date(initialDate.getTime() + 1000 * 60 * 60 * 24 * daysToAdd);
        const months = this.lang === 'eng' ?
            ["January",
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
                "December"
            ] : [
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
                "Декабря"
            ]
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 1000}`
    }
}


