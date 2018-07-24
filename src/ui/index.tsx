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
import { parse } from "../lib/qmreader";
import * as pako from "pako";
import { getUIState, performJump } from "../lib/qmplayer/funcs";
import { Loader, DivFadeinCss } from "./common";
import {
    HashRouter,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";
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
import { QuestListRouter } from "./questList";
import { AppNavbar } from "./appNavbar";
import { AuthTabContainer } from "./auth";
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

interface MainLoaderState {
    player?: Player;
    db?: DB;
    index?: Index;
    error?: string;

    firebaseLoggedIn?: firebase.User | null;
}
class MainLoader extends React.Component<
    RouteComponentProps<{}>,
    MainLoaderState
> {
    state: MainLoaderState = {};
    private unsubscribe: (() => void)[] = [];
    componentWillUnmount() {
        this.unsubscribe.forEach(f => f());
    }
    componentDidMount() {
        this.unsubscribe.push(
            app.auth().onAuthStateChanged(user => {
                this.setState({
                    firebaseLoggedIn: user ? user : null
                });
            })
        );

        getDb(app)
            .then(db => {
                this.setState(
                    {
                        db
                    },
                    this.loadPlayer
                );

                db.getPrivate("lastPlayedGame")
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
        db.getPrivate("player")
            .then(player => {
                if (player) {
                    this.setState({
                        player
                    });
                } else {
                    const browserLang = guessBrowserLang();
                    console.info(`Welcome, a new user!`);
                    db.setPrivate(
                        "player",
                        browserLang === "rus"
                            ? DEFAULT_RUS_PLAYER
                            : browserLang === "eng"
                                ? DEFAULT_ENG_PLAYER
                                : assertNever(browserLang)
                    ).catch(e => this.setState({ error: e }));
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
                            <>
                                <AppNavbar
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                />
                                <AuthTabContainer
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                    app={app}
                                />
                            </>
                        )}
                    />

                    <Route
                        path={"/offlinemode"}
                        render={prop => (
                            <>
                                <AppNavbar
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                />

                                <OfflineModeTabContainer l={l} />
                            </>
                        )}
                    />

                    <Route
                        path={"/options"}
                        render={prop => (
                            <>
                                <AppNavbar
                                    l={l}
                                    player={player}
                                    firebaseLoggedIn={firebaseLoggedIn}
                                />

                                 <OptionsTabContainer
                                            l={l}
                                            player={player}
                                            onNewPlayer={player =>
                                                this.setState({ player })
                                            }
                                            db={db}
                                    />
                            </>
                        )}
                    />

                    <QuestListRouter
                                            l={l}
                                            player={player}
                                            index={index}
                                            db={db}    
                                            firebaseLoggedIn={firebaseLoggedIn}                                        
                    />


                    <Route
                        path="/"
                        exact
                        render={() => <Redirect to="quests"/>}
                    />

                   
                </>
            );
        }
    }
}

const root = document.getElementById("root");
if (!root) {
    throw new Error("No root element!");
}

ReactDOM.render(
    <HashRouter>
        <Route path={"/"} render={prop => <MainLoader {...prop} />} />
    </HashRouter>,
    root
);
