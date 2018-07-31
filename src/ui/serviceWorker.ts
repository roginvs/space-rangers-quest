/// <reference path='../../node_modules/typescript/lib/lib.es6.d.ts' />
/// <reference path='../../node_modules/typescript/lib/lib.webworker.d.ts' />

declare var self: ServiceWorkerGlobalScope;

import "./version.ts";

declare var serviceWorkerOption: {
    assets: string[];
};

import {
    INDEX_JSON,
    DATA_DIR,
    CACHE_NAME_ENGINE,
    CACHE_NAME_MUSIC,
    CACHE_NAME_IMAGES
} from "./consts";
import { Index } from "../packGameData";

const engineUrls = [
    "/",
    INDEX_JSON,
    ...serviceWorkerOption.assets,
    `/?version=${new Date(__VERSION__).getTime()}` // to enforce a reinstall after rebuild
];
console.info('Service worker engine urls: ', engineUrls);

function getIndex() {
    return fetch(INDEX_JSON).then(data => data.json()) as Promise<Index>;
}

declare const x: ServiceWorkerGlobalScope;

self.addEventListener("install", event => {
    // Perform install steps
    console.info(new Date() + ` Serviceworker got install event.`);
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME_ENGINE);
            console.info(new Date() + ` Serviceworker opened cache`);
            const data = await getIndex();

            for (const dir of [data.dir.quests]) {
                const urlsToCache = engineUrls.concat(
                    ...dir.files
                        .map(x => x.path)
                        // .slice(0, 3)
                        .map(x => DATA_DIR + x)
                );

                console.info(
                    new Date() + ` Starting to fill cache size=${dir.totalSize}`
                );
                await cache.addAll(urlsToCache);
            }
            /*                
            for (const url of urlsToCache) {
                console.info(new Date() + ` Caching ${url}`);            
                await cache.add(url)
            };
            */
            console.info(new Date() + ` Catching done`);            
            //await self.skipWaiting();
        })().catch(e => {
            console.error(new Date() + ` Error in sw`, e);
            throw e;
        })
    );
});

self.addEventListener("activate", event => {
    console.log(new Date() + " ServiceWorker activation started");
    event.waitUntil(
        (async () => {
            (await caches.keys()).map((x: string) => {
                console.info(`Have cache key:`, x);
            });

            const cache = await caches.open(CACHE_NAME_ENGINE);
            const keys = await cache.keys();
            const index = await getIndex();
            for (const key of keys) {
                // key is Request
                /*
                if (index.filesToCache.indexOf(key) < 0) {
                    console.info(new Date() + ` No file ${key} in index, removing`);
                    //cache.delete(key);
                }
                */
            }            
            console.info(new Date() + " Service worker activation finished");
        })()
    );
});

self.addEventListener("fetch", event => {
    event.respondWith((async () => {
        const cacheHit =
            (await caches
                .open(CACHE_NAME_ENGINE)
                .then(cache => cache.match(event.request.url))) ||
            (await caches
                .open(CACHE_NAME_IMAGES)
                .then(cache => cache.match(event.request.url))) ||
            (await caches
                .open(CACHE_NAME_MUSIC)
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
                "Range request for",
                event.request.url,
                ", starting position:",
                pos
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
                            "bytes " +
                                pos +
                                "-" +
                                (arrayBuffer.byteLength - 1) +
                                "/" +
                                arrayBuffer.byteLength
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
    })());
});
