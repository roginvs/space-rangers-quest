/**
 * Pure helpers (no Firebase, no IndexedDB) for the champions table and the
 * win proofs sync. The UI imports database mechanics only from db.ts and
 * these helpers from here.
 */
import { GameLog } from "../../lib/qmplayer/funcs";
import { ChampionRecord } from "./defs";

/** Rejects when the promise does not settle in `ms` (same race as getFirebase/setFirebase) */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/* ============ Win proofs ============ */

/**
 * Win proofs of one player: quest name -> seed -> proof.
 * Local IndexedDB "wongames" keeps plain GameLog values,
 * usersPublic/<uid>/gamesWonProofs adds the server "created" timestamp.
 */
export interface ProofsByGame {
  [gameName: string]: { [seed: string]: (GameLog & { created?: number }) | null | undefined };
}

export interface ProofToPush {
  gameName: string;
  seed: string;
  proof: GameLog;
}

function hasProofs(proofs: ProofsByGame[string] | null | undefined) {
  return !!proofs && Object.keys(proofs).some((seed) => !!proofs[seed]);
}

/** Proofs present in "from" and absent in "to" */
export function proofsMissingIn(from: ProofsByGame, to: ProofsByGame): ProofToPush[] {
  const result: ProofToPush[] = [];
  for (const gameName of Object.keys(from)) {
    const fromGame = from[gameName];
    if (!fromGame) {
      continue;
    }
    const toGame = to[gameName] || {};
    for (const seed of Object.keys(fromGame)) {
      const proof = fromGame[seed];
      if (proof && !toGame[seed]) {
        result.push({ gameName, seed, proof });
      }
    }
  }
  return result;
}

/** Remote proof without the server field, as it is kept locally */
export function proofForLocal(proof: GameLog & { created?: number }): GameLog {
  const { created, ...gameLog } = proof;
  return gameLog;
}

/** Time of the win: the last jump, or the server "created" if there are no jumps */
export function proofTime(proof: GameLog & { created?: number }): number {
  const jumps = proof.performedJumps || [];
  if (jumps.length > 0) {
    return jumps[jumps.length - 1].dateUnix;
  }
  return typeof proof.created === "number" ? proof.created : 0;
}

/**
 * Seeds for the champions node: quest -> seeds, oldest first.
 * Only the last `seedsPerGame` seeds of each quest are kept.
 */
export function championGames(
  proofs: ProofsByGame,
  seedsPerGame = 1,
): { [gameName: string]: string[] } {
  const games: { [gameName: string]: string[] } = {};
  for (const gameName of Object.keys(proofs)) {
    const gameProofs = proofs[gameName];
    if (!gameProofs || !hasProofs(gameProofs)) {
      continue;
    }
    const seeds = Object.keys(gameProofs)
      .filter((seed) => !!gameProofs[seed])
      .sort((a, b) => {
        const diff = proofTime(gameProofs[a]!) - proofTime(gameProofs[b]!);
        return diff !== 0 ? diff : a < b ? -1 : a > b ? 1 : 0;
      });
    games[gameName] = seeds.slice(-seedsPerGame);
  }
  return games;
}

/* ============ Champions row ============ */

/** games: quest -> seeds (non-empty arrays), see championGames() */
export function buildChampionPayload(
  name: string,
  games: { [gameName: string]: string[] },
  updatedAt: number | object,
): ChampionRecord {
  return {
    name,
    gamesWonCount: Object.keys(games).length,
    games,
    updatedAt: updatedAt as number,
  };
}

export function gameNamesList(record: { games?: { [gameName: string]: unknown } }): string[] {
  if (!record.games) {
    return [];
  }
  return Object.keys(record.games).sort();
}

/**
 * Names from a champions row that are still in the known quest index,
 * in the same order as gameNamesList. Does not change the stored row.
 */
export function knownGameNamesList(
  record: { games?: { [gameName: string]: unknown } },
  knownNames: { has(name: string): boolean },
): string[] {
  return gameNamesList(record).filter((name) => knownNames.has(name));
}

/** Seeds of a quest from a champions row, oldest first */
export function championSeeds(
  record: { games?: { [gameName: string]: unknown } },
  gameName: string,
): string[] {
  const raw = record.games ? record.games[gameName] : undefined;
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const obj = raw as { [key: string]: unknown; slice?: unknown };
  // Firebase may return an array as an object with "0", "1", ... keys,
  // and a MobX 4 observable array is not Array.isArray but has slice()
  const list: unknown[] = Array.isArray(obj)
    ? obj
    : typeof obj.slice === "function"
    ? (obj as unknown as { slice(): unknown[] }).slice()
    : Object.keys(obj)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => obj[key]);
  return list.filter((seed): seed is string => typeof seed === "string" && seed !== "");
}

/* ============ Verify ============ */

export type ChampionGameVerifyResult = "validated" | "failed";

/**
 * Verifies one quest of a champion. Seeds come from champions/<uid>/games/<quest>
 * (oldest first). They are tried from the end: the proof is downloaded by its
 * exact path and checked; the first valid proof is enough, a missing or invalid
 * proof moves on to the previous seed.
 */
export async function verifyChampionGame(
  seeds: readonly string[],
  fetchProof: (seed: string) => Promise<GameLog | null>,
  checkProof: (seed: string, proof: GameLog) => Promise<ChampionGameVerifyResult>,
): Promise<{ result: ChampionGameVerifyResult; seed: string | null }> {
  for (let i = seeds.length - 1; i >= 0; i--) {
    const seed = seeds[i];
    let proof: GameLog | null = null;
    try {
      proof = await fetchProof(seed);
    } catch (e) {
      console.warn(`Champion proof fetch failed seed=${seed}`, e);
    }
    if (!proof) {
      continue;
    }
    try {
      if ((await checkProof(seed, proof)) === "validated") {
        return { result: "validated", seed };
      }
    } catch (e) {
      console.warn(`Champion proof check failed seed=${seed}`, e);
    }
  }
  return { result: "failed", seed: null };
}
