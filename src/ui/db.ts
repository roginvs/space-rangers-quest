import firebase from "firebase";

import { Player } from "../lib/qmplayer/player";

interface Config {
    player: Player;
    lastPlayedGame: string;
}

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

const FIREBASE_USERS_PRIVATE = `usersPrivate`;
const FIREBASE_USERS_PUBLIC = `usersPublic`;

export async function getDb(app: firebase.app.App) {
    console.info("Starting to get db");
    const idb = indexedDB.open(INDEXEDDB_NAME, 2);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        idb.onerror = e => reject(new Error(idb.error.toString()));
        idb.onsuccess = (e: any) => resolve(e.target.result);
        idb.onupgradeneeded = (e: any) => {
            console.info("onupgradeneeded");
            const db: IDBDatabase = e.target.result;
            // console.info(`Old version=${db.}`)
            if (!db.objectStoreNames.contains(INDEXEDDB_CONFIG_STORE_NAME)) {
                console.info(`Creating config store`);
                db.createObjectStore(INDEXEDDB_CONFIG_STORE_NAME, {
                    // keyPath: false,
                    autoIncrement: false
                });
            } else {
                console.info(`It containt config store`);
            }
        };
    });

    let firebaseUser: firebase.User | null;
    try {
        app.auth().onAuthStateChanged(function(user) {
            firebaseUser = user;
            console.info(`on auth changed = ${firebaseUser}`);
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

    async function setPrivate(key: keyof Config, value: Config[typeof key]) {
        console.info(`setConfig key=${key} value=${value}`);
        const trx = db.transaction([INDEXEDDB_CONFIG_STORE_NAME], "readwrite");
        const os = trx.objectStore(INDEXEDDB_CONFIG_STORE_NAME);
        const getReq = os.put(value, key);
        await new Promise<void>((resolve, reject) => {
            getReq.onsuccess = e => resolve(getReq.result);
            getReq.onerror = e => reject(new Error(getReq.error.toString()));
        });

        try {
            if (firebaseUser) {
                console.info(`setConfig key=${key} value=${value} saving to firebase`);
                await app
                    .database()
                    .ref(`${FIREBASE_USERS_PRIVATE}/${firebaseUser.uid}/${key}`)
                    .set(value);
            }
        } catch (e) {
            console.error(`Error with firebase: `, e);
        }
    }

    async function getPrivate(key: keyof Config): Promise<Config[typeof key]> {
        const trx = db.transaction([INDEXEDDB_CONFIG_STORE_NAME], "readonly");
        const os = trx.objectStore(INDEXEDDB_CONFIG_STORE_NAME);
        const getReq = os.get(key);
        const localResult = await new Promise<Config[typeof key]>(
            (resolve, reject) => {
                getReq.onsuccess = e => resolve(getReq.result);
                getReq.onerror = e =>
                    reject(new Error(getReq.error.toString()));
            }
        );
        console.info(`getConfig key=${key} localResult=${localResult}`);

        try {
            const firebaseResult = await new Promise<
                Config[typeof key] | undefined
            >(
                resolve =>
                    firebaseUser
                        ? app
                              .database()
                              .ref(
                                  `${FIREBASE_USERS_PRIVATE}/${
                                      firebaseUser.uid
                                  }/${key}`
                              )
                              .once("value", snapshot =>
                                  resolve(snapshot ? snapshot.val() : undefined)
                              )
                        : resolve(undefined)
            );
            if (firebaseResult !== undefined) {
                console.info(`getConfig key=${key} firebaseResult=${localResult}`);
                await setPrivate(key, firebaseResult);
                return firebaseResult;
            }
        } catch (e) {
            console.error(`Error with firebase: `, e);
        }
        console.info(`getConfig key=${key} no firebase result`);
        return localResult;
    }

    return {
        getPrivate,
        setPrivate
    };
}
