import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB, WonProofs } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import { GameState } from "../lib/qmplayer/funcs";
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
import classnames from 'classnames';

export class QuestPlayRouter extends React.Component<
    {
        l: LangTexts;
        index: Index;
        player: Player;
        db: DB;
        firebaseLoggedIn: firebase.User | null | undefined;
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

                    return (
                        <QuestPlay
                            key={gameName}
                            {...this.props}
                            gameName={gameName}
                            isPlaying={isPlaying}
                        />
                    );
                }}
            />
        );
    }
}

interface QuestPlayState {
    passedQuests?: WonProofs;
    gameState?: GameState | null;
    gameStateLoaded?: boolean;
}
class QuestPlay extends React.Component<
    {
        l: LangTexts;
        index: Index;
        player: Player;
        db: DB;
        firebaseLoggedIn: firebase.User | null | undefined;
        gameName: string;
        isPlaying: boolean;
    },
    QuestPlayState
> {
    state: QuestPlayState = {};

    loadComments = () => {
        // todo
    };
    componentDidMount() {
        this.loadComments();

        this.props.db
            .getOwnWonGames()
            .then(passedQuests => this.setState({ passedQuests }))
            .catch(e => undefined);
        this.props.db
            .getSavedGame(this.props.gameName)
            .catch(e => undefined)
            .then(gameState => this.setState({ gameState, gameStateLoaded: true }));
    }
    render() {
        const {
            l,
            index,
            player,
            db,
            firebaseLoggedIn,
            gameName,
            isPlaying
        } = this.props;

        const quest = index.quests.find(
            x => x.gameName === this.props.gameName
        );
        if (!quest) {
            return <Redirect to="#/" />;
        }
        const passedQuests = this.state.passedQuests;
        if (!isPlaying) {
            return (
                <>
                    <AppNavbar
                        l={l}
                        player={player}
                        firebaseLoggedIn={firebaseLoggedIn}
                    />
                    <DivFadeinCss className="container">
                        <div className="text-center mb-3">
                            <h4>{quest.gameName}</h4>
                            <div>
                                <small>{quest.smallDescription}</small>
                            </div>
                            <div>
                                <small>
                                    {(() => {
                                        // copy-paste from questList
                                        if (!passedQuests) {
                                            return (
                                                <i className="text-muted fa fa-spin circle-o-notch" />
                                            );
                                        }
                                        const passed =
                                            passedQuests[quest.gameName];
                                        const lastStep = passed
                                            ? passed.performedJumps
                                                  .slice(-1)
                                                  .shift()
                                            : undefined;
                                        if (!lastStep) {
                                            return null;
                                        }

                                        return (
                                            <span>
                                                {l.passed}{" "}
                                                {moment(
                                                    lastStep.date.toISOString()
                                                ).format("lll")}
                                            </span>
                                        );
                                    })()}
                                </small>
                            </div>
                        </div>
                        <div className="mb-3">
                            {replaceTags(substitute(
                    quest.taskText,
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
                ))}
                        </div>
                        <div className="row">
    <div className="col-md-6">
    <button className={classnames("btn btn-block", {
        "btn-primary": this.state.gameStateLoaded && ! this.state.gameState,        
    })}>
    <i className="fa fa-rocket"/>{" "}{l.startFromTheStart}
    </button>
    </div>
    <div className="col-md-6">
    <button className={classnames("btn btn-block", {
        "btn-primary": this.state.gameStateLoaded && this.state.gameState,
        "disabled": ! this.state.gameState,
    })}>
    {!this.state.gameStateLoaded ? <Loader/> :
    this.state.gameState ? <><i className="fa fa-save"/>{" "}{l.startFromLastSave}</>:
    <> <i className="fa fa-circle-o"/>{" "}{l.noLastSave}</>}    
    </button>
    </div>
                        </div>
                    </DivFadeinCss>
                </>
            );
        }
        return <div>TODO</div>;
    }
}
