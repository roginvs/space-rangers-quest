import { parse, QM, ParamType, ParamCritType } from "../lib/qmreader";
import * as fs from "fs";

import { QMPlayer } from "../lib/qmplayer";
import { getAllMediaFromQmm } from "../lib/getAllMediaFromQmm";

/*

for f in *.png; do convert $f -quality 90 $(basename $f .png).jpg; done

*/

const data = fs.readFileSync(process.argv[2]);

const quest = parse(data);

const media = getAllMediaFromQmm(quest);

console.info(`All images:`);
Object.keys(media.images).forEach((img) => console.info(img));
console.info("");

console.info(`All sounds:`);
Object.keys(media.sounds).forEach((sound) => console.info(sound));
console.info("");

console.info(`All track:`);
Object.keys(media.tracks).forEach((track) => console.info(track));
console.info("");
