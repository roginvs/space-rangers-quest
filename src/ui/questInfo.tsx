import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB, WonProofs, GameWonProofs } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import {
    GameState,
    initGame,
    performJump,
    Quest,
    getUIState,
    getAllImagesToPreload,
    getGameLog,
    GameLog
} from "../lib/qmplayer/funcs";
import { JUMP_I_AGREE } from "../lib/qmplayer/defs";
import { Index, Game } from "../packGameData";
import { AppNavbar } from "./appNavbar";
import {
    ButtonDropdown,
    DropdownMenu,
    DropdownToggle,
    DropdownItem
} from "reactstrap";
import {
    HashRouter,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";
import moment from "moment";
import { replaceTags } from "./questReplaceTags";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import classnames from "classnames";

import { DATA_DIR } from "./consts";
import { parse } from "../lib/qmreader";
import * as pako from "pako";
import { QuestPlay } from "./questPlay";

export class QuestInfoRouter extends React.Component<
    {
        l: LangTexts;
        index: Index;
        player: Player;
        db: DB;
        firebaseLoggedIn: firebase.User | null | undefined;
        firebaseSyncing: boolean | undefined;
    },
    {}
> {
    render() {
        const { l, firebaseLoggedIn, player, index, db } = this.props;
        return (
            <Route
                exact
                path={"/quests/:gameName/:playing?"}
                render={prop => {
                    const gameName = prop.match.params.gameName;
                    const isPlaying = prop.match.params.playing === "play";

                    const game = index.quests.find(
                        x => x.gameName === gameName
                    );
                    if (!game) {
                        return <Redirect to="#/" />;
                    }
                    return (
                        <QuestInfo
                            key={gameName}
                            {...this.props}
                            gameName={gameName}
                            game={game}
                            isPlaying={isPlaying}
                            onPlayChange={newPlaying =>
                                prop.history.push(
                                    `/quests/${gameName}` +
                                        (newPlaying ? "/play" : "")
                                )
                            }
                        />
                    );
                }}
            />
        );
    }
}

interface QuestInfoState {
    passedQuest?: GameWonProofs | null;
    lastSavedGameState?: GameState | null;
    gameInfoLoaded?: boolean;
    error?: string | Error;
    noMusic?: boolean;
}
class QuestInfo extends React.Component<
    {
        l: LangTexts;
        index: Index;
        player: Player;
        db: DB;
        firebaseLoggedIn: firebase.User | null | undefined;
        firebaseSyncing: boolean | undefined;
        gameName: string;
        game: Game;
        isPlaying: boolean;
        onPlayChange: (newPlaying: boolean) => void;
    },
    QuestInfoState
> {
    state: QuestInfoState = {};

    loadComments = () => {
        // TODO
    };

    private loadWinningState() {
        this.setState({
            passedQuest: undefined
        });
        this.props.db
            .isGamePassedLocal(this.props.gameName)
            .catch(e => undefined)
            .then(passedQuest => this.setState({ passedQuest }));
    }

    componentDidMount() {
        if (this.props.isPlaying) {
            // this.props.onPlayChange(false);
        } else {
            this.loadComments();
        }

        this.loadWinningState();

        (async () => {
            const lastSavedGameState = await this.props.db
                .getLocalSaving(this.props.gameName)
                .catch(e => undefined);
            const noMusic =
                (await this.props.db
                    .getConfigLocal("noMusic")
                    .catch(e => undefined)) || undefined;
            this.setState({
                lastSavedGameState,
                gameInfoLoaded: true,
                noMusic
            });
        })().catch(e => this.setState({ error: e }));
    }

    render() {
        const {
            l,
            index,
            player,
            db,
            firebaseLoggedIn,
            isPlaying,
            game
        } = this.props;

        const passedQuest = this.state.passedQuest;
        if (this.state.error) {
            return (
                <AppNavbar
                    l={l}
                    player={player}
                    firebaseLoggedIn={firebaseLoggedIn}
                    firebaseSyncing={this.props.firebaseSyncing}
                >
                    <div className="text-center text-danger">
                        {this.state.error.toString()}
                    </div>
                </AppNavbar>
            );
        }

        if (!isPlaying) {
            return (
                <AppNavbar
                    l={l}
                    player={player}
                    firebaseLoggedIn={firebaseLoggedIn}
                    firebaseSyncing={this.props.firebaseSyncing}
                >
                    <DivFadeinCss className="container">
                        <div className="text-center mb-3">
                            <h4>{game.gameName}</h4>
                            <div>
                                <small>{game.smallDescription}</small>
                            </div>
                            <div>
                                <small>
                                    {(() => {
                                        // copy-paste from questList
                                        if (passedQuest === undefined) {
                                            return (
                                                <i className="text-muted fa fa-spin circle-o-notch" />
                                            );
                                        }

                                        if (
                                            passedQuest === null ||
                                            typeof passedQuest !== "object" ||
                                            Object.keys(passedQuest).length < 1
                                        ) {
                                            return;
                                        }
                                        return Object.keys(passedQuest).map(k => {
                                            const log = passedQuest[k];
                                            const firstStep = log.performedJumps
                                                .slice(0)
                                                .shift();
                                            const lastStep = log.performedJumps
                                                .slice(-1)
                                                .shift();
                                            if (!firstStep || !lastStep) {
                                                return null;
                                            }
                                            const durationsMins = Math.ceil(
                                                ((new Date(
                                                    lastStep.dateUnix
                                                ).getTime() -
                                                    new Date(
                                                        firstStep.dateUnix
                                                    ).getTime()) /
                                                    (1000 * 60 * 60)                                                    
                                            ));
                                            return {
                                                started: firstStep.dateUnix,
                                                end: lastStep.dateUnix,
                                                durationsMins,
                                                k
                                            }                                                                                        
                                        })
                                        .filter(x => x)
                                        .sort((a,b) => {
                                            if (a === null || b === null) {
                                                return 0
                                            } else {
                                                return a.started - b.started
                                            }
                                        }).map(x => x ? <div key={x.k}>
                                            {l.passed}{" "}
                                            {moment(
                                                x.end
                                            ).format("lll")}{" "}
                                            ({x.durationsMins}{" "}
                                            {l.minutesShort})
                                        </div> : null);
                                                                    })()}
                                </small>
                            </div>
                        </div>
                        <div className="mb-3">
                            {replaceTags(
                                substitute(
                                    game.taskText,
                                    {
                                        ...player,
                                        Day: `${DEFAULT_DAYS_TO_PASS_QUEST}`,
                                        Date: SRDateToString(
                                            DEFAULT_DAYS_TO_PASS_QUEST,
                                            player.lang
                                        ),
                                        CurDate: SRDateToString(0, player.lang)
                                    },
                                    [],
                                    n =>
                                        n !== undefined
                                            ? Math.floor(Math.random() * n)
                                            : Math.random()
                                )
                            )}
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <button
                                    className={classnames(
                                        "btn btn-block mb-2",
                                        {
                                            "btn-primary":
                                                this.state.gameInfoLoaded &&
                                                !this.state.lastSavedGameState
                                        }
                                    )}
                                    onClick={async () => {
                                        this.props.db.saveGame(
                                            this.props.gameName,
                                            null
                                        );
                                        this.props.onPlayChange(true);
                                    }}
                                >
                                    <i className="fa fa-rocket" />{" "}
                                    {l.startFromTheStart}
                                </button>
                            </div>
                            <div className="col-md-6">
                                <button
                                    className={classnames(
                                        "btn btn-block mb-2",
                                        {
                                            "btn-primary":
                                                this.state.gameInfoLoaded &&
                                                this.state.lastSavedGameState,
                                            disabled: !this.state
                                                .lastSavedGameState
                                        }
                                    )}
                                    onClick={async () => {
                                        this.props.onPlayChange(true);
                                    }}
                                >
                                    {!this.state.gameInfoLoaded ? (
                                        <i className="fa fa-spin fa-spinner" />
                                    ) : this.state.lastSavedGameState ? (
                                        <>
                                            <i className="fa fa-save" />{" "}
                                            {l.startFromLastSave}
                                        </>
                                    ) : (
                                        <>
                                            {" "}
                                            <i className="fa fa-circle-o" />{" "}
                                            {l.noLastSave}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </DivFadeinCss>
                </AppNavbar>
            );
        }

        return (
            <QuestPlay
                l={this.props.l}
                index={this.props.index}
                player={this.props.player}
                game={this.props.game}
                loadInitialState={async () => {
                    const saving = await this.props.db
                        .getLocalSaving(this.props.gameName)
                        .catch(e => undefined);
                    return saving || undefined;
                }}
                onStateChange={newGameState => {
                    this.props.db.saveGame(this.props.gameName, newGameState);
                    this.setState({
                        lastSavedGameState: newGameState
                    });
                }}
                onReturn={() => {
                    this.props.onPlayChange(false);
                }}
                onWin={winningProof => {
                    this.props.db.setGamePassing(
                        this.props.gameName,
                        winningProof
                    );
                    this.loadWinningState();
                }}
                noMusic={this.state.noMusic || false}
                onNoMusicChange={newNoMusic => {
                    this.setState({
                        noMusic: newNoMusic
                    });
                    this.props.db.setConfigBoth("noMusic", newNoMusic);
                }}
            />
        );
    }
}
