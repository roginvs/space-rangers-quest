import * as React from "react";
import { PQImages } from "../lib/pqImages";
import { Quest, GameState, getUIState, getAllImagesToPreload } from "../lib/qmplayer/funcs";
import { initGame, performJump, JUMP_I_AGREE } from "../lib/qmplayer";
import { Player } from "../lib/qmplayer/player";
import { DATA_DIR } from "./consts";
import { Loader, DivFadeinCss, ErrorInfo } from "./common";
import { QuestReplaceTags } from "./questReplaceTags";
import classnames from "classnames";

import "./questPlay.css";
import { Music } from "./questPlay.music";
import { LangTexts } from "./lang";
import { QuestPlayImage } from "./questPlay.image";
import { DeepImmutable } from "../lib/qmplayer/deepImmutable";

export function initRandomGame(quest: Quest) {
  const gameState = initGame(
    quest,
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
  );
  return gameState;
}
export function initRandomGameAndDoFirstStep(quest: Quest) {
  const gameState = performJump(JUMP_I_AGREE, quest, initRandomGame(quest), new Date().getTime());
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

const MOBILE_THRESHOLD = 576; // 576px 768px

const MAX_DESKTOP_WIDTH = 1300;

function getImageUrl(name: string) {
  if (name.startsWith("http://") || name.startsWith("https://")) {
    return name;
  }

  return DATA_DIR + "img/" + name;
}

export function QuestPlay({
  quest,
  gameState,
  setGameState,
  player,

  musicList,
  setIsMusic,

  l,

  onExit,
  busySaving,

  showTaskInfoOnQuestStart,
}: {
  quest: Quest;

  gameState: GameState;

  player: DeepImmutable<Player>;

  setGameState: (newGameState: GameState) => void;

  musicList: string[] | undefined;
  setIsMusic: (isMusic: boolean) => void;

  l: LangTexts;

  onExit: () => void;
  busySaving?: boolean;

  showTaskInfoOnQuestStart?: boolean;
}) {
  const [windowInnerWidth, setWindowInnerWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const onResize = () => {
      setWindowInnerWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [reallyRestart, setReallyRestart] = React.useState(false);

  const isMobile = windowInnerWidth < MOBILE_THRESHOLD;

  const uistate = getUIState(quest, gameState, player);

  const imageUrl = uistate.imageFileName ? getImageUrl(uistate.imageFileName) : null;
  const allImagesUrls = getAllImagesToPreload(quest).map((x) => getImageUrl(x));

  const isMusic = !!musicList;

  const locationText = (
    <DivFadeinCss key={`${uistate.text}#${gameState.performedJumps.length}`}>
      <QuestReplaceTags str={uistate.text} />
    </DivFadeinCss>
  );

  const choices = (
    <DivFadeinCss key={`#${gameState.performedJumps.length}`}>
      {uistate.choices.map((choice) => {
        return (
          <div key={choice.jumpId} className="mb-4">
            <a
              href={location.href}
              onClick={(e) => {
                e.preventDefault();
                const newState = performJump(choice.jumpId, quest, gameState);
                setGameState(newState);

                //window.scrollTo(0, isMobile ? 44 : 0);
                window.scrollTo(0, isMobile ? 42 : 0);
              }}
              className={"game " + (choice.active ? "" : "disabled")}
            >
              <i className="fa fa-angle-double-right" /> <QuestReplaceTags str={choice.text} />
            </a>
          </div>
        );
      })}
    </DivFadeinCss>
  );

  const paramsStrings = ([] as string[]).concat(...uistate.paramsState.map((x) => x.split("<br>")));

  const params = (
    <>
      {removeSerialEmptyStrings(paramsStrings).map((paramText, index) => {
        return (
          <DivFadeinCss key={`${paramText}###${index}`}>
            <div
              style={{
                whiteSpace: "pre-wrap",
                textAlign: "center",
                minHeight: "1em",
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
          const uiState = getUIState(quest, gameState, player);
          if (
            !uiState ||
            uiState.gameState === "dead" ||
            uiState.gameState === "fail" ||
            uiState.gameState === "win"
          ) {
            const newGameState = showTaskInfoOnQuestStart
              ? initRandomGame(quest)
              : initRandomGameAndDoFirstStep(quest);
            setGameState(newGameState);
          } else {
            setReallyRestart(true);
          }
          /*
          let gameState = this.state.gameState;
          const uiState = gameState ? getUIState(quest, gameState, player) : undefined;
          if (
            !uiState ||
            uiState.gameState === "dead" ||
            uiState.gameState === "fail" ||
            uiState.gameState === "win"
          ) {
            gameState = initRandomGameAndDoFirstStep(quest, game.images);
            this.setState({
              gameState,
            });
            this.saveGame(null);
          } else {
            this.setState({
              reallyRestart: true,
            });
          }
          */
        }}
      >
        <i className="fa fa-fast-backward fa-fw" />
      </button>

      <button
        className="btn btn-light mr-1"
        onClick={() => {
          setIsMusic(!isMusic);
        }}
      >
        <i className={classnames("fa fa-fw", !isMusic ? "fa-volume-off" : "fa-volume-up")} />
      </button>

      <button className="btn btn-light mr-1" onClick={onExit}>
        {/*<i className="fa fa-share-square-o fa-fw" />*/}
        {
          /* this.state.thinkingSavingGame || */
          busySaving ? (
            <i className="fa fa-refresh fa-spin fa-fw" />
          ) : (
            <i className="fa fa-external-link fa-fw" />
          )
        }
      </button>
    </>
  );

  return (
    <div className="">
      {isMusic && musicList ? (
        <Music urls={musicList.map((fileName) => DATA_DIR + fileName)} />
      ) : null}
      <div
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: isMobile ? 0 : "2rem",
        }}
      >
        {reallyRestart ? (
          <>
            <div className="text-center m-2">
              <div>{l.reallyRestart}</div>
              <div>
                <button
                  className="btn btn-warning mt-1 mr-1"
                  onClick={() => {
                    const newGameState = showTaskInfoOnQuestStart
                      ? initRandomGame(quest)
                      : initRandomGameAndDoFirstStep(quest);
                    setGameState(newGameState);
                    setReallyRestart(false);
                  }}
                >
                  <i className="fa fa-refresh fa-fw" /> {l.yes}
                </button>

                <button className="btn btn-secondary mt-1" onClick={() => setReallyRestart(false)}>
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
                textAlign: "center",
              }}
            >
              {controlButtons}
            </div>

            <div
              style={{
                margin: 5,
              }}
            >
              <QuestPlayImage src={imageUrl} allImagesUrls={allImagesUrls} />
            </div>

            <div
              style={{
                margin: 5,
              }}
            >
              {locationText}
            </div>

            <div
              style={{
                marginTop: 25,
                marginBottom: 25,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {params}
            </div>

            <div
              style={{
                margin: 5,
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
                bottom: 15,
              }}
            >
              {controlButtons}
            </div>
            <div
              style={{
                marginLeft: "auto",
                marginRight: "auto",
                width: Math.min(windowInnerWidth * 0.9, MAX_DESKTOP_WIDTH),
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <div
                  style={{
                    flex: `0 0 ${(100 / 3) * 2}%`,
                    maxWidth: `${(100 / 3) * 2}%`,
                    boxSizing: "border-box",
                    padding: 15,
                  }}
                >
                  {locationText}
                </div>
                <div
                  style={{
                    flex: `0 0 ${100 / 3}%`,
                    maxWidth: `${100 / 3}%`,
                    padding: 15,
                  }}
                >
                  <QuestPlayImage src={imageUrl} allImagesUrls={allImagesUrls} />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <div
                  style={{
                    flex: `0 0 ${(100 / 3) * 2}%`,
                    maxWidth: `${(100 / 3) * 2}%`,
                    boxSizing: "border-box",
                    padding: 15,
                  }}
                >
                  {choices}
                </div>
                <div
                  style={{
                    flex: `0 0 ${100 / 3}%`,
                    maxWidth: `${100 / 3}%`,
                    padding: 15,
                    paddingBottom: 65,
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
