import firebase from "firebase/app";
import { FIREBASE_CHAMPIONS, ChampionRecord } from "./defs";
import { championSeeds } from "./utils";

/** Database mechanics of the champions row; used from db.ts only */

export async function writeOwnChampionNode(
  db: firebase.database.Database,
  uid: string,
  payload: ChampionRecord,
): Promise<void> {
  await db.ref(`${FIREBASE_CHAMPIONS}/${uid}`).set(payload);
}

/** Seeds already in the own champions row (one small read, no proofs) */
export async function readOwnChampionGames(
  db: firebase.database.Database,
  uid: string,
): Promise<{ [gameName: string]: string[] }> {
  const raw = (await db.ref(`${FIREBASE_CHAMPIONS}/${uid}/games`).once("value")).val();
  const games: { [gameName: string]: string[] } = {};
  if (raw && typeof raw === "object") {
    for (const gameName of Object.keys(raw)) {
      const seeds = championSeeds({ games: raw }, gameName);
      if (seeds.length > 0) {
        games[gameName] = seeds;
      }
    }
  }
  return games;
}

/** Fails when the row does not exist yet: the rules require the whole row */
export async function writeOwnChampionName(
  db: firebase.database.Database,
  uid: string,
  name: string,
  updatedAt: number | object,
): Promise<void> {
  await db.ref(`${FIREBASE_CHAMPIONS}/${uid}`).update({ name, updatedAt });
}
