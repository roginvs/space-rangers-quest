import firebase from "firebase/app";
import { FIREBASE_CHAMPIONS, ChampionRecord } from "./defs";

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

export function gameNamesList(record: { games?: { [gameName: string]: unknown } }): string[] {
  if (!record.games) {
    return [];
  }
  return Object.keys(record.games).sort();
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
