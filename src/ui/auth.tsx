import * as React from "react";


import { LangTexts } from "./lang";
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
import { observer } from 'mobx-react';
import { Store } from './store';

@observer
export class AuthTabContainer extends React.Component<{
    store: Store
},{}> {
    
    render() {
        const {l, firebaseLoggedIn, app} = this.props.store;
        return firebaseLoggedIn === undefined ? (            
                                                <Loader
                                                    text={l.waitForFirebase}
                                                />
                                            ) : firebaseLoggedIn ? (
                                                <ProfileTabContainer
                                                    l={l}
                                                    user={firebaseLoggedIn}
                                                    firebaseSyncing={this.props.store.firebaseSyncing}
                                                    app={app}
                                                />
                                            ) : (
                                                <LoginTabContainer l={l} app={app} />
                                            );

                    
        }    
}