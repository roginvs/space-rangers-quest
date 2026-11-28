import * as React from "react";
import { Loader, DivFadeinCss, Redirect } from "./common";
import { LangTexts } from "./lang";
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
import {
  getQuestStartLine,
  questStartLineIsEmpty,
  QuestStartLineParts,
} from "../lib/questStartLine";
import { toggleFullscreen } from "./questPlay/fullscreen";
import { getQuestPassedInfo } from "./questPassed";

function QuestStartLineView({ parts }: { parts: QuestStartLineParts }) {
  const chunks: React.ReactNode[] = [];
  if (parts.from && parts.to) {
    chunks.push(
      <span className="quest-start-route" key="route">
        {parts.from}
        <svg className="quest-start-mark" viewBox="0 0 16 6" aria-hidden="true">
          <path d="M0 2.15H9V.35L16 3 9 5.65V3.85H0z" />
        </svg>
        {parts.to}
      </span>,
    );
  } else if (parts.from || parts.to) {
    chunks.push(<span key="route">{parts.from || parts.to}</span>);
  }
  if (parts.who) {
    chunks.push(<span key="who">{parts.who}</span>);
  }
  if (parts.reputation) {
    chunks.push(<span key="reputation">{parts.reputation}</span>);
  }
  return (
    <>
      {chunks.map((chunk, index) => (
        <React.Fragment key={index}>
          {index > 0 ? " · " : null}
          {chunk}
        </React.Fragment>
      ))}
    </>
  );
}

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
    const passedInfo = getQuestPassedInfo(
      this.props.store.wonProofs ? this.props.store.wonProofs.get(gameName) : undefined,
      !!this.props.store.wonProofs,
    );

    return (
      <DivFadeinCss className="container">
        <div className="text-center mb-3">
          <h4>{game.gameName}</h4>
          <div>
            <small>
              {game.lang === "eng"
                ? `Hardness: ${game.hardness} · ${game.questOrigin}`
                : `Сложность: ${game.hardness} · ${game.questOrigin}`}
            </small>
          </div>
          {(() => {
            if (
              typeof game.givingRace !== "number" ||
              typeof game.planetRace !== "number" ||
              typeof game.playerCareer !== "number" ||
              typeof game.playerRace !== "number" ||
              typeof game.reputationChange !== "number"
            ) {
              return null;
            }
            const parts = getQuestStartLine({
              givingRace: game.givingRace,
              planetRace: game.planetRace,
              playerCareer: game.playerCareer,
              playerRace: game.playerRace,
              reputationChange: game.reputationChange,
              lang: game.lang,
            });
            if (questStartLineIsEmpty(parts)) {
              return null;
            }
            return (
              <div>
                <small className="quest-start-line">
                  <QuestStartLineView parts={parts} />
                </small>
              </div>
            );
          })()}
          <div>
            <small>
              {passedInfo.loading ? (
                <i className="text-muted fa fa-spin fa-circle-o-notch" />
              ) : (
                passedInfo.passings.map((x) => (
                  <div key={x.seed}>
                    {l.passed} {new Date(x.end).toLocaleString()} ({x.durationsMins}{" "}
                    {l.minutesShort})
                  </div>
                ))
              )}
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
