import { observable, computed, action } from "mobx";
import { Index } from "../packGameData";
import { DB, GameWonProofs } from "./db";
import { Player } from "../lib/qmplayer/player";
import { getLang } from "./lang";
import { CACHE_MUSIC_NAME, DATA_DIR, CACHE_IMAGES_NAME } from "./consts";

type CacheInfo = "no" | "yes" | undefined;
interface CacheInstallInfo {
    sizeTotal: number;
    downloaded: number;
    currentFile: string;
}
export const QUEST_SEARCH_ALL = "all";
export const QUEST_SEARCH_OWN = "own";

export class Store {
    constructor(
        public index: Index,
        public app: firebase.app.App,
        public db: DB,
        player: Player
    ) {
        window.onhashchange = () => this.setPath();
        this.setPath();
        this.player = player;

        this.queryCacheInfo().catch(e => console.warn(e));
    }

    @observable player: Player;

    private setPath() {
        const hash = location.hash.replace(/^#/, "").replace(/^\//, "");
        if (this._hash === hash) {
            return;
        }
        this._hash = hash;
    }

    @observable private _hash: string = "";

    @computed get hash() {
        return '#/' + this._hash;
    }
    @computed
    get path() {
        const arr = this._hash.split("/");
        return {
            tab0: arr[0],
            tab1: arr[1],
            tab2: arr[2]
        };
    }

    @observable firebaseLoggedIn: firebase.User | null | undefined = null;

    @observable firebaseSyncing: boolean = false;

    @computed
    get l() {
        return getLang(this.player.lang);
    }

    @observable wonProofs: Map<string, GameWonProofs | undefined> | undefined;

    async loadWinProofsFromLocal() {
        const m = new Map<string, GameWonProofs | undefined>();
        await Promise.all(
            this.index.quests.map(async quest => {
                const passed = await this.db.isGamePassedLocal(quest.gameName);
                m.set(quest.gameName, passed);
            })
        );
        this.wonProofs = m;
    }

    async syncWithFirebase() {
        if (this.firebaseSyncing) {
            // TODO: retry sync when first finished
            return;
        }
        this.firebaseSyncing = true;
        await this.db.syncWithFirebase();

        // console.info: renew all cached values
        const player = await this.db.getConfigLocal("player");
        if (player) {
            this.player = player;
        }

        await this.loadWinProofsFromLocal();

        this.firebaseSyncing = false;
    }

    lastQuestListScroll: number = 0;

    @observable serviceWorkerController: ServiceWorkerState | null = null;

    @observable reloadingPage: boolean = false;

    @observable serviceWorkerStoragePersistent: boolean | undefined = undefined;

    @observable installingServiceWorkerState: ServiceWorkerState | null = null;
    @observable waitingServiceWorkerState: ServiceWorkerState | null = null;
    @observable waitingServiceWorker: ServiceWorker | null = null;
    @observable activeServiceWorkerState: ServiceWorkerState | null = null;

    @observable questsListTab: string = QUEST_SEARCH_ALL;
    @observable questsListSearch: string = "";

    @observable imagesCache: CacheInfo;
    @observable imagesCacheInstallInfo: CacheInstallInfo | undefined;

    @observable musicCache: CacheInfo;
    @observable musicCacheInstallInfo: CacheInstallInfo | undefined;

    async queryCacheInfo() {
        const cacheMusic = await caches.open(CACHE_MUSIC_NAME);
        let somethingMissingMusic = false;
        for (const f of this.index.dir.music.files) {
            if (!(await cacheMusic.match(DATA_DIR + f.path))) {
                somethingMissingMusic = true;
                break;
            }
        }
        if (!this.musicCacheInstallInfo) {
            this.musicCache = somethingMissingMusic ? "no" : "yes";
        }

        const cacheImages = await caches.open(CACHE_IMAGES_NAME);
        let somethingMissingImages = false;
        for (const f of this.index.dir.images.files) {
            if (!(await cacheImages.match(DATA_DIR + f.path))) {
                somethingMissingImages = true;
                break;
            }
        }
        if (!this.imagesCacheInstallInfo) {
            this.imagesCache = somethingMissingImages ? "no" : "yes";
        }
    }
    async installMusicCache() {
        if (this.musicCacheInstallInfo) {
            return;
        }
        this.musicCacheInstallInfo = {
            currentFile: "",
            sizeTotal: this.index.dir.music.totalSize,
            downloaded: 0
        };
        const cacheMusic = await caches.open(CACHE_MUSIC_NAME);
        for (const f of this.index.dir.music.files) {
            this.musicCacheInstallInfo.currentFile = f.path;
            const url = DATA_DIR + f.path;
            const data = await fetch(url);
            await cacheMusic.put(url, data);
            this.musicCacheInstallInfo.downloaded += f.size;
        }
        this.musicCache = "yes";
        this.musicCacheInstallInfo = undefined;
    }
    async installImagesCache() {
        if (this.imagesCacheInstallInfo) {
            return;
        }
        this.imagesCacheInstallInfo = {
            currentFile: "",
            sizeTotal: this.index.dir.images.totalSize,
            downloaded: 0
        };
        const cacheImages = await caches.open(CACHE_IMAGES_NAME);
        for (const f of this.index.dir.images.files) {
            this.imagesCacheInstallInfo.currentFile = f.path;
            const url = DATA_DIR + f.path;
            const data = await fetch(url);
            await cacheImages.put(url, data);
            this.imagesCacheInstallInfo.downloaded += f.size;
        }
        this.imagesCache = "yes";
        this.imagesCacheInstallInfo = undefined;
    }
    async removeMusicCache() {
        if (this.musicCacheInstallInfo) {
            return;
        }
        await caches.delete(CACHE_MUSIC_NAME);
        this.musicCache = "no";
    }
    async removeImagesCache() {
        if (this.imagesCacheInstallInfo) {
            return;
        }
        await caches.delete(CACHE_IMAGES_NAME);
        this.imagesCache = "no";
    }
}

/*
- page is server by sw.js: true/false
- another installing
- another waiting

*/
