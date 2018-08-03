import * as React from "react";

import firebase from "firebase/app";
import "firebase/auth";

import { LangTexts } from "./lang";
import { Player } from "../lib/qmplayer/player";
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
import { AppNavbar } from "./appNavbar";
import { Loader, DivFadeinCss } from "./common";
import { observer } from "mobx-react";
import { Store } from "./store";

@observer
export class AuthTabContainer extends React.Component<
    {
        store: Store;
    },
    {}
> {
    render() {
        const { l, firebaseLoggedIn, app } = this.props.store;
        return firebaseLoggedIn === undefined ? (
            <Loader text={l.waitForFirebase} />
        ) : firebaseLoggedIn ? (
            <DivFadeinCss key="logout" className="text-center container">
                <div className="mb-3">
                    <h5>{firebaseLoggedIn.displayName}</h5>
                </div>

                <div className="mb-5">
                    {this.props.store.firebaseSyncing ? (
                        <span>
                            <i className="fa fa-spin fa-spinner" />{" "}
                            {l.firebaseSyncing}
                        </span>
                    ) : (
                        <button
                            className="btn btn-info"
                            onClick={() =>
                                this.props.store.syncWithFirebase()
                            }
                        >
                            <div
                                className="d-flex align-items-center justify-content-center"
                                style={{
                                    whiteSpace: "normal"
                                }}
                            >
                                <span className="mr-1">
                                    <i className="fa fa-refresh fa-fw" />
                                </span>
                                <span>{l.doFirebaseSync}</span>
                            </div>
                        </button>
                    )}
                </div>

                <div className="mb-3">
                    <button
                        className="btn btn-light btn-sm px-3"
                        onClick={() => {
                            this.props.store.app
                                .auth()
                                .signOut()
                                .catch(e => undefined);
                        }}
                    >
                        <i className="fa fa-sign-out" /> {l.logout}
                    </button>
                </div>
            </DivFadeinCss>
        ) : (
            <DivFadeinCss key="login" className="text-center">
                <div className="mb-3">
                    <div className="mb-3">{l.loginInfo}</div>
                    <button
                        className="btn btn-light px-3"
                        onClick={() => {
                            const authProvider = new firebase.auth.GoogleAuthProvider();
                            this.props.store.app
                                .auth()
                                .signInWithPopup(authProvider)
                                .catch(e => undefined);
                        }}
                    >
                        <i className="fa fa-google" /> {l.loginWithGoogle}
                    </button>
                </div>
            </DivFadeinCss>
        );
    }
}
