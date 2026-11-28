import { GameLog } from "../lib/qmplayer/funcs";

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
