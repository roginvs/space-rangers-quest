import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";

import { parse } from "../lib/qmreader";
import * as pako from "pako";

import { observer } from "mobx-react";
import { observable } from "mobx";
import { Store } from "./store";
import { FirebasePublic } from "./db";
import { DATA_DIR } from "./consts";
import {
    GameState,
    initGame,
    performJump,
    Quest,
    getUIState,
    getAllImagesToPreload,
    getGameLog,
    GameLog,
    validateWinningLog
} from "../lib/qmplayer/funcs";

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
    @observable validationComplete = false;

    wasUnmounted = false;
    componentWillUnmount() {
        this.wasUnmounted = true;
    }

    async validateAll() {
        if (this.validating) {
            return;
        }
        const champions = this.champions;
        if (!champions) {
            return;
        }
        for (const champion of champions) {
            try {
                for (const { gameName, idx } of Object.keys(
                    champion.gamesWonProofs
                ).map((gameName, idx) => ({ gameName, idx }))) {
                    this.validating = {
                        userId: champion.userId,
                        currentQuestGameName: gameName,
                        currentQuestNumber: idx
                    };

                    const game = this.props.store.index.quests.find(
                        x => x.gameName === gameName
                    );
                    if (!game) {
                        throw new Error(`No game ${gameName}`);
                    }
                    const questArrayBuffer = await fetch(
                        DATA_DIR + game.filename
                    ).then(x => x.arrayBuffer());
                    const quest = parse(
                        new Buffer(pako.ungzip(new Buffer(questArrayBuffer)))
                    ) as Quest;

                    let gameValidated = false;
                    const wons = champion.gamesWonProofs[gameName];
                    for (const gameSeed of Object.keys(wons)) {
                        if (validateWinningLog(quest, wons[gameSeed])) {
                            gameValidated = true;
                            break;
                        }
                    }

                    if (!gameValidated) {
                        throw new Error(
                            `User ${
                                champion.userId
                            } not validated game=${gameName} from ${
                                Object.keys(wons).length
                            } seeds!`
                        );
                    }

                    if (this.wasUnmounted) {
                        return;
                    }
                }

                champion.validatedStatus = "success";
            } catch (e) {
                console.warn(`Champion failed: `, e);
                champion.validatedStatus = "failed";
            }
        }
        this.validating = undefined;
        this.validationComplete = true;
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
                            {!this.validating ? (
                                <button
                                    className="btn btn-primary px-3"
                                    onClick={() => this.validateAll()}
                                >
                                    <i className="fa fa-fw fa-search" />
                                    {l.validateResult}
                                </button>
                            ) : (
                                <h5>
                                    {this.validationComplete
                                        ? l.validationComplete
                                        : l.validatingInfo}
                                </h5>
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
                                    .filter(
                                        champion =>
                                            champion.validatedStatus ===
                                                undefined ||
                                            champion.validatedStatus ===
                                                "success"
                                    )
                                    .map(champion => {
                                        try {
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
                                                            champion.validatedStatus ===
                                                            "success"
                                                                ? "text-success"
                                                                : champion.validatedStatus ===
                                                                  "failed"
                                                                    ? "text-danger"
                                                                    : ""
                                                        }
                                                    >
                                                        {champion.gamesWonCount}{" "}
                                                        {champion.validatedStatus ===
                                                        "success" ? (
                                                            <i className="fa fa-check" />
                                                        ) : champion.validatedStatus ===
                                                        "failed" ? (
                                                            <i className="fa fa-times" />
                                                        ) : null}
                                                        <br />
                                                    </td>
                                                    <td>
                                                        {this.validating &&
                                                        this.validating
                                                            .userId ===
                                                            champion.userId ? (
                                                            <span>
                                                                <i className="fa fa-spin fa-spinner fa-fw" />{" "}
                                                                {
                                                                    l.validatingQuest
                                                                }{" "}
                                                                {
                                                                    this
                                                                        .validating
                                                                        .currentQuestGameName
                                                                }{" "}
                                                                {
                                                                    this
                                                                        .validating
                                                                        .currentQuestNumber
                                                                }/{
                                                                    Object.keys(
                                                                        champion.gamesWonProofs
                                                                    ).length
                                                                }
                                                            </span>
                                                        ) : (
                                                            Object.keys(
                                                                champion.gamesWonProofs
                                                            ).map(
                                                                (
                                                                    gameName,
                                                                    idx
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            gameName
                                                                        }
                                                                    >
                                                                        {idx !==
                                                                        0
                                                                            ? ", "
                                                                            : ""}
                                                                        {champion.validatedStatus ===
                                                                        "success" ? (
                                                                            <a
                                                                                href={`#/quests/${gameName}`}
                                                                            >
                                                                                {
                                                                                    gameName
                                                                                }
                                                                            </a>
                                                                        ) : (
                                                                            gameName
                                                                        )}
                                                                    </span>
                                                                )
                                                            )
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
