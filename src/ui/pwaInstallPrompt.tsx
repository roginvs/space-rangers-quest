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
export class PwaInstallPrompt extends React.Component<{
  store: Store;
}> {
  @observable
  pwaInstallResult?: "success" | "failed" = undefined;

  render() {
    const store = this.props.store;
    const { l } = store;

    if (this.pwaInstallResult === undefined) {
      if (store.pwaAlreadyInstalled || !store.pwaInstallReadyEvent) {
        return null;
      }
      return (
        <DivFadeinCss>
          <Alert color="primary" toggle={() => (store.pwaInstallReadyEvent = undefined)}>
            <h4 className="alert-heading">{l.pwaInstallHeader}</h4>
            <p>
              <a
                href="#"
                className="alert-link"
                onClick={(e) => {
                  e.preventDefault();
                  const savedEvent = store.pwaInstallReadyEvent;
                  if (!savedEvent) {
                    return;
                  }
                  store.pwaInstallReadyEvent = undefined;
                  savedEvent.prompt().catch((e) => console.warn(e));
                  savedEvent.userChoice
                    .then((choiceResult) => {
                      this.pwaInstallResult =
                        choiceResult.outcome === "accepted"
                          ? "success"
                          : choiceResult.outcome === "dismissed"
                          ? "failed"
                          : assertNever(choiceResult.outcome);
                      setTimeout(() => (this.pwaInstallResult = undefined), 4000);
                    })
                    .catch((e) => console.warn(e));
                }}
              >
                {l.pwaInstallInfoLink}
              </a>
              {l.pwaInstallInfoToAddToDesktop}
            </p>
          </Alert>
        </DivFadeinCss>
      );
    } else if (this.pwaInstallResult === "success") {
      return (
        <Alert color="success" toggle={() => (this.pwaInstallResult = undefined)}>
          {l.pwaInstallOk}
        </Alert>
      );
    } else if (this.pwaInstallResult === "failed") {
      return (
        <Alert color="warning" toggle={() => (this.pwaInstallResult = undefined)}>
          {l.pwaInstallNotOk}
        </Alert>
      );
    } else {
      return assertNever(this.pwaInstallResult);
    }
  }
}
