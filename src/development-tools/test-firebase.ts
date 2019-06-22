import admin from "firebase-admin";
import * as fs from "fs";

import { FirebasePublic } from "../ui/db/defs";
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
const db = admin.database();

(async () => {
  const d = await db.ref("usersPublic").child("");
})();
