import * as React from "react";
import { PQImages } from "../lib/pqImages";
import { Quest, GameState, getUIState } from "../lib/qmplayer/funcs";
import { getAllMediaFromQmm } from "../lib/getAllMediaFromQmm";
import { initGame, performJump, JUMP_I_AGREE } from "../lib/qmplayer";
import { Player } from "../lib/qmplayer/player";
import { Loader, DivFadeinCss, ErrorInfo } from "./common";
import { QuestReplaceTags } from "./questReplaceTags";
import classnames from "classnames";

import "./questPlay.css";
import { Music } from "./questPlay.music";
import { LangTexts } from "./lang";
import { QuestPlayImage, QuestPlayImageFixed } from "./questPlay.image";
import { DeepImmutable } from "../lib/qmplayer/deepImmutable";
import { transformMedianameToUrl } from "./transformMediaNameToUrl";
import { DATA_DIR } from "./consts";
import { Sound } from "./questPlay.sound";
import { ScrollableContainer } from "./questPlay.scrollcontainer";
import { QuestPlayFrame } from "./questPlay.frame";
import { IMAGE_SIZE_X, IMAGE_SIZE_Y } from "./questPlay.consts";
import { style } from "./questPlay.style";

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

export function QuestPlay({
  quest,
  gameState,
  setGameState,
  player,

  defaultMusicList,
  isMusic,
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

  defaultMusicList: string[] | undefined;
  isMusic: boolean;
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

  const imageUrl = transformMedianameToUrl(uistate.imageName, "img");
  const allImagesUrls = Object.keys(getAllMediaFromQmm(quest).images).map((imageName) =>
    transformMedianameToUrl(imageName, "img"),
  );

  const locationText = (
    <DivFadeinCss key={`${uistate.text}#${gameState.performedJumps.length}`}>
      <QuestReplaceTags str={uistate.text} clrColor={!isMobile ? style.textColorCrl : undefined} />
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
              style={{
                color: !isMobile
                  ? choice.active
                    ? style.textColor
                    : style.textColorInactive
                  : undefined,
              }}
            >
              <i className="fa fa-angle-double-right" />{" "}
              <QuestReplaceTags
                str={choice.text}
                clrColor={!isMobile && choice.active ? style.textColorCrl : undefined}
              />
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
              <QuestReplaceTags
                str={paramText}
                clrColor={!isMobile ? style.textColorCrl : undefined}
              />
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

  const musicAndSound = (
    <>
      {isMusic ? (
        uistate.trackName ? (
          <Music
            urls={[transformMedianameToUrl(uistate.trackName, "track")]}
            key={uistate.trackName}
          />
        ) : defaultMusicList ? (
          <Music
            urls={defaultMusicList.map(
              (fileName) =>
                // defaultMusicList is provided as list of ["music/trackName.mp3"]
                // so transformMedianameToUrl will not work
                DATA_DIR + fileName,
            )}
          />
        ) : null
      ) : null}

      {isMusic && uistate.soundName ? <Sound url={uistate.soundName} /> : null}
    </>
  );

  if (!isMobile) {
    return (
      <div
        style={{
          height: "100vh",
          position: "relative",
          backgroundImage: "url('/questplay/background.jpg')",
          backgroundSize: "cover",
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            maxWidth: 1300,
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `calc(100% - ${IMAGE_SIZE_X}px - 20px - 20px)`,
              height: `calc(${IMAGE_SIZE_Y}px + 20px + 20px)`,
            }}
          >
            <QuestPlayFrame onTop={true} left={60} right={50} top={60} bottom={60}>
              <ScrollableContainer>
                <div style={{ color: style.textColor, padding: 10, paddingRight: 30 }}>
                  {locationText}
                </div>
              </ScrollableContainer>
            </QuestPlayFrame>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: `calc(${IMAGE_SIZE_X}px + 20px + 20px)`,
              height: `calc(${IMAGE_SIZE_Y}px + 20px + 20px)`,
            }}
          >
            <QuestPlayFrame onTop={false} left={20} right={20} top={20} bottom={10}>
              <QuestPlayImageFixed src={imageUrl} allImagesUrls={allImagesUrls} />
            </QuestPlayFrame>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: `calc(100% - ${IMAGE_SIZE_X}px - 20px - 20px)`,
              height: `calc(100% - ${IMAGE_SIZE_Y}px - 20px - 20px)`,
            }}
          >
            <QuestPlayFrame onTop={true} left={60} right={50} top={60} bottom={60}>
              <ScrollableContainer>
                <div style={{ color: style.textColor, padding: 10, paddingRight: 30 }}>
                  {choices}
                </div>
              </ScrollableContainer>
            </QuestPlayFrame>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: `calc(${IMAGE_SIZE_X}px + 20px + 20px)`,
              height: `calc(100% - ${IMAGE_SIZE_Y}px - 20px - 20px)`,
            }}
          >
            <QuestPlayFrame onTop={true} left={20} right={20} top={30} bottom={30}>
              <ScrollableContainer>
                <div
                  style={{
                    color: style.textColor,
                    padding: 10,
                    paddingRight: 30,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  {params}
                </div>
              </ScrollableContainer>
            </QuestPlayFrame>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {musicAndSound}
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
