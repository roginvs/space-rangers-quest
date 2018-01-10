import { INDEX_JSON, DATA_DIR, CACHE_NAME } from "./consts";
import { Index } from "../packGameData";

/* 
    Not used now, but maybe I will use this in the future.
    Right now only purpose of this is to make serviceWorker code changed
        in order to make all installions to reinstall to most up-to-date version
*/
const ENGINE_VERSION = 7;

const engineUrls = [
    "/",
    "bundle.js",
    "bundle.css",
    "favicon.png",
    "manifest.json",
    INDEX_JSON,
    `version.json`,
    `version.json?${ENGINE_VERSION}`
];

//declare function skipWaiting(): void;

interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<any>): void;
}
interface ActivateEvent extends ExtendableEvent {}

interface FetchEvent extends Event {
    request: Request;
    respondWith(response: Promise<Response> | Response): Promise<Response>;
}

function getIndex() {
    return fetch(INDEX_JSON).then(data => data.json()) as Promise<Index>;
}
self.addEventListener("install", event => {
    // Perform install steps
    console.info(new Date() + ` Serviceworker got install event.`);
    (event as ExtendableEvent).waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.info(new Date() + ` Serviceworker opened cache`);
            const data = await getIndex();

            // for (const dir of [data.dir.quests, data.dir.images]) {
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
            // (<any>self).skipWaiting();
        })().catch(e => {
            console.error(new Date() + ` Error in sw`, e);
            throw e;
        })
    );
});

self.addEventListener("activate", event => {
    console.log(new Date() + " ServiceWorker activation started");
    (event as ActivateEvent).waitUntil(
        (async () => {
            (await caches.keys()).map((x: string) => {
                console.info(`Have cache key:`, x);
            });

            const cache = await caches.open(CACHE_NAME);
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

self.addEventListener("fetch", eventRaw => {
    const event = eventRaw as FetchEvent;
    const headersRange = event.request.headers.get("range");
    if (headersRange) {
        console.info(`headersRange='${headersRange}'`);
        const m = headersRange.match(/^bytes\=(\d+)\-$/);
        if (!m) {
            // ????
            event.respondWith(fetch(event.request));
            return;
        }
        const pos = parseInt(m[1]);
        console.log(
            "Range request for",
            event.request.url,
            ", starting position:",
            pos
        );
        event.respondWith(
            caches
                .open(CACHE_NAME)
                .then(function(cache) {
                    return cache.match(event.request.url);
                })
                .then(function(res) {
                    if (!res) {
                        console.info(`No audio cache for ${event.request.url}`);
                        return fetch(event.request).then(res => {
                            return res.arrayBuffer();
                        });
                    } else {
                        console.info(
                            `Cache audio hit for ${event.request.url}`
                        );
                        return res.arrayBuffer();
                    }
                })
                .then(function(ab) {
                    return new Response(ab.slice(pos), {
                        status: 206,
                        statusText: "Partial Content",
                        headers: [
                            // ['Content-Type', 'video/webm'],
                            [
                                "Content-Range",
                                "bytes " +
                                    pos +
                                    "-" +
                                    (ab.byteLength - 1) +
                                    "/" +
                                    ab.byteLength
                            ]
                        ]
                    });
                })
        );
    } else {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const response = await cache.match(event.request);
                if (response) {
                    console.info(`Cache hit for ${event.request.url}`);
                    return response;
                } else {
                    console.info(`No cache for ${event.request.url}`);
                    return fetch(event.request);
                }

                /*
                try {
                    const res = await fetch(event.request);
                    console.info(
                        `Network-first success for ${event.request.url}`
                    );
                    return res;
                } catch (e) {
                    // console.info(`Network-first failed for ${event.request.url}`)
                }
                const response = caches.match(event.request);
                if (response) {
                    console.info(
                        `Network-first failed, but cache hit for ${event.request
                            .url}`
                    );
                    return response;
                } else {
                    console.warn(
                        `Network-first failed and no cache for ${event.request
                            .url}`
                    );
                    return fetch(event.request);
                }
                */
            })()
        );
    }
});
