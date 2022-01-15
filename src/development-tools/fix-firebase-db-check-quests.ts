import admin from "firebase-admin";
import * as fs from "fs";

import * as pako from "pako";
import { Index } from "../packGameData/defs";
import { parse } from "../lib/qmreader";
import { Quest, validateWinningLog } from "../lib/qmplayer/funcs";
import { FirebasePublic } from "../ui/db/defs";
//const acc = require("~/space-rangers-firebase-root-key.json");

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

(async () => {
  console.info("Fetching all data");
  const usersPublic = (await db.ref("usersPublic").once("value")).val() as {
    [userId: string]: FirebasePublic;
  };
  if (!fs.existsSync("backup/usersPublic.json")) {
    console.info("Creating backup file");
    fs.writeFileSync("backup/usersPublic.json", JSON.stringify(usersPublic));
  }
  for (const userId of Object.keys(usersPublic)) {
    if (userId !== "8xXMRqtqB5f9o0G17dMhpYh5wcf1") {
      // continue;
    }
    const userData = usersPublic[userId];
    console.info(`Checking user id=${userId} name=${userData.info && userData.info.name}`);

    const checkedProofs: FirebasePublic["gamesWonProofs"] = {};

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
          if (!checkedProofs[gameName]) {
            checkedProofs[gameName] = {};
          }
          checkedProofs[gameName][proofSeed] = gameProofs[proofSeed];
        } else {
          console.info("======= Not validated ======== ");
        }
      }
    }

    const gamesWonCount = Object.keys(checkedProofs).length;
    const updatedUserData = {
      ...userData,
      gamesWonCount,
      gamesWonProofs: checkedProofs,
    };
    console.info(
      `Updating data in firebase oldCount=${userData.gamesWonCount} new=${gamesWonCount}`,
    );
    await db.ref(`usersPublic/${userId}`).set(updatedUserData);

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
