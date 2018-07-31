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
var qmreader_1 = require("../lib/qmreader");
var fileName = __dirname + '/../../src/development-tools/Amnesia-param1imgsound-added-param25.qmm';
//const fileName = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart2.1.2170\\DATA\\questsRus\\Data\\Quest\\Rus\\Amnesia.qmm'; 
console.info("Loading qmm quest " + fileName);
var qmmData = fs.readFileSync(fileName);
var qmmQuest = qmreader_1.parse(qmmData);
