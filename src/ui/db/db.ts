import firebase from "firebase/app";
import "firebase/database";

import { Player } from "../../lib/qmplayer/player";
import { GameLog, GameState } from "../../lib/qmplayer/funcs";
import { resolve } from "path";
import {
  ConfigBoth,
  FIREBASE_PUBLIC_WON_PROOF,
  FIREBASE_USERS_PRIVATE,
  WonProofs,
  FIREBASE_USERS_PUBLIC,
  FirebasePublic,
  ConfigLocalOnly,
  FIREBASE_CUSTOM_QUESTS,
} from "./defs";
import { WonProofTableRow } from "./defs";
import { FirebaseCustomQuest } from "../editor/defs";

/*
Here is firebase rules:

{
  "rules": {
    "usersPublic": {
      "$uid": {
        "info": {
          ".write": "$uid === auth.uid",
        },
        "gamesWonCount": {
          ".write": "$uid === auth.uid",
        },
        "gamesWonProofs": {
          "$gameName": {
            "$aleaSeed": {
              ".write": "$uid === auth.uid",
              ".validate": "newData.hasChild('created') && newData.child('created').val() === now && data.val() === null",
            }
          }
        }        
      },
      ".read": true,
      ".indexOn": ["gamesWonCount"]
    },
     
    "usersPrivate": {
      "$uid": {
        ".write": "$uid === auth.uid",
        ".read": true,
      }
    }, 

    "customQuests": {
      "$user_id": {
        ".read": "$user_id === auth.uid",
        "$quest_name": {
          ".write": "$user_id === auth.uid",
          ".read": "$user_id === auth.uid || data.child('isPublic').val() == true",
        }
      }
    },
      
    "wonProofs": {
      "$proofId": {
        ".write": "newData.hasChild('userId') && newData.child('userId').val() === auth.uid && newData.hasChild('createdAt') && newData.child('createdAt').val() === now && ! newData.hasChild('validated')",
        ".validate": "data.val() == null",
        ".read": true,
      },
      ".indexOn": ["userId", "gameName", "aleaSeed"],
      ".read": true,
    }
  }
}


*/
const INDEXEDDB_NAME = "spaceranges2";
const INDEXEDDB_CONFIG_STORE_NAME = "config";
const INDEXEDDB_SAVED_STORE_NAME = "savedgames";
const INDEXEDDB_WON_STORE_NAME = "wongames";
const INDEXEDDB_CUSTOM_SAVED_STORE_NAME = "customsavedgames";

type FirebaseStoreType =
  | typeof FIREBASE_USERS_PRIVATE
  | typeof FIREBASE_USERS_PUBLIC
  | typeof FIREBASE_PUBLIC_WON_PROOF
  | typeof FIREBASE_CUSTOM_QUESTS;
// export interface GameLogDatabase extends GameLog {
//   created: number;
// }

function debug(...args: any[]) {
  //console.info(...args);
}

export async function getDb(app: firebase.app.App) {
  debug("Starting to get db");

  const db = window.indexedDB
    ? await new Promise<IDBDatabase>((resolve, reject) => {
        const idb = window.indexedDB.open(INDEXEDDB_NAME, 8);
        debug("idb opened");
        idb.onerror = (e) =>
          reject(
            new Error(
              idb.error ? `IndexedDB error: ${idb.error.name} ${idb.error.message}` : "Unknown",
            ),
          );
        idb.onsuccess = (e: any) => resolve(e.target.result);
        idb.onupgradeneeded = (e: any) => {
          debug("onupgradeneeded");
          const db: IDBDatabase = e.target.result;
          // debug(`Old version=${db.}`)

          for (const storeName of [
            INDEXEDDB_CONFIG_STORE_NAME,
            INDEXEDDB_SAVED_STORE_NAME,
            INDEXEDDB_WON_STORE_NAME,
            INDEXEDDB_CUSTOM_SAVED_STORE_NAME,
          ]) {
            if (!db.objectStoreNames.contains(storeName)) {
              debug(`Creating ${storeName} store`);
              db.createObjectStore(storeName, {
                // keyPath: false,
                autoIncrement: false,
              });
            } else {
              debug(`It containt ${storeName} store`);
            }
          }
        };
      })
    : undefined;
  debug(db ? "Got indexedDB" : "IndexedDB is not available, will use localStorage");
  // await new Promise<void>(resolve => setTimeout(resolve, 1));

  async function getLocal(storeName: string, key: string) {
    if (db) {
      const trx = db.transaction([storeName], "readonly");
      const objectStore = trx.objectStore(storeName);
      const getReq = objectStore.get(key);
      const localResult = await new Promise<any>((resolve, reject) => {
        getReq.onsuccess = (e) => {
          resolve(getReq.result);
        };
        getReq.onerror = (e) =>
          reject(new Error(getReq.error ? getReq.error.toString() : "Unknown"));
      });
      return localResult;
    } else {
      // fallback to localStorage
      const raw = localStorage.getItem(`RANGERS-${storeName}-${key}`);
      if (raw) {
        return JSON.parse(raw);
      } else {
        return null;
      }
    }
  }

  async function getAllLocal(storeName: string) {
    if (db) {
      const objectStore = db.transaction([storeName]).objectStore(storeName);
      return new Promise<WonProofs>((resolve, reject) => {
        const data: {
          [key: string]: any;
        } = {};
        const openCursor = objectStore.openCursor();
        openCursor.onsuccess = function (event: any) {
          const cursor = event.target.result;
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
        openCursor.onerror = (e) => {
          reject(new Error(openCursor.error ? openCursor.error.toString() : "Unknown"));
        };
      });
    } else {
      const prefix = `RANGERS-${storeName}-`;
      const r: {
        [key: string]: any;
      } = {};
      for (const lsFullKey of Object.keys(localStorage)) {
        if (lsFullKey.indexOf(prefix) !== 0) {
          continue;
        }
        const key = lsFullKey.slice(prefix.length);
        const raw = localStorage.getItem(lsFullKey);

        if (raw) {
          r[key] = JSON.parse(raw);
        }
      }
      return r;
    }
  }

  async function setLocal(storeName: string, key: string, value: any) {
    if (db) {
      const trx = db.transaction([storeName], "readwrite");
      const objectStore = trx.objectStore(storeName);

      const req = value ? objectStore.put(value, key) : objectStore.delete(key);
      await new Promise<void>((resolve, reject) => {
        req.onsuccess = (e) => resolve();
        req.onerror = (e) => {
          console.warn("Indexeddb error", req.error);
          reject(
            new Error(
              req.error ? `IndexedDB error: ${req.error.name} ${req.error.message}` : "Unknown",
            ),
          );
        };
      });
    } else {
      const lsFullKey = `RANGERS-${storeName}-${key}`;
      if (value) {
        localStorage.setItem(lsFullKey, JSON.stringify(value));
      } else {
        localStorage.removeItem(lsFullKey);
      }
    }
  }

  /*
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
    */

  let firebaseUser: firebase.User | null;
  let firebaseDatabaseOnlineConnections = 1;
  function firebaseGoOffline() {
    firebaseDatabaseOnlineConnections--;
    if (firebaseDatabaseOnlineConnections <= 0) {
      debug(`Firebase goes offline, no consumers`);
      try {
        app.database().goOffline();
      } catch (e) {
        console.warn(`Error with firebase`, e);
      }
    } else {
      debug(`Firebase will not go offline, have ${firebaseDatabaseOnlineConnections} consumers`);
    }
  }
  function firebaseGoOnline() {
    firebaseDatabaseOnlineConnections++;
    if (firebaseDatabaseOnlineConnections === 1) {
      debug(`We are the first firebase online consumer, going online`);
      try {
        app.database().goOnline();
      } catch (e) {
        console.warn(`Error with firebase`, e);
      }
    } else {
      debug(`Now firebase have ${firebaseDatabaseOnlineConnections} connections`);
    }
  }
  try {
    app.auth().onAuthStateChanged(function (user) {
      firebaseUser = user;
      debug(`on auth changed = ${firebaseUser ? firebaseUser.uid : "<null>"}`);
    });

    app
      .database()
      .ref(".info/connected")
      .on("value", (snap) => {
        const firebaseOnline = snap && snap.val();
        debug(`Firebase online=${firebaseOnline}`);
      });

    firebaseGoOffline();
  } catch (e) {
    console.error(`Error with firebase: `, e);
  }

  /* No actions from this point, only exported functions */

  async function setFirebase(
    store: FirebaseStoreType,
    userId: string | undefined,
    userPath: string,
    value: any,
  ) {
    try {
      firebaseGoOnline();

      const targetUserId = userId || (firebaseUser ? firebaseUser.uid : null);
      if (targetUserId) {
        const fullRefPath = `${store}/${targetUserId}/${userPath}`;
        debug(`Firebase SET fullRefPath=${fullRefPath} value=${JSON.stringify(value)}`);
        const setResult = await Promise.race([
          app.database().ref(fullRefPath).set(value),
          new Promise<void>((r) => setTimeout(r, 60000)).then(() => Promise.reject("Timed out")),
        ]);
      }
    } catch (e) {
      console.error(`Error with firebase: `, e);
    } finally {
      firebaseGoOffline();
    }
  }

  async function setFirebaseThisUser(store: FirebaseStoreType, userPath: string, value: any) {
    return setFirebase(store, undefined, userPath, value);
  }

  async function getFirebase(
    store: FirebaseStoreType,
    userId: string | undefined,
    userPath: string,
  ) {
    try {
      firebaseGoOnline();
      const firebaseResult = await Promise.race([
        new Promise<any | null>((resolve, reject) => {
          const targetUserId = userId || (firebaseUser ? firebaseUser.uid : null);
          targetUserId
            ? app
                .database()
                .ref(`${store}/${targetUserId}/${userPath}`)
                .once(
                  "value",
                  (snapshot) => {
                    const value = snapshot ? snapshot.val() : null;
                    debug(
                      `Firebase GET path=${store}/${
                        firebaseUser ? firebaseUser.uid : "ERR"
                      }/${userPath} value=${JSON.stringify(value)}`,
                    );
                    resolve(value);
                  },
                  (err) => {
                    reject(err);
                  },
                )
            : resolve(null);
        }),
        new Promise<null>((r) => setTimeout(() => r(null), 60000)).then(() =>
          Promise.reject("Firebase read timeout"),
        ),
      ]);

      return firebaseResult;
    } catch (e) {
      console.error(`Error with firebase: `, e);
      return null;
    } finally {
      firebaseGoOffline();
    }
  }
  async function getFirebaseThisUser(store: FirebaseStoreType, userPath: string) {
    return getFirebase(store, undefined, userPath);
  }

  async function setOwnHighscoresName(name: string) {
    await setFirebaseThisUser(FIREBASE_USERS_PUBLIC, "info/name", name);
  }

  async function getFirebasePublicHighscores() {
    firebaseGoOnline();
    try {
      const data = await new Promise<FirebasePublic[] | null>((resolve, reject) => {
        const allUsersRef = app.database().ref(FIREBASE_USERS_PUBLIC);
        allUsersRef
          .orderByChild("gamesWonCount")
          .limitToLast(100)
          .once("value", (snapshot) => {
            if (snapshot) {
              const champions: FirebasePublic[] = [];
              snapshot.forEach((champion) => {
                champions.push({
                  ...champion.val(),
                  userId: champion.key,
                });
                return undefined; // Typescript needs this for some unknown reasons
              });
              resolve(champions.reverse());
            } else {
              resolve(null);
            }
          })
          .catch((e) => reject(e));
      });
      return data;
    } catch (e) {
      console.warn(e);
      return null;
    } finally {
      firebaseGoOffline();
    }
  }

  /*
    async function getLocalAndFirebase(storeName: string, key: string) {
        const localResult = await getLocal(storeName, key);
        debug(
            `getLocal store=${storeName} key=${key} localResult=${JSON.stringify(
                localResult
            )}`
        );
        const firebaseResult = await getFirebase(
            FIREBASE_USERS_PRIVATE,
            `${storeName}/${key}`
        );

        if (firebaseResult !== undefined && firebaseResult !== null) {
            debug(
                `getFirebase store=${storeName} key=${key} firebaseResult=${JSON.stringify(
                    firebaseResult
                )}`
            );
            await setLocal(storeName, key, firebaseResult);
            return firebaseResult;
        }
        debug(
            `getLocal store=${storeName} key=${key} no_firebase_result`
        );
        return localResult;
    }
    */

  async function setConfigBoth(key: keyof ConfigBoth, value: ConfigBoth[typeof key]) {
    debug(`setConfig key=${key} value=${JSON.stringify(value)}`);
    await setLocal(INDEXEDDB_CONFIG_STORE_NAME, key, value);
    await setFirebaseThisUser(
      FIREBASE_USERS_PRIVATE,
      `${INDEXEDDB_CONFIG_STORE_NAME}/${key}`,
      value,
    );
  }

  async function setConfigLocal(key: keyof ConfigLocalOnly, value: ConfigLocalOnly[typeof key]) {
    debug(`setConfig key=${key} value=${JSON.stringify(value)}`);
    await setLocal(INDEXEDDB_CONFIG_STORE_NAME, key, value);
  }

  // async function getBoth<T extends keyof Config>(key: T): Promise<Config[T] | null> {
  //    return getLocalAndFirebase(INDEXEDDB_CONFIG_STORE_NAME, key);
  //}
  async function getConfigLocal<T extends keyof ConfigBoth>(key: T): Promise<ConfigBoth[T] | null> {
    return getLocal(INDEXEDDB_CONFIG_STORE_NAME, key);
  }

  async function firebaseOnline<T>(f: () => Promise<T>) {
    firebaseGoOnline();
    try {
      return await f();
    } finally {
      firebaseGoOffline();
    }
  }

  async function getRemotePassings(userId?: string) {
    /*

store.app.database().goOnline();
const firebaseUser = store.app.auth().currentUser;
const FIREBASE_PUBLIC_WON_PROOF = 'wonProofs';

(await store.app.database().ref("wonProofs").
orderByChild('createdAt').once("value")).val();

      */
    return await firebaseOnline(async () => {
      const ref = app.database().ref(FIREBASE_PUBLIC_WON_PROOF);
      const query = userId ? ref.orderByChild("userId").equalTo(userId) : ref;
      const data = (await query.once("value")).val() as Record<string, WonProofTableRow> | null;
      return data;
    });
  }

  function setRemoteWon(key: string, row: WonProofTableRow) {
    return firebaseOnline(() =>
      app
        .database()
        .ref(FIREBASE_PUBLIC_WON_PROOF + "/" + key)
        .set(row),
    );
  }

  async function updateFirebaseOwnHighscore() {
    try {
      const allRemotePrivateWons =
        (await getFirebaseThisUser(FIREBASE_USERS_PRIVATE, `${INDEXEDDB_WON_STORE_NAME}`)) || {};
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

      const allRemotePublicWons =
        (await getFirebaseThisUser(FIREBASE_USERS_PUBLIC, `gamesWonProofs`)) || {};
      debug(`Updating public highscores newCount=${newCount}`);
      await setFirebaseThisUser(FIREBASE_USERS_PUBLIC, `gamesWonCount`, newCount);
      /*
            await setFirebase(
                FIREBASE_USERS_PUBLIC,
                `gamesWonProofs`,
                newProofs
            );
            */
      for (const gameName of Object.keys(newProofs)) {
        for (const aleaSeed of Object.keys(newProofs[gameName])) {
          if (!allRemotePublicWons[gameName] || !allRemotePublicWons[gameName][aleaSeed]) {
            const gameLog = newProofs[gameName][aleaSeed];
            const created = firebase.database.ServerValue.TIMESTAMP;

            debug(`Updating firebase public won game=${gameName} seed=${aleaSeed}`);

            await setFirebaseThisUser(
              FIREBASE_USERS_PUBLIC,
              `gamesWonProofs/${gameName}/${aleaSeed}`,
              {
                ...gameLog,
                created,
              },
            );
          }
        }
      }
      debug(`Updating public highscores done`);
    } catch (e: any) {
      console.warn(`public wining state sync error`, e, e.stack);
    }
  }

  async function syncWithFirebase() {
    const userId = firebaseUser ? firebaseUser.uid : undefined;
    if (!userId) {
      return;
    }
    firebaseGoOnline();
    try {
      debug(`SyncWithFirebase started`);

      // Config is remote-first
      for (const key of ["player", "lastPlayedGame", "noMusic"] as (keyof ConfigBoth)[]) {
        const firebaseResult = await getFirebaseThisUser(
          FIREBASE_USERS_PRIVATE,
          `${INDEXEDDB_CONFIG_STORE_NAME}/${key}`,
        );
        if (firebaseResult) {
          debug(`Taking config ${key} from firebase`);
          await setLocal(INDEXEDDB_CONFIG_STORE_NAME, key, firebaseResult);
        } else if (firebaseResult === null) {
          const localResult = await getLocal(INDEXEDDB_CONFIG_STORE_NAME, key);
          if (localResult) {
            debug(`Saving firebase config ${key} because there is nothing`);
            await setFirebaseThisUser(
              FIREBASE_USERS_PRIVATE,
              `${INDEXEDDB_CONFIG_STORE_NAME}/${key}`,
              localResult,
            );
          } else {
            debug(`Config key ${key} no in local, neither in firebase`);
          }
        }
      }
      debug(`Sync syncWithFirebase config done`);

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
        debug(`Sync syncWithFirebase local savings done`);
        */
      try {
        debug(`Sync old syncWithFirebase passed games started`);
        const allLocalWons = await getAllLocal(INDEXEDDB_WON_STORE_NAME);
        const allRemoteWons =
          (await getFirebaseThisUser(FIREBASE_USERS_PRIVATE, `${INDEXEDDB_WON_STORE_NAME}`)) || {};

        const allGameNames = Object.keys({
          ...allLocalWons,
          ...allRemoteWons,
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
              debug(
                `Sync with firebase: gameName=${gameName} pushing seed=${localSeed} into firebase`,
              );
              await setFirebaseThisUser(
                FIREBASE_USERS_PRIVATE,
                `${INDEXEDDB_WON_STORE_NAME}/${gameName}/${localSeed}`,
                localProof,
              );
            }
          }

          for (const remoteSeed of Object.keys(thisGameRemoteWons)) {
            const remoteProof = thisGameRemoteWons[remoteSeed];
            if (!remoteProof) {
              continue;
            }
            if (!thisGameLocalWons[remoteSeed]) {
              debug(
                `Sync with firebase: gameName=${gameName} fetching seed=${remoteSeed} from firebase`,
              );

              const values = await getLocal(INDEXEDDB_WON_STORE_NAME, gameName);
              const newValues = {
                ...values,
                [remoteProof.aleaSeed]: remoteProof,
              };
              await setLocal(INDEXEDDB_WON_STORE_NAME, gameName, newValues);
            }
          }
        }
      } catch (e: any) {
        console.warn(`wining state sync error`, e, e.stack);
      }
      debug(`Sync old syncWithFirebase passed games done`);

      debug(`Sync flat syncWithFirebase passed games started`);

      const localConfig = await getConfigLocal("player");
      const rangerName = localConfig ? localConfig.Ranger : "";

      try {
        const allLocalWons = (await getAllLocal(INDEXEDDB_WON_STORE_NAME)) as WonProofs;
        const allRemoteWons = (await getRemotePassings(userId)) || {};

        for (const gameName of Object.keys(allLocalWons)) {
          const proofs = allLocalWons[gameName];
          for (const aleaSeed of Object.keys(proofs)) {
            const proof = proofs[aleaSeed];
            if (!allRemoteWons[aleaSeed]) {
              debug(`Pushing ${aleaSeed} into remote wons`);
              await setRemoteWon(aleaSeed, {
                rangerName,
                createdAt: firebase.database.ServerValue.TIMESTAMP as any as number,
                gameName,
                proof,
                userId,
              });
            }
          }
        }

        for (const aleaSeed of Object.keys(allRemoteWons)) {
          const row = allRemoteWons[aleaSeed];
          if (row.userId !== userId) {
            throw new Error(`Unexpected userId ${row.userId}, expected ${userId}`);
          }
          const gameName = row.gameName;
          const values = (await getLocal(INDEXEDDB_WON_STORE_NAME, gameName)) || {};
          if (!values[aleaSeed]) {
            debug(`Polling ${aleaSeed} from remote wons`);
            const newValues = {
              ...values,
              [aleaSeed]: row.proof,
            };
            await setLocal(INDEXEDDB_WON_STORE_NAME, gameName, newValues);
          }
        }
        /*
          TODO: 
          - Make local db flat view
          - Sync with firebase (both directions)
          - Write a method for writing passed game and add it into "gamePassed"

        */
      } catch (e: any) {
        console.warn(`wining state sync error`, e, e.stack);
      }
      debug(`Sync flat syncWithFirebase passed games done`);

      await updateFirebaseOwnHighscore();
      debug(`Own highscores synced`);

      const localName = await getConfigLocal("player");
      if (localName) {
        await setOwnHighscoresName(localName.Ranger || "");
      }
      debug(`Public ranger name synced`);

      debug(`Sync with firebase finished`);
    } finally {
      firebaseGoOffline();
    }
  }

  async function isGamePassedLocal(gameName: string) {
    const values = await getLocal(INDEXEDDB_WON_STORE_NAME, gameName);
    if (values && typeof values === "object" && Object.keys(values).length >= 1) {
      return values;
    } else {
      return false;
    }
  }

  async function setGamePassing(gameName: string, proof: GameLog) {
    const values = await getLocal(INDEXEDDB_WON_STORE_NAME, gameName);
    const newValues = {
      ...values,
      [proof.aleaSeed]: proof,
    };
    await setLocal(INDEXEDDB_WON_STORE_NAME, gameName, newValues);
    await setFirebaseThisUser(
      FIREBASE_USERS_PRIVATE,
      `${INDEXEDDB_WON_STORE_NAME}/${gameName}/${proof.aleaSeed}`,
      proof,
    );
    const localConfig = await getConfigLocal("player");
    const rangerName = localConfig ? localConfig.Ranger : "";
    const userId = firebaseUser ? firebaseUser.uid : undefined;
    if (userId) {
      await setRemoteWon(proof.aleaSeed, {
        rangerName,
        createdAt: firebase.database.ServerValue.TIMESTAMP as any as number,
        gameName,
        proof,
        userId,
      });
    }
    await updateFirebaseOwnHighscore();
  }

  async function saveGame(gameName: string, saving: GameState | null) {
    const savingRaw = saving ? JSON.stringify(saving) : saving;
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

  async function saveCustomQuest(questName: string, data: FirebaseCustomQuest | null) {
    await setFirebaseThisUser(
      FIREBASE_CUSTOM_QUESTS,
      `${encodeURIComponent(questName)}`,
      data
        ? {
            ...data,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
          }
        : null,
    );
  }
  async function loadCustomQuest(
    targetUserId: string | undefined,
    questName: string,
  ): Promise<FirebaseCustomQuest | null> {
    return await getFirebase(
      FIREBASE_CUSTOM_QUESTS,
      targetUserId,
      `${encodeURIComponent(questName)}`,
    );
  }
  async function getAllMyCustomQuests(): Promise<Record<string, FirebaseCustomQuest> | null> {
    firebaseGoOnline();
    try {
      const data = await new Promise<Record<string, FirebaseCustomQuest> | null>(
        (resolve, reject) => {
          if (!firebaseUser) {
            resolve(null);
            return;
          }

          const allMyCustomQuests = app
            .database()
            .ref(`${FIREBASE_CUSTOM_QUESTS}/${firebaseUser.uid}`);
          allMyCustomQuests
            //.orderByChild("gamesWonCount")
            //.limitToLast(100)
            .once("value", (snapshot) => {
              if (snapshot) {
                const data = snapshot.val();
                if (!data || typeof data !== "object") {
                  resolve(null);
                } else {
                  const transformedData: Record<string, FirebaseCustomQuest> = {};
                  Object.entries(data).forEach(([key, value]) => {
                    transformedData[decodeURIComponent(key)] = value as any;
                  });
                  debug(data, transformedData);
                  resolve(transformedData);
                }
              } else {
                resolve(null);
              }
            })
            .catch((e) => reject(e));
        },
      );
      return data;
    } catch (e) {
      console.warn(e);
      return null;
    } finally {
      firebaseGoOffline();
    }
  }

  function getMyUserId() {
    return firebaseUser ? firebaseUser.uid : null;
  }

  async function saveCustomGame(gameKey: string, saving: GameState | null) {
    // It is ok to save gamestate as it is without JSON encoding
    // But it caused some issues when saving was a MobX observable
    // So we save it as a string
    const savingRaw = saving ? JSON.stringify(saving) : saving;
    await setLocal(INDEXEDDB_CUSTOM_SAVED_STORE_NAME, gameKey, savingRaw);
  }
  async function loadCustomGame(gameKey: string) {
    const rawValue = await getLocal(INDEXEDDB_CUSTOM_SAVED_STORE_NAME, gameKey);
    if (!rawValue) {
      return null;
    }
    try {
      const value = JSON.parse(rawValue);
      return value as GameState;
    } catch (e) {
      return null;
    }
  }

  debug(`Returning db instance`);
  return {
    setConfigBoth,
    setConfigLocal,
    getConfigLocal,

    isGamePassedLocal,
    setGamePassing,

    getFirebasePublicHighscores,

    saveGame,
    getLocalSaving,
    // getAllRemoteSavings,

    syncWithFirebase,

    setOwnHighscoresName,

    getRemotePassings,

    getAllMyCustomQuests,
    saveCustomQuest,
    loadCustomQuest,
    getMyUserId,

    saveCustomGame,
    loadCustomGame,
  };
}

export type DB = typeof getDb extends (app: any) => Promise<infer T> ? T : never;
