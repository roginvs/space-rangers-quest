import { assertNever } from "../assertNever";
import { DeepImmutable } from "./qmplayer/deepImmutable";
import {
  HEADER_QMM_6,
  HEADER_QMM_7,
  HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR,
  HEADER_QM_2,
  HEADER_QM_3,
  HEADER_QM_4,
  JumpParameterCondition,
  LocationType,
  ParameterChange,
  ParameterChangeType,
  ParameterShowingType,
  QM,
  QMParam,
} from "./qmreader";

export class Writer {
  private buf = Buffer.alloc(this.chunkSize);
  private pos = 0;

  private ensure(len: number) {
    if (this.pos + len > this.buf.length) {
      this.buf = Buffer.concat([this.buf, Buffer.alloc(this.chunkSize)]);
    }
  }

  constructor(private readonly chunkSize = 1024 * 1024) {
    // nothing here
  }

  export() {
    return this.buf.slice(0, this.pos);
  }

  int32(i: number) {
    this.ensure(4);
    this.buf.writeInt32LE(i, this.pos);
    this.pos += 4;
  }
  writeString(str: string | null | undefined) {
    if (str === null || str === undefined) {
      this.int32(0);
    } else {
      this.int32(1);
      const stringBuffer = Buffer.from(str, "utf16le");
      if (stringBuffer.length % 2 !== 0) {
        throw new Error(`Internal error, utf16le is not even`);
      }
      const length = stringBuffer.length / 2;

      this.int32(length);

      this.ensure(stringBuffer.length);
      stringBuffer.copy(this.buf, this.pos);
      this.pos += stringBuffer.length;
    }
  }
  byte(b: number) {
    this.ensure(1);
    this.buf[this.pos] = b;
    this.pos += 1;
  }
  float64(val: number) {
    this.ensure(8);
    this.buf.writeDoubleLE(val, this.pos);
    this.pos += 8;
  }
}

function writeParamChange(w: Writer, param: DeepImmutable<ParameterChange>, paramIdx: number) {
  w.int32(paramIdx + 1);
  w.int32(param.change);
  w.byte(param.showingType);

  const changeType = param.isChangeFormula
    ? ParameterChangeType.Formula
    : param.isChangeValue
    ? ParameterChangeType.Value
    : param.isChangePercentage
    ? ParameterChangeType.Percentage
    : ParameterChangeType.Summ;
  w.byte(changeType);

  w.writeString(param.changingFormula);

  w.writeString(param.critText);
  w.writeString(param.img);
  w.writeString(param.sound);
  w.writeString(param.track);
}

function isParameterChangeChanged(param: DeepImmutable<ParameterChange>): boolean {
  return (
    param.change !== 0 ||
    param.showingType !== ParameterShowingType.НеТрогать ||
    param.isChangeFormula ||
    param.isChangeValue ||
    param.isChangePercentage ||
    !!param.changingFormula ||
    !!param.critText ||
    !!param.img ||
    !!param.sound ||
    !!param.track
  );
}

function isJumpParameterConditionChanged(
  condition: DeepImmutable<JumpParameterCondition>,
  param: { min: number; max: number },
): boolean {
  return (
    condition.mustFrom !== param.min ||
    condition.mustTo !== param.max ||
    condition.mustEqualValues.length > 0 ||
    condition.mustEqualValuesEqual ||
    condition.mustModValues.length > 0 ||
    condition.mustModValuesMod
  );
}

export function writeQmm(quest: DeepImmutable<QM>) {
  const w = new Writer();
  if (
    quest.header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR ||
    quest.header === HEADER_QM_2 ||
    quest.header === HEADER_QM_3 ||
    quest.header === HEADER_QM_4
  ) {
    w.int32(HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR);
  } else if (quest.header === HEADER_QMM_7 || quest.header === HEADER_QMM_6) {
    w.int32(HEADER_QMM_7);
  } else {
    assertNever(quest.header);
  }
  w.int32(quest.majorVersion === undefined ? 1 : quest.majorVersion);
  w.int32(quest.minorVersion === undefined ? 0 : quest.minorVersion);

  w.writeString(quest.changeLogString);

  w.byte(quest.givingRace);
  w.byte(quest.whenDone);
  w.byte(quest.planetRace);
  w.byte(quest.playerCareer);
  w.byte(quest.playerRace);
  w.int32(quest.reputationChange);

  w.int32(quest.screenSizeX);
  w.int32(quest.screenSizeY);
  w.int32(quest.widthSize);
  w.int32(quest.heightSize);
  w.int32(quest.defaultJumpCountLimit);
  w.int32(quest.hardness);

  // Params
  w.int32(quest.params.length);
  for (const param of quest.params) {
    w.int32(param.min);
    w.int32(param.max);
    w.byte(param.type);

    w.byte(0);
    w.byte(0);
    w.byte(0);
    w.byte(param.showWhenZero ? 1 : 0);
    w.byte(param.critType);
    w.byte(param.active ? 1 : 0);
    w.int32(param.showingInfo.length);
    w.byte(param.isMoney ? 1 : 0);
    w.writeString(param.name);
    for (const showingRange of param.showingInfo) {
      w.int32(showingRange.from);
      w.int32(showingRange.to);
      w.writeString(showingRange.str);
    }
    w.writeString(param.critValueString);
    w.writeString(param.img);
    w.writeString(param.sound);
    w.writeString(param.track);
    w.writeString(param.starting);
  }

  w.writeString(quest.strings.ToStar);
  w.writeString(quest.strings.ToPlanet);
  w.writeString(quest.strings.Date);
  w.writeString(quest.strings.Money);
  w.writeString(quest.strings.FromPlanet);
  w.writeString(quest.strings.FromStar);
  w.writeString(quest.strings.Ranger);

  w.int32(quest.locations.length);
  w.int32(quest.jumps.length);

  w.writeString(quest.successText);

  w.writeString(quest.taskText);

  for (const loc of quest.locations) {
    w.int32(loc.dayPassed ? 1 : 0);
    w.int32(loc.locX);
    w.int32(loc.locY);
    w.int32(loc.id);
    w.int32(loc.maxVisits);

    const type = loc.isStarting
      ? LocationType.Starting
      : loc.isSuccess
      ? LocationType.Success
      : loc.isEmpty
      ? LocationType.Empty
      : loc.isFailyDeadly
      ? LocationType.Deadly
      : loc.isFaily
      ? LocationType.Faily
      : LocationType.Ordinary;
    w.byte(type);

    const affectedParamsChange = loc.paramsChanges
      .map((param, idx) => ({
        param,
        idx,
        keep: isParameterChangeChanged(param),
      }))
      .filter((x) => x.keep);

    w.int32(affectedParamsChange.length);
    for (const { param, idx } of affectedParamsChange) {
      writeParamChange(w, param, idx);
    }

    w.int32(loc.texts.length);
    for (let i = 0; i < loc.texts.length; i++) {
      w.writeString(loc.texts[i]);
      const media = loc.media[i];
      w.writeString(media?.img);
      w.writeString(media?.sound);
      w.writeString(media?.track);
    }

    w.byte(loc.isTextByFormula ? 1 : 0);
    w.writeString(loc.textSelectFormula);
  }

  for (const jump of quest.jumps) {
    w.float64(jump.priority);
    w.int32(jump.dayPassed ? 1 : 0);
    w.int32(jump.id);
    w.int32(jump.fromLocationId);
    w.int32(jump.toLocationId);
    w.byte(jump.alwaysShow ? 1 : 0);
    w.int32(jump.jumpingCountLimit);
    w.int32(jump.showingOrder);

    const affectedJumpConditionParams = jump.paramsConditions
      .map((cond, idx) => ({
        cond,
        idx,
        keep: isJumpParameterConditionChanged(cond, quest.params[idx]),
      }))
      .filter((x) => x.keep);
    w.int32(affectedJumpConditionParams.length);
    for (const { cond, idx } of affectedJumpConditionParams) {
      w.int32(idx + 1);
      w.int32(cond.mustFrom);
      w.int32(cond.mustTo);

      w.int32(cond.mustEqualValues.length);
      w.byte(cond.mustEqualValuesEqual ? 1 : 0);
      for (const val of cond.mustEqualValues) {
        w.int32(val);
      }

      w.int32(cond.mustModValues.length);
      w.byte(cond.mustModValuesMod ? 1 : 0);
      for (const val of cond.mustModValues) {
        w.int32(val);
      }
    }

    const affectedParamsChange = jump.paramsChanges
      .map((param, idx) => ({ param, idx, keep: isParameterChangeChanged(param) }))
      .filter((x) => x.keep);
    w.int32(affectedParamsChange.length);
    for (const { param, idx } of affectedParamsChange) {
      writeParamChange(w, param, idx);
    }

    w.writeString(jump.formulaToPass);
    w.writeString(jump.text);
    w.writeString(jump.description);
    w.writeString(jump.img);
    w.writeString(jump.sound);
    w.writeString(jump.track);
  }

  return w.export();
}
