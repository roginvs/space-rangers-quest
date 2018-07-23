import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import { getDb } from "./db";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";

console.info("starting");

(async () => {
    const db = await getDb();

    const config = await db.getConfig("player");
    console.info(config);

    await db.setConfig("player", DEFAULT_RUS_PLAYER);
})().catch(e => console.error(e));
