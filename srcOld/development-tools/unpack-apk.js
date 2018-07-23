"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var unpackedDir = 'c:\\Users\\vasilii\\Downloads\\Space_Rangers_Quest_v1.0.5_Mod\\';
var dirToScan = unpackedDir + 'assets/bin/Data';
var dirToCopy = unpackedDir + 'tmp\\';
var questCount = 0;
for (var _i = 0, _a = fs.readdirSync(dirToScan).sort(function (a, b) { return a > b ? 1 : -1; }); _i < _a.length; _i++) {
    var f = _a[_i];
    var fullName = dirToScan + '/' + f;
    if (!fs.statSync(fullName).isFile()) {
        continue;
    }
    var data = fs.readFileSync(fullName);
    if (data.length < 0x1010) {
        console.info(f + " size lower then 0x1000");
        continue;
    }
    var fnamelen = data.readUInt32LE(0x1000);
    if (fnamelen > 0x100) {
        console.info(f + " have wrong len");
        continue;
    }
    if (data.length < 0x1000 + 4 + fnamelen + 4) {
        console.info(f + " have small len");
        continue;
    }
    // console.info(`${f} ${data.length} ${fnamelen} ${0x1000 + 4 + fnamelen + 4}`)
    var fname = data.slice(0x1000 + 4, 0x1000 + 4 + fnamelen).toString();
    // const unknown = data.readUInt32LE(0x1000 + 4 + fnamelen);
    var dataStartsFrom = 0x1000 + 4 + fnamelen + 4;
    var dataStartsFromShifted = dataStartsFrom % 4 === 0 ?
        dataStartsFrom : dataStartsFrom - (dataStartsFrom % 4) + 4;
    var dataLen = data.readUInt32LE(dataStartsFromShifted - 4);
    var header = data.readUInt32LE(dataStartsFromShifted);
    var headerBE = data.readUInt32BE(dataStartsFromShifted);
    if (header === 0x423A35D6 || header === 0x423A35D7) {
        console.info(f + " : " + fname + " dataLen=" + dataLen + " dataleft=" + (data.length - dataStartsFromShifted));
        questCount++;
        var writefname = dirToCopy + fname + '.qmm';
        var i = 0;
        while (true) {
            writefname = dirToCopy + fname +
                (i ? i : '') +
                '.qmm';
            if (!fs.existsSync(writefname)) {
                break;
            }
            i++;
        }
        fs.writeFileSync(writefname, data.slice(dataStartsFromShifted, dataStartsFromShifted + dataLen));
    }
    else if (header === 0x423A35D5 || header === 0x423A35D8) {
        console.info(f + " : " + fname + " have unknown header " + header);
    }
    else {
        var lookAhead = 64;
        var lookAheadTo = (dataStartsFrom + lookAhead < data.length) ?
            dataStartsFrom + lookAhead : data.length;
        var someNextData = data.slice(dataStartsFrom, lookAheadTo);
        if (someNextData.indexOf(0x423A35D6) > -1 || someNextData.indexOf(0x423A35D7) > -1) {
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
console.info("Quests totally=" + questCount);
/*

Episode00
Episode07c

Outro
Tutorial

*/ 
