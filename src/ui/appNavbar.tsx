import * as React from "react";

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
  Container,
  Alert,
} from "reactstrap";

import { observer } from "mobx-react";
import { Store } from "./store";
import { DivFadeinCss } from "./common";
import { observable } from "mobx";
import { assertNever } from "../assertNever";

@observer
export class AppNavbar extends React.Component<{
  store: Store;
}> {
  // For mobile view
  @observable
  navbarIsOpen = false;

  render() {
    const { l, firebaseLoggedIn, player } = this.props.store;
    const store = this.props.store;
    const tab0 = this.props.store.path.tab0;
    return (
      <>
        <Navbar color="light" light expand="md">
          <NavbarBrand href="#/">
            {l.hi} {player.Player}
          </NavbarBrand>
          <NavbarToggler
            aria-label={l.menu}
            onClick={() => {
              this.navbarIsOpen = !this.navbarIsOpen;
            }}
          />
          <Collapse isOpen={this.navbarIsOpen} navbar>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink active={tab0 === "quests"} href="#/quests">
                  <i className="fa fa-fw fa-list" /> {l.quests}
                </NavLink>
              </NavItem>

              <NavItem>
                <NavLink active={tab0 === "champions"} href="#/champions">
                  <i className="fa fa-fw fa-users" /> {l.topplayers}
                </NavLink>
              </NavItem>

              <NavItem>
                <NavLink href="#/options" active={tab0 === "options"}>
                  <i className="fa fa-fw fa-cogs" /> {l.options}
                </NavLink>
              </NavItem>

              <NavItem>
                <NavLink href="#/editor" active={false}>
                  <i className="fa fa-fw fa-edit" /> {l.editor}
                </NavLink>
              </NavItem>
              {/*
                                                <NavItem>
                                                    <NavLink
                                                        href="#/useown"
                                                        active={
                                                            tab0 === "useown"
                                                        }
                                                    >
                                                        <i className="fa fa-fw fa-upload" />{" "}
                                                        {l.useown}
                                                    </NavLink>
                                                </NavItem>
                                                    */}
              {"serviceWorker" in navigator ? (
                <NavItem>
                  <NavLink href="#/offlinemode" active={tab0 === "offlinemode"}>
                    {store.installingServiceWorkerState ||
                    store.imagesCacheInstallInfo ||
                    store.musicCacheInstallInfo ? (
                      <>
                        <i className="fa fa-fw fa-spin fa-circle-o-notch" />{" "}
                        {l.installModeInstalling}
                      </>
                    ) : store.waitingServiceWorkerState ? (
                      <span className="text-success">
                        <i className="fa fa-fw fa-truck fa-flip-horizontal" />{" "}
                        {l.installModeNeedReload}
                      </span>
                    ) : (
                      <>
                        <i className="fa fa-fw fa-cloud-download" /> {l.installMode}
                      </>
                    )}
                  </NavLink>
                </NavItem>
              ) : null}

              {firebaseLoggedIn !== undefined ? (
                <NavItem>
                  <NavLink href="#/auth" active={tab0 === "auth"}>
                    {firebaseLoggedIn ? (
                      <>
                        {this.props.store.firebaseSyncing ? (
                          <i className="fa fa-fw fa-spinner fa-spin" />
                        ) : (
                          <i className="fa fa-fw fa-vcard" />
                        )}{" "}
                        {l.profile}
                      </>
                    ) : (
                      <>
                        <i className="fa fa-fw fa-sign-in" /> {l.login}
                      </>
                    )}
                  </NavLink>
                </NavItem>
              ) : null}

              <NavItem>
                <NavLink href="#/about" active={tab0 === "about"}>
                  <i className="fa fa-fw fa-info-circle" /> {l.about}
                </NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>

        <Container className="mt-3">{this.props.children}</Container>
      </>
    );
  }
}
