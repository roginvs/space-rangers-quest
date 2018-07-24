import * as React from "react";


import { LangTexts } from "./lang";
import {
    HashRouter,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";
import {
    Player,    
} from "../lib/qmplayer/player";
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
import { LoginTabContainer } from "./login";
import { ProfileTabContainer } from "./profile";

export class AuthTabContainer extends React.Component<{
    l: LangTexts,    
    player: Player;
    firebaseLoggedIn: firebase.User | null | undefined,
    app: firebase.app.App;
},{}> {
    
    render() {
        const {l, firebaseLoggedIn, app} = this.props;
        return firebaseLoggedIn === undefined ? (            
                                                <Loader
                                                    text={l.waitForFirebase}
                                                />
                                            ) : firebaseLoggedIn ? (
                                                <ProfileTabContainer
                                                    l={l}
                                                    user={firebaseLoggedIn}
                                                    app={app}
                                                />
                                            ) : (
                                                <LoginTabContainer l={l} app={app} />
                                            );

                    
        }    
}