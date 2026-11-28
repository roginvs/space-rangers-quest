import * as assert from "assert";
import firebase from "firebase/app";
import {
  FIREBASE_PUBLIC_WON_PROOF,
  FIREBASE_USERS_PRIVATE,
  FIREBASE_USERS_PUBLIC,
} from "../ui/db/defs";
import { FirebaseCustomQuest } from "../ui/editor/defs";
import { GameState } from "../lib/qmplayer/funcs";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";
import { adminSet, assertSucceeds, createApp, deleteApp, sampleProof, signUp } from "./helpers";

/** Functions that exist in both the old and the new client */
interface CommonDb {
  getMyUserId(): string | null;
  setConfigLocal(key: "lastLocation", value: string): Promise<void>;
  getConfigLocal(key: any): Promise<any>;
  saveGame(gameName: string, saving: GameState | null): Promise<void>;
  getLocalSaving(gameName: string): Promise<GameState | null>;
  saveCustomGame(gameKey: string, saving: GameState | null): Promise<void>;
  loadCustomGame(gameKey: string): Promise<GameState | null>;
  isGamePassedLocal(gameName: string): Promise<any>;
  saveCustomQuest(questName: string, data: FirebaseCustomQuest | null): Promise<void>;
  loadCustomQuest(uid: string | undefined, questName: string): Promise<FirebaseCustomQuest | null>;
  getAllMyCustomQuests(): Promise<Record<string, FirebaseCustomQuest> | null>;
}

const fakeState = { aleaSeed: "state-seed", performedJumps: [] } as any as GameState;

/** IndexedDB-only functions: no Firebase involved */
export async function checkLocalOnlyFunctions(db: CommonDb) {
  assert.strictEqual(db.getMyUserId(), null);

  await db.setConfigLocal("lastLocation", "#/quests");
  assert.strictEqual(await db.getConfigLocal("lastLocation"), "#/quests");

  await db.saveGame("Феи", fakeState);
  assert.deepStrictEqual(await db.getLocalSaving("Феи"), fakeState);
  await db.saveGame("Феи", null);
  assert.ok(!(await db.getLocalSaving("Феи")));

  await db.saveCustomGame("custom-key", fakeState);
  assert.deepStrictEqual(await db.loadCustomGame("custom-key"), fakeState);

  assert.strictEqual(await db.isGamePassedLocal("Феи"), false);
}

/** customQuests: owner reads/writes; others read only public quests */
export async function checkCustomQuests(open: (app: firebase.app.App) => Promise<CommonDb>) {
  const aliceApp = createApp();
  const alice = await signUp(aliceApp, "alice");
  const aliceDb = await open(aliceApp);
  await assertSucceeds(
    aliceDb.saveCustomQuest("PublicQuest", {
      quest_qmm_gz_base64: "cHVibGlj",
      isPublic: true,
      updatedAt: 0,
    }),
  );
  await assertSucceeds(
    aliceDb.saveCustomQuest("PrivateQuest", {
      quest_qmm_gz_base64: "cHJpdmF0ZQ==",
      isPublic: false,
      updatedAt: 0,
    }),
  );
  const mine = await assertSucceeds(aliceDb.getAllMyCustomQuests());
  assert.ok(mine && mine.PublicQuest && mine.PrivateQuest);
  const own = await aliceDb.loadCustomQuest(undefined, "PrivateQuest");
  assert.ok(own && own.quest_qmm_gz_base64 === "cHJpdmF0ZQ==");

  const bobApp = createApp();
  await signUp(bobApp, "bob");
  const bobDb = await open(bobApp);
  const pubAsBob = await bobDb.loadCustomQuest(alice.uid, "PublicQuest");
  assert.ok(pubAsBob && pubAsBob.isPublic);
  assert.ok(!(await bobDb.loadCustomQuest(alice.uid, "PrivateQuest")));

  const anonApp = createApp();
  const anonDb = await open(anonApp);
  assert.ok(await anonDb.loadCustomQuest(alice.uid, "PublicQuest"));
  assert.strictEqual(await anonDb.getAllMyCustomQuests(), null);

  await deleteApp(aliceApp);
  await deleteApp(bobApp);
  await deleteApp(anonApp);
}

/**
 * What a player of the deployed site has in the database after one win:
 * the same proof in three places, plus the name and the count.
 */
export async function seedOldClientPlayer(
  uid: string,
  wins: { gameName: string; seed: string; finishedAt?: number }[],
  rangerName = "Старожил",
) {
  const wongames: any = {};
  const gamesWonProofs: any = {};
  for (const { gameName, seed, finishedAt } of wins) {
    const proof = sampleProof(seed, finishedAt);
    wongames[gameName] = { ...wongames[gameName], [seed]: proof };
    gamesWonProofs[gameName] = {
      ...gamesWonProofs[gameName],
      [seed]: { ...proof, created: 1_700_000_001_000 },
    };
    await adminSet(`${FIREBASE_PUBLIC_WON_PROOF}/${seed}`, {
      rangerName,
      createdAt: 1_700_000_001_000,
      gameName,
      proof,
      userId: uid,
    });
  }
  await adminSet(`${FIREBASE_USERS_PRIVATE}/${uid}`, {
    config: { player: { ...DEFAULT_RUS_PLAYER, Ranger: rangerName, Player: rangerName } },
    wongames,
  });
  await adminSet(`${FIREBASE_USERS_PUBLIC}/${uid}`, {
    info: { name: rangerName },
    gamesWonCount: Object.keys(gamesWonProofs).length,
    gamesWonProofs,
  });
}
