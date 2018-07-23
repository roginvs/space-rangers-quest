import { Player } from "../lib/qmplayer/player";

interface Config {
    tableOfWinnersName: string;
    player: Player;
    lastPlayedGame: string;
}

const DB_NAME = "spaceranges";

const CONFIG_STORE_NAME = "config";

export async function getDb() {
    console.info("Starting to get db");
    const idb = indexedDB.open(DB_NAME, 2);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        idb.onerror = e => reject(new Error(idb.error.toString()));
        idb.onsuccess = (e: any) => resolve(e.target.result);
        idb.onupgradeneeded = (e: any) => {
            console.info("onupgradeneeded");
            const db: IDBDatabase = e.target.result;
            // console.info(`Old version=${db.}`)
            if (!db.objectStoreNames.contains(CONFIG_STORE_NAME)) {
                console.info(`Creating config store`);
                db.createObjectStore(CONFIG_STORE_NAME, {
                    // keyPath: false,
                    autoIncrement: false
                });
            } else {
                console.info(`It containt config store`);
            }
        };
    });

    function getConfig(key: keyof Config) {
        const trx = db.transaction([CONFIG_STORE_NAME], "readonly");
        const os = trx.objectStore(CONFIG_STORE_NAME);
        const getReq = os.get(key);
        return new Promise<Config[typeof key]>((resolve, reject) => {
            getReq.onsuccess = e => resolve(getReq.result);
            getReq.onerror = e => reject(new Error(getReq.error.toString()));
        });
    }

    function setConfig(key: keyof Config, value: Config[typeof key]) {
        const trx = db.transaction([CONFIG_STORE_NAME], "readwrite");
        const os = trx.objectStore(CONFIG_STORE_NAME);
        const getReq = os.put(value, key);
        return new Promise<void>((resolve, reject) => {
            getReq.onsuccess = e => resolve(getReq.result);
            getReq.onerror = e => reject(new Error(getReq.error.toString()));
        });
    }

    return {
        getConfig,
        setConfig
    };
}
