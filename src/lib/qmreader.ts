export const LOCATION_TEXTS = 10;

/** Exported only for tests */
export class Reader {
  private i = 0;
  constructor(private readonly data: Buffer) {}
  int32() {
    const result = this.data.readInt32LE(this.i);
    /*
        this.data[this.i] +
                      this.data[this.i + 1] * 0x100 +
                    this.data[this.i + 2] * 0x10000 +
                    this.data[this.i + 3] * 0x1000000;
                    */
    this.i += 4;
    return result;
  }

  readString(): string;
  readString(canBeUndefined: true): string | undefined;
  readString(canBeUndefined: boolean = false) {
    const ifString = this.int32();
    if (ifString) {
      const strLen = this.int32();
      const str = this.data.slice(this.i, this.i + strLen * 2).toString("utf16le");
      this.i += strLen * 2;
      return str;
    } else {
      return canBeUndefined ? undefined : "";
    }
  }
  byte() {
    return this.data[this.i++];
  }
  dwordFlag(expected?: number) {
    const val = this.int32();
    if (expected !== undefined && val !== expected) {
      throw new Error(`Expecting ${expected}, but get ${val} at position ${this.i - 4}`);
    }
  }
  float64() {
    const val = this.data.readDoubleLE(this.i);
    this.i += 8;
    return val;
  }
  seek(n: number) {
    this.i += n;
  }
  isNotEnd() {
    if (this.data.length === this.i) {
      return undefined;
    } else {
      return (
        `Not an end! We are at ` +
        `0x${Number(this.i).toString(16)}, file len=0x${Number(this.data.length).toString(16)} ` +
        ` left=0x${Number(this.data.length - this.i).toString(16)}`
      );
    }
  }

  debugShowHex(n: number = 300) {
    console.info("Data at 0x" + Number(this.i).toString(16) + "\n");
    let s = "";
    for (let i = 0; i < n; i++) {
      s = s + ("0" + Number(this.data[this.i + i]).toString(16)).slice(-2) + ":";
      if (i % 16 === 15) {
        s = s + "\n";
      }
    }
    console.info(s);
  }
}

enum PlayerRace {
  Малоки = 1,
  Пеленги = 2,
  Люди = 4,
  Феяне = 8,
  Гаальцы = 16,
}
enum PlanetRace {
  Малоки = 1,
  Пеленги = 2,
  Люди = 4,
  Феяне = 8,
  Гаальцы = 16,
  Незаселенная = 64,
}

export enum WhenDone {
  OnReturn = 0,
  OnFinish = 1,
}
export enum PlayerCareer {
  Торговец = 1,
  Пират = 2,
  Воин = 4,
}

// Gladiator: ......C8
// Ivan:      ......D0
// FullRing   ......CA
// Jump       00000000
//

export const HEADER_QM_2 = 0x423a35d2; // 24 parameters
export const HEADER_QM_3 = 0x423a35d3; // 48 parameters
export const HEADER_QM_4 = 0x423a35d4; // 96 parameters
export const HEADER_QMM_6 = 0x423a35d6;
export const HEADER_QMM_7 = 0x423a35d7;

/**
 *
 * This is a workaround to tell player to keep old TGE behavior if quest is
 * resaved as new version.
 *
 *
 * 0x423a35d7 = 1111111127
 * 0x69f6bd7  = 0111111127
 */
export const HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR = 0x69f6bd7;

export type HeaderMagic =
  | typeof HEADER_QM_3
  | typeof HEADER_QM_2
  | typeof HEADER_QM_4
  | typeof HEADER_QMM_6
  | typeof HEADER_QMM_7
  | typeof HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR;

interface QMBase {
  givingRace: number;
  whenDone: WhenDone;
  planetRace: number;
  playerCareer: number;
  playerRace: number;
  // reputationChange
  defaultJumpCountLimit: number;
  hardness: number;
  paramsCount: number;

  changeLogString?: string;
  majorVersion?: number;
  minorVersion?: number;

  screenSizeX: number;
  screenSizeY: number;
  reputationChange: number;
  widthSize: number;
  heightSize: number;
}

function parseBase(r: Reader, header: HeaderMagic): QMBase {
  if (
    header === HEADER_QMM_6 ||
    header === HEADER_QMM_7 ||
    header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR
  ) {
    const majorVersion =
      header === HEADER_QMM_7 || header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR
        ? r.int32()
        : undefined;
    const minorVersion =
      header === HEADER_QMM_7 || header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR
        ? r.int32()
        : undefined;
    const changeLogString =
      header === HEADER_QMM_7 || header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR
        ? r.readString(true)
        : undefined;

    const givingRace = r.byte();
    const whenDone = r.byte();
    const planetRace = r.byte();
    const playerCareer = r.byte();
    const playerRace = r.byte();
    const reputationChange = r.int32();

    const screenSizeX = r.int32(); // In pixels
    const screenSizeY = r.int32(); // In pixels
    const widthSize = r.int32(); // Grid width, from small to big 1E-16-0F-0A
    const heightSize = r.int32(); // Grid heigth, from small to big 18-12-0C-08
    const defaultJumpCountLimit = r.int32();
    const hardness = r.int32();

    const paramsCount = r.int32();

    return {
      givingRace,
      whenDone,
      planetRace,
      playerCareer,
      playerRace,
      defaultJumpCountLimit,
      hardness,
      paramsCount,
      changeLogString,
      majorVersion,
      minorVersion,
      screenSizeX,
      screenSizeY,
      reputationChange,
      widthSize,
      heightSize,
    };
  } else {
    const paramsCount =
      header === HEADER_QM_3
        ? 48
        : header === HEADER_QM_2
        ? 24
        : header === HEADER_QM_4
        ? 96
        : undefined;
    if (!paramsCount) {
      throw new Error(`Unknown header ${header}`);
    }
    r.dwordFlag();
    const givingRace = r.byte();
    const whenDone = r.byte();
    r.dwordFlag();
    const planetRace = r.byte();
    r.dwordFlag();
    const playerCareer = r.byte();
    r.dwordFlag();
    const playerRace = r.byte();
    const reputationChange = r.int32();

    const screenSizeX = r.int32();
    const screenSizeY = r.int32();
    const widthSize = r.int32();
    const heightSize = r.int32();
    r.dwordFlag();

    const defaultJumpCountLimit = r.int32();
    const hardness = r.int32();
    return {
      givingRace,
      whenDone,
      planetRace,
      playerCareer,
      playerRace,
      defaultJumpCountLimit,
      hardness,
      paramsCount,

      reputationChange,

      // TODO
      screenSizeX,
      screenSizeY,

      widthSize,
      heightSize,
    };
  }
}

export enum ParamType {
  Обычный = 0,
  Провальный = 1,
  Успешный = 2,
  Смертельный = 3,
}
export enum ParamCritType {
  Максимум = 0,
  Минимум = 1,
}

export interface QMParamShowInfoPart {
  from: number;
  to: number;
  str: string;
}

export interface Media {
  img: string | undefined;
  sound: string | undefined;
  track: string | undefined;
}

export interface QMParamShowInfo {
  showingInfo: QMParamShowInfoPart[];
}
export interface QMParamIsActive {
  active: boolean;
}
export interface QMParam extends Media, QMParamShowInfo, QMParamIsActive {
  min: number;
  max: number;
  type: ParamType;
  showWhenZero: boolean;
  critType: ParamCritType;
  //  showingRangesCount: number;
  isMoney: boolean;
  name: string;
  starting: string;
  critValueString: string;
}

function parseParam(r: Reader): QMParam {
  const min = r.int32();
  const max = r.int32();
  r.int32();
  const type = r.byte();
  r.int32();
  const showWhenZero = !!r.byte();
  const critType = r.byte();
  const active = !!r.byte();
  const showingRangesCount = r.int32();
  const isMoney = !!r.byte();
  const name = r.readString();
  const param: QMParam = {
    min,
    max,
    type,
    showWhenZero,
    critType,
    active,
    // showingRangesCount,
    isMoney,
    name,
    showingInfo: [],
    starting: "",
    critValueString: "",
    img: undefined,
    sound: undefined,
    track: undefined,
  };
  for (let i = 0; i < showingRangesCount; i++) {
    const from = r.int32();
    const to = r.int32();
    const str = r.readString();
    param.showingInfo.push({
      from,
      to,
      str,
    });
  }
  param.critValueString = r.readString();
  param.starting = r.readString();
  return param;
}
function parseParamQmm(r: Reader): QMParam {
  const min = r.int32();
  const max = r.int32();
  // console.info(`Param min=${min} max=${max}`)
  const type = r.byte();
  //r.debugShowHex(16);
  const unknown1 = r.byte();
  const unknown2 = r.byte();
  const unknown3 = r.byte();
  if (unknown1 !== 0) {
    console.warn(`Unknown1 is params is not zero`);
  }
  if (unknown2 !== 0) {
    console.warn(`Unknown2 is params is not zero`);
  }
  if (unknown3 !== 0) {
    console.warn(`Unknown3 is params is not zero`);
  }
  const showWhenZero = !!r.byte();
  const critType = r.byte();
  const active = !!r.byte();

  const showingRangesCount = r.int32();
  const isMoney = !!r.byte();

  const name = r.readString();
  const param: QMParam = {
    min,
    max,
    type,
    showWhenZero,
    critType,
    active,
    // showingRangesCount,
    isMoney,
    name,
    showingInfo: [],
    starting: "",
    critValueString: "",
    img: undefined,
    sound: undefined,
    track: undefined,
  };
  // console.info(`Ranges=${showingRangesCount}`)
  for (let i = 0; i < showingRangesCount; i++) {
    const from = r.int32();
    const to = r.int32();
    const str = r.readString();
    param.showingInfo.push({
      from,
      to,
      str,
    });
  }
  param.critValueString = r.readString();
  param.img = r.readString(true);
  param.sound = r.readString(true);
  param.track = r.readString(true);
  param.starting = r.readString();
  return param;
}

interface QMBase3 {
  header: HeaderMagic;
}

interface QMBase2 {
  strings: {
    ToStar: string;
    Parsec: string | undefined;
    Artefact: string | undefined;
    ToPlanet: string;
    Date: string;
    Money: string;
    FromPlanet: string;
    FromStar: string;
    Ranger: string;
  };
  locationsCount: number;
  jumpsCount: number;
  successText: string;
  taskText: string;
}

export interface QM extends QMBase, QMBase2, QMBase3 {
  params: QMParam[];
  locations: Location[];
  jumps: Jump[];
}

function parseBase2(r: Reader, isQmm: boolean): QMBase2 {
  const ToStar = r.readString();

  const Parsec = isQmm ? undefined : r.readString(true);
  const Artefact = isQmm ? undefined : r.readString(true);

  const ToPlanet = r.readString();
  const Date = r.readString();
  const Money = r.readString();
  const FromPlanet = r.readString();
  const FromStar = r.readString();
  const Ranger = r.readString();

  const locationsCount = r.int32();
  const jumpsCount = r.int32();

  const successText = r.readString();

  const taskText = r.readString();

  // tslint:disable-next-line:no-dead-store
  const unknownText = isQmm ? undefined : r.readString();

  return {
    strings: {
      ToStar,
      Parsec,
      Artefact,
      ToPlanet,
      Date,
      Money,
      FromPlanet,
      FromStar,
      Ranger,
    },
    locationsCount,
    jumpsCount,
    successText,
    taskText,
  };
}

export enum ParameterShowingType {
  НеТрогать = 0x00,
  Показать = 0x01,
  Скрыть = 0x02,
}

export interface ParameterChange extends Media {
  change: number;
  isChangePercentage: boolean;
  isChangeValue: boolean;
  isChangeFormula: boolean;
  changingFormula: string;
  showingType: ParameterShowingType;
  critText: string;
}

export enum ParameterChangeType {
  Value = 0x00,
  Summ = 0x01,
  Percentage = 0x02,
  Formula = 0x03,
}

export enum LocationType {
  Ordinary = 0x00,
  Starting = 0x01,
  Empty = 0x02,
  Success = 0x03,
  Faily = 0x04,
  Deadly = 0x05,
}

export type LocationId = number & { readonly __nominal: unique symbol };
export type JumpId = number & { readonly __nominal: unique symbol };

export interface ParamsChanger {
  paramsChanges: ParameterChange[];
}
export interface Jump extends Media, ParamsChanger {
  priority: number;
  dayPassed: boolean;
  id: JumpId;
  fromLocationId: LocationId;
  toLocationId: LocationId;
  alwaysShow: boolean;
  jumpingCountLimit: number;
  showingOrder: number;

  paramsConditions: JumpParameterCondition[];
  formulaToPass: string;
  text: string;
  description: string;
}

export interface Location extends ParamsChanger {
  dayPassed: boolean;
  id: LocationId;
  isStarting: boolean;
  isSuccess: boolean;
  isFaily: boolean;
  isFailyDeadly: boolean;
  isEmpty: boolean;
  texts: string[];
  media: Media[];
  isTextByFormula: boolean;
  textSelectFormula: string;
  maxVisits: number;
  locX: number;
  locY: number;
}
function parseLocation(r: Reader, paramsCount: number): Location {
  const dayPassed = !!r.int32();
  const locX = r.int32();
  const locY = r.int32();
  const id = r.int32() as LocationId;
  const isStarting = !!r.byte();
  const isSuccess = !!r.byte();
  const isFaily = !!r.byte();
  const isFailyDeadly = !!r.byte();
  const isEmpty = !!r.byte();

  const paramsChanges: ParameterChange[] = [];
  for (let i = 0; i < paramsCount; i++) {
    r.seek(12);
    const change = r.int32();
    const showingType = r.byte();
    r.seek(4);
    const isChangePercentage = !!r.byte();
    const isChangeValue = !!r.byte();
    const isChangeFormula = !!r.byte();
    const changingFormula = r.readString();
    r.seek(10);
    const critText = r.readString();
    paramsChanges.push({
      change,
      showingType,
      isChangePercentage,
      isChangeValue,
      isChangeFormula,
      changingFormula,
      critText,
      img: undefined,
      track: undefined,
      sound: undefined,
    });
  }
  const texts: string[] = [];
  const media: Media[] = [];
  for (let i = 0; i < LOCATION_TEXTS; i++) {
    texts.push(r.readString());
    media.push({ img: undefined, sound: undefined, track: undefined });
  }
  const isTextByFormula = !!r.byte();
  r.seek(4);
  r.readString();
  r.readString();
  const textSelectFurmula = r.readString();

  return {
    dayPassed,
    id,
    isEmpty,
    isFaily,
    isFailyDeadly,
    isStarting,
    isSuccess,
    paramsChanges,
    texts,
    media,
    isTextByFormula,
    textSelectFormula: textSelectFurmula,
    maxVisits: 0,

    locX,
    locY,
  };
}
function parseLocationQmm(r: Reader, paramsCount: number): Location {
  const dayPassed = !!r.int32();

  const locX = r.int32(); /* In pixels */
  const locY = r.int32(); /* In pixels */

  const id = r.int32() as LocationId;
  const maxVisits = r.int32();

  const type = r.byte() as LocationType;
  const isStarting = type === LocationType.Starting;
  const isSuccess = type === LocationType.Success;
  const isFaily = type === LocationType.Faily;
  const isFailyDeadly = type === LocationType.Deadly;
  const isEmpty = type === LocationType.Empty;

  const paramsChanges: ParameterChange[] = [];

  for (let i = 0; i < paramsCount; i++) {
    paramsChanges.push({
      change: 0,
      showingType: ParameterShowingType.НеТрогать,
      isChangePercentage: false,
      isChangeValue: false,
      isChangeFormula: false,
      changingFormula: "",
      critText: "",
      img: undefined,
      track: undefined,
      sound: undefined,
    });
  }
  const affectedParamsCount = r.int32();
  for (let i = 0; i < affectedParamsCount; i++) {
    const paramN = r.int32();

    const change = r.int32();
    const showingType = r.byte() as ParameterShowingType;

    const changeType = r.byte() as ParameterChangeType;
    const isChangePercentage = changeType === ParameterChangeType.Percentage;
    const isChangeValue = changeType === ParameterChangeType.Value;
    const isChangeFormula = changeType === ParameterChangeType.Formula;
    const changingFormula = r.readString();
    const critText = r.readString();
    const img = r.readString(true);
    const sound = r.readString(true);
    const track = r.readString(true);
    paramsChanges[paramN - 1] = {
      change,
      showingType,
      isChangePercentage,
      isChangeFormula,
      isChangeValue,
      changingFormula,
      critText,
      img,
      track,
      sound,
    };
  }
  const texts: string[] = [];
  const media: Media[] = [];
  const locationTexts = r.int32();
  for (let i = 0; i < locationTexts; i++) {
    const text = r.readString();
    texts.push(text);
    const img = r.readString(true);
    const sound = r.readString(true);
    const track = r.readString(true);
    media.push({ img, track, sound });
  }

  const isTextByFormula = !!r.byte();
  const textSelectFurmula = r.readString();
  // console.info(isTextByFormula, textSelectFurmula)
  // r.debugShowHex(0); // must be 3543
  return {
    dayPassed,
    id,
    isEmpty,
    isFaily,
    isFailyDeadly,
    isStarting,
    isSuccess,
    paramsChanges,
    texts,
    media,
    isTextByFormula,
    textSelectFormula: textSelectFurmula,
    maxVisits,
    locX,
    locY,
  };
}

export interface JumpParameterCondition {
  mustFrom: number;
  mustTo: number;
  mustEqualValues: number[];
  mustEqualValuesEqual: boolean;
  mustModValues: number[];
  mustModValuesMod: boolean;
}

function parseJump(r: Reader, paramsCount: number): Jump {
  const priority = r.float64();
  const dayPassed = !!r.int32();
  const id = r.int32() as JumpId;
  const fromLocationId = r.int32() as LocationId;
  const toLocationId = r.int32() as LocationId;
  r.seek(1);
  const alwaysShow = !!r.byte();
  const jumpingCountLimit = r.int32();
  const showingOrder = r.int32();

  const paramsChanges: ParameterChange[] = [];
  const paramsConditions: JumpParameterCondition[] = [];
  for (let i = 0; i < paramsCount; i++) {
    r.seek(4);
    const mustFrom = r.int32();
    const mustTo = r.int32();
    const change = r.int32();
    const showingType = r.int32() as ParameterShowingType;
    r.seek(1);
    const isChangePercentage = !!r.byte();
    const isChangeValue = !!r.byte();
    const isChangeFormula = !!r.byte();
    const changingFormula = r.readString();

    const mustEqualValuesCount = r.int32();
    const mustEqualValuesEqual = !!r.byte();
    const mustEqualValues: number[] = [];
    //console.info(`mustEqualValuesCount=${mustEqualValuesCount}`)
    for (let ii = 0; ii < mustEqualValuesCount; ii++) {
      mustEqualValues.push(r.int32());
      //  console.info('pushed');
    }
    //console.info(`eq=${mustEqualValuesNotEqual} values = ${mustEqualValues.join(', ')}`)
    const mustModValuesCount = r.int32();
    //console.info(`mustModValuesCount=${mustModValuesCount}`)
    const mustModValuesMod = !!r.byte();
    const mustModValues: number[] = [];
    for (let ii = 0; ii < mustModValuesCount; ii++) {
      mustModValues.push(r.int32());
    }

    const critText = r.readString();
    // console.info(`Param ${i} crit text =${critText}`)
    paramsChanges.push({
      change,
      showingType,
      isChangeFormula,
      isChangePercentage,
      isChangeValue,
      changingFormula,
      critText,
      img: undefined,
      track: undefined,
      sound: undefined,
    });
    paramsConditions.push({
      mustFrom,
      mustTo,
      mustEqualValues,
      mustEqualValuesEqual,
      mustModValues,
      mustModValuesMod,
    });
  }

  const formulaToPass = r.readString();

  const text = r.readString();

  const description = r.readString();

  return {
    priority,
    dayPassed,
    id,
    fromLocationId,
    toLocationId,
    alwaysShow,
    jumpingCountLimit,
    showingOrder,
    paramsChanges,
    paramsConditions,
    formulaToPass,
    text,
    description,
    img: undefined,
    track: undefined,
    sound: undefined,
  };
}

function parseJumpQmm(r: Reader, paramsCount: number, questParams: QMParam[]): Jump {
  //r.debugShowHex()
  const priority = r.float64();
  const dayPassed = !!r.int32();
  const id = r.int32() as JumpId;
  const fromLocationId = r.int32() as LocationId;
  const toLocationId = r.int32() as LocationId;

  const alwaysShow = !!r.byte();
  const jumpingCountLimit = r.int32();
  const showingOrder = r.int32();

  const paramsChanges: ParameterChange[] = [];
  const paramsConditions: JumpParameterCondition[] = [];

  for (let i = 0; i < paramsCount; i++) {
    paramsChanges.push({
      change: 0,
      showingType: ParameterShowingType.НеТрогать,
      isChangeFormula: false,
      isChangePercentage: false,
      isChangeValue: false,
      changingFormula: "",
      critText: "",
      img: undefined,
      track: undefined,
      sound: undefined,
    });
    paramsConditions.push({
      mustFrom: questParams[i].min,
      mustTo: questParams[i].max,
      mustEqualValues: [],
      mustEqualValuesEqual: false,
      mustModValues: [],
      mustModValuesMod: false,
    });
  }
  const affectedConditionsParamsCount = r.int32();
  for (let i = 0; i < affectedConditionsParamsCount; i++) {
    const paramId = r.int32();

    const mustFrom = r.int32();
    const mustTo = r.int32();

    const mustEqualValuesCount = r.int32();
    const mustEqualValuesEqual = !!r.byte();
    const mustEqualValues: number[] = [];
    //console.info(`mustEqualValuesCount=${mustEqualValuesCount}`)
    for (let ii = 0; ii < mustEqualValuesCount; ii++) {
      mustEqualValues.push(r.int32());
      //  console.info('pushed');
    }

    const mustModValuesCount = r.int32();
    const mustModValuesMod = !!r.byte();
    const mustModValues: number[] = [];
    for (let ii = 0; ii < mustModValuesCount; ii++) {
      mustModValues.push(r.int32());
    }

    paramsConditions[paramId - 1] = {
      mustFrom,
      mustTo,
      mustEqualValues,
      mustEqualValuesEqual,
      mustModValues,
      mustModValuesMod,
    };
  }

  const affectedChangeParamsCount = r.int32();
  for (let i = 0; i < affectedChangeParamsCount; i++) {
    const paramId = r.int32();
    const change = r.int32();

    const showingType = r.byte() as ParameterShowingType;

    const changingType = r.byte() as ParameterChangeType;

    const isChangePercentage = changingType === ParameterChangeType.Percentage;
    const isChangeValue = changingType === ParameterChangeType.Value;
    const isChangeFormula = changingType === ParameterChangeType.Formula;
    const changingFormula = r.readString();

    const critText = r.readString();

    const img = r.readString(true);
    const sound = r.readString(true);
    const track = r.readString(true);

    // console.info(`Param ${i} crit text =${critText}`)
    paramsChanges[paramId - 1] = {
      change,
      showingType,
      isChangeFormula,
      isChangePercentage,
      isChangeValue,
      changingFormula,
      critText,
      img,
      track,
      sound,
    };
  }

  const formulaToPass = r.readString();

  const text = r.readString();

  const description = r.readString();
  const img = r.readString(true);
  const sound = r.readString(true);
  const track = r.readString(true);

  return {
    priority,
    dayPassed,
    id,
    fromLocationId,
    toLocationId,
    alwaysShow,
    jumpingCountLimit,
    showingOrder,
    paramsChanges,
    paramsConditions,
    formulaToPass,
    text,
    description,
    img,
    track,
    sound,
  };
}

export function parse(data: Buffer): QM {
  const r = new Reader(data);
  const header = r.int32() as HeaderMagic;

  const base = parseBase(r, header);

  const isQmm =
    header === HEADER_QMM_6 ||
    header === HEADER_QMM_7 ||
    header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR;
  const params: QMParam[] = [];
  for (let i = 0; i < base.paramsCount; i++) {
    params.push(isQmm ? parseParamQmm(r) : parseParam(r));
  }

  const base2 = parseBase2(r, isQmm);

  const locations: Location[] = [];

  for (let i = 0; i < base2.locationsCount; i++) {
    locations.push(
      isQmm ? parseLocationQmm(r, base.paramsCount) : parseLocation(r, base.paramsCount),
    );
  }

  const jumps: Jump[] = [];
  for (let i = 0; i < base2.jumpsCount; i++) {
    jumps.push(isQmm ? parseJumpQmm(r, base.paramsCount, params) : parseJump(r, base.paramsCount));
  }

  if (r.isNotEnd()) {
    throw new Error(r.isNotEnd());
  }

  const base3: QMBase3 = {
    header,
  };
  return {
    ...base,
    ...base2,
    ...base3,
    params,
    locations,
    jumps,
  };
}
