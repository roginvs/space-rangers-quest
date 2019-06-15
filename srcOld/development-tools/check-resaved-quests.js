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
var gameDir = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart\\DATA\\questsRus\\Data\\Quest\\Rus\\';
var resavedDir = __dirname + '/../../data/src/rus/';
var _loop_1 = function (fileName) {
    //const fileName = 'Banket.qm';    
    console.info('\n');
    var origData = fs.readFileSync(gameDir + fileName);
    console.info("Loading original quest " + fileName);
    var origQuest = qmreader_1.parse(origData);
    if (!fs.existsSync(resavedDir + fileName)) {
        console.info('No resaved quest');
        return "continue";
    }
    var resavedData = fs.readFileSync(resavedDir + fileName);
    console.info("Loading resaved quest " + fileName);
    var resavedQuest = qmreader_1.parse(resavedData);
    //if (resavedQuest.paramsCount === origQuest.paramsCount && fileName !== 'GLAVRED.qm') {
    if (fileName !== 'GLAVRED.qm') {
        var diff = deepDiff(origQuest, resavedQuest);
        if (diff) {
            var diffWithoutAddings = diff.filter(function (x) { return !((x.kind === 'A' && x.item.kind === 'N' &&
                ((x.path[0] === 'params' || x.path[2] === 'params') && x.index >= origQuest.paramsCount)) ||
                (x.path.length === 1 && x.path[0] === 'paramsCount')); });
            if (diffWithoutAddings.length === 0) {
                console.info("Same but have inserts in arrays");
                // console.info(diff.map((x:any) => x.path).join('\n'))
            }
            else {
                console.info(diffWithoutAddings);
                throw new Error('Difference!');
            }
        }
        else {
            console.info('Object are same');
        }
    }
    else {
        console.info("Skipping check: resavedParams=" + resavedQuest.paramsCount + " originalParams=" + origQuest.paramsCount);
    }
    // assert.deepStrictEqual(resavedQuest, origQuest, 'Data is the same');
    // const player = new QMPlayer(quest, undefined, lang, questOrigin === ORIGIN_TGE);
};
for (var _i = 0, _a = fs.readdirSync(gameDir); _i < _a.length; _i++) {
    var fileName = _a[_i];
    _loop_1(fileName);
}
