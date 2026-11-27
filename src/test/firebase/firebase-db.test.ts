import * as assert from "assert";
import "mocha";
import {
  FIREBASE_CHAMPIONS,
  FIREBASE_CUSTOM_QUESTS,
  FIREBASE_PUBLIC_WON_PROOF,
  FIREBASE_USERS_PRIVATE,
  FIREBASE_USERS_PUBLIC,
} from "../../ui/db/defs";
import {
  adminGet,
  adminSet,
  assertFails,
  assertSucceeds,
  clearEmulator,
  createApp,
  deleteApp,
  loadRules,
  openDb,
  sampleProof,
  seedPlayerName,
  signUp,
  withOnline,
  RulesMode,
} from "./helpers";
import { ChampionsPage } from "../../ui/db/championsPage";

function currentClientSuite(mode: RulesMode) {
  describe(`current client on ${mode} rules`, () => {
    beforeEach(async () => {
      await loadRules(mode);
      await clearEmulator();
    });

    it("setGamePassing writes private proof, wonProofs and public highscore", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      const proof = sampleProof("seed-alice-1");
      await assertSucceeds(db.setGamePassing("Пиратская линейка", proof));

      const privateWon = await adminGet(
        `${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames/Пиратская линейка/seed-alice-1`,
      );
      assert.strictEqual(privateWon && privateWon.aleaSeed, "seed-alice-1");

      const publicWon = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}`);
      assert.strictEqual(publicWon.gamesWonCount, 1);
      assert.ok(publicWon.gamesWonProofs["Пиратская линейка"]["seed-alice-1"]);

      const remote = await adminGet(`${FIREBASE_PUBLIC_WON_PROOF}/seed-alice-1`);
      assert.strictEqual(remote.userId, user.uid);
      assert.strictEqual(remote.gameName, "Пиратская линейка");
      assert.strictEqual(remote.rangerName, "Алиса");
      assert.ok(typeof remote.createdAt === "number");
      assert.ok(!("validated" in remote));

      await deleteApp(app);
    });

    it("refuses a second write of the same wonProofs seed", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await assertSucceeds(db.setGamePassing("Шпион", sampleProof("seed-once")));
      await assertFails(
        withOnline(app, () =>
          app
            .database()
            .ref(`${FIREBASE_PUBLIC_WON_PROOF}/seed-once`)
            .set({
              rangerName: "Алиса",
              createdAt: Date.now(),
              gameName: "Шпион",
              proof: sampleProof("seed-once"),
              userId: user.uid,
            }),
        ),
      );
      await deleteApp(app);
    });

    it("setOwnHighscoresName updates usersPublic info.name", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Старое");
      await assertSucceeds(db.setOwnHighscoresName("НовоеИмя"));
      const info = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/info`);
      assert.strictEqual(info.name, "НовоеИмя");
      await deleteApp(app);
    });

    it("syncWithFirebase pulls remote passings into a fresh local db", async () => {
      const app1 = createApp();
      const user = await signUp(app1, "alice");
      const db1 = await openDb(app1);
      await seedPlayerName(db1, "Алиса");
      await assertSucceeds(db1.setGamePassing("Гладиатор", sampleProof("seed-sync-1")));
      await deleteApp(app1);

      const app2 = createApp();
      await app2.auth().signInWithEmailAndPassword(user.email as string, "password123");
      const db2 = await openDb(app2);
      await assertSucceeds(db2.syncWithFirebase());
      const local = await db2.isGamePassedLocal("Гладиатор");
      assert.ok(local);
      assert.ok(local && local["seed-sync-1"]);
      await deleteApp(app2);
    });

    it("getRemotePassings(userId) returns only that player's rows (sync path)", async () => {
      const aliceApp = createApp();
      const alice = await signUp(aliceApp, "alice");
      const aliceDb = await openDb(aliceApp);
      await seedPlayerName(aliceDb, "Алиса");
      await aliceDb.setGamePassing("Шпион", sampleProof("seed-alice-spy"));

      const bobApp = createApp();
      const bob = await signUp(bobApp, "bob");
      const bobDb = await openDb(bobApp);
      await seedPlayerName(bobDb, "Боб");
      await bobDb.setGamePassing("Бомба", sampleProof("seed-bob-bomb"));

      const aliceRows = await assertSucceeds(aliceDb.getRemotePassings(alice.uid));
      assert.ok(aliceRows);
      assert.ok(aliceRows && aliceRows["seed-alice-spy"]);
      assert.ok(aliceRows && !aliceRows["seed-bob-bomb"]);

      // A player can also query another uid (needed later for "Проверить")
      const bobAsSeenByAlice = await assertSucceeds(aliceDb.getRemotePassings(bob.uid));
      assert.ok(bobAsSeenByAlice && bobAsSeenByAlice["seed-bob-bomb"]);

      await deleteApp(aliceApp);
      await deleteApp(bobApp);
    });

    it("getRemotePassings() without a filter (old #/logs full tree)", async () => {
      const app = createApp();
      await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await db.setGamePassing("Феи", sampleProof("seed-logs"));

      if (mode === "new") {
        // expected-deny: tightened rules block unfiltered wonProofs reads
        await assertFails(
          withOnline(app, () => app.database().ref(FIREBASE_PUBLIC_WON_PROOF).once("value")),
        );
      } else {
        const all = await assertSucceeds(db.getRemotePassings());
        assert.ok(all && all["seed-logs"]);
      }
      await deleteApp(app);
    });

    it("getFirebasePublicHighscores reads the usersPublic leaderboard", async () => {
      const app = createApp();
      await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await db.setGamePassing("Хищник", sampleProof("seed-hs"));

      if (mode === "new") {
        // expected-deny: usersPublic is readable only by its owner, not as a list
        const result = await db.getFirebasePublicHighscores();
        assert.strictEqual(result, null);
      } else {
        const list = await assertSucceeds(db.getFirebasePublicHighscores());
        assert.ok(list && list.length >= 1);
        assert.ok(list && list.some((row) => row.gamesWonCount >= 1));
      }
      await deleteApp(app);
    });

    it("a user cannot write someone else's usersPublic highscore", async () => {
      const aliceApp = createApp();
      const alice = await signUp(aliceApp, "alice");
      const aliceDb = await openDb(aliceApp);
      await seedPlayerName(aliceDb, "Алиса");
      await aliceDb.setGamePassing("Феи", sampleProof("seed-own"));
      await deleteApp(aliceApp);

      const bobApp = createApp();
      await signUp(bobApp, "bob");
      await assertFails(
        withOnline(bobApp, () =>
          bobApp.database().ref(`${FIREBASE_USERS_PUBLIC}/${alice.uid}/gamesWonCount`).set(99),
        ),
      );
      const count = await adminGet(`${FIREBASE_USERS_PUBLIC}/${alice.uid}/gamesWonCount`);
      assert.strictEqual(count, 1);
      await deleteApp(bobApp);
    });

    it("unauthenticated client cannot write wonProofs", async () => {
      const app = createApp();
      await assertFails(
        app
          .database()
          .ref(`${FIREBASE_PUBLIC_WON_PROOF}/seed-anon`)
          .set({
            rangerName: "X",
            createdAt: Date.now(),
            gameName: "Феи",
            proof: sampleProof("seed-anon"),
            userId: "nobody",
          }),
      );
      await deleteApp(app);
    });

    it("customQuests: owner can read/write; public quests are readable by others", async () => {
      const aliceApp = createApp();
      const alice = await signUp(aliceApp, "alice");
      const aliceDb = await openDb(aliceApp);

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

      const bobApp = createApp();
      const bobDb = await openDb(bobApp);
      await signUp(bobApp, "bob");

      // load as bob:
      const pubAsBob = await assertSucceeds(bobDb.loadCustomQuest(alice.uid, "PublicQuest"));
      assert.ok(pubAsBob && pubAsBob.isPublic);

      const privAsBob = await bobDb.loadCustomQuest(alice.uid, "PrivateQuest");
      assert.ok(!privAsBob);

      await deleteApp(aliceApp);
      await deleteApp(bobApp);
    });
  });
}

describe("Firebase current client", () => {
  currentClientSuite("current");
  currentClientSuite("new");
});

describe("Firebase new client on new rules", () => {
  beforeEach(async () => {
    await loadRules("new");
    await clearEmulator();
  });

  it("setGamePassing writes a thin champions node without proofs", async () => {
    const app = createApp();
    const user = await signUp(app, "alice");
    const db = await openDb(app);
    await seedPlayerName(db, "Алиса");
    await db.setGamePassing("Пиратская линейка", sampleProof("seed-ch-1"));
    await db.setGamePassing("Шпион", sampleProof("seed-ch-2"));

    const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
    assert.strictEqual(row.name, "Алиса");
    assert.strictEqual(row.gamesWonCount, 2);
    assert.strictEqual(row.gameNames["Пиратская линейка"], true);
    assert.strictEqual(row.gameNames["Шпион"], true);
    assert.ok(typeof row.updatedAt === "number");
    assert.ok(!("proof" in row));
    assert.ok(!row.gamesWonProofs);
    await deleteApp(app);
  });

  it("setOwnHighscoresName updates the champions node name", async () => {
    const app = createApp();
    const user = await signUp(app, "alice");
    const db = await openDb(app);
    await seedPlayerName(db, "Алиса");
    await db.setGamePassing("Феи", sampleProof("seed-name"));
    await db.setOwnHighscoresName("НовыйНик");
    const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
    assert.strictEqual(row.name, "НовыйНик");
    assert.strictEqual(row.gamesWonCount, 1);
    await deleteApp(app);
  });

  it("getChampionsLeaderboard is readable without signing in", async () => {
    const app = createApp();
    const user = await signUp(app, "alice");
    const db = await openDb(app);
    await seedPlayerName(db, "Алиса");
    await db.setGamePassing("Бомба", sampleProof("seed-pub"));
    await deleteApp(app);

    const anon = createApp();
    const anonDb = await openDb(anon);
    const list = await assertSucceeds(anonDb.getChampionsLeaderboard());
    assert.ok(list && list.length >= 1);
    assert.ok(list && list.some((row) => row.userId === user.uid && row.gamesWonCount === 1));
    await deleteApp(anon);
  });

  it("rejects a champion write with an extra field or a non-server timestamp", async () => {
    const app = createApp();
    const user = await signUp(app, "alice");
    await assertFails(
      withOnline(app, () =>
        app
          .database()
          .ref(`${FIREBASE_CHAMPIONS}/${user.uid}`)
          .set({
            name: "Алиса",
            gamesWonCount: 1,
            gameNames: { Феи: true },
            updatedAt: { ".sv": "timestamp" },
            proof: { aleaSeed: "x" },
          }),
      ),
    );
    await assertFails(
      withOnline(app, () =>
        app
          .database()
          .ref(`${FIREBASE_CHAMPIONS}/${user.uid}`)
          .set({
            name: "Алиса",
            gamesWonCount: 1,
            gameNames: { Феи: true },
            updatedAt: Date.now(),
          }),
      ),
    );
    await deleteApp(app);
  });

  it("rejects writing another user's champions node", async () => {
    const aliceApp = createApp();
    const alice = await signUp(aliceApp, "alice");
    const aliceDb = await openDb(aliceApp);
    await seedPlayerName(aliceDb, "Алиса");
    await aliceDb.setGamePassing("Феи", sampleProof("seed-a"));
    await deleteApp(aliceApp);

    const bobApp = createApp();
    await signUp(bobApp, "bob");
    await assertFails(
      withOnline(bobApp, () =>
        bobApp
          .database()
          .ref(`${FIREBASE_CHAMPIONS}/${alice.uid}`)
          .set({
            name: "Хакер",
            gamesWonCount: 1,
            gameNames: { Феи: true },
            updatedAt: { ".sv": "timestamp" },
          }),
      ),
    );
    const row = await adminGet(`${FIREBASE_CHAMPIONS}/${alice.uid}`);
    assert.strictEqual(row.name, "Алиса");
    await deleteApp(bobApp);
  });

  it("pages the champions leaderboard in order without duplicates", async () => {
    const total = 120;
    const now = Date.now();
    const seed: { [uid: string]: object } = {};
    const expectedOrder: string[] = [];
    for (let n = 40; n >= 1; n--) {
      for (const suffix of ["c", "b", "a"]) {
        const uid = `uid-${String(n).padStart(2, "0")}-${suffix}`;
        const gameNames: { [name: string]: true } = {};
        for (let k = 0; k < n; k++) {
          gameNames[`g${k}`] = true;
        }
        seed[uid] = {
          name: "Ranger " + uid,
          gamesWonCount: n,
          gameNames,
          updatedAt: now,
        };
        expectedOrder.push(uid);
      }
    }
    assert.strictEqual(expectedOrder.length, total);
    await adminSet(FIREBASE_CHAMPIONS, seed);

    const anon = createApp();
    const anonDb = await openDb(anon);
    const loaded: string[] = [];
    const counts: number[] = [];
    let cursor: { gamesWonCount: number; userId: string } | null = null;
    let pages = 0;
    let hasMore = true;
    while (hasMore) {
      const page: ChampionsPage | null = await assertSucceeds(anonDb.getChampionsPage(cursor));
      assert.ok(page);
      if (!page) {
        throw new Error("missing page");
      }
      pages += 1;
      for (const row of page.rows) {
        loaded.push(row.userId);
        counts.push(row.gamesWonCount);
      }
      cursor = page.cursor;
      hasMore = page.hasMore;
      if (pages > 10) {
        throw new Error("too many pages");
      }
    }
    await deleteApp(anon);

    assert.strictEqual(pages, 3);
    assert.strictEqual(loaded.length, total);
    assert.deepStrictEqual(loaded, expectedOrder);
    assert.strictEqual(new Set(loaded).size, total);
    for (let i = 1; i < counts.length; i++) {
      assert.ok(counts[i - 1] >= counts[i], `order broken at ${i}`);
    }
  });
});
