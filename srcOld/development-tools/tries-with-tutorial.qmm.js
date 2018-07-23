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
//const fileName = __dirname + '/../../borrowed/qm/SRQ 1.0.5/Tutorial.qmm';
var fileName = __dirname + '/../../../tmp/1.qmm';
console.info("Loading qmm quest " + fileName);
var qmmData = fs.readFileSync(fileName);
var qmmQuest = qmreader_1.parse(qmmData);
//console.info(JSON.stringify(qmmQuest, null, 4));
