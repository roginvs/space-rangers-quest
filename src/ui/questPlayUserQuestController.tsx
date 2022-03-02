import * as React from "react";
import { observer } from "mobx-react";
import { Store } from "./store";
import { Quest, GameState, getUIState } from "../lib/qmplayer/funcs";
import { toJS } from "mobx";
import { parse } from "../lib/qmreader";
import Pako from "pako";
import { QuestPlay } from "./questPlay/questPlay";

interface UserQuestControllerState {
  game: null | string | Quest;

  gameState: null | GameState;

  gameSaveKey: string | null;

  noMusic: boolean;
}

@observer
export class QuestPlayUserQuestController extends React.Component<
  {
    store: Store;
    userId: string;
    questName: string;
  },
  UserQuestControllerState
> {
  state: UserQuestControllerState = {
    game: null,
    gameState: null,
    gameSaveKey: null,
    noMusic: false,
  };

  private async load() {
    const questInfo = await this.props.store.db.loadCustomQuest(
      this.props.userId,
      this.props.questName,
    );
    if (!questInfo) {
      throw new Error("No such quest");
    }
    const quest = parse(
      Buffer.from(Pako.ungzip(Buffer.from(questInfo.quest_qmm_gz_base64, "base64"))),
    );
    const gameSaveKey = `${this.props.userId}/${this.props.questName} ${quest.majorVersion}`;

    let gameState: GameState | null = null;
    const latestLoad = await this.props.store.db.loadCustomGame(gameSaveKey);
    if (latestLoad) {
      try {
        // Verify it is working so UI will not crash
        getUIState(quest, latestLoad, this.props.store.player);
        gameState = latestLoad;
      } catch {}
    }

    const noMusic = !!(await this.props.store.db.getConfigLocal("noMusic"));

    const game = quest;

    this.setState({
      game,
      gameState,
      gameSaveKey,
      noMusic,
    });
  }
  componentDidMount() {
    this.load().catch((e) => {
      this.setState({
        game: `Error: ${e.message}`,
        gameState: null,
        gameSaveKey: null,
      });
    });
  }

  render() {
    const l = this.props.store.l;

    if (typeof this.state.game === "string") {
      return (
        <div className="my-3 container">
          <div className="text-center">
            {this.state.game}
            {/* TODO: back button */}
          </div>
        </div>
      );
    }

    if (this.state.game === null) {
      return (
        <div className="my-3 container">
          <div className="text-center">{l.loadingQuest}</div>
        </div>
      );
    }

    return (
      <QuestPlay
        quest={this.state.game}
        gameState={this.state.gameState}
        player={toJS(this.props.store.player)}
        setGameState={(newState) => {
          if (this.state.gameSaveKey) {
            this.props.store.db.saveCustomGame(this.state.gameSaveKey, newState).catch((e) => {
              console.error(e);
            });
          }
          this.setState({
            gameState: newState,
          });
        }}
        defaultMusicList={this.props.store.defaultMusicList}
        isMusic={!this.state.noMusic}
        setIsMusic={(newIsMusic) => {
          this.setState({
            noMusic: !newIsMusic,
          });
          this.props.store.db.setConfigBoth("noMusic", !newIsMusic).catch((e) => console.warn(e));
        }}
        onExit={() => {
          location.hash = `/quests`;
        }}
        busySaving={false}
        showTaskInfoOnQuestStart={true}
      />
    );
  }
}
