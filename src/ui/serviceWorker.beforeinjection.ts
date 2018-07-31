import './version.ts';

declare var serviceWorkerOption: {
       assets: string[],
};
const { assets } = serviceWorkerOption;

import { INDEX_JSON, DATA_DIR } from "./consts";
import { Index } from "../packGameData";

// console.info(serviceWorkerOption);
/*
"assets": [
    "/fonts/674f50d287a8c48dc19ba404d20fe713.eot",
    "/img/912ec66d7572ff821749319396470bde.svg",
    "/fonts/b06871f281fee6b241d60582ae9369b9.ttf",
    "/fonts/af7ae505a9eed503f8b8e6982036873e.woff2",
    "/fonts/fee66e712a8a08eef5805a46892932ad.woff",
    "/index.css",
    "/index.js",
    "/serviceWorker.beforeinjection.js",
    "/favicon.png",
    "/spacerangersquest/index.html",
    "/manifest.json",
    "/index.html",
    "/version.json"
  ]
*/

console.info(assets);
console.info(`Version = ${__VERSION__}`)