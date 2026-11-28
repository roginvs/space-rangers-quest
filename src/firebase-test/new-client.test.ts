import * as assert from "assert";
import "mocha";
import {
  FIREBASE_CHAMPIONS,
  FIREBASE_PUBLIC_WON_PROOF,
  FIREBASE_USERS_PRIVATE,
  FIREBASE_USERS_PUBLIC,
} from "../ui/db/defs";
import { ChampionsPage } from "../ui/db/championsPage";
import { championSeeds } from "../ui/db/champions";
import { verifyChampionGame } from "../ui/championsVerify";
import {
  adminGet,
  adminSet,
  assertFails,
  assertSucceeds,
  clearEmulator,
  clearLocalIdb,
  createApp,
  deleteApp,
  loadRules,
  openDb,
  rawGet,
  rawSet,
  sampleProof,
  seedPlayerName,
  signInAs,
  signUp,
  useNewDeviceStorage,
  withOnline,
} from "./helpers";
import { checkCustomQuests, checkLocalOnlyFunctions, seedOldClientPlayer } from "./sharedCases";

const SV_NOW = { ".sv": "timestamp" };

describe("Firebase: new client on new rules", () => {
  beforeEach(async () => {
    await loadRules("new");
    await clearEmulator();
  });

  describe("db.ts functions", () => {
    it("anonymous: local-only functions work", async () => {
      const app = createApp();
      const db = await openDb(app);
      await checkLocalOnlyFunctions(db);
      await deleteApp(app);
    });

    it("anonymous: setGamePassing keeps the win locally and writes nothing remote", async () => {
      const app = createApp();
      const db = await openDb(app);
      await assertSucceeds(db.setGamePassing("Феи", sampleProof("seed-anon")));
      const local = await db.isGamePassedLocal("Феи");
      assert.ok(local && local["seed-anon"]);
      assert.strictEqual(await adminGet(""), null);
      await deleteApp(app);
    });

    it("setGamePassing writes usersPublic proof and champions, not wongames or wonProofs", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await assertSucceeds(db.setGamePassing("Пиратская линейка", sampleProof("seed-1")));

      const pub = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}`);
      assert.deepStrictEqual(
        Object.keys(pub),
        ["gamesWonProofs"],
        "no info/name, no gamesWonCount",
      );
      const proof = pub.gamesWonProofs["Пиратская линейка"]["seed-1"];
      assert.strictEqual(proof.aleaSeed, "seed-1");
      assert.strictEqual(proof.performedJumps.length, 2);
      assert.ok(typeof proof.created === "number");

      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.deepStrictEqual(
        { ...row, updatedAt: typeof row.updatedAt },
        {
          name: "Алиса",
          gamesWonCount: 1,
          games: { "Пиратская линейка": ["seed-1"] },
          updatedAt: "number",
        },
      );

      assert.strictEqual(await adminGet(`${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames`), null);
      assert.strictEqual(await adminGet(FIREBASE_PUBLIC_WON_PROOF), null);
      await deleteApp(app);
    });

    it("repeated win of a quest keeps both proofs; champions gets the last seed", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await db.setGamePassing("Шпион", sampleProof("seed-late", 1_700_000_900_000));
      await db.setGamePassing("Шпион", sampleProof("seed-early", 1_700_000_100_000));
      await db.setGamePassing("Шпион", sampleProof("seed-last", 1_700_000_999_000));
      await db.setGamePassing("Бомба", sampleProof("seed-bomb"));

      const proofs = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs`);
      assert.deepStrictEqual(Object.keys(proofs["Шпион"]).sort(), [
        "seed-early",
        "seed-last",
        "seed-late",
      ]);
      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.strictEqual(row.gamesWonCount, 2);
      assert.deepStrictEqual(row.games, { Шпион: ["seed-last"], Бомба: ["seed-bomb"] });
      await deleteApp(app);
    });

    it("the same seed twice: the stored proof is not overwritten, nothing breaks", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await db.setGamePassing("Феи", sampleProof("seed-same"));
      const first = await adminGet(
        `${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs/Феи/seed-same`,
      );
      await assertSucceeds(db.setGamePassing("Феи", sampleProof("seed-same")));
      const second = await adminGet(
        `${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs/Феи/seed-same`,
      );
      assert.deepStrictEqual(second, first);
      await deleteApp(app);
    });

    it("new device: syncWithFirebase pulls wins from usersPublic and config from usersPrivate", async () => {
      const app1 = createApp();
      const user = await signUp(app1, "alice");
      const db1 = await openDb(app1);
      await seedPlayerName(db1, "Алиса");
      await db1.setGamePassing("Гладиатор", sampleProof("seed-g"));
      await db1.setGamePassing("Хищник", sampleProof("seed-h"));
      await deleteApp(app1);

      await clearLocalIdb();
      const app2 = createApp();
      await signInAs(app2, user);
      const db2 = await openDb(app2);
      assert.strictEqual(await db2.isGamePassedLocal("Гладиатор"), false);
      await assertSucceeds(db2.syncWithFirebase());
      const g = await db2.isGamePassedLocal("Гладиатор");
      assert.deepStrictEqual(g, { "seed-g": sampleProof("seed-g") }, "no 'created' locally");
      assert.ok(await db2.isGamePassedLocal("Хищник"));
      const player = await db2.getConfigLocal("player");
      assert.strictEqual(player && player.Ranger, "Алиса");
      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.strictEqual(row.gamesWonCount, 2);
      await deleteApp(app2);
    });

    it("player of the old site: sync takes wins from usersPublic, legacy data stays untouched", async () => {
      const app0 = createApp();
      const user = await signUp(app0, "old");
      await deleteApp(app0);
      await seedOldClientPlayer(user.uid, [
        { gameName: "Гладиатор", seed: "seed-g1", finishedAt: 1_700_000_000_100 },
        { gameName: "Гладиатор", seed: "seed-g2", finishedAt: 1_700_000_500_000 },
        { gameName: "Бомба", seed: "seed-b" },
      ]);
      // The old site on the new rules may have reset the count to 0
      await adminSet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonCount`, 0);
      const legacyPrivate = await adminGet(`${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames`);
      const legacyFlat = await adminGet(FIREBASE_PUBLIC_WON_PROOF);

      await clearLocalIdb();
      const app = createApp();
      await signInAs(app, user);
      const db = await openDb(app);
      await assertSucceeds(db.syncWithFirebase());

      const local = await db.isGamePassedLocal("Гладиатор");
      assert.ok(local && local["seed-g1"] && local["seed-g2"]);
      assert.ok(await db.isGamePassedLocal("Бомба"));
      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.strictEqual(row.name, "Старожил");
      assert.strictEqual(row.gamesWonCount, 2);
      assert.deepStrictEqual(row.games, { Гладиатор: ["seed-g2"], Бомба: ["seed-b"] });
      assert.deepStrictEqual(
        await adminGet(`${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames`),
        legacyPrivate,
      );
      assert.deepStrictEqual(await adminGet(FIREBASE_PUBLIC_WON_PROOF), legacyFlat);
      await deleteApp(app);
    });

    it("win before signing in is pushed to usersPublic and champions on sync", async () => {
      const app = createApp();
      const db = await openDb(app);
      await db.setGamePassing("Бомба", sampleProof("seed-offline"));
      const user = await signUp(app, "alice");
      for (let i = 0; i < 200 && !db.getMyUserId(); i++) {
        await new Promise((r) => setTimeout(r, 25));
      }
      await assertSucceeds(db.syncWithFirebase());
      const proof = await adminGet(
        `${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs/Бомба/seed-offline`,
      );
      assert.ok(proof && typeof proof.created === "number");
      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.deepStrictEqual(row.games, { Бомба: ["seed-offline"] });
      await deleteApp(app);
    });

    it("two devices open at once: the champions row keeps wins of both", async () => {
      useNewDeviceStorage();
      const appA = createApp();
      const user = await signUp(appA, "alice");
      const dbA = await openDb(appA);
      await seedPlayerName(dbA, "Алиса");
      await dbA.setGamePassing("Феи", sampleProof("seed-a1"));

      useNewDeviceStorage();
      const appB = createApp();
      await signInAs(appB, user);
      const dbB = await openDb(appB);
      await assertSucceeds(dbB.syncWithFirebase());
      assert.ok(await dbB.isGamePassedLocal("Феи"));
      await dbB.setGamePassing("Деньги", sampleProof("seed-b1"));
      assert.strictEqual((await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`)).gamesWonCount, 2);

      // A did not sync since B's win, its local has no "Деньги"
      assert.strictEqual(await dbA.isGamePassedLocal("Деньги"), false);
      await dbA.setGamePassing("Бомба", sampleProof("seed-a2"));
      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.strictEqual(row.gamesWonCount, 3);
      assert.deepStrictEqual(row.games, {
        Феи: ["seed-a1"],
        Деньги: ["seed-b1"],
        Бомба: ["seed-a2"],
      });

      await dbA.syncWithFirebase();
      await dbB.syncWithFirebase();
      for (const db of [dbA, dbB]) {
        for (const game of ["Феи", "Деньги", "Бомба"]) {
          assert.ok(await db.isGamePassedLocal(game), game);
        }
      }
      const proofs = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs`);
      assert.deepStrictEqual(Object.keys(proofs).sort(), ["Бомба", "Деньги", "Феи"]);
      assert.strictEqual((await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`)).gamesWonCount, 3);
      await deleteApp(appA);
      await deleteApp(appB);
    });

    it("empty data: sync without wins writes no champions row", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await assertSucceeds(db.syncWithFirebase());
      assert.strictEqual(await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`), null);
      assert.strictEqual(await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}`), null);
      const page = await db.getChampionsPage(null);
      assert.ok(page);
      assert.deepStrictEqual(page && page.rows, []);
      assert.strictEqual(page && page.hasMore, false);
      await deleteApp(app);
    });

    it("setOwnHighscoresName writes only champions name; without a row writes nothing", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await assertSucceeds(db.setOwnHighscoresName("Без побед"));
      assert.strictEqual(await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`), null);

      await db.setGamePassing("Феи", sampleProof("seed-name"));
      const before = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      await new Promise((r) => setTimeout(r, 5));
      await assertSucceeds(db.setOwnHighscoresName("НовыйНик"));
      const row = await adminGet(`${FIREBASE_CHAMPIONS}/${user.uid}`);
      assert.strictEqual(row.name, "НовыйНик");
      assert.deepStrictEqual(row.games, { Феи: ["seed-name"] });
      assert.strictEqual(row.gamesWonCount, 1);
      assert.ok(row.updatedAt > before.updatedAt);
      assert.strictEqual(await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/info`), null);
      await deleteApp(app);
    });

    it("setConfigBoth writes usersPrivate config", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await db.setConfigBoth("noMusic", true);
      assert.strictEqual(
        await adminGet(`${FIREBASE_USERS_PRIVATE}/${user.uid}/config/noMusic`),
        true,
      );
      assert.strictEqual(await db.getConfigLocal("noMusic"), true);
      await deleteApp(app);
    });

    it("getChampionProof reads one proof by its exact path, anonymously and as another user", async () => {
      const aliceApp = createApp();
      const alice = await signUp(aliceApp, "alice");
      const aliceDb = await openDb(aliceApp);
      await aliceDb.setGamePassing("Феи", sampleProof("seed-a"));
      await deleteApp(aliceApp);

      const anonApp = createApp();
      const anonDb = await openDb(anonApp);
      const proof = await anonDb.getChampionProof(alice.uid, "Феи", "seed-a");
      assert.ok(proof && proof.aleaSeed === "seed-a" && proof.performedJumps.length === 2);
      assert.strictEqual(await anonDb.getChampionProof(alice.uid, "Феи", "no-such-seed"), null);

      const bobApp = createApp();
      await signUp(bobApp, "bob");
      const bobDb = await openDb(bobApp);
      assert.ok(await bobDb.getChampionProof(alice.uid, "Феи", "seed-a"));
      await deleteApp(anonApp);
      await deleteApp(bobApp);
    });

    it("getChampionsPage is readable anonymously", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const db = await openDb(app);
      await seedPlayerName(db, "Алиса");
      await db.setGamePassing("Бомба", sampleProof("seed-pub"));
      await deleteApp(app);

      const anon = createApp();
      const anonDb = await openDb(anon);
      const page = await assertSucceeds(anonDb.getChampionsPage(null));
      assert.ok(page && page.rows.length === 1 && page.rows[0].userId === user.uid);
      assert.deepStrictEqual(page && page.rows[0].games, { Бомба: ["seed-pub"] });
      await deleteApp(anon);
    });

    it("old helpers are closed: getRemotePassings denied, getFirebasePublicHighscores null", async () => {
      const app = createApp();
      await signUp(app, "alice");
      const db = await openDb(app);
      await assertFails(db.getRemotePassings());
      await assertFails(db.getRemotePassings(db.getMyUserId() || ""));
      assert.strictEqual(await db.getFirebasePublicHighscores(), null);
      await deleteApp(app);
    });

    it("customQuests: owner read/write, public quest readable by others", async () => {
      await checkCustomQuests(openDb);
    });
  });

  describe("rules", () => {
    it("usersPublic: owner reads own node; nobody reads someone else's node or the list", async () => {
      await seedOldClientPlayer("uid-alice", [{ gameName: "Феи", seed: "seed-a" }]);
      const aliceProof = `${FIREBASE_USERS_PUBLIC}/uid-alice/gamesWonProofs/Феи/seed-a`;

      const bobApp = createApp();
      const bob = await signUp(bobApp, "bob");
      await rawSet(bobApp, `${FIREBASE_USERS_PUBLIC}/${bob.uid}/info/name`, "Боб");
      assert.ok(await assertSucceeds(rawGet(bobApp, `${FIREBASE_USERS_PUBLIC}/${bob.uid}`)));
      await assertFails(rawGet(bobApp, `${FIREBASE_USERS_PUBLIC}/uid-alice`));
      await assertFails(rawGet(bobApp, `${FIREBASE_USERS_PUBLIC}/uid-alice/info`));
      await assertFails(rawGet(bobApp, `${FIREBASE_USERS_PUBLIC}/uid-alice/gamesWonProofs`));
      await assertFails(rawGet(bobApp, `${FIREBASE_USERS_PUBLIC}/uid-alice/gamesWonProofs/Феи`));
      await assertFails(rawGet(bobApp, FIREBASE_USERS_PUBLIC));
      await assertFails(
        withOnline(bobApp, () =>
          bobApp
            .database()
            .ref(FIREBASE_USERS_PUBLIC)
            .orderByChild("gamesWonCount")
            .limitToLast(100)
            .once("value"),
        ),
      );
      assert.ok(await assertSucceeds(rawGet(bobApp, aliceProof)));

      const anonApp = createApp();
      await assertFails(rawGet(anonApp, `${FIREBASE_USERS_PUBLIC}/uid-alice`));
      await assertFails(rawGet(anonApp, FIREBASE_USERS_PUBLIC));
      assert.ok(await assertSucceeds(rawGet(anonApp, aliceProof)));
      await deleteApp(bobApp);
      await deleteApp(anonApp);
    });

    it("usersPublic proofs: write once, server time only, own node only", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const base = `${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs/Феи`;
      await assertSucceeds(rawSet(app, `${base}/s1`, { ...sampleProof("s1"), created: SV_NOW }));
      await assertFails(rawSet(app, `${base}/s1`, { ...sampleProof("s1"), created: SV_NOW }));
      await assertFails(rawSet(app, `${base}/s2`, { ...sampleProof("s2"), created: Date.now() }));
      await assertFails(rawSet(app, `${base}/s3`, sampleProof("s3")));
      await assertFails(
        rawSet(app, `${FIREBASE_USERS_PUBLIC}/uid-other/gamesWonProofs/Феи/s4`, {
          ...sampleProof("s4"),
          created: SV_NOW,
        }),
      );
      await assertFails(rawSet(app, `${FIREBASE_USERS_PUBLIC}/uid-other/gamesWonCount`, 99));
      await deleteApp(app);
    });

    it("legacy wonProofs and usersPrivate/<uid>/wongames are closed even for the owner", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      await seedOldClientPlayer(user.uid, [{ gameName: "Феи", seed: "seed-a" }]);
      const wongames = `${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames`;
      await assertFails(rawGet(app, wongames));
      await assertFails(rawGet(app, `${wongames}/Феи/seed-a`));
      await assertFails(rawSet(app, `${wongames}/Феи/seed-new`, sampleProof("seed-new")));
      await assertFails(rawGet(app, FIREBASE_PUBLIC_WON_PROOF));
      await assertFails(rawGet(app, `${FIREBASE_PUBLIC_WON_PROOF}/seed-a`));
      await assertFails(
        withOnline(app, () =>
          app
            .database()
            .ref(FIREBASE_PUBLIC_WON_PROOF)
            .orderByChild("userId")
            .equalTo(user.uid)
            .once("value"),
        ),
      );
      await assertFails(
        rawSet(app, `${FIREBASE_PUBLIC_WON_PROOF}/seed-new`, {
          rangerName: "Алиса",
          createdAt: SV_NOW,
          gameName: "Феи",
          proof: sampleProof("seed-new"),
          userId: user.uid,
        }),
      );
      assert.ok(await adminGet(`${wongames}/Феи/seed-a`), "legacy data stays in the database");
      await deleteApp(app);
    });

    it("usersPrivate config: owner read/write, other users and anonymous denied", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const cfg = `${FIREBASE_USERS_PRIVATE}/${user.uid}/config/noMusic`;
      await assertSucceeds(rawSet(app, cfg, true));
      assert.strictEqual(await assertSucceeds(rawGet(app, cfg)), true);

      const bobApp = createApp();
      await signUp(bobApp, "bob");
      await assertFails(rawGet(bobApp, cfg));
      await assertFails(rawSet(bobApp, cfg, false));
      await assertFails(rawGet(bobApp, `${FIREBASE_USERS_PRIVATE}/${user.uid}`));
      const anonApp = createApp();
      await assertFails(rawGet(anonApp, cfg));
      await assertFails(rawGet(anonApp, FIREBASE_USERS_PRIVATE));
      await deleteApp(app);
      await deleteApp(bobApp);
      await deleteApp(anonApp);
    });

    it("champions: games is an array of seed strings; everything else is rejected", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const path = `${FIREBASE_CHAMPIONS}/${user.uid}`;
      const valid = {
        name: "Алиса",
        gamesWonCount: 2,
        games: { Феи: ["s1"], Бомба: ["s2", "s3"] },
        updatedAt: SV_NOW,
      };
      await assertSucceeds(rawSet(app, path, valid));
      const stored = await adminGet(path);
      assert.deepStrictEqual(stored.games, { Феи: ["s1"], Бомба: ["s2", "s3"] });

      const bad: [string, any][] = [
        ["extra field", { ...valid, proof: { aleaSeed: "x" } }],
        ["client timestamp", { ...valid, updatedAt: Date.now() }],
        ["old gameNames format", { ...valid, games: undefined, gameNames: { Феи: true } }],
        ["seed is a number", { ...valid, games: { Феи: [1] } }],
        ["seed is an object", { ...valid, games: { Феи: [{ aleaSeed: "s1" }] } }],
        ["games entry is a string", { ...valid, games: { Феи: "s1" } }],
        ["negative count", { ...valid, gamesWonCount: -1 }],
        ["name is not a string", { ...valid, name: 5 }],
        ["no games", { name: "Алиса", gamesWonCount: 0, updatedAt: SV_NOW }],
      ];
      for (const [label, value] of bad) {
        const clean = JSON.parse(JSON.stringify(value));
        await assertFails(rawSet(app, path, clean)).catch((e) => {
          throw new Error(`${label}: ${e}`);
        });
      }

      const bobApp = createApp();
      await signUp(bobApp, "bob");
      await assertFails(rawSet(bobApp, path, { ...valid, name: "Хакер" }));
      const anonApp = createApp();
      await assertFails(rawSet(anonApp, path, { ...valid, name: "Аноним" }));
      assert.strictEqual((await adminGet(path)).name, "Алиса");
      await deleteApp(app);
      await deleteApp(bobApp);
      await deleteApp(anonApp);
    });
  });

  describe("Verify", () => {
    it("tries seeds from the end: missing and invalid proofs fall back to an earlier seed", async () => {
      const app = createApp();
      const user = await signUp(app, "alice");
      const base = `${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs/Феи`;
      await rawSet(app, `${base}/s-good`, { ...sampleProof("s-good"), created: SV_NOW });
      await rawSet(app, `${base}/s-bad`, {
        aleaSeed: "s-bad",
        performedJumps: [{ dateUnix: 1, jumpId: 999 }],
        created: SV_NOW,
      });
      await rawSet(app, `${FIREBASE_CHAMPIONS}/${user.uid}`, {
        name: "Алиса",
        gamesWonCount: 2,
        games: { Феи: ["s-older", "s-good", "s-missing", "s-bad"], Бомба: ["s-gone"] },
        updatedAt: SV_NOW,
      });
      await deleteApp(app);

      const anonApp = createApp();
      const db = await openDb(anonApp);
      const page = await db.getChampionsPage(null);
      const champion = page && page.rows[0];
      assert.ok(champion);
      if (!champion) {
        return;
      }
      const checked: string[] = [];
      const check = async (seed: string, proof: any) => {
        checked.push(seed);
        // stands for the worker: a log with jump 999 does not win the quest
        return proof.performedJumps.some((j: any) => j.jumpId === 999) ? "failed" : "validated";
      };
      const fetchFor = (gameName: string) => (seed: string) =>
        db.getChampionProof(champion.userId, gameName, seed);

      const fei = await verifyChampionGame(championSeeds(champion, "Феи"), fetchFor("Феи"), check);
      assert.deepStrictEqual(fei, {
        result: "validated",
        seed: "s-good",
      });
      assert.deepStrictEqual(checked, ["s-bad", "s-good"]);

      const bomb = await verifyChampionGame(
        championSeeds(champion, "Бомба"),
        fetchFor("Бомба"),
        check,
      );
      assert.deepStrictEqual(bomb, { result: "failed", seed: null });
      await deleteApp(anonApp);
    });
  });

  describe("champions paging", () => {
    it("120 rows: 3 pages in order, no duplicates", async () => {
      const total = 120;
      const now = Date.now();
      const rows: { [uid: string]: object } = {};
      const expectedOrder: string[] = [];
      for (let n = 40; n >= 1; n--) {
        for (const suffix of ["c", "b", "a"]) {
          const uid = `uid-${String(n).padStart(2, "0")}-${suffix}`;
          const games: { [name: string]: string[] } = {};
          for (let k = 0; k < n; k++) {
            games[`g${k}`] = [`seed-${uid}-${k}`];
          }
          rows[uid] = { name: `Ranger ${uid}`, gamesWonCount: n, games, updatedAt: now };
          expectedOrder.push(uid);
        }
      }
      assert.strictEqual(expectedOrder.length, total);
      await adminSet(FIREBASE_CHAMPIONS, rows);

      const anon = createApp();
      const anonDb = await openDb(anon);
      const loaded: string[] = [];
      let cursor: { gamesWonCount: number; userId: string } | null = null;
      let pages = 0;
      let hasMore = true;
      while (hasMore) {
        const page: ChampionsPage | null = await assertSucceeds(anonDb.getChampionsPage(cursor));
        if (!page) {
          throw new Error("missing page");
        }
        pages += 1;
        loaded.push(...page.rows.map((row) => row.userId));
        cursor = page.cursor;
        hasMore = page.hasMore;
        if (pages > 10) {
          throw new Error("too many pages");
        }
      }
      await deleteApp(anon);
      assert.strictEqual(pages, 3);
      assert.deepStrictEqual(loaded, expectedOrder);
      assert.strictEqual(new Set(loaded).size, total);
    });
  });
});
