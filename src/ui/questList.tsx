import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB, WonProofs } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import { Index, Game } from "../packGameData";
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
import { AppNavbar } from "./appNavbar";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import moment from "moment";
import { replaceTags } from './questPlay';

interface QuestListState {
    tab: string;
    search: string;
    dropdownOpen: boolean;
    passedQuests?: WonProofs;
}

const ALL = "all";
const OWN = "own";

export class QuestListRouter extends React.Component<
    {
        l: LangTexts;
        index: Index;
        player: Player;
        db: DB;
        firebaseLoggedIn: firebase.User | null | undefined;
    },
    QuestListState
> {
    state: QuestListState = {
        tab: ALL,
        search: "",
        dropdownOpen: false
    };
    componentDidMount() {
        this.props.db
            .getOwnWonGames()
            .then(passedQuests => this.setState({ passedQuests }))
            .catch(e => undefined);
    }
    render() {
        const { l, firebaseLoggedIn, player, index } = this.props;
        const passedQuests = this.state.passedQuests;

        const origins = index.quests
            .filter(x => x.lang === this.props.player.lang)
            .map(x => x.questOrigin)
            .reduce(
                (acc, d) => (acc.indexOf(d) > -1 ? acc : acc.concat(d)),
                [] as string[]
            );

        const questsToShow = index.quests
            .filter(quest => quest.lang === player.lang)
            .filter(
                quest =>
                    this.state.tab !== ALL
                        ? quest.questOrigin === this.state.tab
                        : true
            )
            .map(quest => ({
                ...quest,
                taskText: substitute(
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
                )
            }))
            .filter(
                quest =>
                    this.state.search
                        ? quest.gameName
                              .toLowerCase()
                              .indexOf(this.state.search.toLowerCase()) > -1 ||
                          quest.taskText
                              .toLowerCase()
                              .indexOf(this.state.search.toLowerCase()) > -1
                        : true
            );

        return (
            <Route
                exact
                path={"/quests/"}
                render={prop => {
                    return (
                        <>
                            <AppNavbar
                                l={l}
                                player={player}
                                firebaseLoggedIn={firebaseLoggedIn}
                            />
                            <DivFadeinCss
                                key="quest list"
                                className="container"
                            >
                                <div className="text-center mb-3">
                                    <h5>{l.welcomeHeader}</h5>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <ButtonDropdown
                                            style={{
                                                display: "block"
                                            }}
                                            isOpen={this.state.dropdownOpen}
                                            toggle={() =>
                                                this.setState({
                                                    dropdownOpen: !this.state
                                                        .dropdownOpen
                                                })
                                            }
                                        >
                                            <DropdownToggle
                                                color="info"
                                                caret
                                                block
                                            >
                                                {this.state.tab === ALL
                                                    ? l.all
                                                    : this.state.tab === OWN
                                                        ? l.own
                                                        : this.state.tab}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem
                                                    onClick={() =>
                                                        this.setState({
                                                            tab: ALL
                                                        })
                                                    }
                                                >
                                                    {l.all}
                                                </DropdownItem>
                                                <DropdownItem divider />
                                                {origins.map(originName => (
                                                    <DropdownItem
                                                        key={originName}
                                                        onClick={() =>
                                                            this.setState({
                                                                tab: originName
                                                            })
                                                        }
                                                    >
                                                        {originName}
                                                    </DropdownItem>
                                                ))}
                                                <DropdownItem divider />
                                                <DropdownItem
                                                    onClick={() =>
                                                        this.setState({
                                                            tab: OWN
                                                        })
                                                    }
                                                >
                                                    {l.own}
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </ButtonDropdown>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <input
                                            className="form-control"
                                            value={this.state.search}
                                            onChange={e =>
                                                this.setState({
                                                    search: e.target.value
                                                })
                                            }
                                            placeholder={l.search}
                                        />
                                    </div>
                                </div>
                                {questsToShow.length > 0 ? (
                                    <div className="list-group">
                                        {questsToShow.map(quest => (
                                            <a
                                                href={`#/quests/${
                                                    quest.gameName
                                                }`}
                                                key={quest.gameName}
                                                className="list-group-item list-group-item-action flex-column align-items-start"
                                            >
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h5 className="mb-1">
                                                        {quest.gameName}
                                                    </h5>
                                                    <small>
                                                        {(() => {
                                                            if (!passedQuests) {
                                                                return (
                                                                    <i className="text-muted fa fa-spin circle-o-notch" />
                                                                );
                                                            }
                                                            const passed =
                                                                passedQuests[
                                                                    quest
                                                                        .gameName
                                                                ];
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
                                                                    ).format(
                                                                        "lll"
                                                                    )}
                                                                </span>
                                                            );
                                                        })()}
                                                    </small>
                                                </div>
                                                <p className="mb-1">
                                                    {replaceTags(
                                                        quest.taskText
                                                    )}
                                                </p>
                                                <small>
                                                    {quest.smallDescription}
                                                </small>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <i className="fa fa-circle-o" />{" "}
                                        {l.nothingFound}
                                    </div>
                                )}
                            </DivFadeinCss>
                        </>
                    );
                }}
            />
        );
    }
}
