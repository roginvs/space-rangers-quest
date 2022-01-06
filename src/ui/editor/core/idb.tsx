import * as React from "react";
import { toast } from "react-toastify";
import { Quest } from "../../../lib/qmplayer/funcs";
import { parse } from "../../../lib/qmreader";
import { emptyQmm } from "./emptyQmm";

const EDITOR_INDEXEDDB_NAME = "space-rangers-editor";
const INDEXEDDB_EDITOR_AUTOSAVE_STORE = "autosave";

const getAllKeys = (store: IDBObjectStore) => {
  return new Promise<number[]>((resolve, reject) => {
    const getAllKeysRequest = store.getAllKeys();
    getAllKeysRequest.onsuccess = () => {
      resolve(
        getAllKeysRequest.result.map((x) => (typeof x === "number" ? x : 0)).sort((a, b) => a - b),
      );
    };
    getAllKeysRequest.onerror = (e) => reject(new Error(getAllKeysRequest.error?.message));
  });
};

async function writeQuest(db: IDBDatabase, quest: Quest, index: number) {
  // todo:
  //  - write to specific index
  const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readwrite");
  const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

  const request = objectStore.put(quest, index);
  await new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e);
  });

  //  - remove everything lower than index minus MAX_SAVE
  //  - remove everything higher than index
}
async function readLatestIndex(db: IDBDatabase) {
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readonly");
    const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);
    // TODO: Use cursor
    getAllKeys(objectStore)
      .then((allKeys) => {
        if (allKeys.length === 0) {
          resolve(1);
        } else {
          resolve(allKeys[allKeys.length - 1]);
        }
      })
      .catch((e) => {
        console.error(e);
        resolve(1);
      });
  });
}
async function readQuest(db: IDBDatabase, index: number): Promise<Quest | null> {
  return new Promise<Quest | null>((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readonly");
    const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

    const request = objectStore.get(index);
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        resolve(null);
      }
    };
    request.onerror = (e) => reject(new Error(request.error?.message));
  });
}

async function initDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const idb = window.indexedDB.open(EDITOR_INDEXEDDB_NAME, 7);
    console.info("idb opened");
    idb.onerror = (e) => {
      reject(new Error(idb.error?.message));
      // toast("IndexedDB error: " + idb.error?.message);
    };

    idb.onsuccess = (e: any) => resolve(e.target.result);
    idb.onupgradeneeded = (e: any) => {
      console.info("onupgradeneeded");
      const db: IDBDatabase = e.target.result;
      // console.info(`Old version=${db.}`)

      if (!db.objectStoreNames.contains(INDEXEDDB_EDITOR_AUTOSAVE_STORE)) {
        console.info(`Creating ${INDEXEDDB_EDITOR_AUTOSAVE_STORE} store`);
        db.createObjectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE, {
          // keyPath: false,
          autoIncrement: false,
        });
      } else {
        console.info(`It contains ${INDEXEDDB_EDITOR_AUTOSAVE_STORE} store`);
      }
    };
  });
}

interface IDBStoreState {
  readonly quest: Quest;
  readonly undoQuest: Quest | null;
  readonly redoQuest: Quest | null;
  readonly currentIndex: number;
}

export function useIdb() {
  const [db, setDb] = React.useState<IDBDatabase | undefined>(undefined);

  const [state, setState] = React.useState<IDBStoreState | null>(null);

  const setInitialDefaultState = React.useCallback(() => {
    const emptyQuest = parse(emptyQmm);
    setState({
      quest: emptyQuest,
      undoQuest: null,
      redoQuest: null,
      currentIndex: 1,
    });
  }, []);

  React.useEffect(() => {
    initDatabase()
      .then((freshDb) => setDb(freshDb))
      .catch((e) => {
        setInitialDefaultState();
        toast(e.message);
      });
  }, [setInitialDefaultState]);

  const saveQuest = React.useCallback(
    (newQuest: Quest) => {
      setState({
        currentIndex: state ? state.currentIndex + 1 : 1,
        undoQuest: state ? state.quest : null,
        redoQuest: null,
        quest: newQuest,
      });

      if (db && state) {
        writeQuest(db, newQuest, state.currentIndex + 1).catch((e) => toast(e.message));
      }
    },
    [db, state],
  );

  React.useEffect(() => {
    if (!db) {
      return;
    }
    (async () => {
      const latestIndex = await readLatestIndex(db);
      const quest = await readQuest(db, latestIndex);
      const prevQuest = await readQuest(db, latestIndex - 1);
      if (!quest) {
        setInitialDefaultState();
        return;
      }
      setState({
        quest,
        undoQuest: prevQuest,
        redoQuest: null,
        currentIndex: latestIndex,
      });
    })().catch((e) => {
      setInitialDefaultState();
      toast(e.message);
    });
  }, [db, setInitialDefaultState]);

  return {
    quest: state?.quest,
    setQuest: saveQuest,

    //canUndo,
    //  undo,
    // canRedo,
    //redo,
  };
}
