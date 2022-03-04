import * as React from "react";
import { toast } from "react-toastify";
import { Quest } from "../../../lib/qmplayer/funcs";
import { parse } from "../../../lib/qmreader";
import { emptyQmm } from "./emptyQmm";
import { greetingsQmm } from "./greetingsQmm";

const EDITOR_INDEXEDDB_NAME = "space-rangers-editor";
const INDEXEDDB_EDITOR_AUTOSAVE_STORE = "autosave";

const AUTOSAVE_SIZE = 500;

export interface QuestName {
  readonly filename?: string;
}

export interface QuestWithMetadata extends Quest, QuestName {
  isPublic?: boolean;
}

async function writeQuest(db: IDBDatabase, quest: QuestWithMetadata, index: number) {
  const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readwrite");
  const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

  // Find and remove what is higher or equal to our index
  const higherKeysRemoveRequest = objectStore.delete(IDBKeyRange.lowerBound(index));
  await new Promise<void>((resolve, reject) => {
    higherKeysRemoveRequest.onsuccess = () => resolve();
    higherKeysRemoveRequest.onerror = () =>
      reject(new Error(higherKeysRemoveRequest.error?.message));
  });

  // Then save what do we have
  const saveRequest = objectStore.put(quest, index);
  await new Promise<void>((resolve, reject) => {
    saveRequest.onsuccess = () => resolve();
    saveRequest.onerror = () => reject(new Error(saveRequest.error?.message));
  });

  // Next, find and remove everything lower threshold
  const removingThreshold = index - AUTOSAVE_SIZE;
  if (removingThreshold > 0) {
    const olderKeysRemoveRequest = objectStore.delete(IDBKeyRange.upperBound(removingThreshold));
    await new Promise<void>((resolve, reject) => {
      olderKeysRemoveRequest.onsuccess = () => resolve();
      olderKeysRemoveRequest.onerror = () =>
        reject(new Error(olderKeysRemoveRequest.error?.message));
    });
  }

  //  - remove everything lower than index minus MAX_SAVE
  //  - remove everything higher than index
}
async function readLatestIndex(db: IDBDatabase) {
  return new Promise<number | null>((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readonly");
    const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

    const openCursorRequest = objectStore.openKeyCursor(null, "prev");
    openCursorRequest.onsuccess = (event) => {
      if (openCursorRequest.result && typeof openCursorRequest.result.key === "number") {
        resolve(openCursorRequest.result.key);
      } else {
        resolve(null);
      }
    };
    openCursorRequest.onerror = (e) => reject(new Error(openCursorRequest.error?.message));
  });
}
async function readQuest(db: IDBDatabase, index: number): Promise<QuestWithMetadata | null> {
  return new Promise<Quest | null>((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_EDITOR_AUTOSAVE_STORE], "readonly");
    const objectStore = transaction.objectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE);

    const request = objectStore.get(index);
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(result);
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

    idb.onsuccess = (e) => resolve(idb.result);
    idb.onupgradeneeded = (event) => {
      console.info("onupgradeneeded");
      const db = idb.result;

      console.info(`Old version=${event.oldVersion}`);

      if (event.oldVersion < 7) {
        console.info(`Creating ${INDEXEDDB_EDITOR_AUTOSAVE_STORE} store`);
        db.createObjectStore(INDEXEDDB_EDITOR_AUTOSAVE_STORE, {
          // keyPath: false,
          autoIncrement: false,
        });
      }
    };
  });
}

interface IDBStoreState {
  readonly quest: QuestWithMetadata;
  readonly undoQuest: QuestWithMetadata | null;
  readonly redoQuest: QuestWithMetadata | null;
  readonly currentIndex: number;
}

export function useIdb() {
  const [db, setDb] = React.useState<IDBDatabase | undefined>(undefined);

  const [broadcastChannel, setBroadcastChannel] = React.useState<BroadcastChannel | undefined>();
  React.useEffect(() => {
    // tslint:disable-next-line:strict-type-predicates
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    const bc = new BroadcastChannel("space-ranger-editor-questupdated");
    setBroadcastChannel(bc);
    return () => {
      bc.close();
    };
  }, []);

  const [state, setState] = React.useState<IDBStoreState | null>(null);

  const setFallbackEmptyState = React.useCallback(() => {
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
        setFallbackEmptyState();
        toast(`Failed to init database: ${e.message}`);
      });
  }, [setFallbackEmptyState]);

  const saveQuest = React.useCallback(
    (newQuest: QuestWithMetadata) => {
      setState({
        currentIndex: state ? state.currentIndex + 1 : 1,
        undoQuest: state ? state.quest : null,
        redoQuest: null,
        quest: newQuest,
      });

      if (!db) {
        toast("No database to save quest");
        return;
      }

      if (!state) {
        toast("No previous state to save quest");
        return;
      }

      writeQuest(db, newQuest, state.currentIndex + 1)
        .then(() => {
          if (broadcastChannel) {
            broadcastChannel.postMessage("");
          } else {
            toast("No broadcast channel to send message");
          }
        })
        .catch((e) => toast(`Failed to save quest: ${e.message}!`));
    },
    [db, state, broadcastChannel],
  );

  const startupLoad = React.useCallback(() => {
    console.info(`Editor startup loading dbIsReady=${db}`);
    if (!db) {
      return;
    }
    (async () => {
      const latestIndex = await readLatestIndex(db);
      if (!latestIndex) {
        const greetingsQuest = parse(greetingsQmm);
        setState({
          quest: greetingsQuest,
          undoQuest: null,
          redoQuest: null,
          currentIndex: 1,
        });
        return;
      }
      const quest = await readQuest(db, latestIndex);
      const prevQuest = await readQuest(db, latestIndex - 1);
      if (!quest) {
        setFallbackEmptyState();
        toast(`Could not read saved quest at index ${latestIndex}`);
        return;
      }
      setState({
        quest,
        undoQuest: prevQuest,
        redoQuest: null,
        currentIndex: latestIndex,
      });
    })().catch((e) => {
      setFallbackEmptyState();
      toast(`Failed to read from database: ${e.message}`);
    });
  }, [db, setFallbackEmptyState]);

  React.useEffect(() => {
    startupLoad();
  }, [startupLoad]);

  React.useEffect(() => {
    if (!broadcastChannel) {
      return;
    }
    broadcastChannel.onmessage = () => {
      // console.info("broadcastChannel got message");
      startupLoad();
    };
    return () => {
      broadcastChannel.onmessage = null;
    };
  }, [startupLoad, broadcastChannel]);

  const undo = React.useMemo(() => {
    if (!db || !state || !state.undoQuest) {
      return null;
    }
    const undoQuest = state.undoQuest;

    return () => {
      setState({
        quest: undoQuest,
        undoQuest: null,
        redoQuest: state.quest,
        currentIndex: state.currentIndex - 1,
      });
      // Read one more quest to be able to undo
      readQuest(db, state.currentIndex - 2)
        .then((undoQuest) => {
          setState((oldState) =>
            oldState
              ? {
                  ...oldState,
                  undoQuest,
                }
              : null,
          );
        })
        .catch((e) => toast(`Failed to read previous quest: ${e.message}`));
    };
  }, [db, state]);

  // Quite a copy-paste from undo
  const redo = React.useMemo(() => {
    if (!db || !state || !state.redoQuest) {
      return null;
    }
    const redoQuest = state.redoQuest;

    return () => {
      setState({
        quest: redoQuest,
        undoQuest: state.quest,
        redoQuest: null,
        currentIndex: state.currentIndex + 1,
      });
      // Read one more quest to be able to redo
      readQuest(db, state.currentIndex + 2)
        .then((redoQuest) => {
          setState((oldState) =>
            oldState
              ? {
                  ...oldState,
                  redoQuest,
                }
              : null,
          );
        })
        .catch((e) => toast(`Failed to read quest to next redo: ${e.message}`));
    };
  }, [db, state]);

  return {
    quest: state?.quest,
    setQuest: saveQuest,
    undo,
    redo,
  };
}
