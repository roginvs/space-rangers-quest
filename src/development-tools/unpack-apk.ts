import * as fs from "fs";

import { parse, ParamType, ParamCritType } from "../lib/qmreader";

import * as assert from "assert";

const unpackedDir = "c:\\Users\\vasilii\\Downloads\\Space_Rangers_Quest_v1.0.5_Mod\\";
const dirToScan = unpackedDir + "assets/bin/Data";

const dirToCopy = unpackedDir + "tmp\\";

let questCount = 0;
for (const f of fs.readdirSync(dirToScan).sort((a, b) => (a > b ? 1 : -1))) {
  const fullName = dirToScan + "/" + f;
  if (!fs.statSync(fullName).isFile()) {
    continue;
  }
  const data = fs.readFileSync(fullName);
  if (data.length < 0x1010) {
    console.info(`${f} size lower then 0x1000`);
    continue;
  }

  const fnamelen = data.readUInt32LE(0x1000);
  if (fnamelen > 0x100) {
    console.info(`${f} have wrong len`);
    continue;
  }
  if (data.length < 0x1000 + 4 + fnamelen + 4) {
    console.info(`${f} have small len`);
    continue;
  }

  // console.info(`${f} ${data.length} ${fnamelen} ${0x1000 + 4 + fnamelen + 4}`)
  const fname = data.slice(0x1000 + 4, 0x1000 + 4 + fnamelen).toString();
  // const unknown = data.readUInt32LE(0x1000 + 4 + fnamelen);

  const dataStartsFrom = 0x1000 + 4 + fnamelen + 4;
  const dataStartsFromShifted =
    dataStartsFrom % 4 === 0 ? dataStartsFrom : dataStartsFrom - (dataStartsFrom % 4) + 4;

  const dataLen = data.readUInt32LE(dataStartsFromShifted - 4);

  const header = data.readUInt32LE(dataStartsFromShifted);
  const headerBE = data.readUInt32BE(dataStartsFromShifted);
  if (header === 0x423a35d6 || header === 0x423a35d7) {
    console.info(
      `${f} : ${fname} dataLen=${dataLen} dataleft=${data.length - dataStartsFromShifted}`,
    );
    questCount++;

    let writefname = dirToCopy + fname + ".qmm";
    let i = 0;
    while (true) {
      writefname = dirToCopy + fname + (i ? `${i}` : "") + ".qmm";
      if (!fs.existsSync(writefname)) {
        break;
      }
      i++;
    }
    fs.writeFileSync(
      writefname,
      data.slice(dataStartsFromShifted, dataStartsFromShifted + dataLen),
    );
  } else if (header === 0x423a35d5 || header === 0x423a35d8) {
    console.info(`${f} : ${fname} have unknown header ${header}`);
  } else {
    const lookAhead = 64;
    const lookAheadTo =
      dataStartsFrom + lookAhead < data.length ? dataStartsFrom + lookAhead : data.length;
    const someNextData = data.slice(dataStartsFrom, lookAheadTo);
    if (someNextData.indexOf(0x423a35d6) > -1 || someNextData.indexOf(0x423a35d7) > -1) {
      //  console.info(`${f} : ${fname} (len=${fnamelen}), dataSize=${dataSize} ${lookAheadTo}`);//${someNextData.toString('hex')}`);
      //questCount++;
    }
  }

  /*
    if (headerBE === 0xffd8ffe0) {
        let writefname = dirToCopy + fname + '.jpg';        
        fs.writeFileSync(writefname, data.slice(dataStartsFromShifted, dataStartsFromShifted + dataLen))
    }
    */
}
// 81+32 == 113 from simple file lookup
console.info(`Quests totally=${questCount}`);

/*

Episode00
Episode07c

Outro
Tutorial

*/
