import * as React from "react";
import { Loader, DivFadeinCss, Redirect } from "./common";
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
import moment from "moment";
import { QuestReplaceTags } from "./questReplaceTags";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import classnames from "classnames";

import { DATA_DIR } from "./consts";
import { parse } from "../lib/qmreader";
import * as pako from "pako";
import { QuestPlay } from "./questPlay";
import { observer } from "mobx-react";
import { Store } from "./store";

interface QuestInfoState {
  lastSavedGameState?: GameState | null;
  error?: string | Error;
}

@observer
export class QuestInfo extends React.Component<
  {
    store: Store;
    gameName: string;
  },
  QuestInfoState
> {
  state: QuestInfoState = {};
  componentDidMount() {
    this.props.store.db
      .getLocalSaving(this.props.gameName)
      .then(x => x || null)
      .catch(e => null)
      .then(lastSavedGameState =>
        this.setState({
          lastSavedGameState
        })
      )
      .catch(e => console.warn(e));
    window.scrollTo(0, 0);
  }
  render() {
    const { l, player, index, db } = this.props.store;

    const gameName = this.props.gameName;
    const game = index.quests.find(x => x.gameName === gameName);
    if (!game) {
      return <Redirect to="#/" />;
    }
    const passedQuest = this.props.store.wonProofs
      ? this.props.store.wonProofs.get(gameName)
      : null;

    return (
      <AppNavbar store={this.props.store}>
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
                    // tslint:disable-next-line:strict-type-predicates
                    typeof passedQuest !== "object" ||
                    Object.keys(passedQuest).length < 1
                  ) {
                    return;
                  }
                  return Object.keys(passedQuest)
                    .map(k => {
                      const log = passedQuest[k];
                      const firstStep = log.performedJumps.slice(0).shift();
                      const lastStep = log.performedJumps.slice(-1).shift();
                      if (!firstStep || !lastStep) {
                        return null;
                      }
                      const durationsMins = Math.ceil(
                        (new Date(lastStep.dateUnix).getTime() -
                          new Date(firstStep.dateUnix).getTime()) /
                          (1000 * 60)
                      );
                      return {
                        started: firstStep.dateUnix,
                        end: lastStep.dateUnix,
                        durationsMins,
                        k
                      };
                    })
                    .filter(x => x)
                    .sort((a, b) => {
                      if (a === null || b === null) {
                        return 0;
                      } else {
                        return a.started - b.started;
                      }
                    })
                    .map(x =>
                      x ? (
                        <div key={x.k}>
                          {l.passed} {new Date(x.end).toLocaleString()} (
                          {x.durationsMins} {l.minutesShort})
                          {/*
                                                        {new Date(x.started).toLocaleString()} - {
                                                            new Date(x.end).toLocaleString()}
                                                        */}
                        </div>
                      ) : null
                    );
                })()}
              </small>
            </div>
          </div>
          <div className="mb-3">
            <QuestReplaceTags
              str={substitute(
                game.taskText,
                {
                  ...player,
                  Day: `${DEFAULT_DAYS_TO_PASS_QUEST}`,
                  Date: SRDateToString(DEFAULT_DAYS_TO_PASS_QUEST, player.lang),
                  CurDate: SRDateToString(0, player.lang)
                },
                [],
                n =>
                  // tslint:disable-next-line:strict-type-predicates
                  n !== undefined
                    ? Math.floor(Math.random() * n)
                    : Math.random()
              )}
            />
          </div>
          <div className="row">
            <div className="col-md-4">
              <button
                className={classnames("btn btn-block mb-2", {
                  "btn-primary": !this.state.lastSavedGameState
                })}
                onClick={async () => {
                  await this.props.store.db.saveGame(this.props.gameName, null);
                  location.hash = `/quests/${gameName}/play`;
                }}
              >
                <i className="fa fa-rocket" /> {l.startFromTheStart}
              </button>
            </div>
            <div className="col-md-4">
              <button
                className={classnames("btn btn-block mb-2", {
                  "btn-primary": !!this.state.lastSavedGameState,
                  disabled: !this.state.lastSavedGameState
                })}
                onClick={async () => {
                  location.hash = `/quests/${gameName}/play`;
                }}
              >
                {this.state.lastSavedGameState === undefined ? (
                  <i className="fa fa-spin fa-spinner" />
                ) : this.state.lastSavedGameState ? (
                  <>
                    <i className="fa fa-save" /> {l.startFromLastSave}
                  </>
                ) : (
                  <>
                    {" "}
                    <i className="fa fa-circle-o" /> {l.noLastSave}
                  </>
                )}
              </button>
            </div>

            <div className="col-md-4">
              <button
                className={classnames("btn btn-block btn-ligth mb-2")}
                onClick={async () => {
                  location.hash = `/quests`;
                }}
              >
                <i className="fa fa-reply" /> {l.backToList}
              </button>
            </div>
          </div>
        </DivFadeinCss>
      </AppNavbar>
    );
  }
}

/*
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
*/
