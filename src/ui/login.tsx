import * as React from "react";
import firebase from "firebase";
import { getDb } from "./db";
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

export class LoginTabContainer extends React.Component<
    {
        l: LangTexts;
        app: firebase.app.App;
    },
    {}
> {
    render() {
        return (
            <DivFadeinCss key="login" className="text-center">
                <div className="mb-3">
                    <button
                        className="btn btn-light px-3"
                        onClick={() => {
                            const authProvider = new firebase.auth.GoogleAuthProvider();
                            this.props.app
                                .auth()
                                .signInWithPopup(authProvider)
                                .catch(e => undefined);
                        }}
                    >
                        <i className="fa fa-google" />{" "}
                        {this.props.l.loginWithGoogle}
                    </button>
                </div>
            </DivFadeinCss>
        );
    }
}