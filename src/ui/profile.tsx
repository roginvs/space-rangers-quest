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


export class ProfileTabContainer extends React.Component<
    {
        l: LangTexts;
        user: firebase.User;
        app: firebase.app.App;
        firebaseSyncing: boolean | undefined;
    },
    {}
> {
    render() {
        return (            
            <DivFadeinCss key="logout" className="text-center container">                
                <div className="mb-3">
                    <h5>{this.props.user.displayName}</h5>
                </div>                
                {this.props.firebaseSyncing ? 
                <div className="mb-3">
                    <i className="fa fa-spin fa-spinner"/>{" "}{this.props.l.firebaseSyncing}
                </div>: null}
                
                <div className="mb-3">
                    <button
                        className="btn btn-light px-3"
                        onClick={() => {
                            this.props.app
                                .auth()
                                .signOut()
                                .catch(e => undefined);
                        }}
                    >
                        <i className="fa fa-sign-out" />{" "}
                        {this.props.l.logout}
                    </button>
                </div>                
            </DivFadeinCss>
        );
    }
}