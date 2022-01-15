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
  CACHE_MUSIC_NAME_MP3,
  CACHE_IMAGES_NAME,
  SKIP_WAITING_MESSAGE_DATA,
  CACHE_MUSIC_NAME_OGG_OLD,
} from "./consts";
import { Index } from "../packGameData/defs";

const CACHE_ENGINE_PREFIX = "spacerangers-engine";
const CACHE_ENGINE_NAME = `${CACHE_ENGINE_PREFIX}-${__VERSION__}`;

const CACHE_QUESTS_NAME = "spacerangers-quests";

const engineUrls = [
  "/",
  INDEX_JSON,
  ...serviceWorkerOption.assets,
  `/?version=${new Date(__VERSION__).getTime()}`, // to enforce a reinstall after rebuild
];
console.info(`${new Date()} Service version ${__VERSION__} worker engine urls: `, engineUrls);

function getIndex() {
  return fetch(INDEX_JSON).then((data) => data.json()) as Promise<Index>;
}

self.addEventListener("install", (event) => {
  // Perform install steps
  console.info(`${new Date()} Serviceworker got install event.`);
  event.waitUntil(
    (async () => {
      console.info(`${new Date()} Downloading index.json`);
      const data = await getIndex();

      const cacheEngine = await caches.open(CACHE_ENGINE_NAME);
      console.info(
        `${new Date()} Serviceworker opened engine cache='${CACHE_ENGINE_NAME}', downloading engine`,
      );
      await cacheEngine.addAll(engineUrls);

      const cacheQuests = await caches.open(CACHE_QUESTS_NAME);
      console.info(
        `${new Date()} Serviceworker opened quests cache='${CACHE_QUESTS_NAME}', ` +
          `downloading quests size=${data.dir.quests.totalSize}`,
      );
      await cacheQuests.addAll(data.dir.quests.files.map((quest) => DATA_DIR + quest.path));

      /*
            await Promise.all((async quest => {
                const url = DATA_DIR + quest.path;
                if (! await cacheQuests.match(url)) {
                    console.info(`${new Date()} Quest ${url} no match in cache, downloading`);
                    await cacheQuests.add(url);
                } else {
                    console.info(`${new Date()} Quest ${url} is already in cache`)
                }
            }));                                            
            */

      // console.info(`${new Date()} waiting for 30 sec`);
      // await new Promise(resolve => setTimeout(resolve, 30 *1000));

      console.info(`${new Date()} Catching done`);
    })().catch((e) => {
      console.error(`${new Date()} Error in sw`, e);
      throw e;
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.info(`${new Date()} ServiceWorker activation started`);

  event.waitUntil(
    (async () => {
      /*
                During "activating" state browser is not able to load an application.
                Browser will wait untill "activate" even finishes, and only after this
                    will give a "fetch" event to activated serviceWorker
             */
      // console.info(`${new Date()} waiting for 30 sec`);
      // await new Promise(resolve => setTimeout(resolve, 54 *1000));
      // console.info(`${new Date()} waiting done`);

      if (await caches.has(CACHE_MUSIC_NAME_OGG_OLD)) {
        console.info(`${new Date()} dropping old ogg music cache ${CACHE_MUSIC_NAME_OGG_OLD}`);
        await caches.delete(CACHE_MUSIC_NAME_OGG_OLD);
      }
      for (const cacheKey of (await caches.keys())
        .filter((cacheKey) => cacheKey.indexOf(CACHE_ENGINE_PREFIX) === 0)
        .filter((cacheKey) => cacheKey !== CACHE_ENGINE_NAME)) {
        console.info(`${new Date()} Removing old engine cache ${cacheKey}`);
        await caches.delete(cacheKey);
      }

      /*
             If client is controlled by serviceWorker, then skipWaiting will took control.
             If client loaded before serviceWorker, then skipWaiting will do nothing.
             I will not took control of uncontrolled clients because claim() reloads them
               (if there was no serviceWorker and then installed one, then serviceWorker will go to "activate" state.
                In that case all pages are "uncontrolled", and there is no need to force them to reload - 
                    user is not expecting the page to be reloaded)
             UPDATE: I will call "claim", but I know that page knows when it was uncontrolled and page
                will not reload only when it was uncontrolled before.
            */

      console.info(`${new Date()} Service worker claiming clients`);
      await self.clients.claim();

      console.info(`${new Date()} Service worker activation finished`);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cacheHit =
        (await caches.open(CACHE_ENGINE_NAME).then((cache) => cache.match(event.request.url))) ||
        (await caches.open(CACHE_QUESTS_NAME).then((cache) => cache.match(event.request.url))) ||
        (await caches.open(CACHE_IMAGES_NAME).then((cache) => cache.match(event.request.url))) ||
        (await caches.open(CACHE_MUSIC_NAME_MP3).then((cache) => cache.match(event.request.url)));

      const headersRange = event.request.headers.get("range");
      if (headersRange) {
        console.info(`${new Date()} headersRange='${headersRange}'`);
        const m = headersRange.match(/^bytes\=(\d+)\-$/);
        if (!m) {
          // ????
          return fetch(event.request);
        }

        const pos = parseInt(m[1]);
        console.log(
          `${new Date()} Range request for ${event.request.url}, starting position: ${pos}`,
        );

        if (!cacheHit) {
          console.info(`${new Date()} No audio cache for ${event.request.url}`);
          return fetch(event.request);
        } else {
          console.info(`${new Date()} Cache audio hit for ${event.request.url}`);
          const arrayBuffer = await cacheHit.arrayBuffer();

          return new Response(arrayBuffer.slice(pos), {
            status: 206,
            statusText: "Partial Content",
            headers: [
              // ['Content-Type', 'video/webm'],
              [
                "Content-Range",
                `bytes ${pos}-${arrayBuffer.byteLength - 1}/${arrayBuffer.byteLength}`,
              ],
            ],
          }) /* hack for serviceWorker typings */ as any;
        }
      }

      if (cacheHit) {
        console.info(`${new Date()} Cache hit for ${event.request.url}`);
        return cacheHit;
      } else {
        console.info(`${new Date()} No cache for ${event.request.url}`);
        return fetch(event.request);
      }
    })(),
  );
});

self.addEventListener("message", (messageEvent) => {
  console.info(`${new Date()} Got a message=${messageEvent.data}`);
  if (messageEvent.data === SKIP_WAITING_MESSAGE_DATA) {
    console.info(`${new Date()} service worker will skipWaiting and start to activate`);
    return self.skipWaiting();
  }
});
