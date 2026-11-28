import { GameLog } from "../../lib/qmplayer/funcs";

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
