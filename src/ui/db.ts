import firebase from "firebase";

import { Player } from "../lib/qmplayer/player";
import { GameLog, GameState } from "../lib/qmplayer/funcs";
import { resolve } from "path";

interface Config {
    player: Player;
    lastPlayedGame: string;    
}

console.info(`TODO: SET TIMEOUTS ON FIREBASE`);

/*
Here is firebase rules:
{
  "rules": {
    "usersPublic": {
      "$uid": {
        ".write": "$uid === auth.uid",        
      },
      ".read": true,
      ".indexOn": ["gamesWonCount"]
    },
     
    "usersPrivate": {
      "$uid": {
        ".write": "$uid === auth.uid",
        ".read": true,
      }
    }
  }
}
*/
const INDEXEDDB_NAME = "spaceranges";
const INDEXEDDB_CONFIG_STORE_NAME = "config";
const INDEXEDDB_SAVED_STORE_NAME = "savedgames";
const INDEXEDDB_WON_STORE_NAME = "savedgames";

const FIREBASE_USERS_PRIVATE = `usersPrivate`;
const FIREBASE_USERS_PUBLIC = `usersPublic`;

interface WonProof {
    [gameId: string]: GameLog;
}
interface FirebasePublic {
    name: string;
    gamesWonCount: number;
    wonProofs: WonProof;
}

export async function getDb(app: firebase.app.App) {
    console.info("Starting to get db");
    const idb = indexedDB.open(INDEXEDDB_NAME, 3);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        idb.onerror = e => reject(new Error(idb.error.toString()));
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

    let firebaseUser: firebase.User | null;
    try {
        app.auth().onAuthStateChanged(function(user) {
            firebaseUser = user;
            console.info(
                `on auth changed = ${
                    firebaseUser ? firebaseUser.uid : "nouser"
                }`
            );
        });
        await new Promise<void>(resolve => {
            const unsubscribe = app.auth().onAuthStateChanged(() => {
                unsubscribe();
                resolve();
            });
        });
    } catch (e) {
        console.error(`Error with firebase: `, e);
    }

    async function getLocal(storeName: string, key: string) {
        const trx = db.transaction([storeName], "readonly");
        const os = trx.objectStore(storeName);
        const getReq = os.get(key);
        const localResult = await new Promise<any>((resolve, reject) => {
            getReq.onsuccess = e => resolve(getReq.result);
            getReq.onerror = e => reject(new Error(getReq.error.toString()));
        });
        return localResult;
    }

    async function setLocal(storeName: string, key: string, value: any) {
        const trx = db.transaction([storeName], "readwrite");
        const os = trx.objectStore(storeName);
        const getReq = os.put(value, key);
        await new Promise<void>((resolve, reject) => {
            getReq.onsuccess = e => resolve(getReq.result);
            getReq.onerror = e => reject(new Error(getReq.error.toString()));
        });
    }

    async function setFirebase(
        store: "usersPrivate" | "usersPublic",
        storeName: string,
        key: string,
        value: any
    ) {
        try {
            if (firebaseUser) {
                console.info(
                    `setConfig key=${key} value=${JSON.stringify(
                        value
                    )} saving to firebase`
                );
                await Promise.race([
                    app
                        .database()
                        .ref(`${store}/${firebaseUser.uid}/${storeName}/${key}`)
                        .set(value),
                    new Promise<void>(r => setTimeout(r, 10000))
                ]);
            }
        } catch (e) {
            console.error(`Error with firebase: `, e);
        }
    }
    async function getFirebase(
        store: "usersPrivate" | "usersPublic",
        storeName: string,
        key: string
    ) {
        try {
            const firebaseResult = await Promise.race([
                new Promise<any | null>(
                    resolve =>
                        firebaseUser
                            ? app
                                  .database()
                                  .ref(
                                      `${store}/${
                                          firebaseUser.uid
                                      }/${storeName}/${key}`
                                  )
                                  .once("value", snapshot =>
                                      resolve(snapshot ? snapshot.val() : null)
                                  )
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

    async function getLocalAndFirebase(storeName: string, key: string) {
        const localResult = await getLocal(storeName, key);
        console.info(
            `getLocal store=${storeName} key=${key} localResult=${JSON.stringify(
                localResult
            )}`
        );
        const firebaseResult = await getFirebase(
            "usersPrivate",
            storeName,
            key
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

    async function setPrivate(key: keyof Config, value: Config[typeof key]) {
        console.info(`setConfig key=${key} value=${JSON.stringify(value)}`);
        await setLocal(INDEXEDDB_CONFIG_STORE_NAME, key, value);
        await setFirebase(
            "usersPrivate",
            INDEXEDDB_CONFIG_STORE_NAME,
            key,
            value
        );
    }

    async function getPrivate<T extends keyof Config>(key: T): Promise<Config[T]> {
        return getLocalAndFirebase(INDEXEDDB_CONFIG_STORE_NAME, key);
    }

    async function setSavedGame(gameName: string, state: GameState) {
        console.info(`setConfig key=${gameName} value=${state}`);
        await setLocal(INDEXEDDB_SAVED_STORE_NAME, gameName, state);
        await setFirebase(
            "usersPrivate",
            INDEXEDDB_SAVED_STORE_NAME,
            gameName,
            state
        );
    }

    async function getSavedGame(gameName: string) {
        return getLocalAndFirebase(INDEXEDDB_SAVED_STORE_NAME, gameName);
    }

    async function setWonGame(gameName: string, proof: GameLog) {
        await setLocal(INDEXEDDB_WON_STORE_NAME, gameName, proof);
        if (firebaseUser) {
            const mePublicRef = app
                .database()
                .ref(`usersPublic/${firebaseUser.uid}`);
            mePublicRef
                .transaction((me: FirebasePublic) => {
                    me.wonProofs = {
                        ...me.wonProofs,
                        [gameName]: proof
                    };
                    me.gamesWonCount = Object.keys(me.wonProofs).length;
                    return me;
                })
                .catch(e => {
                    console.error("firebase update error", e);
                });
        }
    }
    async function removeWonGame(gameName: string) {
        await setLocal(INDEXEDDB_WON_STORE_NAME, gameName, null);
        if (firebaseUser) {
            const mePublicRef = app
                .database()
                .ref(`usersPublic/${firebaseUser.uid}`);
            mePublicRef
                .transaction((me: FirebasePublic) => {
                    me.wonProofs = {
                        ...me.wonProofs
                    };
                    delete me.wonProofs[gameName];
                    me.gamesWonCount = Object.keys(me.wonProofs).length;
                    return me;
                })
                .catch(e => {
                    console.error("firebase update error", e);
                });
        }
    }
    function getOwnWonGames() {
        // TODO a sync with firebase
        const objectStore = db
            .transaction([INDEXEDDB_WON_STORE_NAME])
            .objectStore(INDEXEDDB_WON_STORE_NAME);
        return new Promise<WonProof>((resolve, reject) => {
            const wonGames: WonProof = {};
            const openCursor = objectStore.openCursor();
            openCursor.onsuccess = function(event: any) {
                var cursor = event.target.result;
                if (cursor) {
                    wonGames[cursor.key] = cursor.value.name;
                    cursor.continue();
                } else {
                    // alert("No more entries!");
                    resolve(wonGames);
                }
            };
            openCursor.onerror = e => {
                reject(new Error(openCursor.error.toString()));
            };
        });
    }

    async function setOwnHighscoresName(name: string) {
        await setLocal(INDEXEDDB_CONFIG_STORE_NAME, "name", name);
        await setFirebase("usersPublic", "info", "name", name);
    }

    async function getOwnHighscoresName() {
        const localResult = await getLocal(
            INDEXEDDB_CONFIG_STORE_NAME,
            "publicName"
        );
        const firebaseResult = await getFirebase("usersPublic", "info", "name");

        if (firebaseResult) {
            await setLocal(INDEXEDDB_CONFIG_STORE_NAME, "name", firebaseResult);
            return firebaseResult;
        }
        return localResult;
    }

    function getHighscores() {
        // Only from firebase!
        return new Promise<{
            [userId: string]: FirebasePublic;
        }>((resolve, reject) => {
            const allUsersRef = app.database().ref(`usersPublic`);
            allUsersRef
                .orderByChild("gamesWonCount")
                .limitToFirst(1000)
                .once("value", snapshot =>
                    resolve(snapshot ? snapshot.val() : null)
                )
                .catch(e => reject(e));
        });
    }

    return {
        getPrivate,
        setPrivate,
        getSavedGame,
        setSavedGame,

        setWonGame,
        removeWonGame,
        getOwnWonGames
    };
}
