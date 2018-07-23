import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import firebase from "firebase";
import { getDb } from "./db";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";
import { initGame } from "../lib/qmplayer";
import { parse } from "../lib/qmreader";
import * as pako from 'pako';
import { getUIState, performJump } from "../lib/qmplayer/funcs";

console.info("starting");

const config = {
    apiKey: "AIzaSyBWnLHRm15oXB0cbFwU57dGPeR731Zmisg",
    authDomain: "test-project-5f054.firebaseapp.com",
    databaseURL: "https://test-project-5f054.firebaseio.com",
    projectId: "test-project-5f054",
    storageBucket: "test-project-5f054.appspot.com",
    messagingSenderId: "188260954291"
};

const app = firebase.initializeApp(config);
const authProvider = new firebase.auth.GoogleAuthProvider();

(async () => {
    // await firebase.auth().signInWithPopup(authProvider);

    const db = await getDb(app);
    
    const config = await db.getPrivate("player");
    console.info(`config=`,config);

    // await db.setPrivate("player", DEFAULT_RUS_PLAYER);

    /*
    const questDataGzipped = await fetch('data/qm/Amnesia.qmm.gz').then(x => x.arrayBuffer());
    const questData = pako.ungzip(questDataGzipped as any);
    const quest = parse(new Buffer(questData));
    let state = initGame(quest, "myseed1"); 
    state = performJump(-1, quest, state, []);
    state = performJump(2, quest, state, []);
    //await 
    
    console.info(getUIState(quest, state, DEFAULT_RUS_PLAYER).choices);
    */
})().catch(e => console.error(e));
