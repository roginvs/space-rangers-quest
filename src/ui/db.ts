import firebase from "firebase";

import { Player } from "../lib/qmplayer/player";
import { GameLog, GameState } from "../lib/qmplayer/funcs";

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

    async function setFirebasePrivate(
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
                await app
                    .database()
                    .ref(`usersPrivate/${firebaseUser.uid}/${storeName}/${key}`)
                    .set(value);
            }
        } catch (e) {
            console.error(`Error with firebase: `, e);
        }
    }
    async function getFirebasePrivate(storeName: string, key: string) {        
        try {
            const firebaseResult = await new Promise<any | null>(
                resolve =>                     
                    firebaseUser
                        ? app
                              .database()
                              .ref(`usersPrivate/${firebaseUser.uid}/${storeName}/${key}`)
                              .once("value", snapshot =>
                                  resolve(snapshot ? snapshot.val() : null)
                              )
                        : resolve(null)
            );
            
            return firebaseResult
        } catch (e) {
            console.error(`Error with firebase: `, e);
            return null;
        }
    }

    async function getLocalAndFirebase(storeName: string, key: string) {
        const localResult = await getLocal(
            storeName,
            key
        );
        console.info(
            `getLocal store=${storeName} key=${key} localResult=${JSON.stringify(localResult)}`
        );
        const firebaseResult = await getFirebasePrivate(
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
        console.info(`getLocal store=${storeName} key=${key} no firebase result`);
        return localResult;
    }

    async function setPrivate(key: keyof Config, value: Config[typeof key]) {
        console.info(`setConfig key=${key} value=${JSON.stringify(value)}`);
        await setLocal(INDEXEDDB_CONFIG_STORE_NAME, key, value);
        await setFirebasePrivate(INDEXEDDB_CONFIG_STORE_NAME, key, value);
    }


    async function getPrivate(key: keyof Config): Promise<Config[typeof key]> {
        return getLocalAndFirebase(INDEXEDDB_CONFIG_STORE_NAME, key);        
    }

    async function setSavedGame(gameName: string, state: GameState) {
        console.info(`setConfig key=${gameName} value=${state}`);
        await setLocal(INDEXEDDB_SAVED_STORE_NAME, gameName, state);
        await setFirebasePrivate(INDEXEDDB_SAVED_STORE_NAME, gameName, state);
    }

    async function getSavedGame(gameName: string) {
        return getLocalAndFirebase(INDEXEDDB_SAVED_STORE_NAME, gameName);
    }

    function setWonGame(gameName: string, proof: GameLog) {
        // todo
    }
    function removeWonGame(gameName: string) {
        // todo
    }
    function getOwnWonGames() {
        // todo
    }

    function setOwnHighscoresName(name: string) {
        // todo
    }

    function getOwnHighscoresName() {
        // todo
    }

    function getHighscores() {
        // Only from firebase!
    }

    return {
        getPrivate,
        setPrivate,
        getSavedGame,
        setSavedGame
    };
}
