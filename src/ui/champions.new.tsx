import * as React from "react";
import { Loader, DivFadeinCss, ErrorInfo } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";

import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Store } from "./store";
import { FirebasePublic, WonProofTableRow } from "./db/defs";
import { WorkerPromise } from "./worker";
import { assertNever } from "../assertNever";

@observer
export class ChampionsTabContainerNew extends React.Component<
  {
    store: Store;
  },
  {}
> {
  private mounted = false;
  private readonly worker: WorkerPromise = new WorkerPromise("worker.js");
  private readonly onUnmount: (() => void)[] = [
    () => (this.mounted = false),
    () => this.worker.destroy(),
  ];
  componentWillUnmount() {
    this.onUnmount.forEach((f) => f());
  }

  componentDidMount() {
    this.mounted = true;
    this.props.store.db
      .getRemotePassings()
      .then((champions) => {
        if (champions) {
          const orderedKeysByDate = Object.keys(champions).sort((a, b) => {
            return champions[a].createdAt - champions[b].createdAt > 0 ? -1 : 1;
          });
          this.champions.set({ champions, orderedKeysByDate });
        } else {
          this.champions.set(null);
        }
      })
      .catch((e) => {
        this.champions.set(`${e.message || "Error"}`);
      });
  }

  champions = observable.box<
    | undefined
    | null
    | string
    | {
        champions: Record<string, WonProofTableRow>;
        orderedKeysByDate: string[];
      }
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
          <div>
            <table className="table table-responsive">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ranger</th>
                  <th>Game</th>
                </tr>
              </thead>
              <tbody>
                {champions.orderedKeysByDate.map((k) => {
                  const row = champions.champions[k];
                  return (
                    <tr key={k}>
                      <td>{new Date(row.createdAt).toLocaleString()}</td>
                      <td>{row.rangerName}</td>
                      <td>{row.gameName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DivFadeinCss>
    );
  }
}
