import firebase from "firebase/app";

/**
 * Connect the web app to the local Auth + RTDB emulators when the page is
 * opened with ?emulator=1 (for example http://127.0.0.1:4100/?emulator=1).
 * Called only in development builds (see index.tsx), production has no such code.
 */
export function connectFirebaseEmulatorsIfNeeded(app: firebase.app.App) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("emulator") !== "1") {
    return;
  }
  app.database().useEmulator("127.0.0.1", 9000);
  app.auth().useEmulator("http://127.0.0.1:9099");
  console.info("Firebase emulators enabled (127.0.0.1:9000 / 9099)");
}
