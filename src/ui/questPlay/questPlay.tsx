import * as React from "react";
import { Quest, GameState, getUIState } from "../../lib/qmplayer/funcs";
import { getAllMediaFromQmm } from "../../lib/getAllMediaFromQmm";
import { initGame, performJump, JUMP_I_AGREE } from "../../lib/qmplayer";
import { Player } from "../../lib/qmplayer/player";
import { Loader, DivFadeinCss, ErrorInfo } from "../common";
import { QuestReplaceTags } from "../questReplaceTags";
import classnames from "classnames";

import "./questPlay.css";
import { Music } from "./questPlay.music";
import { getLang, LangTexts } from "../lang";
import { QuestPlayImageMobile, QuestPlayImageDesktop } from "./questPlay.image";
import { DeepImmutable } from "../../lib/qmplayer/deepImmutable";
import { transformMedianameToUrl } from "./transformMediaNameToUrl";
import { DATA_DIR } from "../consts";
import { Sound } from "./questPlay.sound";
import { ScrollableContainer } from "./questPlay.scrollcontainer";
import { QuestPlayFrameImage, QuestPlayFrameText } from "./questPlay.frame";
import {
  FRAME_BORDER_DESKTOP_X,
  FRAME_BORDER_DESKTOP_Y,
  FRAME_BORDER_MOBILE_X,
  FRAME_BORDER_MOBILE_Y,
  NATIVE_IMAGE_SIZE_X,
  NATIVE_IMAGE_SIZE_Y,
} from "./questPlay.consts";
import { GamePlayButton } from "./questPlay.button";
import { useDarkTheme } from "./questPlay.metatheme";
import { toggleFullscreen } from "./fullscreen";
import { brAndNobrTags } from "./brAndNobrTags";

function initRandomGame(quest: Quest, doFirstStep: boolean) {
  const gameState = initGame(
    quest,
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
  );
  if (!doFirstStep) {
    return gameState;
  }
  const afterFirstStep = performJump(JUMP_I_AGREE, quest, gameState, new Date().getTime());
  return afterFirstStep;
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

/**
 * Remembers states, clears history on quest state
 */
function usePrevGameState<T extends object, Q extends object>(quest: T, state: Q | null): Q | null {
  const statesHistory = React.useRef<{
    quest: T;
    states: Q[];
  }>({
    quest,
    states: [],
  });
  if (quest !== statesHistory.current.quest) {
    statesHistory.current = {
      quest,
      states: [],
    };
  }

  if (!state) {
    statesHistory.current.states = [];
    return null;
  }

  // First, ensure that current state is always last
  if (statesHistory.current.states.slice(-1).shift() !== state) {
    statesHistory.current.states.push(state);
  }

  // console.info(`States`, statesHistory.current.states);

  // No state to revert
  if (statesHistory.current.states.length === 1) {
    return null;
  }

  // Check that current state is not from the past. If so, then remove all changes after this from the history
  // A B C D E F D -> A B C D
  const thisStateIndex = statesHistory.current.states.indexOf(state);
  if (thisStateIndex < statesHistory.current.states.length - 1) {
    statesHistory.current.states.splice(thisStateIndex);
  }

  const prevState = statesHistory.current.states.slice(-2).shift();
  if (prevState === undefined) {
    return null;
  }
  return prevState;
}

const MOBILE_THRESHOLD = 768; // 576px 768px

const MAX_DESKTOP_WIDTH = 1300;

export function QuestPlay({
  quest,
  gameState,
  setGameState,
  player,

  defaultMusicList,
  isMusic,
  setIsMusic,

  onExit,
  busySaving,

  showTaskInfoOnQuestStart,
}: {
  quest: Quest;

  gameState: GameState | null;

  player: DeepImmutable<Player>;

  setGameState: (newGameState: GameState) => void;

  defaultMusicList: string[] | undefined;
  isMusic: boolean;
  setIsMusic: (isMusic: boolean) => void;

  onExit: () => void;
  busySaving?: boolean;

  showTaskInfoOnQuestStart: boolean;
}) {
  const l = getLang(player.lang);

  const [windowInnerWidth, setWindowInnerWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const onResize = () => {
      setWindowInnerWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useDarkTheme();

  const [reallyRestart, setReallyRestart] = React.useState(false);
  React.useEffect(() => setReallyRestart(false), [quest, gameState, player]);

  const isMobile = windowInnerWidth < MOBILE_THRESHOLD;

  React.useEffect(() => {
    if (!gameState) {
      const newGameState = initRandomGame(quest, !showTaskInfoOnQuestStart);
      setGameState(newGameState);
    }
  }, [gameState, setGameState]);

  const previousGameState = usePrevGameState(quest, gameState);

  const backButtonContent = <i className="fa fa-fw fa-step-backward" />;
  const onBackButtonClick = React.useCallback(() => {
    if (previousGameState) {
      setGameState(previousGameState);
    }
  }, [previousGameState, setGameState]);

  const exitButtonContent = busySaving ? (
    <i className="fa fa-refresh fa-spin fa-fw" />
  ) : (
    <i className="fa fa-sign-out fa-fw" />
  );
  const musicButtonContent = (
    <i className={classnames("fa fa-fw", !isMusic ? "fa-volume-off" : "fa-volume-up")} />
  );
  const onMusicButtonClick = React.useCallback(() => {
    setIsMusic(!isMusic);
  }, [isMusic]);

  const restartButtonContent = <i className="fa fa-fast-backward fa-fw" />;

  const onRestartButtonClick = React.useCallback(() => {
    if (!gameState) {
      return;
    }
    const uiState = getUIState(quest, gameState, player);
    if (
      !uiState ||
      uiState.gameState === "dead" ||
      uiState.gameState === "fail" ||
      uiState.gameState === "win" ||
      reallyRestart
    ) {
      const newGameState = initRandomGame(quest, false);
      setGameState(newGameState);
      setReallyRestart(false);
    } else {
      setReallyRestart(true);
    }
  }, [gameState, quest, player, showTaskInfoOnQuestStart, reallyRestart]);

  const fullscreenButtonContent = <i className="fa fa-arrows-alt fa-fw" />;
  const onFullscreenButtonClick = React.useCallback(() => {
    toggleFullscreen();
  }, []);

  if (!gameState) {
    return null;
  }

  const uistate = getUIState(quest, gameState, player);

  const imageUrl = transformMedianameToUrl(uistate.imageName, "img");
  const allImagesUrls = Object.keys(getAllMediaFromQmm(quest).images).map((imageName) =>
    transformMedianameToUrl(imageName, "img"),
  );

  const locationText = (
    <DivFadeinCss
      key={`${uistate.text}#${gameState.performedJumps.length}`}
      style={{
        overflowX: "auto",
      }}
    >
      <QuestReplaceTags str={uistate.text} />
    </DivFadeinCss>
  );

  const choices = (
    <DivFadeinCss key={`#${gameState.performedJumps.length}`}>
      {uistate.choices.map((choice) => {
        return (
          <div key={choice.jumpId} className={isMobile ? "mb-4" : "mb-3"}>
            <a
              href={location.href}
              onClick={(e) => {
                e.preventDefault();
                if (!choice.active) {
                  return;
                }
                const newState = performJump(choice.jumpId, quest, gameState);
                setGameState(newState);

                if (isMobile) {
                  // Timeout to allow the re-render to finish
                  // This is to solve case when there was no image but next state have image
                  setTimeout(
                    () =>
                      window.scrollTo({
                        left: 0,
                        top: 58,
                        behavior: "smooth",
                      }),
                    10,
                  );
                } else {
                  // Desktop version do not have scroll
                }
              }}
              className={choice.active ? "" : "game-inactive"}
            >
              <i className="fa fa-angle-double-right" /> <QuestReplaceTags str={choice.text} />
            </a>
          </div>
        );
      })}
    </DivFadeinCss>
  );

  const paramsStrings = brAndNobrTags(uistate.paramsState);

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

      {isMusic && uistate.soundName ? (
        <Sound url={transformMedianameToUrl(uistate.soundName, "sound")} />
      ) : null}
    </>
  );

  const frameBorderX = isMobile ? FRAME_BORDER_MOBILE_X : FRAME_BORDER_DESKTOP_X;
  const frameBorderY = isMobile ? FRAME_BORDER_MOBILE_Y : FRAME_BORDER_DESKTOP_Y;

  const reallyRestartContent = reallyRestart ? (
    <QuestPlayFrameText fitHeight={true} frameBorderX={frameBorderX} frameBorderY={frameBorderY}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <div style={{ marginBottom: 10 }}>{l.reallyRestart}</div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GamePlayButton
            onClick={() => {
              const newGameState = initRandomGame(quest, false);
              setGameState(newGameState);
              setReallyRestart(false);
            }}
            ariaLabel={l.yes}
          >
            {l.yes}
          </GamePlayButton>
          <GamePlayButton onClick={() => setReallyRestart(false)} ariaLabel={l.no}>
            {l.no}
          </GamePlayButton>
        </div>
      </div>
    </QuestPlayFrameText>
  ) : null;

  if (!isMobile) {
    const IMAGE_SIZE_X = NATIVE_IMAGE_SIZE_X + 2 * frameBorderX;
    const IMAGE_SIZE_Y = NATIVE_IMAGE_SIZE_Y + 2 * frameBorderY;

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
        className="game-root"
      >
        {musicAndSound}
        <div
          style={{
            maxWidth: MAX_DESKTOP_WIDTH,
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `calc(100% - ${IMAGE_SIZE_X}px)`,
              height: `calc(${IMAGE_SIZE_Y}px)`,
            }}
          >
            <QuestPlayFrameText
              fitHeight={true}
              frameBorderX={frameBorderX}
              frameBorderY={frameBorderY}
            >
              <div style={{ padding: 5, paddingBottom: 10, height: "100%" }}>
                <ScrollableContainer key={uistate.text}>{locationText}</ScrollableContainer>
              </div>
            </QuestPlayFrameText>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: `calc(100% - ${IMAGE_SIZE_X}px)`,
              height: `calc(100% - ${IMAGE_SIZE_Y}px)`,
            }}
          >
            <QuestPlayFrameText
              fitHeight={true}
              frameBorderX={frameBorderX}
              frameBorderY={frameBorderY}
            >
              <div style={{ padding: 5, paddingBottom: 10, height: "100%" }}>
                <ScrollableContainer
                  key={uistate.choices.map((c) => `${c.text} ${c.jumpId} ${c.active}`).join("#")}
                >
                  {choices}
                </ScrollableContainer>
              </div>
            </QuestPlayFrameText>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: `calc(${IMAGE_SIZE_X}px)`,
              height: `calc(${IMAGE_SIZE_Y}px)`,
            }}
          >
            <QuestPlayFrameImage
              fitHeight={true}
              frameBorderX={frameBorderX}
              frameBorderY={frameBorderY}
            >
              <QuestPlayImageDesktop src={imageUrl} allImagesUrls={allImagesUrls} />
            </QuestPlayFrameImage>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: `calc(${IMAGE_SIZE_X}px)`,
              height: `calc(100% - ${IMAGE_SIZE_Y}px)`,
            }}
          >
            <QuestPlayFrameText
              fitHeight={true}
              frameBorderX={frameBorderX}
              frameBorderY={frameBorderY}
            >
              <div style={{ padding: 5, paddingBottom: 20, height: "100%" }}>
                <ScrollableContainer
                  // No key here
                  key="params"
                  forceMeRecalculateHeight={paramsStrings}
                  //key={uistate.paramsState.map((p) => p).join("#")}
                >
                  <div
                    style={{
                      minHeight: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    {params}
                    {
                      // Just for testing
                      new Array(0).fill(0).map((_, i) => (
                        <div style={{ border: "1px solid green" }}>{i}</div>
                      ))
                    }
                  </div>
                </ScrollableContainer>
              </div>
            </QuestPlayFrameText>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
          }}
        >
          <GamePlayButton ariaLabel={l.restart} onClick={onRestartButtonClick}>
            {restartButtonContent}
          </GamePlayButton>
          {player.allowBackButton && (
            <GamePlayButton
              disabled={previousGameState === null}
              onClick={onBackButtonClick}
              ariaLabel={l.stepBack}
            >
              {backButtonContent}
            </GamePlayButton>
          )}
          <GamePlayButton onClick={onMusicButtonClick} ariaLabel={l.toggleMusic}>
            {musicButtonContent}
          </GamePlayButton>
          <GamePlayButton onClick={onFullscreenButtonClick} ariaLabel={l.toggleFullscreen}>
            {fullscreenButtonContent}
          </GamePlayButton>
          <GamePlayButton onClick={onExit} ariaLabel={l.exit}>
            {exitButtonContent}
          </GamePlayButton>
        </div>

        {reallyRestartContent && (
          <div
            style={{
              position: "absolute",
              right: "30%",
              left: "30%",
              bottom: "30%",
              top: "30%",
            }}
          >
            {reallyRestartContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/questplay/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "70% 0px",
      }}
      className="game-root"
    >
      {musicAndSound}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 10,
        }}
      >
        <GamePlayButton onClick={onRestartButtonClick} ariaLabel={l.restart}>
          {restartButtonContent}
        </GamePlayButton>
        {player.allowBackButton && (
          <GamePlayButton
            disabled={previousGameState === null}
            onClick={onBackButtonClick}
            ariaLabel={l.stepBack}
          >
            {backButtonContent}
          </GamePlayButton>
        )}
        <GamePlayButton onClick={onMusicButtonClick} ariaLabel={l.toggleMusic}>
          {musicButtonContent}
        </GamePlayButton>
        <GamePlayButton onClick={onFullscreenButtonClick} ariaLabel={l.toggleFullscreen}>
          {fullscreenButtonContent}
        </GamePlayButton>
        <GamePlayButton onClick={onExit} ariaLabel={l.exit}>
          {exitButtonContent}
        </GamePlayButton>
      </div>
      <div
        style={{
          display: imageUrl ? undefined : "none",
        }}
      >
        <QuestPlayFrameImage
          fitHeight={false}
          frameBorderX={frameBorderX}
          frameBorderY={frameBorderY}
        >
          <QuestPlayImageMobile src={imageUrl} allImagesUrls={allImagesUrls} />
        </QuestPlayFrameImage>
      </div>
      <div style={{}}>
        <QuestPlayFrameText
          fitHeight={false}
          frameBorderX={frameBorderX}
          frameBorderY={frameBorderY}
        >
          <div style={{ padding: 5 }}>{locationText}</div>
        </QuestPlayFrameText>
      </div>

      <div
        style={{
          display: paramsStrings.filter((x) => x.trim()).length > 0 ? undefined : "none",
        }}
      >
        <QuestPlayFrameText
          fitHeight={false}
          frameBorderX={frameBorderX}
          frameBorderY={frameBorderY}
        >
          <div
            style={{
              padding: 5,
            }}
          >
            {params}
          </div>
        </QuestPlayFrameText>
      </div>
      <div style={{}}>
        <QuestPlayFrameText
          fitHeight={false}
          frameBorderX={frameBorderX}
          frameBorderY={frameBorderY}
        >
          <div style={{ padding: 5 }}>{choices}</div>
        </QuestPlayFrameText>
      </div>

      {reallyRestartContent && (
        <div
          style={{
            position: "fixed",
            right: "5%",
            left: "5%",
            bottom: "30%",
            top: "30%",
          }}
        >
          {reallyRestartContent}
        </div>
      )}
    </div>
  );
}
