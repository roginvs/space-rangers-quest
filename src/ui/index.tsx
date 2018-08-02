import "babel-polyfill";
// import "whatwg-fetch";

import * as React from "react";
import * as ReactDOM from "react-dom";

import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import firebase from 'firebase/app';
import 'firebase/database';

import { Index, Game } from "../packGameData";

import { getDb, DB } from "./db";
import {
    DEFAULT_RUS_PLAYER,
    Player,
    DEFAULT_ENG_PLAYER
} from "../lib/qmplayer/player";
import { initGame } from "../lib/qmplayer";
import { getUIState, performJump } from "../lib/qmplayer/funcs";
import { Loader, DivFadeinCss, Redirect, ErrorInfo } from "./common";
import { observer } from "mobx-react";
import { autorun } from "mobx";
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
    loadingStage?: "db" | "index";
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
            this.setState({
                loadingStage: "index"
            });
            const index = await fetch(INDEX_JSON).then(x => x.json());

            this.setState({
                loadingStage: "db"
            });
            const db = await getDb(app);
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

            const lastLocation = await db.getConfigLocal("lastLocation");
            const store = new Store(index, app, db, player);
            autorun(() => {
                db.setConfigBoth("lastLocation", store.hash).catch(e =>
                    console.warn(e)
                );
            });
            if (lastLocation) {
                location.replace(
                    lastLocation.indexOf("#") === 0
                        ? lastLocation
                        : "#" + lastLocation
                );
            }
            //if (lastPlayedGame) {
            //    location.hash = `/quests/${lastPlayedGame}`;
            //}
            await store.loadWinProofsFromLocal();
            try {
                app.auth().onAuthStateChanged(user => {
                    store.firebaseLoggedIn = user;
                    if (user) {
                        store.syncWithFirebase().catch(e => console.warn(e));
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
                            store.installingServiceWorkerState = reg.installing
                                ? reg.installing.state
                                : null;
                            store.waitingServiceWorkerState = reg.waiting
                                ? reg.waiting.state
                                : null;
                            store.waitingServiceWorker = reg.waiting;
                            store.activeServiceWorkerState = reg.active
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

                        setInterval(
                            () => reg.update().catch(e => console.warn(e)),
                            1000 * 60 * 60
                        );
                    })
                    .catch(e => undefined);

                navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    e => {
                        if (store.reloadingPage) {
                            return;
                        }
                        store.reloadingPage = true;
                        window.location.reload(); // Call to "reload" does not stop the page!
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
                if (navigator.serviceWorker.controller) {
                    if (navigator.storage) {
                        navigator.storage
                            .persist()
                            .then(persisted => {
                                console.info(`Persisted=`, persisted);
                                store.serviceWorkerStoragePersistent = persisted;
                            })
                            .catch(e => console.warn(e));
                    }
                }
            }
            this.setState({
                store,
                loadingStage: undefined
            });
        })().catch(e =>
            this.setState({
                error: e
            })
        );
    }
    render() {
        if (this.state.error) {
            return <ErrorInfo error={this.state.error} />;
        }
        const store = this.state.store;
        if (!store) {
            if (this.state.loadingStage === "index") {
                return <Loader text="Loading index" />;
            } else if (this.state.loadingStage === "db") {
                return <Loader text="Loading local database" />;
            } else if (this.state.loadingStage === undefined) {
                return <Loader text="Loading root" />;
            } else {
                return assertNever(this.state.loadingStage);
            }
        }
        if (store.reloadingPage) {
            return <Loader text="Reloading" />;
        }

        const { tab0, tab1, tab2 } = store.path;
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
        } else if (tab0 === "about") {
            return (
                <AppNavbar store={store}>
                    <AboutTabContainer store={store} />
                </AppNavbar>
            );
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
        }
        return (
            <div>                
                <Redirect to="#/quests" />
            </div>
        );
    }
}

const root = document.getElementById("root");
if (!root) {
    throw new Error("No root element!");
}
console.info("Mounting main component");
ReactDOM.render(<MainLoader />, root);
