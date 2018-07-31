import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
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
    DropdownItem,
    Progress
} from "reactstrap";
import moment from "moment";
import { QuestReplaceTags } from "./questReplaceTags";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import classnames from "classnames";

import { DATA_DIR } from "./consts";
import { parse } from "../lib/qmreader";
import * as pako from "pako";

import { observer } from "mobx-react";
import { Store } from "./store";

import "./questPlay.css";

interface QuestPlayState {
    quest?: Quest;
    game?: Game;
    gameState?: GameState;
    questLoadProgress: number;
    playingMobileView: boolean;
    noMusic?: boolean;
}

@observer
export class QuestPlay extends React.Component<
    {
        store: Store;
        gameName: string;
    },
    QuestPlayState
> {
    state: QuestPlayState = {
        playingMobileView: this.isScreenWidthMobile(),
        questLoadProgress: 0
    };
    isScreenWidthMobile() {
        // console.info(`windows innerWidth = ${window.innerWidth}`);
        return window.innerWidth < 576; // 576px 768px
    }

    componentDidMount() {
        window.addEventListener("resize", this.onResize);
        this.loadData();
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.onResize);
        document.getElementsByTagName('body')[0].className = ''
    }
    componentWillMount() {
        document.getElementsByTagName('body')[0].className = 'game'
    }

    async loadData() {
        const game = this.props.store.index.quests.find(
            x => x.gameName === this.props.gameName
        );
        if (!game) {
            location.href = "#";
            return;
        }
        this.setState({
            game
        });
        const noMusic =
            (await await this.props.store.db.getConfigLocal("noMusic")) ||
            undefined;
        this.setState({
            noMusic
        });

        const questArrayBuffer = await new Promise<ArrayBuffer>(
            (resolv, reject) => {
                var xhr = new XMLHttpRequest();
                const url = DATA_DIR + game.filename;
                xhr.open("GET", url);

                xhr.responseType = "arraybuffer";

                xhr.onload = e => {
                    if (xhr.status <= 299) {
                        resolv(xhr.response);
                    } else {
                        reject(new Error(`Url ${url} ${xhr.status}`));
                    }
                };

                xhr.onerror = e => {
                    reject(new Error(e.message));
                };

                xhr.onprogress = e => {
                    this.setState({
                        questLoadProgress: e.loaded / e.total
                    });
                };
                xhr.send();
            }
        );
        const quest = parse(
            new Buffer(pako.ungzip(new Buffer(questArrayBuffer)))
        ) as Quest;

        let gameState = await this.props.store.db.getLocalSaving(
            this.props.gameName
        );
        if (!gameState) {
            gameState = initGame(
                quest,
                Math.random()
                    .toString(36)
                    .slice(2) +
                    Math.random()
                        .toString(36)
                        .slice(2)
            );
        }
        this.setState({
            quest,
            gameState
        });
    }

    onResize = () => {
        const isScreenWidthMobile = this.isScreenWidthMobile();
        if (this.state.playingMobileView !== isScreenWidthMobile) {
            this.setState({
                playingMobileView: isScreenWidthMobile
            });
        }
    };
    render() {
        const { l, player } = this.props.store;
        const quest = this.state.quest;
        const gameState = this.state.gameState;
        const game = this.state.game;
        if (!quest || !gameState || !game) {
            const percents = Math.round(this.state.questLoadProgress * 100);
            return (
                <div className="my-3 container">
                    <div className="text-center">
                        {l.loadingQuest} {percents}%
                    </div>
                    <Progress value={percents} />
                </div>
            );
        }

        const st = getUIState(quest, gameState, player);
        const image = st.imageFileName ? (
            <DivFadeinCss key={st.imageFileName}>
                <img
                    style={{
                        width: "100%"
                    }}
                    src={DATA_DIR + "img/" + st.imageFileName}
                />
            </DivFadeinCss>
        ) : null;

        const imagesPreloaded = getAllImagesToPreload(quest, game.images).map(
            x => {
                return (
                    <img
                        key={x}
                        src={DATA_DIR + "img/" + x}
                        style={{ display: "none" }}
                    />
                );
            }
        );

        const locationText = (
            <DivFadeinCss key={st.text + "#" + gameState.performedJumps.length}>
                <QuestReplaceTags str={st.text}/>
            </DivFadeinCss>
        );

        const choices = (
            <DivFadeinCss key={"#" + gameState.performedJumps.length}>
                {st.choices.map(choice => {
                    return (
                        <div key={choice.jumpId} className="mb-4">
                            <a
                                href={`#/quests/${game.gameName}/play/gameStep${
                                    choice.jumpId
                                }`}
                                onClick={e => {
                                    e.preventDefault();

                                    this.playAudio(false);

                                    const newState = performJump(
                                        choice.jumpId,
                                        quest,
                                        gameState,
                                        game.images
                                    );

                                    this.props.store.db.saveGame(
                                        this.props.gameName,
                                        newState
                                    );
                                    if (
                                        getUIState(quest, newState, player)
                                            .gameState === "win"
                                    ) {
                                        this.props.store.db
                                            .setGamePassing(
                                                this.props.gameName,
                                                getGameLog(newState)
                                            )
                                            .then(() =>
                                                this.props.store.loadWinProofsFromLocal()
                                            );
                                    }

                                    this.setState({
                                        gameState: newState
                                    });
                                    // todo: scroll?
                                }}
                                className={
                                    "game " + (choice.active ? "" : "disabled")
                                }
                            >
                                <i className="fa fa-angle-double-right" />{" "}
                                <QuestReplaceTags str={choice.text}/>
                            </a>
                        </div>
                    );
                })}
            </DivFadeinCss>
        );

        const params = (
            <>
                {([] as string[])
                    .concat(...st.paramsState.map(x => x.split("<br>")))
                    .map((paramText, index) => {
                        return (
                            <DivFadeinCss key={paramText + "###" + index}>
                                <div
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        textAlign: "center",
                                        minHeight: "1em"
                                    }}
                                >
                                    <QuestReplaceTags str={paramText}/>
                                </div>
                            </DivFadeinCss>
                        );
                    })}
            </>
        );

        const isMobile = this.state.playingMobileView;
        const br = "md";

        return (
            <div className="">
                {!this.state.noMusic ? (
                    <audio
                        autoPlay={false}
                        controls={false}
                        onEnded={e => this.playAudio(true)}
                        ref={e => {
                            this.audio = e;
                            this.playAudio(false);
                        }}
                    />
                ) : null}
                <div
                    className=""
                    style={{
                        maxWidth: 992,
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginTop: isMobile ? 0 : "2rem",                        
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: isMobile
                                    ? "column-reverse"
                                    : "row"
                            }}
                        >
                            <div
                                style={{
                                    flexBasis: isMobile
                                    ? "100%"
                                    : `${100 / 3 * 2}%`,
                                flexGrow: 0,
                                flexShrink: 0,
                                    marginRight: isMobile ? 5 : 15,
                                    marginLeft: isMobile ? 5 : 15,
                                    marginTop: isMobile ? 5 : 15,
                                    marginBottom: isMobile ? 5 : 15
                                }}
                            >
                                {locationText}
                            </div>
                            <div
                                style={{                                    
                                    marginRight: isMobile ? 5 : 15,
                                    marginLeft: isMobile ? 5 : 15,
                                    marginTop: isMobile ? 5 : 15,
                                    marginBottom: isMobile ? 5 : 15
                                }}
                            >
                                {imagesPreloaded}
                                {image}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: isMobile
                                    ? "column-reverse"
                                    : "row"
                            }}
                        >
                            <div
                                style={{
                                    flexBasis: isMobile
                                    ? "100%"
                                    : `${100 / 3 * 2}%`,
                                flexGrow: 0,
                                flexShrink: 0,
                                    marginRight: isMobile ? 5 : 15,
                                    marginLeft: isMobile ? 5 : 15,
                                    marginTop: isMobile ? 5 : 15,
                                    marginBottom: isMobile ? 5 : 15
                                }}
                            >
                                {choices}
                            </div>
                            <div
                                style={{                                
                                    marginTop: isMobile ? 25 : 15,
                                    marginBottom: isMobile ? 25 : 15,
                                    //marginRight: isMobile ? 5 : 15,
                                    //marginLeft: isMobile ? 5 : 15,
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                }}
                            >
                                {params}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private audio: HTMLAudioElement | null = null;

    private playAudio(restart: boolean) {
        if (this.audio) {
            if (!this.audio.src || restart) {
                const musicList = this.props.store.index.dir.music.files.map(
                    x => x.path
                );
                const i = Math.floor(Math.random() * musicList.length);
                this.audio.src = DATA_DIR + musicList[i];
            }

            this.audio.play().catch(e => {
                console.warn(
                    `Error with music src='${
                        this.audio ? this.audio.src : "no audio tag"
                    }'`,
                    e
                );
            });
        }
    }
    
}
