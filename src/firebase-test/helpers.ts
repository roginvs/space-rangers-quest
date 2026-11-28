import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import "fake-indexeddb/auto";
import { IDBFactory as FakeIDBFactory } from "fake-indexeddb";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { getDb, DB } from "../ui/db/db";
import { getDb as getMasterDb } from "./legacy/dbMaster";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";
import { GameLog } from "../lib/qmplayer/funcs";

export const PROJECT_ID = "test-project-5f054";
export const DATABASE_EMULATOR_HOST =
  process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
export const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const RULES_NEW = path.resolve(__dirname, "../../database.rules.json");
const RULES_CURRENT = path.resolve(__dirname, "fixtures/database.rules.current.json");

export type RulesMode = "current" | "new";

function requireEmulator() {
  if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    // firebase emulators:exec sets these; also accept default ports if FIREBASE_EMULATOR_HUB is set
    if (!process.env.FIREBASE_EMULATOR_HUB) {
      throw new Error(
        "Firebase tests refuse to run without the emulator (set FIREBASE_EMULATOR_HUB)",
      );
    }
  }
}

function emulatorOrigins() {
  const [dbHost, dbPort] = DATABASE_EMULATOR_HOST.split(":");
  const authUrl = AUTH_EMULATOR_HOST.startsWith("http")
    ? AUTH_EMULATOR_HOST
    : `http://${AUTH_EMULATOR_HOST}`;
  return { dbHost, dbPort: Number(dbPort), authUrl };
}

export function isPermissionDenied(err: any): boolean {
  const code = (err && (err.code || err.message || String(err))) as string;
  return /permission_denied|PERMISSION_DENIED|permission-denied/i.test(code);
}

export async function assertSucceeds<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    throw new Error(`Expected success but got: ${e}`);
  }
}

export async function assertFails(p: Promise<any>): Promise<any> {
  try {
    await p;
  } catch (e) {
    if (isPermissionDenied(e)) {
      return e;
    }
    throw new Error(`Expected permission denied but got: ${e}`);
  }
  throw new Error("Expected permission denied, but the operation succeeded");
}

export async function loadRules(mode: RulesMode): Promise<void> {
  requireEmulator();
  const file = mode === "current" ? RULES_CURRENT : RULES_NEW;
  const rules = fs.readFileSync(file, "utf8");
  const { dbHost, dbPort } = emulatorOrigins();
  const url = `http://${dbHost}:${dbPort}/.settings/rules.json?ns=${PROJECT_ID}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: "Bearer owner",
      "Content-Type": "application/json",
    },
    body: rules,
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${mode} rules: ${res.status} ${await res.text()}`);
  }
}

export async function clearEmulator(): Promise<void> {
  requireEmulator();
  const { dbHost, dbPort, authUrl } = emulatorOrigins();
  const dbRes = await fetch(`http://${dbHost}:${dbPort}/.json?ns=${PROJECT_ID}`, {
    method: "PUT",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: "null",
  });
  if (!dbRes.ok) {
    throw new Error(`Failed to clear database: ${dbRes.status} ${await dbRes.text()}`);
  }
  const authRes = await fetch(`${authUrl}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: "DELETE",
  });
  if (!authRes.ok && authRes.status !== 404) {
    throw new Error(`Failed to clear auth: ${authRes.status} ${await authRes.text()}`);
  }
  await clearLocalIdb();
}

let appCounter = 0;

export function createApp(name?: string): firebase.app.App {
  requireEmulator();
  if (typeof (global as any).window === "undefined") {
    (global as any).window = global;
  }
  if (!(global as any).navigator) {
    (global as any).navigator = { userAgent: "firebase-tests" };
  }
  appCounter += 1;
  const app = firebase.initializeApp(
    {
      apiKey: "fake-api-key",
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
      projectId: PROJECT_ID,
    },
    name || `app-${appCounter}-${Date.now()}`,
  );
  const { dbHost, dbPort, authUrl } = emulatorOrigins();
  app.database().useEmulator(dbHost, dbPort);
  app.auth().useEmulator(authUrl);
  return app;
}

export async function signUp(app: firebase.app.App, prefix: string): Promise<firebase.User> {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`;
  const cred = await app.auth().createUserWithEmailAndPassword(email, "password123");
  if (!cred.user) {
    throw new Error("signUp produced no user");
  }
  return cred.user;
}

/** The client deployed now (master before this PR) */
export type MasterDB = typeof getMasterDb extends (app: any) => Promise<infer T> ? T : never;

export async function openDb(app: firebase.app.App): Promise<DB> {
  return waitForUser(app, await getDb(app));
}

export async function openMasterDb(app: firebase.app.App): Promise<MasterDB> {
  return waitForUser(app, await getMasterDb(app));
}

async function waitForUser<T extends { getMyUserId(): string | null }>(
  app: firebase.app.App,
  db: T,
): Promise<T> {
  if (!app.auth().currentUser) {
    return db;
  }
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (db.getMyUserId()) {
      return db;
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("Timed out waiting for getDb to see the signed-in user");
}

export function sampleProof(seed: string, finishedAt = 1_700_000_000_100): GameLog {
  return {
    aleaSeed: seed,
    performedJumps: [
      { dateUnix: finishedAt - 100, jumpId: 1 },
      { dateUnix: finishedAt, jumpId: 2 },
    ],
  };
}

/** Signs in on another app as an existing user (a second device) */
export async function signInAs(app: firebase.app.App, user: firebase.User): Promise<void> {
  await app.auth().signInWithEmailAndPassword(user.email as string, "password123");
}

/** Raw SDK read as the app's current user */
export function rawGet(app: firebase.app.App, dbPath: string): Promise<any> {
  return withOnline(app, async () => (await app.database().ref(dbPath).once("value")).val());
}

/** Raw SDK write as the app's current user */
export function rawSet(app: firebase.app.App, dbPath: string, value: any): Promise<void> {
  return withOnline(app, () => app.database().ref(dbPath).set(value));
}

export async function seedPlayerName(
  db: Pick<DB, "setConfigBoth">,
  rangerName: string,
): Promise<void> {
  await db.setConfigBoth("player", {
    ...DEFAULT_RUS_PLAYER,
    Ranger: rangerName,
    Player: rangerName,
  });
}

export async function deleteApp(app: firebase.app.App): Promise<void> {
  try {
    await app.delete();
  } catch {
    // already deleted
  }
}

export function assertNonNull<T>(value: T | null | undefined, msg: string): T {
  assert.ok(value, msg);
  return value as T;
}

export async function adminGet(dbPath: string): Promise<any> {
  const { dbHost, dbPort } = emulatorOrigins();
  const clean = dbPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const url = `http://${dbHost}:${dbPort}/${clean}.json?ns=${PROJECT_ID}`;
  const res = await fetch(url, { headers: { Authorization: "Bearer owner" } });
  if (!res.ok) {
    throw new Error(`adminGet ${clean} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function adminSet(dbPath: string, value: any): Promise<void> {
  const { dbHost, dbPort } = emulatorOrigins();
  const clean = dbPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const url = `http://${dbHost}:${dbPort}/${clean}.json?ns=${PROJECT_ID}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    throw new Error(`adminSet ${clean} failed: ${res.status} ${await res.text()}`);
  }
}

/** getDb takes the app offline between calls; turn it on for raw SDK reads/writes. */
export async function withOnline<T>(app: firebase.app.App, fn: () => Promise<T>): Promise<T> {
  app.database().goOnline();
  try {
    return await fn();
  } finally {
    app.database().goOffline();
  }
}

/** A separate empty IndexedDB for the next getDb: another device that stays open */
export function useNewDeviceStorage(): void {
  (global as any).indexedDB = new FakeIDBFactory();
}

/** Empties the local IndexedDB: the next getDb behaves like a new device */
export async function clearLocalIdb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("spaceranges2");
    req.onerror = () => resolve();
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.length === 0) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction(Array.from(db.objectStoreNames), "readwrite");
      Array.from(db.objectStoreNames).forEach((name) => tx.objectStore(name).clear());
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
