import * as React from "react";
import { observer } from "mobx-react";
import { Store } from "./store";
import { Quest, GameState } from "../lib/qmplayer/funcs";
import { initGame } from "../lib/qmplayer";
import { observable, toJS } from "mobx";
import { parse } from "../lib/qmreader";
import Pako from "pako";
import { QuestPlay } from "./questPlay";

@observer
export class QuestPlayUserQuestController extends React.Component<{
  store: Store;
  userId: string;
  questName: string;
}> {
  @observable
  game: null | string | Quest = null;

  @observable
  gameState: null | GameState = null;

  gameSaveKey: string | null = null;

  @observable
  noMusic = false;

  private async load() {
    const questInfo = await this.props.store.db.loadCustomQuest(
      this.props.userId,
      this.props.questName,
    );
    if (!questInfo) {
      throw new Error("No such quest");
    }
    const quest = parse(Buffer.from(Pako.ungzip(Buffer.from(questInfo.quest_qmm_gz))));
    this.gameSaveKey = `${this.props.userId}/${this.props.questName} ${quest.majorVersion}`;
    const latestLoad = await this.props.store.db.loadCustomGame(this.gameSaveKey);
    this.gameState =
      latestLoad ||
      initGame(quest, Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));

    this.noMusic = !!(await this.props.store.db.getConfigLocal("noMusic"));

    this.game = quest;
  }
  componentDidMount() {
    this.load().catch((e) => {
      this.game = `Error: ${e.message}`;
    });
  }

  render() {
    const l = this.props.store.l;
    if (this.game === null || this.gameState === null) {
      return (
        <div className="my-3 container">
          <div className="text-center">{l.loadingQuest}</div>
        </div>
      );
    }
    if (typeof this.game === "string") {
      return (
        <div className="my-3 container">
          <div className="text-center">
            {this.game}
            TODO: back button
          </div>
        </div>
      );
    }

    return (
      <QuestPlay
        quest={this.game}
        gameState={this.gameState}
        player={toJS(this.props.store.player)}
        setGameState={(newState) => {
          if (this.gameSaveKey) {
            this.props.store.db.saveCustomGame(this.gameSaveKey, newState);
          }
          this.gameState = newState;
        }}
        pqiImages={[]}
        musicList={
          !this.noMusic
            ? this.props.store.index.dir.music.files.map((fileInfo) => fileInfo.path)
            : undefined
        }
        setIsMusic={(newIsMusic) => {
          this.noMusic = !newIsMusic;
          this.props.store.db.setConfigBoth("noMusic", !newIsMusic).catch((e) => console.warn(e));
        }}
        onExit={() => {
          location.hash = `/quests`;
        }}
        busySaving={false}
        l={toJS(this.props.store.l)}
      />
    );
  }
}
