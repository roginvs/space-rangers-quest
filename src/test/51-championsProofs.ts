import * as assert from "assert";
import "mocha";
import {
  buildChampionPayload,
  championGames,
  championSeeds,
  gameNamesList,
  proofForLocal,
  proofsMissingIn,
  proofTime,
  verifyChampionGame,
  withTimeout,
} from "../ui/db/utils";
import { observable } from "mobx";

function proof(seed: string, finishedAt: number) {
  return { aleaSeed: seed, performedJumps: [{ dateUnix: finishedAt, jumpId: 1 }] };
}

describe("Champions: win proofs helpers", () => {
  it("proofTime uses the last jump, then created", () => {
    assert.strictEqual(proofTime({ ...proof("a", 5), created: 100 }), 5);
    assert.strictEqual(proofTime({ aleaSeed: "a", performedJumps: [], created: 100 }), 100);
    assert.strictEqual(proofTime({ aleaSeed: "a", performedJumps: [] }), 0);
  });

  it("proofsMissingIn finds proofs to push or to pull", () => {
    const local = { Феи: { a: proof("a", 1), b: proof("b", 2) }, Бомба: { c: proof("c", 3) } };
    const remote = { Феи: { a: { ...proof("a", 1), created: 10 } } };
    assert.deepStrictEqual(
      proofsMissingIn(local, remote).map((x) => `${x.gameName}/${x.seed}`),
      ["Феи/b", "Бомба/c"],
    );
    assert.deepStrictEqual(proofsMissingIn(remote, local), []);
    assert.deepStrictEqual(proofsMissingIn({ Феи: { a: null } }, {}), []);
  });

  it("proofForLocal drops the server field", () => {
    assert.deepStrictEqual(proofForLocal({ ...proof("a", 1), created: 10 }), proof("a", 1));
  });

  it("championGames skips empty quests and keeps the last seed", () => {
    const proofs = {
      Феи: { old: proof("old", 1), last: proof("last", 9), mid: proof("mid", 5) },
      Пусто: {},
      Бомба: { only: proof("only", 2) },
    };
    assert.deepStrictEqual(championGames(proofs), { Феи: ["last"], Бомба: ["only"] });
    assert.deepStrictEqual(championGames(proofs, 2).Феи, ["mid", "last"]);
  });

  it("buildChampionPayload keeps the count equal to the number of quests", () => {
    const payload = buildChampionPayload("Имя", { Феи: ["a"], Бомба: ["b", "c"] }, 7);
    assert.deepStrictEqual(payload, {
      name: "Имя",
      gamesWonCount: 2,
      games: { Феи: ["a"], Бомба: ["b", "c"] },
      updatedAt: 7,
    });
    assert.deepStrictEqual(gameNamesList(payload), ["Бомба", "Феи"]);
  });

  it("championSeeds reads arrays and array-like objects, ignores junk", () => {
    assert.deepStrictEqual(championSeeds({ games: { Феи: ["a", "b"] } }, "Феи"), ["a", "b"]);
    assert.deepStrictEqual(
      championSeeds({ games: { Феи: { "1": "b", "0": "a", "10": "c" } } }, "Феи"),
      ["a", "b", "c"],
    );
    assert.deepStrictEqual(championSeeds({ games: { Феи: [1, "", "x"] } }, "Феи"), ["x"]);
    assert.deepStrictEqual(championSeeds({ games: { Феи: "a" } }, "Феи"), []);
    assert.deepStrictEqual(championSeeds({ games: {} }, "Феи"), []);
    // The champions table keeps rows in a MobX observable
    const row = observable({ games: { Феи: ["a", "b"] } });
    assert.deepStrictEqual(championSeeds(row, "Феи"), ["a", "b"]);
    assert.deepStrictEqual(championSeeds({}, "Феи"), []);
  });

  it("verifyChampionGame goes from the last seed back and stops at the first valid one", async () => {
    const fetched: string[] = [];
    const res = await verifyChampionGame(
      ["s1", "s2", "s3", "s4"],
      async (seed) => {
        fetched.push(seed);
        if (seed === "s3") {
          throw new Error("network");
        }
        return seed === "s4" || seed === "s2" || seed === "s1" ? proof(seed, 1) : null;
      },
      async (seed) => (seed === "s2" ? "validated" : "failed"),
    );
    assert.deepStrictEqual(res, { result: "validated", seed: "s2" });
    assert.deepStrictEqual(fetched, ["s4", "s3", "s2"]);

    const none = await verifyChampionGame(
      [],
      async () => null,
      async () => "validated",
    );
    assert.deepStrictEqual(none, { result: "failed", seed: null });
  });
});

describe("Champions: withTimeout", () => {
  it("passes the value and the error through", async () => {
    assert.strictEqual(await withTimeout(Promise.resolve(5), 1000), 5);
    await assert.rejects(withTimeout(Promise.reject(new Error("boom")), 1000), /boom/);
  });

  it("rejects when the promise never settles (dead network)", async () => {
    const started = Date.now();
    // tslint:disable-next-line:promise-must-complete
    const hanging = new Promise<void>(() => undefined);
    await assert.rejects(withTimeout(hanging, 30), /Timed out/);
    assert.ok(Date.now() - started < 1000);
  });
});
