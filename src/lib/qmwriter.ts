import { DeepImmutable } from "./qmplayer/deepImmutable";
import { HEADER_QMM_7, LocationType, QM } from "./qmreader";

export class Writer {
  private buf = Buffer.alloc(this.chunkSize);
  private pos = 0;

  private ensure(len: number) {
    if (this.pos + len > this.buf.length) {
      this.buf = Buffer.concat([this.buf, Buffer.alloc(this.chunkSize)]);
    }
  }

  constructor(private chunkSize = 1024 * 1024) {
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
    this.ensure(4);
    if (str === null || str === undefined) {
      this.int32(0);
    } else {
      this.int32(1);
      const stringBuffer = Buffer.from(str, "utf16le");
      if (stringBuffer.length % 2 !== 0) {
        throw new Error(`Internal error, utf16le is not even`);
      }
      const length = stringBuffer.length / 2;

      this.ensure(4);
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

export function writeQmm(quest: DeepImmutable<QM>) {
  const w = new Writer();
  w.int32(HEADER_QMM_7);
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
    // todo
  }

  return w.export();
}
