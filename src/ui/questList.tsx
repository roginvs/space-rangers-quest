import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
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
import { observer } from "mobx-react";
import { Store, QUEST_SEARCH_ALL, QUEST_SEARCH_OWN } from "./store";

import { AppNavbar } from "./appNavbar";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import { QuestReplaceTags } from "./questReplaceTags";

interface QuestListState {
    dropdownOpen: boolean;
}

@observer
export class QuestList extends React.Component<
    {
        store: Store;
    },
    QuestListState
> {
    state: QuestListState = {
        dropdownOpen: false
    };
    onScroll = () => {
        this.props.store.lastQuestListScroll = window.scrollY;
    };
    componentWillUnmount() {
        window.removeEventListener("scroll", this.onScroll);
    }
    componentDidMount() {
        window.addEventListener("scroll", this.onScroll);
        if (this.props.store.lastQuestListScroll) {
            window.scrollTo(0, this.props.store.lastQuestListScroll);
        }
    }
    render() {
        const { l, player, index } = this.props.store;
        const passedQuests = this.props.store.wonProofs;
        const store = this.props.store;

        const origins = index.quests
            .filter(x => x.lang === player.lang)
            .map(x => x.questOrigin)
            .reduce(
                (acc, d) => (acc.indexOf(d) > -1 ? acc : acc.concat(d)),
                [] as string[]
            );

        const questsToShow = index.quests
            .filter(quest => quest.lang === player.lang)
            .filter(
                quest =>
                    store.questsListTab !== QUEST_SEARCH_ALL
                        ? quest.questOrigin === store.questsListTab
                        : true
            )
            .map(quest => ({
                ...quest,
                passed: (() => {
                    if (!passedQuests) {
                        return undefined;
                    }
                    const passed = passedQuests.get(quest.gameName);
                    if (
                        typeof passed !== "object" ||
                        Object.keys(passed).length < 1
                    ) {
                        return false;
                    }
                    return true;
                })(),
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
                    store.questsListSearch
                        ? quest.gameName
                              .toLowerCase()
                              .indexOf(store.questsListSearch.toLowerCase()) >
                              -1 ||
                          quest.taskText
                              .toLowerCase()
                              .indexOf(store.questsListSearch.toLowerCase()) >
                              -1
                        : true
            );
        const questsToShowUnpassed = questsToShow.filter(
            x => x.passed === false
        );

        return (
            <AppNavbar store={this.props.store}>
                <DivFadeinCss key="quest list" className="container mb-5">
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
                                        dropdownOpen: !this.state.dropdownOpen
                                    })
                                }
                            >
                                <DropdownToggle color="info" caret block>
                                    {store.questsListTab === QUEST_SEARCH_ALL
                                        ? l.all
                                        : store.questsListTab ===
                                          QUEST_SEARCH_OWN
                                            ? l.own
                                            : store.questsListTab}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem
                                        onClick={() =>
                                            (store.questsListTab = QUEST_SEARCH_ALL)
                                        }
                                    >
                                        {l.all}
                                    </DropdownItem>
                                    <DropdownItem divider />
                                    {origins.map(originName => (
                                        <DropdownItem
                                            key={originName}
                                            onClick={() =>
                                                (store.questsListTab = originName)
                                            }
                                        >
                                            {originName}
                                        </DropdownItem>
                                    ))}
                                    {/*
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
                                    */}
                                </DropdownMenu>
                            </ButtonDropdown>
                        </div>
                        <div className="col-md-6 mb-3">
                            <input
                                className="form-control"
                                value={store.questsListSearch}
                                onChange={e =>
                                    (store.questsListSearch = e.target.value)
                                }
                                onKeyUp={e =>
                                    e.which === 27 /* ESC */
                                        ? (store.questsListSearch = "")
                                        : undefined
                                }
                                placeholder={l.search}
                            />
                        </div>
                    </div>
                    {questsToShow.length > 0 ? (
                        <>
                            {questsToShowUnpassed.length > 0 ? (
                                <button
                                    className="btn btn-block btn-primary mb-3"
                                    style={{
                                        whiteSpace: "normal"
                                    }}
                                    onClick={() => {
                                        const idx = Math.floor(
                                            Math.random() *
                                                questsToShowUnpassed.length
                                        );
                                        const quest = questsToShowUnpassed[idx];
                                        location.href = `#/quests/${
                                            quest.gameName
                                        }`;
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-center">
                                        <span className="mr-1">
                                            <i className="fa fa-random fa-fw" />
                                        </span>
                                        <span>{l.startRandomUnpassed}</span>
                                    </div>
                                </button>
                            ) : null}

                            <div className="list-group">
                                {questsToShow.map(quest => (
                                    <a
                                        href={`#/quests/${quest.gameName}`}
                                        key={quest.gameName}
                                        className="list-group-item list-group-item-action flex-column align-items-start"
                                    >
                                        <div className="d-flex w-100 justify-content-between">
                                            <h5 className="mb-1">
                                                {quest.gameName}
                                            </h5>
                                            <small>
                                                {quest.passed === undefined ? (
                                                    <i className="text-muted fa fa-spin circle-o-notch" />
                                                ) : quest.passed === true ? (
                                                    <span>{l.passed}</span>
                                                ) : null}
                                            </small>
                                        </div>
                                        <p className="mb-1">
                                            <QuestReplaceTags
                                                str={quest.taskText}
                                            />
                                        </p>
                                        <small>{quest.smallDescription}</small>
                                    </a>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <i className="fa fa-circle-o" /> {l.nothingFound}
                        </div>
                    )}
                </DivFadeinCss>
            </AppNavbar>
        );
    }
}
