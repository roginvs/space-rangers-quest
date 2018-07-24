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
import { LoginTab } from "./login";
import { ProfileTab } from "./profile";
import { OfflineMode } from "./offlineMode";
import { Options } from "./options";
import { QuestList } from "./questList";

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
    navbarIsOpen: boolean;
    firebaseLoggedIn?: firebase.User | null;
}
class MainLoader extends React.Component<
    RouteComponentProps<{}>,
    MainLoaderState
> {
    state: MainLoaderState = {
        navbarIsOpen: false
    };
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
                <Switch>
                    <Route
                        path={"/:tab?"}
                        render={prop => {
                            const tab = prop.match.params.tab;
                            if (!tab) {
                                return <Redirect to="/quests" />;
                            }                            
                            return (
                                <div>
                                    <Navbar color="light" light expand="md">
                                        <NavbarBrand href="#/">
                                            {l.hi} {player.Player}
                                        </NavbarBrand>
                                        <NavbarToggler
                                            onClick={() => {
                                                this.setState({
                                                    navbarIsOpen: !this.state
                                                        .navbarIsOpen
                                                });
                                            }}
                                        />
                                        <Collapse
                                            isOpen={this.state.navbarIsOpen}
                                            navbar
                                        >
                                            <Nav className="ml-auto" navbar>
                                                <NavItem>
                                                    <NavLink
                                                        active={
                                                            tab === "quests"
                                                        }
                                                        href="#/quests"
                                                    >
                                                        <i className="fa fa-list" />{" "}
                                                        {l.quests}
                                                    </NavLink>
                                                </NavItem>
                                                <NavItem>
                                                    <NavLink
                                                        active={
                                                            tab === "topplayers"
                                                        }
                                                        href="#/topplayers"
                                                    >
                                                        <i className="fa fa-users" />{" "}
                                                        {l.topplayers}
                                                    </NavLink>
                                                </NavItem>
                                                <NavItem>
                                                    <NavLink
                                                        href="#/options"
                                                        active={
                                                            tab === "options"
                                                        }
                                                    >
                                                        <i className="fa fa-cogs" />{" "}
                                                        {l.options}
                                                    </NavLink>
                                                </NavItem>
                                                <NavItem>
                                                    <NavLink
                                                        href="#/useown"
                                                        active={
                                                            tab === "useown"
                                                        }
                                                    >
                                                        <i className="fa fa-upload" />{" "}
                                                        {l.useown}
                                                    </NavLink>
                                                </NavItem>
                                                <NavItem>
                                                    <NavLink
                                                        href="#/offlinemode"
                                                        active={
                                                            tab ===
                                                            "offlinemode"
                                                        }
                                                    >
                                                        <i className="fa fa-cloud-download" />{" "}
                                                        {l.offlinemode}
                                                    </NavLink>
                                                </NavItem>

                                                {firebaseLoggedIn !==
                                                undefined ? (
                                                    <NavItem>
                                                        <NavLink
                                                            href="#/sign"
                                                            active={
                                                                tab === "sign"
                                                            }
                                                        >
                                                            {firebaseLoggedIn ? (
                                                                <>
                                                                    <i className="fa fa-vcard" />{" "}
                                                                    {l.profile}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fa fa-sign-in" />{" "}
                                                                    {l.login}
                                                                </>
                                                            )}
                                                        </NavLink>
                                                    </NavItem>
                                                ) : null}
                                            </Nav>
                                        </Collapse>
                                    </Navbar>
                                    <Container className="mt-3 mb-3">
                                        {tab === "sign" ? (
                                            firebaseLoggedIn === undefined ? (
                                                <Loader
                                                    text={l.waitForFirebase}
                                                />
                                            ) : firebaseLoggedIn ? (
                                                <ProfileTab
                                                    l={l}
                                                    user={firebaseLoggedIn}
                                                    app={app}
                                                />
                                            ) : (
                                                <LoginTab l={l} app={app} />
                                            )
                                        ) : tab === "offlinemode" ? (
                                            <OfflineMode l={l} />
                                        ) : tab === "options" ? (
                                            <Options
                                                l={l}
                                                player={player}
                                                onNewPlayer={player =>
                                                    this.setState({ player })
                                                }
                                                db={db}
                                            />
                                        ) : tab === "quests" ? (
                                            <QuestList
                                                l={l}
                                                player={player}
                                                index={index}
                                                {...prop}
                                            />
                                        ) : (
                                            "TODO"
                                        )}
                                    </Container>
                                </div>
                            );
                        }}
                    />
                </Switch>
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