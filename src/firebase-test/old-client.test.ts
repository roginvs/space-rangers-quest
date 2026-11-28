import * as assert from "assert";
import "mocha";
import {
  FIREBASE_PUBLIC_WON_PROOF,
  FIREBASE_USERS_PRIVATE,
  FIREBASE_USERS_PUBLIC,
} from "../ui/db/defs";
import {
  adminGet,
  assertFails,
  assertSucceeds,
  clearEmulator,
  clearLocalIdb,
  createApp,
  deleteApp,
  loadRules,
  openMasterDb,
  RulesMode,
  sampleProof,
  seedPlayerName,
  signInAs,
  signUp,
} from "./helpers";
import { checkCustomQuests, checkLocalOnlyFunctions, seedOldClientPlayer } from "./sharedCases";

/*
  DELETE AFTER DEPLOY, together with legacy/dbMaster.ts and fixtures/.
  The deployed client (master, legacy/dbMaster.ts).
  "current" — the rules that are live now: everything works.
  "new" — the rules of this PR: writes and reads of wonProofs,
  usersPrivate/<uid>/wongames, usersPublic info/name and gamesWonCount
  are denied; config, customQuests and local functions still work.
*/
function oldClientSuite(mode: RulesMode) {
  const isNew = mode === "new";

  describe(`old client (master) on ${mode} rules`, () => {
    beforeEach(async () => {
      await loadRules(mode);
      await clearEmulator();
    });

    it("anonymous: local-only functions work", async () => {
      const app = createApp();
      const db = await openMasterDb(app);
      await checkLocalOnlyFunctions(db);
      await deleteApp(app);
    });

    it("anonymous: setGamePassing keeps the win locally", async () => {
      const app = createApp();
      const db = await openMasterDb(app);
      await assertSucceeds(db.setGamePassing("Феи", sampleProof("seed-anon")));
      const local = await db.isGamePassedLocal("Феи");
      assert.ok(local && local["seed-anon"]);
      await deleteApp(app);
    });

    it("setConfigBoth writes usersPrivate config, a new device gets it on sync", async () => {
      const app1 = createApp();
      const user = await signUp(app1, "alice");
      const db1 = await openMasterDb(app1);
      await seedPlayerName(db1, "Алиса");
      await db1.setConfigBoth("noMusic", true);
      const config = await adminGet(`${FIREBASE_USERS_PRIVATE}/${user.uid}/config`);
      assert.strictEqual(config.player.Ranger, "Алиса");
      assert.strictEqual(config.noMusic, true);
      await deleteApp(app1);

      await clearLocalIdb();
      const app2 = createApp();
      await signInAs(app2, user);
      const db2 = await openMasterDb(app2);
      await assertSucceeds(db2.syncWithFirebase());
      const player = await db2.getConfigLocal("player");
      assert.strictEqual(player && player.Ranger, "Алиса");
      assert.strictEqual(await db2.getConfigLocal("noMusic"), true);
      await deleteApp(app2);
    });

    it(
      isNew
        ? "setOwnHighscoresName does not write usersPublic info/name (expected)"
        : "setOwnHighscoresName writes usersPublic info/name",
      async () => {
        const app = createApp();
        const user = await signUp(app, "alice");
        const db = await openMasterDb(app);
        // setFirebase swallows permission errors, so the call itself resolves
        await assertSucceeds(db.setOwnHighscoresName("НовоеИмя"));
        const info = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/info`);
        if (isNew) {
          assert.strictEqual(info, null);
        } else {
          assert.strictEqual(info.name, "НовоеИмя");
        }
        await deleteApp(app);
      },
    );

    it(
      isNew
        ? "setGamePassing: saved locally, then fails on wonProofs (expected)"
        : "setGamePassing writes the proof to wongames, wonProofs and usersPublic",
      async () => {
        const app = createApp();
        const user = await signUp(app, "alice");
        const db = await openMasterDb(app);
        await seedPlayerName(db, "Алиса");
        const result = db.setGamePassing("Пиратская линейка", sampleProof("seed-1"));
        if (isNew) {
          await assertFails(result);
        } else {
          await assertSucceeds(result);
        }
        const local = await db.isGamePassedLocal("Пиратская линейка");
        assert.ok(local && local["seed-1"], "the win is always kept locally");

        const wongames = await adminGet(
          `${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames/Пиратская линейка/seed-1`,
        );
        const flat = await adminGet(`${FIREBASE_PUBLIC_WON_PROOF}/seed-1`);
        const pub = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}`);
        if (isNew) {
          assert.strictEqual(wongames, null);
          assert.strictEqual(flat, null);
          assert.strictEqual(pub, null);
        } else {
          assert.strictEqual(wongames.aleaSeed, "seed-1");
          assert.strictEqual(flat.userId, user.uid);
          assert.strictEqual(flat.gameName, "Пиратская линейка");
          assert.strictEqual(pub.gamesWonCount, 1);
          assert.ok(typeof pub.gamesWonProofs["Пиратская линейка"]["seed-1"].created === "number");
        }
        await deleteApp(app);
      },
    );

    if (!isNew) {
      it("repeated win of the same quest: two proofs, count stays 1", async () => {
        const app = createApp();
        const user = await signUp(app, "alice");
        const db = await openMasterDb(app);
        await seedPlayerName(db, "Алиса");
        await assertSucceeds(db.setGamePassing("Шпион", sampleProof("seed-a")));
        await assertSucceeds(db.setGamePassing("Шпион", sampleProof("seed-b")));
        const pub = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}`);
        assert.strictEqual(pub.gamesWonCount, 1);
        assert.deepStrictEqual(Object.keys(pub.gamesWonProofs["Шпион"]).sort(), [
          "seed-a",
          "seed-b",
        ]);
        await deleteApp(app);
      });
    }

    it(
      isNew
        ? "syncWithFirebase on a new device: finishes, config comes, wins do not (expected)"
        : "syncWithFirebase on a new device pulls config and wins",
      async () => {
        const app0 = createApp();
        const user = await signUp(app0, "old");
        await deleteApp(app0);
        await seedOldClientPlayer(user.uid, [{ gameName: "Гладиатор", seed: "seed-g" }]);

        await clearLocalIdb();
        const app = createApp();
        await signInAs(app, user);
        const db = await openMasterDb(app);
        await assertSucceeds(db.syncWithFirebase());
        const player = await db.getConfigLocal("player");
        assert.strictEqual(player && player.Ranger, "Старожил");
        const local = await db.isGamePassedLocal("Гладиатор");
        const pub = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}`);
        if (isNew) {
          assert.strictEqual(local, false);
          // The old client cannot read wongames or write gamesWonCount /
          // info/name anymore. Seeded public data is left untouched.
          assert.strictEqual(pub.gamesWonCount, 1);
          assert.strictEqual(pub.info.name, "Старожил");
          assert.ok(pub.gamesWonProofs["Гладиатор"]["seed-g"], "proofs are not lost");
        } else {
          assert.ok(local && local["seed-g"]);
          assert.strictEqual(pub.gamesWonCount, 1);
        }
        await deleteApp(app);
      },
    );

    it(
      isNew
        ? "syncWithFirebase after an offline win: nothing is pushed (expected)"
        : "syncWithFirebase after an offline win pushes it everywhere",
      async () => {
        const app = createApp();
        const db = await openMasterDb(app);
        await db.setGamePassing("Бомба", sampleProof("seed-offline"));
        const user = await signUp(app, "alice");
        // wait for getDb to see the user
        for (let i = 0; i < 200 && !db.getMyUserId(); i++) {
          await new Promise((r) => setTimeout(r, 25));
        }
        await assertSucceeds(db.syncWithFirebase());
        const wongames = await adminGet(`${FIREBASE_USERS_PRIVATE}/${user.uid}/wongames`);
        const flat = await adminGet(`${FIREBASE_PUBLIC_WON_PROOF}/seed-offline`);
        const proofs = await adminGet(`${FIREBASE_USERS_PUBLIC}/${user.uid}/gamesWonProofs`);
        if (isNew) {
          assert.strictEqual(wongames, null);
          assert.strictEqual(flat, null);
          assert.strictEqual(proofs, null);
        } else {
          assert.ok(wongames["Бомба"]["seed-offline"]);
          assert.strictEqual(flat.userId, user.uid);
          assert.ok(proofs["Бомба"]["seed-offline"]);
        }
        await deleteApp(app);
      },
    );

    it(
      isNew
        ? "getRemotePassings(uid) is denied (expected)"
        : "getRemotePassings(uid) returns only that player's rows",
      async () => {
        await seedOldClientPlayer("uid-alice", [{ gameName: "Шпион", seed: "seed-alice" }]);
        await seedOldClientPlayer("uid-bob", [{ gameName: "Бомба", seed: "seed-bob" }]);
        const app = createApp();
        await signUp(app, "carol");
        const db = await openMasterDb(app);
        if (isNew) {
          await assertFails(db.getRemotePassings("uid-alice"));
        } else {
          const rows = await assertSucceeds(db.getRemotePassings("uid-alice"));
          assert.ok(rows && rows["seed-alice"] && !rows["seed-bob"]);
        }
        await deleteApp(app);
      },
    );

    it(
      isNew
        ? "getRemotePassings() of the whole table is denied (expected)"
        : "getRemotePassings() reads the whole wonProofs table",
      async () => {
        await seedOldClientPlayer("uid-alice", [{ gameName: "Шпион", seed: "seed-alice" }]);
        const app = createApp();
        const db = await openMasterDb(app);
        if (isNew) {
          await assertFails(db.getRemotePassings());
        } else {
          const rows = await assertSucceeds(db.getRemotePassings());
          assert.ok(rows && rows["seed-alice"]);
        }
        await deleteApp(app);
      },
    );

    it(
      isNew
        ? "getFirebasePublicHighscores returns null: the list is closed (expected, not used by the UI)"
        : "getFirebasePublicHighscores lists usersPublic",
      async () => {
        await seedOldClientPlayer("uid-alice", [{ gameName: "Шпион", seed: "seed-alice" }]);
        const app = createApp();
        const db = await openMasterDb(app);
        const list = await db.getFirebasePublicHighscores();
        if (isNew) {
          assert.strictEqual(list, null);
        } else {
          assert.ok(list && list.length === 1 && list[0].gamesWonCount === 1);
        }
        await deleteApp(app);
      },
    );

    it("customQuests: owner read/write, public quest readable by others", async () => {
      await checkCustomQuests(openMasterDb);
    });
  });
}

describe("Firebase: old client (master)", () => {
  oldClientSuite("current");
  oldClientSuite("new");
});
