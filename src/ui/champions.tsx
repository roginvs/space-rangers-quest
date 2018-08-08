import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";

import { observer } from "mobx-react";
import { observable } from "mobx";
import { Store } from "./store";
import { FirebasePublic } from "./db";

interface ValidationStatus {
    userId: string;
    currentQuestGameName: string;
    currentQuestNumber: number;
}

interface FirebasePublicWithInfo extends FirebasePublic {
    validatedStatus?: "success" | "failed";
}

interface ChampionsTabContainerProps {
    store: Store;
}
@observer
export class ChampionsTabContainer extends React.Component<
    ChampionsTabContainerProps,
    {}
> {
    constructor(props: ChampionsTabContainerProps) {
        super(props);
        props.store.db
            .getFirebasePublicHighscores()
            .catch(e => {
                console.warn(e);
                return null;
            })
            .then(champions => {
                this.champions = champions
                    ? champions.filter(
                          champion =>
                              champion.gamesWonCount > 0 &&
                              typeof champion.gamesWonProofs === "object"
                      )
                    : null;
            });
    }
    @observable
    champions: FirebasePublicWithInfo[] | null | undefined = undefined;

    @observable validating: ValidationStatus | undefined = undefined;

    async validateAll() {
        if (this.validating) {
            return;
        }
        const champions = this.champions;
        if (!champions) {
            return;
        }
        for (const champion of champions) {
            for (const { gameName, idx } of Object.keys(
                champion.gamesWonProofs
            ).map((gameName, idx) => ({ gameName, idx }))) {
                this.validating = {
                    userId: champion.userId,
                    currentQuestGameName: gameName,
                    currentQuestNumber: idx
                };

                // here it is
                champion.validatedStatus = "success";
            }
        }
        this.validating = undefined;
    }

    render() {
        const store = this.props.store;
        const l = store.l;
        const champions = this.champions;
        console.info(champions);
        return (
            <DivFadeinCss
                key="champions"
                className="text-center container my-3"
            >
                {champions ? (
                    <div>
                        {!this.validating ? (
                            <div className="mb-3">
                                <button
                                    className="btn btn-primary px-3"
                                    onClick={() => this.validateAll()}
                                >
                                    Validate{" "}
                                </button>
                            </div>
                        ) : null}
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Won count</th>
                                    <th>Games names</th>
                                </tr>
                            </thead>
                            <tbody>
                                {champions.map(champion => {
                                    try {
                                        const itIsYou =
                                            store.firebaseLoggedIn &&
                                            champion.userId ===
                                                store.firebaseLoggedIn.uid;
                                        const name =
                                            (champion.info &&
                                                champion.info.name) ||
                                            "NONAME";
                                        return (
                                            <tr key={champion.userId}>
                                                <td>
                                                    {itIsYou ? (
                                                        <b>{name}</b>
                                                    ) : (
                                                        name
                                                    )}
                                                </td>
                                                <td>
                                                    {champion.gamesWonCount}{" "}
                                                    {champion.validatedStatus ===
                                                    "success" ? (
                                                        <i className="fa fa-check text-success" />
                                                    ) : champion.validatedStatus ===
                                                    "failed" ? (
                                                        <i className="fa fa-times text-danger" />
                                                    ) : this.validating &&
                                                    this.validating.userId ===
                                                        champion.userId ? (
                                                        <i className="fa fa-spin fa-spinner" />
                                                    ) : null}
                                                </td>
                                                <td>
                                                    {Object.keys(
                                                        champion.gamesWonProofs
                                                    ).map((gameName, idx) => (
                                                        <span key={gameName}>
                                                            {idx !== 0
                                                                ? ", "
                                                                : ""}

                                                            {gameName}
                                                        </span>
                                                    ))}
                                                </td>
                                            </tr>
                                        );
                                    } catch (e) {
                                        console.warn(`User error`, e);
                                        return null;
                                    }
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Loader />
                )}
            </DivFadeinCss>
        );
    }
}
