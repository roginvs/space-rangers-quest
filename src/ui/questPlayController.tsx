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
  GameLog,
} from "../lib/qmplayer/funcs";
import { JUMP_I_AGREE } from "../lib/qmplayer/defs";
import { Index, Game } from "../packGameData";
import { AppNavbar } from "./appNavbar";
import { ButtonDropdown, DropdownMenu, DropdownToggle, DropdownItem, Progress } from "reactstrap";
import { QuestReplaceTags } from "./questReplaceTags";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import classnames from "classnames";

import { DATA_DIR } from "./consts";
import { parse } from "../lib/qmreader";
import * as pako from "pako";

import { observer } from "mobx-react";
import { Store } from "./store";

import { PQImages } from "../lib/pqImages";

import { QuestPlay } from "./questPlay";
import { toJS } from "mobx";

interface QuestPlayState {
  quest?: Quest;
  game?: Game;
  gameState?: GameState;
  questLoadProgress: number;
  noMusic?: boolean;

  error?: Error;

  thinkingSavingGame?: boolean;
  thinkingSavingWin?: boolean;
}

@observer
export class QuestPlayController extends React.Component<
  {
    store: Store;
    gameName: string;
  },
  QuestPlayState
> {
  state: QuestPlayState = {
    questLoadProgress: 0,
  };

  componentDidMount() {
    this.loadData().catch((e) => this.setState({ error: e }));
  }
  componentWillUnmount() {
    document.getElementsByTagName("body")[0].className = "";
  }
  componentWillMount() {
    document.getElementsByTagName("body")[0].className = "game";
  }

  async loadData() {
    const game = this.props.store.index.quests.find((x) => x.gameName === this.props.gameName);
    if (!game) {
      location.hash = "#";
      return;
    }
    this.setState({
      game,
    });
    const noMusic = (await this.props.store.db.getConfigLocal("noMusic")) || undefined;
    this.setState({
      noMusic,
    });

    const questArrayBuffer = await new Promise<ArrayBuffer>((resolv, reject) => {
      const xhr = new XMLHttpRequest();
      const url = DATA_DIR + game.filename;
      xhr.open("GET", url);

      xhr.responseType = "arraybuffer";

      xhr.onload = (e) => {
        if (xhr.status <= 299) {
          resolv(xhr.response);
        } else {
          reject(new Error(`Url ${url} ${xhr.status}`));
        }
      };

      xhr.onerror = (e) => {
        reject(new Error(`${xhr.statusText}`));
      };

      xhr.onprogress = (e) => {
        this.setState({
          questLoadProgress: e.loaded / e.total,
        });
      };
      xhr.send();
    });
    const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))) as Quest;

    let gameState = await this.props.store.db.getLocalSaving(this.props.gameName);
    if (!gameState) {
      gameState = initRandomGameAndDoFirstStep(quest, game.images);
    }
    this.setState({
      quest,
      gameState,
    });
  }

  saveGame(gameState: null | GameState) {
    this.setState({
      thinkingSavingGame: true,
    });
    this.props.store.db
      .saveGame(this.props.gameName, gameState)
      .catch((e) => console.warn(e))
      .then(() =>
        this.setState({
          thinkingSavingGame: false,
        }),
      )
      .catch((e) => console.error(e));
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

    return (
      <QuestPlay
        quest={quest}
        gameState={gameState}
        player={toJS(player)}
        setGameState={(newState) => {
          this.saveGame(newState);

          if (getUIState(quest, newState, player).gameState === "win") {
            this.setState({
              thinkingSavingWin: true,
            });
            this.props.store.db
              .setGamePassing(this.props.gameName, getGameLog(newState))
              .then(() => this.props.store.loadWinProofsFromLocal())
              .catch((e) => console.warn(e))
              .then(() =>
                this.setState({
                  thinkingSavingWin: false,
                }),
              )
              .catch((e) => console.warn(e));
          }

          this.setState({
            gameState: newState,
          });
        }}
        pqiImages={game.images}
        musicList={
          !this.state.noMusic
            ? this.props.store.index.dir.music.files.map((fileInfo) => fileInfo.path)
            : undefined
        }
        setIsMusic={(newIsMusic) => {
          this.setState(
            {
              noMusic: !newIsMusic,
            },
            () => {
              this.props.store.db
                .setConfigBoth("noMusic", !!this.state.noMusic)
                .catch((e) => console.warn(e));
            },
          );
        }}
        onExit={() => {
          location.hash = `/quests/${this.props.gameName}`;
        }}
        busySaving={!!this.state.thinkingSavingWin}
        l={toJS(this.props.store.l)}
      />
    );
  }
}

function initRandomGameAndDoFirstStep(quest: Quest, images: PQImages) {
  let gameState = initGame(
    quest,
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
  );
  gameState = performJump(JUMP_I_AGREE, quest, gameState, images, new Date().getTime());
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
