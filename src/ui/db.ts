import firebase from "firebase";

import { Player } from "../lib/qmplayer/player";
import { GameLog, GameState } from "../lib/qmplayer/funcs";
import { resolve } from "path";

interface Config {
    player: Player;
    lastLocation: string;
    noMusic: boolean;
}

console.info(`TODO: SET TIMEOUTS ON FIREBASE`);

/*
Here is firebase rules:
{
  "rules": {
    FIREBASE_USERS_PUBLIC: {
      "$uid": {
        ".write": "$uid === auth.uid",        
      },
      ".read": true,
      ".indexOn": ["gamesWonCount"]
    },
     
    FIREBASE_USERS_PRIVATE: {
      "$uid": {
        ".write": "$uid === auth.uid",
        ".read": true,
      }
    }
  }
}
*/
const INDEXEDDB_NAME = "spaceranges2";
const INDEXEDDB_CONFIG_STORE_NAME = "config";
const INDEXEDDB_SAVED_STORE_NAME = "savedgames";
const INDEXEDDB_WON_STORE_NAME = "wongames";

const FIREBASE_USERS_PRIVATE = `usersPrivate`;
const FIREBASE_USERS_PUBLIC = `usersPublic`;

export interface GameWonProofs {
    [seed: string]: GameLog;
}
export interface WonProofs {
    [gameId: string]: GameWonProofs;
}
interface FirebasePublic {
    name: string;
    gamesWonCount: number;
    wonProofs: WonProofs;
}

export async function getDb(app: firebase.app.App) {
    console.info("Starting to get db");
    
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const idb = indexedDB.open(INDEXEDDB_NAME, 7);
        console.info('idb opened');
        idb.onerror = e => reject(new Error(`IndexedDB error: ${idb.error.name} ${idb.error.message}`))
        idb.onsuccess = (e: any) => resolve(e.target.result);
        idb.onupgradeneeded = (e: any) => {
            console.info("onupgradeneeded");
            const db: IDBDatabase = e.target.result;
            // console.info(`Old version=${db.}`)

            for (const storeName of [
                INDEXEDDB_CONFIG_STORE_NAME,
                INDEXEDDB_SAVED_STORE_NAME,
                INDEXEDDB_WON_STORE_NAME
            ]) {
                if (!db.objectStoreNames.contains(storeName)) {
                    console.info(`Creating ${storeName} store`);
                    db.createObjectStore(storeName, {
                        // keyPath: false,
                        autoIncrement: false
                    });
                } else {
                    console.info(`It containt ${storeName} store`);
                }
            }
        };        
    });
    console.info('Got indexedDB');
    await new Promise(resolve => setTimeout(resolve, 1));

    async function getLocal(storeName: string, key: string) {
        const trx = db.transaction([storeName], "readonly");
        const objectStore = trx.objectStore(storeName);
        const getReq = objectStore.get(key);
        const localResult = await new Promise<any>((resolve, reject) => {
            getReq.onsuccess = e => {
                resolve(getReq.result);
            };
            getReq.onerror = e => reject(new Error(getReq.error.toString()));
        });
        return localResult;
    }

    async function getAllLocal(storeName: string) {
        const objectStore = db.transaction([storeName]).objectStore(storeName);
        return new Promise<WonProofs>((resolve, reject) => {
            const data: {
                [key: string]: any;
            } = {};
            const openCursor = objectStore.openCursor();
            openCursor.onsuccess = function(event: any) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.value) {
                        data[cursor.key] = cursor.value;
                    }
                    cursor.continue();
                } else {
                    // alert("No more entries!");
                    resolve(data);
                }
            };
            openCursor.onerror = e => {
                reject(new Error(openCursor.error.toString()));
            };
        });
    }

    async function setLocal(storeName: string, key: string, value: any) {
        const trx = db.transaction([storeName], "readwrite");
        const objectStore = trx.objectStore(storeName);
        
        const req = value ? objectStore.put(value, key) : objectStore.delete(key);
        await new Promise<void>((resolve, reject) => {
            req.onsuccess = e => resolve(req.result);
            req.onerror = e => {
                console.warn('Indexeddb error', req.error);
                reject(new Error(`IndexedDB error: ${req.error.name} ${req.error.message}`));
            };
        });
    }

    const localInfo = await (async () => {
        interface LocalInfo {
            uid: string;
            userAgent: string;
        }
        let localInfoTmp: LocalInfo | null = await getLocal(
            INDEXEDDB_CONFIG_STORE_NAME,
            "uid"
        );
        if (!localInfoTmp) {
            localInfoTmp = {
                uid:
                    Math.random()
                        .toString(36)
                        .slice(2) +
                    Math.random()
                        .toString(36)
                        .slice(2) +
                    Math.random()
                        .toString(36)
                        .slice(2),
                userAgent: navigator.userAgent
            };
            await setLocal(INDEXEDDB_CONFIG_STORE_NAME, "uid", localInfoTmp);
        }
        return localInfoTmp;
    })();

    let firebaseUser: firebase.User | null;
    try {
        app.auth().onAuthStateChanged(function(user) {
            firebaseUser = user;
            console.info(
                `on auth changed = ${
                    firebaseUser ? firebaseUser.uid : "<null>"
                }`
            );
        });
        await new Promise<void>(resolve => {
            const unsubscribe = app.auth().onAuthStateChanged(() => {
                unsubscribe();
                resolve();
            });
        });

        app.database()
            .ref(".info/connected")
            .on("value", snap => {
                const firebaseOnline = snap && snap.val();
                console.info(`Firebase online=${firebaseOnline}`);
            });
    } catch (e) {
        console.error(`Error with firebase: `, e);
    }

    async function setFirebase(
        store: typeof FIREBASE_USERS_PRIVATE | typeof FIREBASE_USERS_PUBLIC,
        userPath: string,
        value: any
    ) {
        try {
            if (firebaseUser) {
                const fullRefPath = `${store}/${firebaseUser.uid}/${userPath}`;
                console.info(
                    `Firebase SET fullRefPath=${fullRefPath} value=${JSON.stringify(
                        value
                    )}`
                );
                await Promise.race([
                    app
                        .database()
                        .ref(fullRefPath)
                        .set(value),
                    new Promise<void>(r => setTimeout(r, 10000))
                ]);
            }
        } catch (e) {
            console.error(`Error with firebase: `, e);
        }
    }
    async function getFirebase(
        store: typeof FIREBASE_USERS_PRIVATE | typeof FIREBASE_USERS_PUBLIC,
        userPath: string
    ) {
        try {
            const firebaseResult = await Promise.race([
                new Promise<any | null>(
                    resolve =>
                        firebaseUser
                            ? app
                                  .database()
                                  .ref(
                                      `${store}/${firebaseUser.uid}/${userPath}`
                                  )
                                  .once("value", snapshot => {
                                      const value = snapshot
                                          ? snapshot.val()
                                          : null;
                                      console.info(
                                          `Firebase GET path=${store}/${
                                              firebaseUser
                                                  ? firebaseUser.uid
                                                  : "ERR"
                                          }/${userPath} value=${JSON.stringify(
                                              value
                                          )}`
                                      );
                                      resolve(value);
                                  })
                            : resolve(null)
                ),
                new Promise<null>(r => setTimeout(() => r(null), 10000))
            ]);

            return firebaseResult;
        } catch (e) {
            console.error(`Error with firebase: `, e);
            return null;
        }
    }

    async function setOwnHighscoresName(name: string) {
        await setLocal(INDEXEDDB_CONFIG_STORE_NAME, "name", name);
        await setFirebase(FIREBASE_USERS_PUBLIC, "info/name", name);
    }

    function getHighscores() {
        // Only from firebase!
        return new Promise<{
            [userId: string]: FirebasePublic;
        }>((resolve, reject) => {
            const allUsersRef = app.database().ref(FIREBASE_USERS_PUBLIC);
            allUsersRef
                .orderByChild("gamesWonCount")
                .limitToFirst(1000)
                .once("value", snapshot =>
                    resolve(snapshot ? snapshot.val() : null)
                )
                .catch(e => reject(e));
        });
    }

    async function getLocalAndFirebase(storeName: string, key: string) {
        const localResult = await getLocal(storeName, key);
        console.info(
            `getLocal store=${storeName} key=${key} localResult=${JSON.stringify(
                localResult
            )}`
        );
        const firebaseResult = await getFirebase(
            FIREBASE_USERS_PRIVATE,
            `${storeName}/${key}`
        );

        if (firebaseResult !== undefined && firebaseResult !== null) {
            console.info(
                `getFirebase store=${storeName} key=${key} firebaseResult=${JSON.stringify(
                    firebaseResult
                )}`
            );
            await setLocal(storeName, key, firebaseResult);
            return firebaseResult;
        }
        console.info(
            `getLocal store=${storeName} key=${key} no_firebase_result`
        );
        return localResult;
    }

    async function setConfigBoth(key: keyof Config, value: Config[typeof key]) {
        console.info(`setConfig key=${key} value=${JSON.stringify(value)}`);
        await setLocal(INDEXEDDB_CONFIG_STORE_NAME, key, value);
        await setFirebase(
            FIREBASE_USERS_PRIVATE,
            `${INDEXEDDB_CONFIG_STORE_NAME}/${key}`,
            value
        );
    }

    // async function getBoth<T extends keyof Config>(key: T): Promise<Config[T] | null> {
    //    return getLocalAndFirebase(INDEXEDDB_CONFIG_STORE_NAME, key);
    //}
    async function getConfigLocal<T extends keyof Config>(
        key: T
    ): Promise<Config[T] | null> {
        return getLocal(INDEXEDDB_CONFIG_STORE_NAME, key);
    }

    async function updateFirebaseOwnHighscore() {
        try {
            const allRemotePrivateWons =
                (await getFirebase(
                    FIREBASE_USERS_PRIVATE,
                    `${INDEXEDDB_WON_STORE_NAME}`
                )) || {};
            let newCount = 0;
            const newProofs: WonProofs = {};            
            for (const gameName of Object.keys(allRemotePrivateWons)) {
                const proofs = allRemotePrivateWons[gameName];
                if (!proofs || Object.keys(proofs).length < 1) {
                    continue;
                }
                newProofs[gameName] = proofs;
                newCount++;
            }
            console.info(`Updating public highscores newCount=${newCount}`);
            await setFirebase(FIREBASE_USERS_PUBLIC, `gamesWonCount`, newCount);
            await setFirebase(
                FIREBASE_USERS_PUBLIC,
                `gamesWonProofs`,
                newProofs
            );
            console.info(`Updating public highscores done`);
        } catch (e) {
            console.warn(`public wining state sync error`, e, e.stack);
        }
    }

    async function syncWithFirebase() {
        console.info(`SyncWithFirebase started`);

        // Config is remote-first
        for (const key of [
            "player",
            "lastPlayedGame",
            "noMusic"
        ] as (keyof Config)[]) {
            const firebaseResult = await getFirebase(
                FIREBASE_USERS_PRIVATE,
                `${INDEXEDDB_CONFIG_STORE_NAME}/${key}`
            );
            if (firebaseResult) {
                console.info(`Taking config ${key} from firebase`);
                await setLocal(
                    INDEXEDDB_CONFIG_STORE_NAME,
                    key,
                    firebaseResult
                );
            } else if (firebaseResult === null) {
                const localResult = await getLocal(
                    INDEXEDDB_CONFIG_STORE_NAME,
                    key
                );
                if (localResult) {
                    console.info(
                        `Saving firebase config ${key} because there is nothing`
                    );
                    await setFirebase(
                        FIREBASE_USERS_PRIVATE,
                        `${INDEXEDDB_CONFIG_STORE_NAME}/${key}`,
                        localResult
                    );
                } else {
                    console.info(
                        `Config key ${key} no in local, neither in firebase`
                    );
                }
            }
        }
        console.info(`Sync syncWithFirebase config done`);

        /*
        // Local saving always overwrite remote
        const localSavings = await getAllLocal(INDEXEDDB_SAVED_STORE_NAME);        
        for (const gameName of Object.keys(localSavings)) {            
            const savingRaw = JSON.stringify(localSavings[gameName]);
            await setFirebase(
                FIREBASE_USERS_PRIVATE,
                `${INDEXEDDB_SAVED_STORE_NAME}/${gameName}/${localInfo.uid}`,
                savingRaw
            );
        }
        console.info(`Sync syncWithFirebase local savings done`);
        */

        

        try {
            const allLocalWons = await getAllLocal(INDEXEDDB_WON_STORE_NAME);            
            const allRemoteWons =
                (await getFirebase(
                    FIREBASE_USERS_PRIVATE,
                    `${INDEXEDDB_WON_STORE_NAME}`
                )) || {};

            const allGameNames = Object.keys({
                ...allLocalWons,
                ...allRemoteWons
            });
            for (const gameName of allGameNames) {
                const thisGameLocalWons = allLocalWons[gameName] || {};
                const thisGameRemoteWons = allRemoteWons[gameName] || {};

                for (const localSeed of Object.keys(thisGameLocalWons)) {
                    const localProof = thisGameLocalWons[localSeed];
                    if (!localProof) {
                        continue;
                    }
                    if (!thisGameRemoteWons[localSeed]) {
                        console.info(
                            `Sync with firebase: gameName=${gameName} pushing seed=${localSeed} into firebase`
                        );
                        await setFirebase(
                            FIREBASE_USERS_PRIVATE,
                            `${INDEXEDDB_WON_STORE_NAME}/${gameName}/${localSeed}`,
                            localProof
                        );
                    }
                }

                for (const remoteSeed of Object.keys(thisGameRemoteWons)) {
                    const remoteProof = thisGameRemoteWons[remoteSeed];
                    if (!remoteProof) {
                        continue;
                    }
                    if (!thisGameLocalWons[remoteSeed]) {
                        console.info(
                            `Sync with firebase: gameName=${gameName} fetching seed=${remoteSeed} from firebase`
                        );

                        const values = await getLocal(
                            INDEXEDDB_WON_STORE_NAME,
                            gameName
                        );
                        const newValues = {
                            ...values,
                            [remoteProof.aleaSeed]: remoteProof
                        };
                        await setLocal(
                            INDEXEDDB_WON_STORE_NAME,
                            gameName,
                            newValues
                        );
                    }
                }
            }
        } catch (e) {
            console.warn(`wining state sync error`, e, e.stack);
        }
        console.info(`Sync syncWithFirebase passed games done`);
        
        await updateFirebaseOwnHighscore();

        console.info(`Sync with firebase finished`);
    }

    async function isGamePassedLocal(gameName: string) {
        const values = await getLocal(INDEXEDDB_WON_STORE_NAME, gameName);
        if (
            values &&
            typeof values === "object" &&
            Object.keys(values).length >= 1
        ) {
            return values;
        } else {
            return false;
        }
    }

    async function setGamePassing(gameName: string, proof: GameLog) {
        const values = await getLocal(INDEXEDDB_WON_STORE_NAME, gameName);
        const newValues = {
            ...values,
            [proof.aleaSeed]: proof
        };
        await setLocal(INDEXEDDB_WON_STORE_NAME, gameName, newValues);
        await setFirebase(
            FIREBASE_USERS_PRIVATE,
            `${gameName}/${proof.aleaSeed}`,
            proof
        );
        await updateFirebaseOwnHighscore();
    }

    async function saveGame(gameName: string, saving: GameState | null) {
        const savingRaw = saving  ? JSON.stringify(saving) : saving;
        await setLocal(INDEXEDDB_SAVED_STORE_NAME, gameName, savingRaw);
        /*
        await setFirebase(
            FIREBASE_USERS_PRIVATE,
            `${INDEXEDDB_SAVED_STORE_NAME}/${gameName}/${localInfo.uid}`,
            savingRaw
        );
        */
    }

    async function getLocalSaving(gameName: string) {
        const rawValue = await getLocal(INDEXEDDB_SAVED_STORE_NAME, gameName);
        try {
            const value = JSON.parse(rawValue);
            return value as GameState;
        } catch (e) {
            return null;
        }
    }
    /*
    async function getAllRemoteSavings(gameName: string) {
        const rawValue = await getFirebase(
            FIREBASE_USERS_PRIVATE,
            `${INDEXEDDB_SAVED_STORE_NAME}/${gameName}`
        );
        let value: {
            [uid: string]: GameState;
        } = {};
        try {
            for (const uid of Object.keys(rawValue)) {
                value[uid] = JSON.parse(rawValue[uid]);
            }
            return value;
        } catch (e) {
            return null;
        }
    }
    */

    console.info(`Returning db instance`);
    return {
        setConfigBoth,
        getConfigLocal,

        isGamePassedLocal,
        setGamePassing,

        getHighscores,

        saveGame,
        getLocalSaving,
        // getAllRemoteSavings,

        syncWithFirebase,

        setOwnHighscoresName
    };
}

export type DB = typeof getDb extends (app: any) => Promise<infer T>
    ? T
    : never;
