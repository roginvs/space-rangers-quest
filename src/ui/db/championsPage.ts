import firebase from "firebase/app";
import { FIREBASE_CHAMPIONS, ChampionPublic, ChampionsCursor, ChampionsPage } from "./defs";

export const CHAMPIONS_PAGE_SIZE = 50;

/**
 * One descending page of the public champions leaderboard.
 */
export async function readChampionsPage(
  db: firebase.database.Database,
  cursor?: ChampionsCursor | null,
  pageSize = CHAMPIONS_PAGE_SIZE,
): Promise<ChampionsPage> {
  const limit = pageSize + 1;
  // orderByChild: sort by gamesWonCount (ascending; the page is reversed below).
  let query: firebase.database.Query = db.ref(FIREBASE_CHAMPIONS).orderByChild("gamesWonCount");
  if (cursor) {
    // endAt(value, key): value is compared with the orderBy field (gamesWonCount).
    // The optional second arg is the node key (uid here), used only to break ties
    // between rows with equal gamesWonCount, so pages neither skip nor duplicate
    // rows at the boundary.
    query = query.endAt(cursor.gamesWonCount, cursor.userId);
  }
  // limitToLast(pageSize + 1) takes the highest values in this range; the extra
  // boundary row (overlap with the previous page) is dropped below.
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
