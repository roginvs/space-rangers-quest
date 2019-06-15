import * as fs from "fs";

import { parse, ParamType, ParamCritType } from "../lib/qmreader";

import * as assert from "assert";

//const fileName = __dirname + '/../../borrowed/qm/SRQ 1.0.5/Tutorial.qmm';

const fileName = __dirname + "/../../../tmp/1.qmm";

console.info(`Loading qmm quest ${fileName}`);
const qmmData = fs.readFileSync(fileName);
const qmmQuest = parse(qmmData);

//console.info(JSON.stringify(qmmQuest, null, 4));
