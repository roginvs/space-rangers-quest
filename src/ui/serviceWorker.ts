import { ServiceWorkerGlobalScope } from "./lib.webworker";

declare var self: ServiceWorkerGlobalScope;
declare var fetch: ServiceWorkerGlobalScope["fetch"];

import "./version.ts";

declare var serviceWorkerOption: {
    assets: string[];
};

import {
    INDEX_JSON,
    DATA_DIR,
    CACHE_MUSIC_NAME,
    CACHE_IMAGES_NAME
} from "./consts";
import { Index } from "../packGameData";

export const CACHE_QUESTS_NAME = 'spacerangers-quests';


export const CACHE_ENGINE_PREFIX = 'spacerangers-engine';
const CACHE_ENGINE_NAME = `${CACHE_ENGINE_PREFIX}-${new Date(__VERSION__).toISOString()}`;

const engineUrls = [
    "/",
    INDEX_JSON,
    ...serviceWorkerOption.assets,
    `/?version=${new Date(__VERSION__).getTime()}` // to enforce a reinstall after rebuild
];
console.info(`Service version ${__VERSION__} worker engine urls: `, engineUrls);

function getIndex() {
    return fetch(INDEX_JSON).then(data => data.json()) as Promise<Index>;
}

self.addEventListener("install", event => {
    // Perform install steps
    console.info(`${new Date()} Serviceworker got install event.`);
    event.waitUntil(
        (async () => {
            const cacheEngine = await caches.open(CACHE_ENGINE_NAME);
            console.info(`${new Date()} Serviceworker opened engine cache='${CACHE_ENGINE_NAME}, downloading engine'`);                
            await cacheEngine.addAll(engineUrls);
            
            console.info(`Downloading index.json`);
            const data = await getIndex();
            console.info(`Opening quests cache`);
            const cacheQuests = await caches.open(CACHE_QUESTS_NAME);
            console.info(`Checking quests and downloading if needed. Total quests size=${data.dir.quests.totalSize}`);
            
            await Promise.all(data.dir.quests.files.map(async quest => {
                const url = DATA_DIR + quest.path;
                if (! await cacheQuests.match(url)) {
                    console.info(`Quest ${url} no match in cache, downloading`);
                    await cacheQuests.add(url);
                } else {
                    console.info(`Quest ${url} is already in cache`)
                }
            }));            
            
            console.info(`${new Date()} Catching done`);
            //await self.skipWaiting();
        })().catch(e => {
            console.error(`${new Date()} Error in sw`, e);
            throw e;
        })
    );
});

self.addEventListener("activate", event => {
    console.log(`${new Date()} ServiceWorker activation started`);
    event.waitUntil(
        (async () => {
            for (const cacheKey of await caches.keys()) {
                if (cacheKey.indexOf(CACHE_ENGINE_PREFIX) !== 0) {
                    continue
                }
                if (cacheKey === CACHE_ENGINE_NAME) {
                    continue
                }
                console.info(`Removing old engine cache ${cacheKey}`);
                const deleteResult = await caches.delete(cacheKey);
                console.info(`Old cache ${cacheKey} deleteResult=${deleteResult}`);
            }
            
            
            console.info(`${new Date()} Service worker activation finished`);
        })()
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        (async () => {
            const cacheHit =
                (await caches
                    .open(CACHE_ENGINE_NAME)
                    .then(cache => cache.match(event.request.url))) ||                    
                (await caches
                        .open(CACHE_QUESTS_NAME)
                        .then(cache => cache.match(event.request.url))) ||    
                (await caches
                    .open(CACHE_IMAGES_NAME)
                    .then(cache => cache.match(event.request.url))) ||
                (await caches
                    .open(CACHE_MUSIC_NAME)
                    .then(cache => cache.match(event.request.url)));

            const headersRange = event.request.headers.get("range");
            if (headersRange) {
                console.info(`headersRange='${headersRange}'`);
                const m = headersRange.match(/^bytes\=(\d+)\-$/);
                if (!m) {
                    // ????
                    return fetch(event.request);
                }

                const pos = parseInt(m[1]);
                console.log(
                    `Range request for ${
                        event.request.url
                    }, starting position: ${pos}`
                );

                if (!cacheHit) {
                    console.info(`No audio cache for ${event.request.url}`);
                    return fetch(event.request);
                } else {
                    console.info(`Cache audio hit for ${event.request.url}`);
                    const arrayBuffer = await cacheHit.arrayBuffer();
                    return new Response(arrayBuffer.slice(pos), {
                        status: 206,
                        statusText: "Partial Content",
                        headers: [
                            // ['Content-Type', 'video/webm'],
                            [
                                "Content-Range",
                                `bytes ${pos}-${arrayBuffer.byteLength - 1}/${
                                    arrayBuffer.byteLength
                                }`
                            ]
                        ]
                    });
                }
            }

            if (cacheHit) {
                console.info(`Cache hit for ${event.request.url}`);
                return cacheHit;
            } else {
                console.info(`No cache for ${event.request.url}`);
                return fetch(event.request);
            }
        })()
    );
});
