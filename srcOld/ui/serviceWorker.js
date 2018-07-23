"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var consts_1 = require("./consts");
/*
    Not used now, but maybe I will use this in the future.
    Right now only purpose of this is to make serviceWorker code changed
        in order to make all installions to reinstall to most up-to-date version
*/
var ENGINE_VERSION = 8;
var engineUrls = [
    "/",
    "bundle.js",
    "bundle.css",
    "favicon.png",
    "manifest.json",
    consts_1.INDEX_JSON,
    "version.json",
    "version.json?" + ENGINE_VERSION
];
function getIndex() {
    return fetch(consts_1.INDEX_JSON).then(function (data) { return data.json(); });
}
self.addEventListener("install", function (event) {
    // Perform install steps
    console.info(new Date() + " Serviceworker got install event.");
    event.waitUntil((function () { return __awaiter(_this, void 0, void 0, function () {
        var cache, data, _i, _a, dir, urlsToCache;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, caches.open(consts_1.CACHE_NAME)];
                case 1:
                    cache = _b.sent();
                    console.info(new Date() + " Serviceworker opened cache");
                    return [4 /*yield*/, getIndex()];
                case 2:
                    data = _b.sent();
                    _i = 0, _a = [data.dir.quests];
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    dir = _a[_i];
                    urlsToCache = engineUrls.concat.apply(engineUrls, dir.files
                        .map(function (x) { return x.path; })
                        // .slice(0, 3)
                        .map(function (x) { return consts_1.DATA_DIR + x; }));
                    console.info(new Date() + (" Starting to fill cache size=" + dir.totalSize));
                    return [4 /*yield*/, cache.addAll(urlsToCache)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    /*
                    for (const url of urlsToCache) {
                        console.info(new Date() + ` Caching ${url}`);
                        await cache.add(url)
                    };
                    */
                    console.info(new Date() + " Catching done");
                    return [2 /*return*/];
            }
        });
    }); })().catch(function (e) {
        console.error(new Date() + " Error in sw", e);
        throw e;
    }));
});
self.addEventListener("activate", function (event) {
    console.log(new Date() + " ServiceWorker activation started");
    event.waitUntil((function () { return __awaiter(_this, void 0, void 0, function () {
        var cache, keys, index, _i, keys_1, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, caches.keys()];
                case 1:
                    (_a.sent()).map(function (x) {
                        console.info("Have cache key:", x);
                    });
                    return [4 /*yield*/, caches.open(consts_1.CACHE_NAME)];
                case 2:
                    cache = _a.sent();
                    return [4 /*yield*/, cache.keys()];
                case 3:
                    keys = _a.sent();
                    return [4 /*yield*/, getIndex()];
                case 4:
                    index = _a.sent();
                    for (_i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                        key = keys_1[_i];
                        // key is Request
                        /*
                        if (index.filesToCache.indexOf(key) < 0) {
                            console.info(new Date() + ` No file ${key} in index, removing`);
                            //cache.delete(key);
                        }
                        */
                    }
                    console.info(new Date() + " Service worker activation finished");
                    return [2 /*return*/];
            }
        });
    }); })());
});
self.addEventListener("fetch", function (eventRaw) {
    var event = eventRaw;
    var headersRange = event.request.headers.get("range");
    if (headersRange) {
        console.info("headersRange='" + headersRange + "'");
        var m = headersRange.match(/^bytes\=(\d+)\-$/);
        if (!m) {
            // ????
            event.respondWith(fetch(event.request));
            return;
        }
        var pos_1 = parseInt(m[1]);
        console.log("Range request for", event.request.url, ", starting position:", pos_1);
        event.respondWith(caches
            .open(consts_1.CACHE_NAME)
            .then(function (cache) {
            return cache.match(event.request.url);
        })
            .then(function (res) {
            if (!res) {
                console.info("No audio cache for " + event.request.url);
                return fetch(event.request).then(function (res) {
                    return res.arrayBuffer();
                });
            }
            else {
                console.info("Cache audio hit for " + event.request.url);
                return res.arrayBuffer();
            }
        })
            .then(function (ab) {
            return new Response(ab.slice(pos_1), {
                status: 206,
                statusText: "Partial Content",
                headers: [
                    // ['Content-Type', 'video/webm'],
                    [
                        "Content-Range",
                        "bytes " +
                            pos_1 +
                            "-" +
                            (ab.byteLength - 1) +
                            "/" +
                            ab.byteLength
                    ]
                ]
            });
        }));
    }
    else {
        event.respondWith((function () { return __awaiter(_this, void 0, void 0, function () {
            var cache, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, caches.open(consts_1.CACHE_NAME)];
                    case 1:
                        cache = _a.sent();
                        return [4 /*yield*/, cache.match(event.request)];
                    case 2:
                        response = _a.sent();
                        if (response) {
                            console.info("Cache hit for " + event.request.url);
                            return [2 /*return*/, response];
                        }
                        else {
                            console.info("No cache for " + event.request.url);
                            return [2 /*return*/, fetch(event.request)];
                        }
                        return [2 /*return*/];
                }
            });
        }); })());
    }
});
