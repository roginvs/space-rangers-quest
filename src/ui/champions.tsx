import * as React from "react";
import { Loader, DivFadeinCss, ErrorInfo } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";

import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Store } from "./store";
import { FirebasePublic, WonProofTableRow } from "./db/defs";
import { DATA_DIR } from "./consts";
import { WorkerPromise } from "./worker";
import { assertNever } from "../lib/formula/calculator";

@observer
export class ChampionsTabContainer extends React.Component<
  {
    store: Store;
  },
  {}
> {
  private mounted = false;
  private readonly worker: WorkerPromise = new WorkerPromise("worker.js");
  private readonly onUnmount: (() => void)[] = [
    () => (this.mounted = false),
    () => this.worker.destroy()
  ];
  componentWillUnmount() {
    this.onUnmount.forEach(f => f());
  }

  componentDidMount() {
    this.mounted = true;
    this.props.store.db
      .getRemotePassings()
      .then(champions => {
        console.info(champions);
        this.champions.set(champions);
      })
      .catch(e => {
        this.champions.set(`${e.message || "Error"}`);
      });
  }

  champions = observable.box<
    undefined | null | string | Record<string, WonProofTableRow>
  >(undefined);

  render() {
    const store = this.props.store;
    const l = store.l;
    const champions = this.champions.get();
    // console.info(champions);
    return (
      <DivFadeinCss key="champions" className="text-center container my-3">
        {champions === undefined ? (
          <Loader text={l.championsLoading} />
        ) : champions === null ? (
          <div>No champions</div>
        ) : typeof champions === "string" ? (
          <ErrorInfo error={champions} />
        ) : (
          <div>ready</div>
        )}
      </DivFadeinCss>
    );
  }
}
