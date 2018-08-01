import * as React from "react";
import * as ReactDOM from "react-dom";

import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import { Index, Game } from "../packGameData";
import firebase from "firebase";
import { getDb, DB } from "./db";
import {
    DEFAULT_RUS_PLAYER,
    Player,
    DEFAULT_ENG_PLAYER
} from "../lib/qmplayer/player";
import { initGame } from "../lib/qmplayer";
import { getUIState, performJump } from "../lib/qmplayer/funcs";
import { Loader, DivFadeinCss, Redirect } from "./common";
import { observer } from "mobx-react";
import {
    Navbar,
    NavbarBrand,
    NavbarToggler,
    Collapse,
    Nav,
    NavItem,
    NavLink,
    Container
} from "reactstrap";
import { INDEX_JSON } from "./consts";
import { getLang, guessBrowserLang, LangTexts } from "./lang";
import { assertNever } from "../lib/formula/calculator";

import { OfflineModeTabContainer } from "./offlineMode";
import { OptionsTabContainer } from "./options";
import { QuestList } from "./questList";
import { AppNavbar } from "./appNavbar";
import { AuthTabContainer } from "./auth";
import { QuestInfo } from "./questInfo";
import { Store } from "./store";
import { QuestPlay } from "./questPlay";
import { AboutTabContainer } from "./about";

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
// const app = firebase.initializeApp({} as typeof config);

declare global {
    interface Navigator {
        storage?: {
            estimate: () => Promise<{ quota: number; usage: number }>;
            persisted: () => Promise<boolean>;
            persist: () => Promise<boolean>;
        };
    }
}

interface MainLoaderState {
    store?: Store;
    error?: string;
}

@observer
class MainLoader extends React.Component<{}, MainLoaderState> {
    state: MainLoaderState = {};

    componentDidMount() {
        /*
        app.auth().onAuthStateChanged(user => {
        this.setState({
            firebaseLoggedIn: user ? user : null
        });
        })
        */

        (async () => {
            const db = await getDb(app);
            const lastPlayedGame = await db.getConfigLocal("lastPlayedGame");
            let player = await db.getConfigLocal("player");
            if (!player) {
                const browserLang = guessBrowserLang();
                console.info(`Welcome, a new user!`);
                player =
                    browserLang === "rus"
                        ? DEFAULT_RUS_PLAYER
                        : browserLang === "eng"
                            ? DEFAULT_ENG_PLAYER
                            : assertNever(browserLang);
                await db.setConfigBoth("player", player);
            }
            const index = await fetch(INDEX_JSON).then(x => x.json());
            const store = new Store(index, app, db, player);
            if (lastPlayedGame) {
                location.hash = `/quests/${lastPlayedGame}`;
            }
            await store.loadWinProofsFromLocal();
            try {
                app.auth().onAuthStateChanged(user => {
                    store.firebaseLoggedIn = user;
                    if (user) {
                        store.syncWithFirebase().catch(e => console.warn(e))
                    }
                });
            } catch (e) {
                console.warn("Error with firebase", e);
            }
            if (
                "serviceWorker" in navigator &&
                location.hostname !== "localhost"
            ) {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then(reg => {
                        function updateStore() {
                            console.info(
                                `serviceWorker installing=${
                                    reg.installing
                                        ? reg.installing.state
                                        : "null"
                                } ` +
                                    `waiting=${
                                        reg.waiting ? reg.waiting.state : "null"
                                    } ` +
                                    `active=${
                                        reg.active ? reg.active.state : "null"
                                    } `
                            );
                            store.haveInstallingServiceWorker = reg.installing
                                ? reg.installing.state
                                : null;
                            store.haveWaitingServiceWorker = reg.waiting
                                ? reg.waiting.state
                                : null;
                            store.haveActiveServiceWorker = reg.active
                                ? reg.active.state
                                : null;
                            if (reg.installing) {
                                reg.installing.onstatechange = updateStore;
                            }
                            if (reg.waiting) {
                                reg.waiting.onstatechange = updateStore;
                            }
                            if (reg.active) {
                                reg.active.onstatechange = updateStore;
                            }
                        }
                        updateStore();
                        reg.addEventListener("updatefound", () => {
                            updateStore();
                        });
                    })
                    .catch(e => undefined);
                navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    e => {
                        store.serviceWorkerController = navigator.serviceWorker
                            .controller
                            ? navigator.serviceWorker.controller.state
                            : null;
                        console.info(
                            `serviceWorker controller=${
                                navigator.serviceWorker.controller
                                    ? navigator.serviceWorker.controller.state
                                    : "null"
                            }`
                        );
                    }
                );
                store.serviceWorkerController = navigator.serviceWorker
                    .controller
                    ? navigator.serviceWorker.controller.state
                    : null;
                console.info(
                    `serviceWorker controller=${
                        navigator.serviceWorker.controller
                            ? navigator.serviceWorker.controller.state
                            : "null"
                    }`
                );
            }
            if (navigator.storage) {
                navigator.storage.persist().then(persisted => {
                    console.info(`Persisted=`, persisted);
                    store.serviceWorkerStoragePersistent = persisted;
                }).catch(e => console.warn(e));
            }
            this.setState({
                store
            });
        })().catch(e =>
            this.setState({
                error: e
            })
        );
    }
    render() {
        if (this.state.error) {
            return (
                <div className="text-center p-3 text-danger">
                    {this.state.error.toString()}
                </div>
            );
        }
        const store = this.state.store;
        if (!store) {
            return <Loader text="Loading index" />;
        }

        const { tab0, tab1, tab2 } = store.path;
        if (!tab0) {
            return <Redirect to="#/quests" />;
        }
        if (tab0 === "auth") {
            return (
                <AppNavbar store={store}>
                    <AuthTabContainer store={store} />
                </AppNavbar>
            );
        } else if (tab0 === "options") {
            return (
                <AppNavbar store={store}>
                    <OptionsTabContainer store={store} />
                </AppNavbar>
            );
        } else if (tab0 === "offlinemode") {
            return (
                <AppNavbar store={store}>
                    <OfflineModeTabContainer store={store} />
                </AppNavbar>
            );
        } else if (tab0 === 'about') {
            return (
                <AppNavbar store={store}>
                    <AboutTabContainer store={store} />
                </AppNavbar>
             )            
        } else if (tab0 === "quests") {
            if (!tab1) {
                return <QuestList store={store} />;
            } else {
                if (!tab2) {
                    return (
                        <QuestInfo key={tab1} store={store} gameName={tab1} />
                    );
                } else {
                    return (
                        <QuestPlay key={tab1} store={store} gameName={tab1} />
                    );
                }
            }
            // asdasd
        }
        return <div>TODO tab={store.path.tab0}</div>;
    }
}

const root = document.getElementById("root");
if (!root) {
    throw new Error("No root element!");
}

ReactDOM.render(<MainLoader />, root);
