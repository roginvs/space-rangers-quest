import * as React from "react";
import * as ReactDOM from "react-dom";

import { QM } from "../lib/qmreader";
import { QMPlayer, GameState, QMImages } from "../lib/qmplayer";
import { GAME_NAME } from "./gamelist";

import "./game.css";

import * as ReactCSSTransitionGroup from "react-addons-css-transition-group";

import { DATA_DIR } from "./consts";

const GAME_STATE = "SpaceRangesGameState";
const MUSIC_STATE = "SpaceRangesMusicIsOff";

class TransitionInOpacity extends React.Component<{}, {}> {
    render() {
        return (
            <ReactCSSTransitionGroup
                transitionName="gamebyopacity"
                transitionEnterTimeout={300}
                transitionLeave={false}
            >
                {this.props.children}
            </ReactCSSTransitionGroup>
        );
    }
}

/* TODO: 
    - На узких сделать картинку сверху
    - Теги везде
*/
export class GamePlay extends React.Component<
    {
        player: QMPlayer;
        gameName: string;
        lang: "rus" | "eng";
        musicList: string[];
        onReturn: (gameName: string) => void;
        onPassed: () => void;
    },
    {
        music: boolean;
        jumpsCountForAnimation: number;
        // game: GameState
    }
> {
    constructor(props: any) {
        super(props);
        this.state = {
            music: localStorage.getItem(MUSIC_STATE) ? false : true,
            jumpsCountForAnimation: 0
        };
        const oldGame = localStorage.getItem(GAME_NAME);
        if (oldGame === this.props.gameName) {
            try {
                const oldState = localStorage.getItem(GAME_STATE);
                this.props.player.loadSaving(JSON.parse(oldState || ""));
            } catch (e) {
                console.warn(`Failed to load game`, e);
                this.props.player.start();
            }
        } else {
            this.props.player.start();
        }
        document.location.hash = this.props.gameName;
    }
    private replaceTags(str: string) {
        // Я не знаю как это сделать React-way

        /*  x.match(/\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/)
[ '<format=left,30>текст</format>',
  'left',
  '30',
  'текст',
*/
        let cloneStr = str.slice();

        while (true) {
            const m = cloneStr.match(
                /\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/
            );
            if (!m) {
                break;
            }
            const [textToReplace, whereToPad, howManyPadStr, textInTags] = m;
            const howManyPad = parseInt(howManyPadStr);

            if (
                !(
                    howManyPad &&
                    (whereToPad === "left" ||
                        whereToPad === "right" ||
                        whereToPad === "center")
                )
            ) {
                cloneStr = cloneStr.replace(textToReplace, textInTags);
                continue;
            }
            let newText = textInTags.slice();
            while (true) {
                if (newText.replace(/\<.*?\>/g, "").length >= howManyPad) {
                    break;
                }
                if (whereToPad === "left") {
                    newText = " " + newText;
                } else if (whereToPad === "right") {
                    newText = newText + " ";
                } else {
                    newText =
                        newText.length % 2 ? " " + newText : newText + " ";
                }
            }
            // console.info(`Replacing part '${textToReplace}' to '${newText}'`)
            cloneStr = cloneStr.replace(textToReplace, newText);
        }

        let s =
            "&nbsp" +
            cloneStr
                .replace(/\r\n/g, "<br/>&nbsp")
                .replace(/\n/g, "<br/>&nbsp")
                .replace(/<clr>/g, '<span class="text-success">')
                .replace(/<clrEnd>/g, "</span>")
                .replace(/<fix>/g, '<span class="game-fix">')
                .replace(/<\/fix>/g, "</span>");

        // console.info('Replace', str, s)
        return {
            __html: s
        };
    }

    private jumbotron: HTMLDivElement | null = null;
    private audio: HTMLAudioElement | null = null;
    private play(restart: boolean) {
        if (this.audio) {
            if (!this.audio.src || restart) {
                const i = Math.floor(
                    Math.random() * this.props.musicList.length
                );
                this.audio.src = DATA_DIR + this.props.musicList[i];
            }
        }
    }
    saveState() {
        const gameState = this.props.player.getSaving();
        localStorage.setItem(GAME_STATE, JSON.stringify(gameState));
        localStorage.setItem(GAME_NAME, this.props.gameName);
        localStorage.setItem(MUSIC_STATE, this.state.music ? "" : "off");
    }
    /*
    componentWillMount() {
        document.getElementsByTagName('body')[0].className = 'game'
    }
    componentWillUnmount() {
        document.getElementsByTagName('body')[0].className = ''
    }
    */
    render() {
        try {
            const st = this.props.player.getState();
            if (st.gameState === "win") {
                this.props.onPassed();
            }
            const image = st.imageFileName ? (
                <img
                    className="game-img"
                    src={DATA_DIR + "img/" + st.imageFileName}
                />
            ) : null;
            // <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width="343" height="392" alt="" />
            const choices = st.choices.map(choice => {
                return (
                    <li key={choice.jumpId} className="mb-4">
                        <a
                            href={`#${this.props.gameName}`}
                            onClick={e => {
                                if (this.state.music && this.audio) {
                                    this.audio.play();
                                }

                                // e.preventDefault();
                                this.props.player.performJump(choice.jumpId);
                                this.saveState();
                                if (
                                    this.props.player.getState().gameState ===
                                    "win"
                                ) {
                                    this.props.onPassed();
                                }
                                this.setState({
                                    jumpsCountForAnimation:
                                        this.state.jumpsCountForAnimation + 1
                                }, () => {   
                                    /*                                 
                                    if (this.jumbotron) {
                                        this.jumbotron.scrollIntoView({
                                            block: "start",
                                            behavior: "smooth"
                                        });
                                    }*/                                                      
                                })
                            }}
                            className={
                                "game " + (choice.active ? "" : "disabled")
                            }
                            dangerouslySetInnerHTML={this.replaceTags(
                                choice.text
                            )}
                        />
                    </li>
                );
            });

            const music = this.state.music ? (
                <audio
                    autoPlay={true}
                    controls={false}
                    onEnded={e => this.play(true)}
                    ref={e => {
                        this.audio = e;
                        this.play(false);
                    }}
                />
            ) : null;
            const imagesPreloaded = this.props.player
                .getAllImagesToPreload()
                .map(x => {
                    return (
                        <img
                            key={x}
                            src={DATA_DIR + "img/" + x}
                            style={{ display: "none" }}
                        />
                    );
                });
            return (
                <div>
                    <nav className="navbar navbar-toggleable navbar-inverse bg-inverse">
                        <button
                            className="navbar-toggler navbar-toggler-right"
                            type="button"
                            data-toggle="collapse"
                            data-target="#navbarsExampleDefault"
                            aria-controls="navbarsExampleDefault"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon" />
                        </button>
                        <a className="navbar-brand" href="#">
                            {this.props.gameName}
                        </a>

                        <div
                            className="collapse navbar-collapse"
                            id="navbarsExampleDefault"
                        >
                            <ul className="navbar-nav mr-auto">
                                <li className="nav-item">
                                    <a
                                        className="nav-link"
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            this.props.player.start();
                                            this.forceUpdate();
                                        }}
                                    >
                                        {this.props.lang === "rus"
                                            ? "Сначала"
                                            : "Restart"}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className={
                                            "nav-link " +
                                            (this.state.music
                                                ? ""
                                                : "text-muted")
                                        }
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            this.setState({
                                                music: !this.state.music
                                            }, () => this.saveState())                                            
                                        }}
                                    >
                                        {this.props.lang === "rus"
                                            ? "Музыка"
                                            : "Music"}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link"
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            document.location.hash = "";
                                            this.props.onReturn(
                                                this.props.gameName
                                            );
                                        }}
                                    >
                                        {this.props.lang === "rus"
                                            ? "Выход"
                                            : "Exit"}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    <div id={this.props.gameName}/>
                    <div className="jumbotron" ref={e => (this.jumbotron = e)}>
                        <div className="container">
                            <div className="row mb-1">
                                <div className="col-12 col-sm-8 mb-3">
                                    <TransitionInOpacity>
                                        <div
                                            key={
                                                st.text +
                                                "#" +
                                                this.state
                                                    .jumpsCountForAnimation
                                            }
                                            dangerouslySetInnerHTML={this.replaceTags(
                                                st.text
                                            )}
                                        />
                                    </TransitionInOpacity>
                                </div>
                                <div className="col-12 col-sm-4 flex-first flex-sm-last mb-3">
                                    {imagesPreloaded}
                                    <TransitionInOpacity>
                                        {image}
                                    </TransitionInOpacity>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12 col-sm-8 mb-3">
                                    <TransitionInOpacity>
                                        <ul
                                            key={
                                                choices.join("#") +
                                                "#" +
                                                this.state
                                                    .jumpsCountForAnimation
                                            }
                                        >
                                            {choices}
                                        </ul>
                                    </TransitionInOpacity>
                                </div>
                                <div className="col-12 col-sm-4 flex-first flex-sm-last mb-3">
                                    <TransitionInOpacity>
                                        {([] as string[])
                                            .concat(
                                                ...st.paramsState.map(x =>
                                                    x.split("<br>")
                                                )
                                            )
                                            .map((paramText, index) => {
                                                return (
                                                    <div
                                                        key={
                                                            paramText +
                                                            "###" +
                                                            index
                                                        }
                                                        style={{
                                                            // whiteSpace: "pre",
                                                            textAlign: "center"
                                                        }}
                                                        dangerouslySetInnerHTML={this.replaceTags(
                                                            paramText
                                                        )}
                                                    />
                                                );
                                            })}
                                    </TransitionInOpacity>
                                </div>
                            </div>
                        </div>
                    </div>
                    {music}
                </div>
            );
        } catch (e) {
            console.error(e);
            return (
                <div className="p-3">
                    <div>Error: {e.message}</div>
                    <div>
                        <a
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                this.props.onReturn(this.props.gameName);
                            }}
                        >
                            Выход
                        </a>
                    </div>
                </div>
            );
        }
    }
}
