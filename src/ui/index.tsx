import * as React from 'react';
import * as ReactDOM from 'react-dom';

import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import firebase from "firebase";
import { getDb } from "./db";
import { DEFAULT_RUS_PLAYER, Player } from "../lib/qmplayer/player";
import { initGame } from "../lib/qmplayer";
import { parse } from "../lib/qmreader";
import * as pako from 'pako';
import { getUIState, performJump } from "../lib/qmplayer/funcs";
import { Loader } from './common';
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'

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
    player?: Player,
    db?: typeof getDb extends (app: any) => Promise<infer T> ? T : never;
    error?: string,
}
class MainLoader extends React.Component<{},MainLoaderState> {
    state: MainLoaderState = {};
    componentDidMount() {
        getDb(app).then(db => {
            this.setState({
                db
            }, this.loadPlayer)
        }).catch(e => {
            this.setState({
                error: e
            })
        })
    }
    loadPlayer = () => {
        const db = this.state.db;
        if (! db) {
            return
        }
        db.getPrivate("player").then(player => this.setState({
            player
        })).catch(e => {
            this.setState({
                error: e
            })
        })
    }
    render () {
        const db = this.state.db;
        const player = this.state.player;
        if (!player || ! db) {
            return <Loader text="Loading user"/>
        } else {
            return     <HashRouter>
            <Switch>
                <Route exact path={"/"} render={() => <Redirect to="/games" />} />
                <Route
                    path={"/:tab/:subTab?"}
                    render={prop => {
                        const tab = prop.match.params.tab;
                        const subTab = prop.match.params.subTab
                        return (
                            <div>TPDP</div>
                        );
                    }}
                />
                </Switch>
                </HashRouter>
    
        }
    }
}

const root = document.getElementById("root");
if (!root) {
    throw new Error("No root element!");
}

ReactDOM.render(
    <MainLoader/>,
    root
);
