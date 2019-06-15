"use strict";
/* Это чтобы проверить что пересорханенные квесты такие же */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var deepDiff = __importStar(require("deep-diff"));
var qmreader_1 = require("../lib/qmreader");
// import { QMPlayer, QMImages } from './lib/qmplayer'
//const gameDir = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart\\DATA\\questsRus\\Data\\Quest\\Rus\\'
//const gameDir = __dirname + '/../../src/development-tools/'
var qmmDir = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart2.1.2170\\DATA\\questsRus\\Data\\Quest\\Rus\\';
//const qmDir = __dirname + '/../../data/src/rus/'
var qmDir = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart\\DATA\\questsRus\\Data\\Quest\\Rus\\';
var _loop_1 = function (fileName) {
    if (fileName != 'Amnesia.qmm') {
        // continue
    }
    console.info('\n');
    console.info("Loading qmm quest " + fileName);
    var qmmData = fs.readFileSync(qmmDir + fileName);
    var qmmQuest = qmreader_1.parse(qmmData);
    if (!false) {
        return "continue";
    }
    if (!fs.existsSync(qmDir + fileName.slice(0, -1))) {
        console.info('No resaved quest');
        //  continue;
    }
    console.info("Loading qm quest " + fileName.slice(0, -1));
    var qmData = fs.readFileSync(qmDir + fileName.slice(0, -1));
    var qmQuest = qmreader_1.parse(qmData);
    //if (resavedQuest.paramsCount === origQuest.paramsCount && fileName !== 'GLAVRED.qm') {
    //  if (fileName !== 'GLAVRED.qm') {
    var diff = deepDiff(qmmQuest, qmQuest);
    //const diff = undefined;
    if (diff) {
        var diffWithoutAddings = diff.filter(function (x) { return !((x.kind === 'A' && x.item.kind === 'N' &&
            ((x.path[0] === 'params' || x.path[2] === 'params') && x.index >= qmmQuest.paramsCount)) ||
            (x.path.length === 1 && x.path[0] === 'paramsCount') ||
            //  (x.path[2] === 'img' || x.path[2] === 'sound' || x.path[2] === 'track') ||
            (x.path[0] === 'header') ||
            (x.path[0] === 'strings' && (x.path[1] === 'Parsec' || x.path[1] === 'Artefact') ||
                (x.path[x.path.length - 1] === 'img' || x.path[x.path.length - 1] === 'sound' ||
                    x.path[x.path.length - 1] === 'track')) ||
            (x.kind === 'A' && x.item.kind === 'A' &&
                (x.item.path[x.item.path.length - 1] === 'img' ||
                    x.item.path[x.item.path.length - 1] === 'sound' ||
                    x.item.path[x.item.path.length - 1] === 'track'))); });
        if (diffWithoutAddings.length === 0) {
            console.info("Almost the same");
            // console.info(diff.map((x:any) => x.path).join('\n'))
        }
        else {
            console.info(diffWithoutAddings);
            // throw new Error('Difference!')
        }
    }
    else {
        console.info('Object are same');
    }
};
for (var _i = 0, _a = fs.readdirSync(qmmDir); _i < _a.length; _i++) {
    var fileName = _a[_i];
    _loop_1(fileName);
}
// } else {
//     console.info(`Skipping check: resavedParams=${resavedQuest.paramsCount} originalParams=${origQuest.paramsCount}`)
// }
// assert.deepStrictEqual(resavedQuest, origQuest, 'Data is the same');
// const player = new QMPlayer(quest, undefined, lang, questOrigin === ORIGIN_TGE);
//}
