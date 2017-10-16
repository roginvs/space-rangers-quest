import { INDEX_JSON, DATA_DIR, CACHE_NAME } from './common';
import { Index } from '../packGameData';
import * as pako from 'pako';
import 'text-encoding';

const engineUrls = ['/', 'bundle.js', 'bundle.css', INDEX_JSON];
declare function skipWaiting(): void;

interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<any>): void;
}
interface ActivateEvent extends ExtendableEvent {
}

interface FetchEvent extends Event {
    request: Request;
    respondWith(response: Promise<Response> | Response): Promise<Response>;
}

/*
https://github.com/inexorabletash/text-encoding
*/

async function getIndex() {
    const raw = await fetch(INDEX_JSON);
    const rawBuf = await raw.arrayBuffer();    
    const ungzippedData = pako.ungzip(new Uint8Array(rawBuf));
    const parsedData = JSON.parse(new TextDecoder("utf-8").decode(ungzippedData))
    return parsedData as Index;
}
self.addEventListener('install', (event: ExtendableEvent) => {
    // Perform install steps
    console.info(new Date() + ` Serviceworker got install event`)
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME)
            console.info(new Date() + ` Serviceworker opened cache`);
            const data = await getIndex();

            for (const dir of [data.dir.quests, data.dir.images]) {
            console.info(new Date() + ` Loaded index file with ${dir.totalSize} total size`);
            const urlsToCache = engineUrls.concat(...dir.files.map(x => x.path)
                // .slice(0, 3)
                .map(x => DATA_DIR + x));

            console.info(new Date() + ` Starting to fill cache`);
            await cache.addAll(urlsToCache)
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
            throw e
        })
    )
});

self.addEventListener('activate', (event: ActivateEvent) => {
    console.log(new Date() + ' ServiceWorker activation started');
    event.waitUntil(
        (async () => {
            (await caches.keys()).map((x: string) => {
                console.info(`Have cache key:`, x)
            })

            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            const index = await getIndex();
            for (const key of keys) { // key is Request
                /*
                if (index.filesToCache.indexOf(key) < 0) {
                    console.info(new Date() + ` No file ${key} in index, removing`);
                    //cache.delete(key);
                }
                */
            }
            console.info(new Date() + ' Service worker activation finished');
        })()
    );
});


self.addEventListener('fetch', (event: FetchEvent) => {
    const headersRange = event.request.headers.get('range');
    if (headersRange) {
        console.info(`headersRange='${headersRange}'`)
        const m = headersRange.match(/^bytes\=(\d+)\-$/);
        if (!m) {
            // ????
            event.respondWith(fetch(event.request));
            return;
        }
        const pos = parseInt(m[1]);
        console.log('Range request for', event.request.url,
            ', starting position:', pos);
        event.respondWith(
            caches.open(CACHE_NAME)
                .then(function (cache) {
                    console.info(`Cache audio hit for ${event.request.url}`)
                    return cache.match(event.request.url);
                }).then(function (res) {
                    if (!res) {
                        console.warn(`No audio cache for ${event.request.url}`)
                        return fetch(event.request)
                            .then(res => {
                                return res.arrayBuffer();
                            });
                    }
                    return res.arrayBuffer();
                }).then(function (ab) {
                    return new Response(
                        ab.slice(pos),
                        {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: [
                                // ['Content-Type', 'video/webm'],
                                ['Content-Range', 'bytes ' + pos + '-' +
                                    (ab.byteLength - 1) + '/' + ab.byteLength]]
                        });
                }));
    } else {
        event.respondWith((async () => {
            try {
                const res = await fetch(event.request);
                console.info(`Network-first success for ${event.request.url}`)
                return res
            } catch (e) {
                // console.info(`Network-first failed for ${event.request.url}`)            
            }
            const response = caches.match(event.request);
            if (response) {
                console.info(`Network-first failed, but cache hit for ${event.request.url}`)
                return response;
            } else {
                console.warn(`Network-first failed and no cache for ${event.request.url}`)
                return fetch(event.request);
            }
        })())
    }
});