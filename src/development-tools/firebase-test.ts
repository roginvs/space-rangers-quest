import admin from "firebase-admin";
import * as fs from "fs";

import { FirebasePublic } from "../ui/db.js";
import * as pako from "pako";
import { Index } from "../packGameData";
import { parse } from "../lib/qmreader";
import { Quest, validateWinningLog } from "../lib/qmplayer/funcs";
//const acc = require("~/space-rangers-firebase-root-key.json");

const serviceAccount = JSON.parse(
  fs.readFileSync("../../../space-rangers-firebase-root-key.json").toString()
);
const questIndex = JSON.parse(
  fs.readFileSync("../../built-web/data/index.json").toString()
) as Index;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: "https://test-project-5f054.firebaseio.com"
});
var db = admin.database();
var ref = db.ref("usersPublic");

(async () => {
  console.info("Fetching all data");
  const val = (await ref.once("value")).val() as {
    [userId: string]: FirebasePublic;
  };
  for (const userId of Object.keys(val)) {
    if (userId !== "xsH8u164u5TeElSAYoM0pwpDkSI2") {
      // continue;
    }
    const userData = val[userId];
    console.info(
      `Checking user id=${userId} name=${userData.info && userData.info.name}`
    );

    const checkedProofs: FirebasePublic["gamesWonProofs"] = {};

    for (const gameName of Object.keys(userData.gamesWonProofs || {})) {
      const gameProofs = userData.gamesWonProofs[gameName];
      console.info(`  Validating game=${gameName}`);
      const gameInfo = questIndex.quests.find(x => x.gameName === gameName);
      if (!gameInfo) {
        console.warn(`  Game ${gameInfo} not found`);
        continue;
      }

      const questArrayBuffer = fs.readFileSync(
        `./../../built-web/data/${gameInfo.filename}`
      );
      const quest = parse(
        Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))
      ) as Quest;

      for (const proofSeed of Object.keys(gameProofs)) {
        //  console.info("seed", proofSeed, "info", gameProofs[proofSeed]);
        const validationResult = validateWinningLog(
          quest,
          gameProofs[proofSeed],
          false
        );
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

    // console.info(userData.gamesWonProofs, checkedProofs);
    //process.exit(0);
  }

  console.info("Done");
})();
