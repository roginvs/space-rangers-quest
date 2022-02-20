import * as React from "react";
import { Loader, DivFadeinCss, Redirect } from "./common";
import { LangTexts } from "./lang";
import { WonProofs, GameWonProofs } from "./db/defs";
import { Player, Lang } from "../lib/qmplayer/player";
import {
  GameState,
  initGame,
  performJump,
  Quest,
  getUIState,
  getGameLog,
  GameLog,
} from "../lib/qmplayer/funcs";
import { JUMP_I_AGREE } from "../lib/qmplayer/defs";
import { Index, Game } from "../packGameData/defs";
import { AppNavbar } from "./appNavbar";
import { ButtonDropdown, DropdownMenu, DropdownToggle, DropdownItem } from "reactstrap";
import { QuestReplaceTags } from "./questReplaceTags";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import classnames from "classnames";

import { observer } from "mobx-react";
import { Store } from "./store";
import { getGameTaskText } from "../lib/getGameTaskText";
import { toggleFullscreen } from "./questPlay/fullscreen";

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
      .then((x) => x || null)
      .catch((e) => null)
      .then((lastSavedGameState) =>
        this.setState({
          lastSavedGameState,
        }),
      )
      .catch((e) => console.warn(e));
    window.scrollTo(0, 0);
  }
  render() {
    const { l, player, index, db } = this.props.store;

    const gameName = this.props.gameName;
    const game = index.quests.find((x) => x.gameName === gameName);
    if (!game) {
      return <Redirect to="#/" />;
    }
    const passedQuest = this.props.store.wonProofs
      ? this.props.store.wonProofs.get(gameName)
      : null;

    return (
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
                  return <i className="text-muted fa fa-spin circle-o-notch" />;
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
                  .map((k) => {
                    const log = passedQuest[k];
                    const firstStep = log.performedJumps.slice(0).shift();
                    const lastStep = log.performedJumps.slice(-1).shift();
                    if (!firstStep || !lastStep) {
                      return null;
                    }
                    const durationsMins = Math.ceil(
                      (new Date(lastStep.dateUnix).getTime() -
                        new Date(firstStep.dateUnix).getTime()) /
                        (1000 * 60),
                    );
                    return {
                      started: firstStep.dateUnix,
                      end: lastStep.dateUnix,
                      durationsMins,
                      k,
                    };
                  })
                  .filter((x) => x)
                  .sort((a, b) => {
                    if (a === null || b === null) {
                      return 0;
                    } else {
                      return a.started - b.started;
                    }
                  })
                  .map((x) =>
                    x ? (
                      <div key={x.k}>
                        {l.passed} {new Date(x.end).toLocaleString()} ({x.durationsMins}{" "}
                        {l.minutesShort})
                        {/*
                                                        {new Date(x.started).toLocaleString()} - {
                                                            new Date(x.end).toLocaleString()}
                                                        */}
                      </div>
                    ) : null,
                  );
              })()}
            </small>
          </div>
        </div>
        <div className="mb-3 bootstrap-style">
          <QuestReplaceTags str={getGameTaskText(game.taskText, player)} />
        </div>
        <div className="row">
          <div className="col-md-4">
            <button
              className={classnames("btn btn-block mb-2", {
                "btn-primary": !this.state.lastSavedGameState,
              })}
              onClick={() => {
                this.props.store.db
                  .saveGame(this.props.gameName, null)
                  .then(() => {
                    location.hash = `/quests/${gameName}/play`;
                  })
                  .catch((e) => console.error(e));
                toggleFullscreen(true);
              }}
            >
              <i className="fa fa-rocket" /> {l.startFromTheStart}
            </button>
          </div>
          <div className="col-md-4">
            <button
              className={classnames("btn btn-block mb-2", {
                "btn-primary": !!this.state.lastSavedGameState,
                disabled: !this.state.lastSavedGameState,
              })}
              onClick={() => {
                location.hash = `/quests/${gameName}/play`;
                toggleFullscreen(true);
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
    );
  }
}
