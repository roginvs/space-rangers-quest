import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";

import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Store } from "./store";
import { FirebasePublic } from "./db";
import { DATA_DIR } from "./consts";
import { WorkerPromise } from "./worker";
import { assertNever } from "../lib/formula/calculator";

import "./champions.css";

type QuestValidateStatus = "unknown" | "inprogress" | "validated" | "failed";
interface FirebasePublicWithValidateStatus extends FirebasePublic {
    validatedQuests: {
        gameName: string;
        validateStatus: QuestValidateStatus;
    }[];
}

@observer
export class ChampionsTabContainer extends React.Component<
    {
        store: Store;
    },
    {}
> {
    @observable
    champions:
        | FirebasePublicWithValidateStatus[]
        | null
        | undefined = undefined;

    @computed
    get validationIsInProgress() {
        return this.champions
            ? this.champions.filter(champion => {
                  const validatingQuests = champion.validatedQuests.filter(
                      x => x.validateStatus === "inprogress"
                  );
                  return validatingQuests.length > 0;
              }).length > 0
            : false;
    }

    private mounted = false;
    private worker: WorkerPromise = new WorkerPromise("worker.js");
    private onUnmount: (() => void)[] = [
        () => (this.mounted = false),
        () => this.worker.destroy()
    ];
    componentWillUnmount() {
        this.onUnmount.forEach(f => f());
    }

    componentDidMount() {
        this.mounted = true;

        const validatedUnknown: QuestValidateStatus = "unknown";
        this.props.store.db
            .getFirebasePublicHighscores()
            .catch(e => {
                console.warn(e);
                return null;
            })
            .then(champions => {
                this.champions = champions
                    ? champions
                          .filter(
                              champion =>
                                  champion.gamesWonCount > 0 &&
                                  typeof champion.gamesWonProofs === "object"
                          )
                          .map(champion => ({
                              ...champion,
                              validatedQuests: Object.keys(
                                  champion.gamesWonProofs
                              ).map(gameName => ({
                                  gameName,
                                  validateStatus: validatedUnknown
                              }))
                          }))
                    : null;
                this.validateAll().catch(e => console.warn(e));
            });
    }

    async validateAll() {
        if (this.validationIsInProgress) {
            return;
        }
        const champions = this.champions;
        if (!champions) {
            return;
        }
        for (const champion of champions) {
            for (const questToValidate of champion.validatedQuests) {
                const game = this.props.store.index.quests.find(
                    x => x.gameName === questToValidate.gameName
                );
                if (!game) {
                    questToValidate.validateStatus = "failed";
                    continue;
                }
                try {
                    questToValidate.validateStatus = "inprogress";

                    const thisGameProofs =
                        champion.gamesWonProofs[questToValidate.gameName];

                    const validationResult = await this.worker.checkQuest({
                        questUrl: DATA_DIR + game.filename,
                        logs: thisGameProofs
                    });
                    questToValidate.validateStatus =
                        validationResult === "validated"
                            ? "validated"
                            : "failed";
                } catch (e) {
                    console.warn(`Champion failed: `, e);
                    questToValidate.validateStatus = "failed";
                }
                if (!this.mounted) {
                    return;
                }
            }
        }
    }

    render() {
        const store = this.props.store;
        const l = store.l;
        const champions = this.champions;
        // console.info(champions);
        return (
            <DivFadeinCss
                key="champions"
                className="text-center container my-3"
            >
                {champions ? (
                    <div>
                        <div className="mb-3">
                            {!this.validationIsInProgress ? (
                                <h5>{l.validationComplete}</h5>
                            ) : (
                                <i>{l.validatingInfo}</i>
                            )}
                        </div>

                        <table className="table table-responsive">
                            <thead>
                                <tr>
                                    <th>{l.championName}</th>
                                    <th>{l.championWonGames}</th>
                                    <th>{l.championGameNames}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {champions
                                    .slice()
                                    .sort((a, b) => {
                                        return (
                                            b.validatedQuests.filter(
                                                x =>
                                                    x.validateStatus !==
                                                    "failed"
                                            ).length -
                                            a.validatedQuests.filter(
                                                x =>
                                                    x.validateStatus !==
                                                    "failed"
                                            ).length
                                        );
                                    })
                                    .map(champion => {
                                        try {
                                            const nonFailedValidatedCount = champion.validatedQuests.filter(
                                                x =>
                                                    x.validateStatus !==
                                                    "failed"
                                            ).length;
                                            const championIsValidating =
                                                champion.validatedQuests.filter(
                                                    x =>
                                                        x.validateStatus ===
                                                        "inprogress"
                                                ).length > 0;
                                            const championHaveValidatedQuests =
                                                champion.validatedQuests.filter(
                                                    x =>
                                                        x.validateStatus ===
                                                        "validated"
                                                ).length > 0;
                                            const itIsYou =
                                                store.firebaseLoggedIn &&
                                                champion.userId ===
                                                    store.firebaseLoggedIn.uid;
                                            const name =
                                                (champion.info &&
                                                    champion.info.name) ||
                                                l.championNoName;
                                            return (
                                                <tr key={champion.userId}>
                                                    <td>
                                                        {itIsYou ? (
                                                            <b>{name}</b>
                                                        ) : (
                                                            name
                                                        )}
                                                    </td>
                                                    <td
                                                        className={
                                                            !championIsValidating &&
                                                            championHaveValidatedQuests
                                                                ? "text-success"
                                                                : ""
                                                        }
                                                    >
                                                        {
                                                            nonFailedValidatedCount
                                                        }{" "}
                                                        {!championIsValidating &&
                                                        championHaveValidatedQuests ? (
                                                            <i className="fa fa-check" />
                                                        ) : championIsValidating ? (
                                                            <i className="fa fa-spin fa-spinner" />
                                                        ) : null}
                                                        <br />
                                                    </td>
                                                    <td>
                                                        {champion.validatedQuests.map(
                                                            (gameInfo, idx) => {
                                                                const comma =
                                                                    idx === 0
                                                                        ? ""
                                                                        : ", ";

                                                                const gameInfoView =
                                                                    gameInfo.validateStatus ===
                                                                    "validated" ? (
                                                                        <a
                                                                            href={`#/quests/${
                                                                                gameInfo.gameName
                                                                            }`}
                                                                        >
                                                                            {
                                                                                gameInfo.gameName
                                                                            }
                                                                        </a>
                                                                    ) : gameInfo.validateStatus ===
                                                                    "inprogress" ? (
                                                                        <span className="champions-blink text-warning">
                                                                            {
                                                                                gameInfo.gameName
                                                                            }
                                                                        </span>
                                                                    ) : gameInfo.validateStatus ===
                                                                    "failed" ? (
                                                                        <span>
                                                                            <s>
                                                                                {
                                                                                    gameInfo.gameName
                                                                                }
                                                                            </s>
                                                                        </span>
                                                                    ) : gameInfo.validateStatus ===
                                                                    "unknown" ? (
                                                                        <span>
                                                                            {
                                                                                gameInfo.gameName
                                                                            }
                                                                        </span>
                                                                    ) : (
                                                                        assertNever(
                                                                            gameInfo.validateStatus
                                                                        )
                                                                    );
                                                                return (
                                                                    <>
                                                                        {comma}
                                                                        {
                                                                            gameInfoView
                                                                        }
                                                                    </>
                                                                );
                                                            }
                                                        )}
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
