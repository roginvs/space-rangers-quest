import firebase from "firebase/app";
import { FIREBASE_CHAMPIONS, ChampionPublic, ChampionsCursor, ChampionsPage } from "./defs";

export const CHAMPIONS_PAGE_SIZE = 50;

/**
 * One descending page of the public champions leaderboard.
 * Uses endAt(lastValue, lastKey).limitToLast(pageSize + 1) so the overlap
 * with the previous page can be dropped (the boundary row).
 */
export async function readChampionsPage(
  db: firebase.database.Database,
  cursor?: ChampionsCursor | null,
  pageSize = CHAMPIONS_PAGE_SIZE,
): Promise<ChampionsPage> {
  const limit = pageSize + 1;
  let query: firebase.database.Query = db.ref(FIREBASE_CHAMPIONS).orderByChild("gamesWonCount");
  if (cursor) {
    query = query.endAt(cursor.gamesWonCount, cursor.userId);
  }
  const snapshot = await query.limitToLast(limit).once("value");
  const rows: ChampionPublic[] = [];
  if (snapshot) {
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
  }
  rows.reverse();

  let start = 0;
  if (cursor && rows.length > 0 && rows[0].userId === cursor.userId) {
    start = 1;
  }
  const hasMore = rows.length >= limit;
  const pageRows = rows.slice(start, start + pageSize);
  const last = pageRows[pageRows.length - 1];
  return {
    rows: pageRows,
    cursor: last
      ? {
          gamesWonCount: last.gamesWonCount,
          userId: last.userId,
        }
      : null,
    hasMore,
  };
}
