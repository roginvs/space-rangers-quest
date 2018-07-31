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
//const app = firebase.initializeApp({} as typeof config);

/*
interface MainLoaderState {
    player?: Player;
    db?: DB;
    index?: Index;
    error?: string;

    firebaseLoggedIn?: firebase.User | null;

    firebaseSyncing?: boolean;
}
class MainLoader extends React.Component<
    {},
    MainLoaderState
> {
    state: MainLoaderState = {};
    private unsubscribe: (() => void)[] = [];
    componentWillUnmount() {
        this.unsubscribe.forEach(f => f());
    }
    syncWithFirebase = async () => {
        const db = this.state.db;
        if (!db) {
            return;
        }
        this.setState({
            firebaseSyncing: true
        });
        await db.syncWithFirebase().catch(e => console.warn(e));
        this.setState({
            firebaseSyncing: false
        });
        await this.loadPlayer();
    };

    componentDidMount() {
        try {
            this.unsubscribe.push(
                app.auth().onAuthStateChanged(user => {
                    this.setState({
                        firebaseLoggedIn: user ? user : null
                    });
                    if (user) {
                        this.syncWithFirebase();
                    }
                })
            );
        } catch (e) {
            console.warn(`Firebase subscribe error`, e);
        }

        getDb(app)
            .then(db => {
                this.setState(
                    {
                        db
                    },
                    async () => {
                        this.loadPlayer();
                        this.syncWithFirebase();
                    }
                );

                db.getConfigLocal("lastPlayedGame")
                    .then(lastPlayedGame => {
                        if (lastPlayedGame) {
                            this.props.history.push(`/games/${lastPlayedGame}`);
                        }
                    })
                    .catch(e => undefined);

                fetch(INDEX_JSON)
                    .then(x => x.json())
                    .then(index =>
                        this.setState({
                            index
                        })
                    )
                    .catch(e =>
                        this.setState({
                            error: e
                        })
                    );
            })
            .catch(e => {
                this.setState({
                    error: e
                });
            });
    }
    loadPlayer = () => {
        const db = this.state.db;
        if (!db) {
            return;
        }
        db.getConfigLocal("player")
            .then(player => {
                if (player) {
                    this.setState({
                        player
                    });
                } else {
                    const browserLang = guessBrowserLang();
                    console.info(`Welcome, a new user!`);
                    const newPlayer =
                        browserLang === "rus"
                            ? DEFAULT_RUS_PLAYER
                            : browserLang === "eng"
                                ? DEFAULT_ENG_PLAYER
                                : assertNever(browserLang);
                    db.setConfigBoth("player", newPlayer).catch(e =>
                        this.setState({ error: e })
                    );
                    this.setState({
                        player: newPlayer
                    });
                }
            })
            .catch(e => {
                this.setState({
                    error: e
                });
            });
    };
    render() {
        const db = this.state.db;
        const player = this.state.player;
        const index = this.state.index;
        if (this.state.error) {
            return (
                <div className="text-center p-3 text-danger">
                    {this.state.error.toString()}
                </div>
            );
        }
        const firebaseLoggedIn = this.state.firebaseLoggedIn;
        if (!player || !db || !index) {
            return <Loader text="Loading" />;
        } else {
            const l = getLang(player.lang);
            return (
                <>
                    <Route
                        path={"/auth"}
                        render={prop => (
                            <AppNavbar
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                    firebaseSyncing={this.state.firebaseSyncing}
                                >
                                <AuthTabContainer
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                    firebaseSyncing={this.state.firebaseSyncing}
                                    app={app}
                                />
                            </AppNavbar>
                        )}
                    />

                    <Route
                        path={"/offlinemode"}
                        render={prop => (
                            
                                <AppNavbar
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                    firebaseSyncing={this.state.firebaseSyncing}
                                >

                                <OfflineModeTabContainer l={l} />
                                </AppNavbar>
                        )}
                    />

                    <Route
                        path={"/options"}
                        render={prop => (
                            
                                <AppNavbar
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                    firebaseSyncing={this.state.firebaseSyncing}
                                >

                                <OptionsTabContainer
                                    l={l}
                                    player={player}
                                    onNewPlayer={player =>
                                        this.setState({ player })
                                    }
                                    db={db}
                                />
                            </AppNavbar>
                        )}
                    />

                    <QuestListRouter
                        l={l}
                        player={player}
                        index={index}
                        db={db}
                        firebaseLoggedIn={firebaseLoggedIn}
                        firebaseSyncing={this.state.firebaseSyncing}
                    />

                    <QuestInfoRouter
                        l={l}
                        player={player}
                        index={index}
                        db={db}
                        firebaseLoggedIn={firebaseLoggedIn}
                        firebaseSyncing={this.state.firebaseSyncing}
                    />

                    <Route
                        path="/"
                        exact
                        render={() => <Redirect to="quests" />}
                    />
                </>
            );
        }
    }
}
*/

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
            app.auth().onAuthStateChanged(user => {
                store.firebaseLoggedIn = user;
                if (user) {
                    store.syncWithFirebase();
                }
            });
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
            return <Loader text="Loading" />;
        }

        const { tab0, tab1, tab2 } = store.path;
        if (!tab0) {
            return <Redirect to='#/quests'/>
        } if (tab0 === "auth") {
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
