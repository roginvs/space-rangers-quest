import firebase from "firebase/app";
import { FIREBASE_CHAMPIONS, ChampionPublic, ChampionRecord } from "./defs";

export function buildChampionPayload(
  name: string,
  gameNames: string[],
  updatedAt: number | object,
): ChampionRecord {
  const gameNamesMap: { [gameName: string]: true } = {};
  for (const gameName of gameNames) {
    gameNamesMap[gameName] = true;
  }
  return {
    name,
    gamesWonCount: gameNames.length,
    gameNames: gameNamesMap,
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

export async function readChampionsLeaderboard(
  db: firebase.database.Database,
  limit = 100,
): Promise<ChampionPublic[] | null> {
  const snapshot = await db
    .ref(FIREBASE_CHAMPIONS)
    .orderByChild("gamesWonCount")
    .limitToLast(limit)
    .once("value");
  if (!snapshot) {
    return null;
  }
  const rows: ChampionPublic[] = [];
  snapshot.forEach((child) => {
    const val = child.val();
    if (val && typeof val.gamesWonCount === "number") {
      rows.push({
        ...val,
        userId: child.key || "",
      });
    }
    return undefined;
  });
  return rows.reverse();
}

export function gameNamesList(record: { gameNames?: { [gameName: string]: true } }): string[] {
  if (!record.gameNames) {
    return [];
  }
  return Object.keys(record.gameNames).sort();
}
