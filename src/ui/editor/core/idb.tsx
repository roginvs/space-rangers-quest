import * as React from "react";
import { toast } from "react-toastify";
import { Quest } from "../../../lib/qmplayer/funcs";
import { parse } from "../../../lib/qmreader";
import { emptyQmm } from "./emptyQmm";

const EDITOR_INDEXEDDB_NAME = "space-rangers-editor";
const INDEXEDDB_EDITOR_AUTOSAVE_STORE = "autosave";

// TODO: Make it much bigger!
const AUTOSAVE_SIZE = 4;

async function writeQuest(db: IDBDatabase, quest: Quest, index: number) {
  const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readwrite");
  const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

  // Find what is higher our threshold
  const higherKeysRequest = objectStore.getAllKeys(IDBKeyRange.lowerBound(index, true));
  const keysToRemove = await new Promise<IDBValidKey[]>((resolve, reject) => {
    higherKeysRequest.onsuccess = () => resolve(higherKeysRequest.result);
    higherKeysRequest.onerror = () => reject(new Error(higherKeysRequest.error?.message));
  });

  // Then save what do we have
  const saveRequest = objectStore.put(quest, index);
  await new Promise<void>((resolve, reject) => {
    saveRequest.onsuccess = () => resolve();
    saveRequest.onerror = () => reject(new Error(saveRequest.error?.message));
  });

  // Next, find everything lower threshold
  const removingThreshold = index - AUTOSAVE_SIZE;
  if (removingThreshold > 0) {
    const olderKeysRequest = objectStore.getAllKeys(IDBKeyRange.upperBound(removingThreshold));
    const oldKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      olderKeysRequest.onsuccess = () => resolve(olderKeysRequest.result);
      olderKeysRequest.onerror = () => reject(new Error(olderKeysRequest.error?.message));
    });
    keysToRemove.push(...oldKeys);
  }

  for (const key of [keysToRemove]) {
    const removeRequest = objectStore.delete(key);
    await new Promise<void>((resolve, reject) => {
      removeRequest.onsuccess = () => resolve();
      removeRequest.onerror = () => reject(new Error(removeRequest.error?.message));
    });
  }

  //  - remove everything lower than index minus MAX_SAVE
  //  - remove everything higher than index
}
async function readLatestIndex(db: IDBDatabase) {
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readonly");
    const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

    const openCursorRequest = objectStore.openKeyCursor(null, "prev");
    openCursorRequest.onsuccess = (event) => {
      if (openCursorRequest.result && typeof openCursorRequest.result.key === "number") {
        resolve(openCursorRequest.result.key);
      } else {
        resolve(1);
      }
    };
    openCursorRequest.onerror = (e) => reject(new Error(openCursorRequest.error?.message));
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
