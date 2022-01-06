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
  writeString(str: string | null) {
    this.ensure(4);
    if (str === null) {
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
