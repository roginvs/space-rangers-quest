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

interface AppNavbarState {
    navbarIsOpen: boolean;
}
export class AppNavbar extends React.Component<{
    l: LangTexts,    
    player: Player;
    firebaseLoggedIn: firebase.User | null | undefined,
},AppNavbarState> {
    state: AppNavbarState = { navbarIsOpen: false}; // For mobile view    
    render() {
        const {l, firebaseLoggedIn, player} = this.props;
        return <Route
                        path={"/:tab?"}
                        render={prop => {
                            const tab = prop.match.params.tab;
                            return (
                                
                                    <Navbar color="light" light expand="md" className="mb-3">
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
                                                            href="#/auth"
                                                            active={
                                                                tab === "auth"
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
                            )}}/>
                    }
                                            }