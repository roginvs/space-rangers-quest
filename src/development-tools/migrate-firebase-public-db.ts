import admin from "firebase-admin";
import * as fs from "fs";

import { FirebasePublic, WonProofTableRow } from "../ui/db/defs";
import * as pako from "pako";
import { Index } from "../packGameData/defs";
import { parse } from "../lib/qmreader";
import { Quest, validateWinningLog } from "../lib/qmplayer/funcs";
//const acc = require("~/space-rangers-firebase-root-key.json");
const FIREBASE_PUBLIC_WON_PROOF = "wonProofs";

const serviceAccount = JSON.parse(
  fs.readFileSync("../../../space-rangers-firebase-root-key.json").toString(),
);
const questIndex = JSON.parse(
  fs.readFileSync("../../built-web/data/index.json").toString(),
) as Index;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-project-5f054.firebaseio.com",
});
const db = admin.database();

async function createRow(key: string, row: WonProofTableRow) {
  await db.ref(FIREBASE_PUBLIC_WON_PROOF + "/" + key).set(row);
}

(async () => {
  if (1 + 1 === 22) {
    console.info("Dropping all data from wonProofs");
    await db.ref(FIREBASE_PUBLIC_WON_PROOF).set({});
    process.exit(0);
  }

  console.info("Fetching all data");
  const usersPublic = (await db.ref("usersPublic").once("value")).val() as {
    [userId: string]: FirebasePublic;
  };
  console.info("Creating backup file");
  fs.writeFileSync(
    `backup/usersPublic-${new Date().getTime()}.json`,
    JSON.stringify(usersPublic, null, 4),
  );

  for (const userId of Object.keys(usersPublic)) {
    if (userId !== "8xXMRqtqB5f9o0G17dMhpYh5wcf1") {
      // continue;
    }
    const userData = usersPublic[userId];
    console.info(`Checking user id=${userId} name=${userData.info && userData.info.name}`);

    for (const gameName of Object.keys(userData.gamesWonProofs || {})) {
      const gameProofs = userData.gamesWonProofs[gameName];
      console.info(`  Validating game=${gameName}`);
      const gameInfo = questIndex.quests.find((x) => x.gameName === gameName);
      if (!gameInfo) {
        console.warn(`  Game ${gameInfo} not found`);
        continue;
      }

      const questArrayBuffer = fs.readFileSync(`./../../built-web/data/${gameInfo.filename}`);
      const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))) as Quest;

      for (const proofSeed of Object.keys(gameProofs)) {
        //  console.info("seed", proofSeed, "info", gameProofs[proofSeed]);
        const validationResult = validateWinningLog(quest, gameProofs[proofSeed], false);
        if (validationResult) {
          await createRow(proofSeed, {
            createdAt:
              gameProofs[proofSeed].created || (admin.database.ServerValue.TIMESTAMP as any),
            gameName,
            userId,
            proof: gameProofs[proofSeed],
            rangerName: userData.info ? userData.info.name : "",
          });
        } else {
          console.info("======= Not validated ======== ");
        }
      }
    }

    //
    // console.info(userData.gamesWonProofs, checkedProofs);
    // process.exit(0);
  }

  console.info("Done");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
