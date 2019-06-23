import * as fs from "fs";

import * as deepDiff from "deep-diff";

import { parse, ParamType, ParamCritType } from "../lib/qmreader";

import * as assert from "assert";

const fileName =
  __dirname + "/../../src/development-tools/Amnesia-param1imgsound-added-param25.qmm";
//const fileName = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart2.1.2170\\DATA\\questsRus\\Data\\Quest\\Rus\\Amnesia.qmm';
console.info(`Loading qmm quest ${fileName}`);
const qmmData = fs.readFileSync(fileName);
const qmmQuest = parse(qmmData);
