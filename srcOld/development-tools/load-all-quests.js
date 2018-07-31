"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var qmreader_1 = require("../lib/qmreader");
var fs = __importStar(require("fs"));
var dataSrcPath = __dirname + '/../../borrowed';
for (var _i = 0, _a = fs.readdirSync(dataSrcPath + '/qm'); _i < _a.length; _i++) {
    var origin = _a[_i];
    console.info("Scanning origin " + origin);
    var qmDir = dataSrcPath + '/qm/' + origin + '/';
    for (var _b = 0, _c = fs.readdirSync(qmDir); _b < _c.length; _b++) {
        var qmShortName = _c[_b];
        var srcQmName = qmDir + qmShortName;
        var lang = origin.endsWith('eng') ? 'eng' : 'rus';
        var oldTge = origin.startsWith('Tge');
        var gameName = qmShortName.replace(/(\.qm|\.qmm)$/, '')
            .replace(/_eng$/, '');
        console.info("Reading " + srcQmName + " (" + lang + ", oldTge=" + oldTge + ") gameName=" + gameName);
        var data = fs.readFileSync(srcQmName);
        var quest = qmreader_1.parse(data);
        //const player = new QMPlayer(quest, undefined, lang, oldTge);
        //player.start();
    }
}
