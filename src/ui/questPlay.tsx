import * as React from "react";
import { Loader, DivFadeinCss, ErrorInfo } from "./common";
import { LangTexts } from "./lang";
import { WonProofs, GameWonProofs } from "./db/defs";
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
import { PQImages } from "../lib/pqImages";

interface QuestPlayState {
  quest?: Quest;
  game?: Game;
  gameState?: GameState;
  questLoadProgress: number;
  width: number;
  noMusic?: boolean;

  reallyRestart?: boolean;

  error?: Error;

  thinkingSavingGame?: boolean;
  thinkingSavingWin?: boolean;
}

const MOBILE_THRESHOLD = 576; // 576px 768px
@observer
export class QuestPlay extends React.Component<
  {
    store: Store;
    gameName: string;
  },
  QuestPlayState
> {
  state: QuestPlayState = {
    width: window.innerWidth,
    questLoadProgress: 0
  };

  componentDidMount() {
    window.addEventListener("resize", this.onResize);
    this.loadData().catch(e => this.setState({ error: e }));
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    document.getElementsByTagName("body")[0].className = "";
  }
  componentWillMount() {
    document.getElementsByTagName("body")[0].className = "game";
  }

  async loadData() {
    const game = this.props.store.index.quests.find(
      x => x.gameName === this.props.gameName
    );
    if (!game) {
      location.hash = "#";
      return;
    }
    this.setState({
      game
    });
    const noMusic =
      (await this.props.store.db.getConfigLocal("noMusic")) || undefined;
    this.setState({
      noMusic
    });

    const questArrayBuffer = await new Promise<ArrayBuffer>(
      (resolv, reject) => {
        const xhr = new XMLHttpRequest();
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
          reject(new Error(`${xhr.statusText}`));
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
      Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))
    ) as Quest;

    let gameState = await this.props.store.db.getLocalSaving(
      this.props.gameName
    );
    if (!gameState) {
      gameState = initRandomGameAndDoFirstStep(quest, game.images);
    }
    this.setState({
      quest,
      gameState
    });
  }

  onResize = () => {
    const width = window.innerWidth;
    if (this.state.width !== width) {
      this.setState({
        width
      });
    }
  };

  saveGame(gameState: null | GameState) {
    this.setState({
      thinkingSavingGame: true
    });
    this.props.store.db
      .saveGame(this.props.gameName, gameState)
      .catch(e => console.warn(e))
      .then(() =>
        this.setState({
          thinkingSavingGame: false
        })
      )
      .catch(e => console.error(e));
  }
  render() {
    const { l, player } = this.props.store;
    const quest = this.state.quest;
    const gameState = this.state.gameState;
    const game = this.state.game;
    if (this.state.error) {
      return (
        <ErrorInfo error={this.state.error}>
          <a href="#">{l.back}</a>
        </ErrorInfo>
      );
    }

    const isMobile = this.state.width < MOBILE_THRESHOLD;

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

    const imagesPreloaded = getAllImagesToPreload(quest, game.images).map(x => {
      return (
        <img key={x} src={DATA_DIR + "img/" + x} style={{ display: "none" }} />
      );
    });

    const locationText = (
      <DivFadeinCss key={`${st.text}#${gameState.performedJumps.length}`}>
        <QuestReplaceTags str={st.text} />
      </DivFadeinCss>
    );

    const choices = (
      <DivFadeinCss key={`#${gameState.performedJumps.length}`}>
        {st.choices.map(choice => {
          return (
            <div key={choice.jumpId} className="mb-4">
              <a
                href={`#/quests/${game.gameName}/play/gameStep`}
                onClick={e => {
                  e.preventDefault();

                  this.playAudio(false);

                  const newState = performJump(
                    choice.jumpId,
                    quest,
                    gameState,
                    game.images
                  );

                  this.saveGame(newState);

                  if (getUIState(quest, newState, player).gameState === "win") {
                    this.setState({
                      thinkingSavingWin: true
                    });
                    this.props.store.db
                      .setGamePassing(this.props.gameName, getGameLog(newState))
                      .then(() => this.props.store.loadWinProofsFromLocal())
                      .catch(e => console.warn(e))
                      .then(() =>
                        this.setState({
                          thinkingSavingWin: false
                        })
                      )
                      .catch(e => console.warn(e));
                  }

                  this.setState({
                    gameState: newState
                  });
                  //window.scrollTo(0, isMobile ? 44 : 0);
                  window.scrollTo(0, isMobile ? 42 : 0);
                }}
                className={"game " + (choice.active ? "" : "disabled")}
              >
                <i className="fa fa-angle-double-right" />{" "}
                <QuestReplaceTags str={choice.text} />
              </a>
            </div>
          );
        })}
      </DivFadeinCss>
    );

    const paramsStrings = ([] as string[]).concat(
      ...st.paramsState.map(x => x.split("<br>"))
    );

    const params = (
      <>
        {removeSerialEmptyStrings(paramsStrings).map((paramText, index) => {
          return (
            <DivFadeinCss key={`${paramText}###${index}`}>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  textAlign: "center",
                  minHeight: "1em"
                }}
              >
                <QuestReplaceTags str={paramText} />
              </div>
            </DivFadeinCss>
          );
        })}
      </>
    );

    const controlButtons = (
      <>
        <button
          className="btn btn-light mr-1"
          onClick={() => {
            let gameState = this.state.gameState;
            const uiState = gameState
              ? getUIState(quest, gameState, player)
              : undefined;
            if (
              !uiState ||
              uiState.gameState === "dead" ||
              uiState.gameState === "fail" ||
              uiState.gameState === "win"
            ) {
              gameState = initRandomGameAndDoFirstStep(quest, game.images);
              this.setState({
                gameState
              });
              this.saveGame(null);
            } else {
              this.setState({
                reallyRestart: true
              });
            }
          }}
        >
          <i className="fa fa-fast-backward fa-fw" />
        </button>

        <button
          className="btn btn-light mr-1"
          onClick={() => {
            this.setState(
              {
                noMusic: !this.state.noMusic
              },
              () => {
                this.props.store.db
                  .setConfigBoth("noMusic", !!this.state.noMusic)
                  .catch(e => console.warn(e));
              }
            );
          }}
        >
          <i
            className={classnames(
              "fa fa-fw",
              this.state.noMusic ? "fa-volume-off" : "fa-volume-up"
            )}
          />
        </button>

        <button
          className="btn btn-light mr-1"
          onClick={() => {
            location.hash = `/quests/${this.props.gameName}`;
          }}
        >
          {/*<i className="fa fa-share-square-o fa-fw" />*/}
          {/* this.state.thinkingSavingGame || */
          this.state.thinkingSavingWin ? (
            <i className="fa fa-refresh fa-spin fa-fw" />
          ) : (
            <i className="fa fa-external-link fa-fw" />
          )}
        </button>
      </>
    );

    const audioComponent = (
      <audio
        autoPlay={true}
        controls={false}
        onEnded={e => this.playAudio(true)}
        ref={e => {
          this.audio = e;
          this.playAudio(false);
        }}
      />
    );

    return (
      <div className="">
        {!this.state.noMusic ? audioComponent : null}
        <div
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: isMobile ? 0 : "2rem"
          }}
        >
          {this.state.reallyRestart ? (
            <>
              <div className="text-center m-2">
                <div>{l.reallyRestart}</div>
                <div>
                  <button
                    className="btn btn-warning mt-1 mr-1"
                    onClick={() => {
                      const gameState = initRandomGameAndDoFirstStep(
                        quest,
                        game.images
                      );
                      this.setState({
                        reallyRestart: false,
                        gameState
                      });
                      this.saveGame(null);
                    }}
                  >
                    <i className="fa fa-refresh fa-fw" /> {l.yes}
                  </button>

                  <button
                    className="btn btn-secondary mt-1"
                    onClick={() =>
                      this.setState({
                        reallyRestart: false
                      })
                    }
                  >
                    <i className="fa fa-reply fa-fw" /> {l.no}
                  </button>
                </div>
              </div>
            </>
          ) : isMobile ? (
            <>
              <div
                style={{
                  margin: 5,
                  textAlign: "center"
                }}
              >
                {controlButtons}
              </div>

              <div
                style={{
                  margin: 5
                }}
              >
                {imagesPreloaded}
                {image}
              </div>

              <div
                style={{
                  margin: 5
                }}
              >
                {locationText}
              </div>

              <div
                style={{
                  marginTop: 25,
                  marginBottom: 25,
                  marginLeft: "auto",
                  marginRight: "auto"
                }}
              >
                {params}
              </div>

              <div
                style={{
                  margin: 5
                }}
              >
                {choices}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  position: "fixed",
                  right: 15,
                  bottom: 15
                }}
              >
                {controlButtons}
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  marginRight: "auto",
                  width: this.state.width * 0.9
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row"
                  }}
                >
                  <div
                    style={{
                      flex: `0 0 ${(100 / 3) * 2}%`,
                      maxWidth: `${(100 / 3) * 2}%`,
                      boxSizing: "border-box",
                      padding: 15
                    }}
                  >
                    {locationText}
                  </div>
                  <div
                    style={{
                      flex: `0 0 ${100 / 3}%`,
                      maxWidth: `${100 / 3}%`,
                      padding: 15
                    }}
                  >
                    {imagesPreloaded}
                    {image}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row"
                  }}
                >
                  <div
                    style={{
                      flex: `0 0 ${(100 / 3) * 2}%`,
                      maxWidth: `${(100 / 3) * 2}%`,
                      boxSizing: "border-box",
                      padding: 15
                    }}
                  >
                    {choices}
                  </div>
                  <div
                    style={{
                      flex: `0 0 ${100 / 3}%`,
                      maxWidth: `${100 / 3}%`,
                      padding: 15,
                      paddingBottom: 65
                    }}
                  >
                    {params}
                  </div>
                </div>
              </div>
            </>
          )}
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

      const audioPlayPromise = this.audio.play();
      if (audioPlayPromise) {
        audioPlayPromise.catch(e => {
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
}

/*
function scrollToTop(scrollDuration: number, offsetTop = 0) {
    const originalScrollY = window.scrollY;    
    const startedTimestamp = performance.now();
    function step(nowTimestamp: number) {        
        if (nowTimestamp - startedTimestamp >= scrollDuration) {
            window.scrollTo(0, offsetTop);
            return
        }
        if (window.scrollY === offsetTop) {
            return;
        }
        
        const coefficient = Math.cos( (nowTimestamp - startedTimestamp) / scrollDuration * Math.PI / 2);        
        window.scrollTo(
            0,
            (originalScrollY - offsetTop)* coefficient + offsetTop,
        );        
        console.info((originalScrollY - offsetTop)* coefficient + offsetTop);
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}
*/

function initRandomGameAndDoFirstStep(quest: Quest, images: PQImages) {
  let gameState = initGame(
    quest,
    Math.random()
      .toString(36)
      .slice(2) +
      Math.random()
        .toString(36)
        .slice(2)
  );
  gameState = performJump(
    JUMP_I_AGREE,
    quest,
    gameState,
    images,
    new Date().getTime()
  );
  return gameState;
}

function removeSerialEmptyStrings(input: string[]) {
  const output: typeof input = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i]) {
      output.push(input[i]);
    } else {
      if (i + 1 < input.length) {
        // Only add if next is not empty
        if (input[i + 1]) {
          output.push(input[i]);
        }
      } else {
        // last element
        output.push(input[i]);
      }
    }
  }
  return output;
}
