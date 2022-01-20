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
import { LangTexts } from "../lang";
import { QuestPlayImage } from "./questPlay.image";
import { DeepImmutable } from "../../lib/qmplayer/deepImmutable";
import { transformMedianameToUrl } from "./transformMediaNameToUrl";
import { DATA_DIR } from "../consts";
import { Sound } from "./questPlay.sound";
import { ScrollableContainer } from "./questPlay.scrollcontainer";
import {
  FRAME_BORDER_X,
  FRAME_BORDER_Y,
  QuestPlayFrameImage,
  QuestPlayFrameText,
} from "./questPlay.frame";
import { IMAGE_SIZE_X, IMAGE_SIZE_Y } from "./questPlay.consts";
import { GamePlayButton } from "./questPlay.button";
import { assertNever } from "../../assertNever";

/*

Styling for desktop version is very very hacky.

TODO: Make a proper frame component, maybe using subimages from the image

*/

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
  React.useEffect(() => setReallyRestart(false), [quest, gameState, player]);

  const isMobile = windowInnerWidth < MOBILE_THRESHOLD;

  const uistate = getUIState(quest, gameState, player);

  const imageUrl = transformMedianameToUrl(uistate.imageName, "img");
  const allImagesUrls = Object.keys(getAllMediaFromQmm(quest).images).map((imageName) =>
    transformMedianameToUrl(imageName, "img"),
  );

  const locationText = (
    <DivFadeinCss key={`${uistate.text}#${gameState.performedJumps.length}`}>
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
                const newState = performJump(choice.jumpId, quest, gameState);
                setGameState(newState);

                //window.scrollTo(0, isMobile ? 44 : 0);
                window.scrollTo(0, isMobile ? 62 : 0);
              }}
              className={"game " + (choice.active ? "" : "disabled game-inactive")}
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

  const exitButtonContent = busySaving ? (
    <i className="fa fa-refresh fa-spin fa-fw" />
  ) : (
    <i className="fa fa-external-link fa-fw" />
  );
  const musicButtonContent = (
    <i className={classnames("fa fa-fw", !isMusic ? "fa-volume-off" : "fa-volume-up")} />
  );
  const onMusicButtonClick = React.useCallback(() => {
    setIsMusic(!isMusic);
  }, [isMusic]);

  const restartButtonContent = <i className="fa fa-fast-backward fa-fw" />;

  const onRestartButtonClick = React.useCallback(() => {
    const uiState = getUIState(quest, gameState, player);
    if (
      !uiState ||
      uiState.gameState === "dead" ||
      uiState.gameState === "fail" ||
      uiState.gameState === "win" ||
      reallyRestart
    ) {
      const newGameState = showTaskInfoOnQuestStart
        ? initRandomGame(quest)
        : initRandomGameAndDoFirstStep(quest);
      setGameState(newGameState);
      setReallyRestart(false);
    } else {
      setReallyRestart(true);
    }
  }, [gameState, quest, player, showTaskInfoOnQuestStart, reallyRestart]);

  const controlButtons = (
    <>
      <button className="btn btn-light mr-1" onClick={onRestartButtonClick}>
        {restartButtonContent}
      </button>

      <button className="btn btn-light mr-1" onClick={onMusicButtonClick}>
        {musicButtonContent}
      </button>

      <button className="btn btn-light mr-1" onClick={onExit}>
        {exitButtonContent}
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

  const reallyRestartContent = reallyRestart ? (
    <QuestPlayFrameText fitHeight={true}>
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
              const newGameState = showTaskInfoOnQuestStart
                ? initRandomGame(quest)
                : initRandomGameAndDoFirstStep(quest);
              setGameState(newGameState);
              setReallyRestart(false);
            }}
          >
            {l.yes}
          </GamePlayButton>
          <GamePlayButton onClick={() => setReallyRestart(false)}>{l.no}</GamePlayButton>
        </div>
      </div>
    </QuestPlayFrameText>
  ) : null;

  if (!isMobile) {
    return (
      <div
        style={{
          height: "100vh",
          position: "relative",
          backgroundImage: "url('/questplay/background.jpg')",
          backgroundSize: "cover",
          justifyContent: "center",
          alignItems: "stretch",
        }}
        className="new-style"
      >
        {musicAndSound}
        <div
          style={{
            maxWidth: 1300,
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
              width: `calc(100% - ${IMAGE_SIZE_X + FRAME_BORDER_X * 2}px)`,
              height: `calc(${IMAGE_SIZE_Y + FRAME_BORDER_Y * 2}px)`,
            }}
          >
            <QuestPlayFrameText fitHeight={true}>
              <ScrollableContainer key={uistate.text}>
                <div style={{ padding: 5, paddingRight: 20 }}>{locationText}</div>
              </ScrollableContainer>
            </QuestPlayFrameText>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: `calc(100% - ${IMAGE_SIZE_X + FRAME_BORDER_X * 2}px)`,
              height: `calc(100% - ${IMAGE_SIZE_Y + FRAME_BORDER_Y * 2}px)`,
            }}
          >
            <QuestPlayFrameText fitHeight={true}>
              <ScrollableContainer
                // TODO: Use proper key = join choices
                key={uistate.text}
              >
                <div style={{ padding: 5, paddingRight: 20 }}>{choices}</div>
              </ScrollableContainer>
            </QuestPlayFrameText>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: `calc(${IMAGE_SIZE_X + FRAME_BORDER_X * 2}px)`,
              height: `calc(${IMAGE_SIZE_Y + FRAME_BORDER_Y * 2}px)`,
            }}
          >
            <QuestPlayFrameImage fitHeight={true}>
              <QuestPlayImage src={imageUrl} allImagesUrls={allImagesUrls} />
            </QuestPlayFrameImage>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: `calc(${IMAGE_SIZE_X + FRAME_BORDER_X * 2}px)`,
              height: `calc(100% - ${IMAGE_SIZE_Y + FRAME_BORDER_Y * 2}px)`,
            }}
          >
            <QuestPlayFrameText fitHeight={true}>
              <ScrollableContainer>
                <div
                  style={{
                    padding: 5,
                    paddingRight: 20,
                    paddingBottom: 20,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  {params}
                </div>
              </ScrollableContainer>
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
          <GamePlayButton onClick={onRestartButtonClick}>{restartButtonContent}</GamePlayButton>
          <GamePlayButton onClick={onMusicButtonClick}>{musicButtonContent}</GamePlayButton>
          <GamePlayButton onClick={onExit}>{exitButtonContent}</GamePlayButton>
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

  if (1 + 1 === 2) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundImage: "url('/questplay/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "70% 0px",
        }}
        className="new-style"
      >
        {musicAndSound}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 10,
          }}
        >
          <GamePlayButton onClick={onRestartButtonClick}>{restartButtonContent}</GamePlayButton>
          <GamePlayButton onClick={onMusicButtonClick}>{musicButtonContent}</GamePlayButton>
          <GamePlayButton onClick={onExit}>{exitButtonContent}</GamePlayButton>
        </div>
        <div
          style={
            {
              //
            }
          }
        >
          <QuestPlayFrameImage fitHeight={false}>
            <QuestPlayImage src={imageUrl} allImagesUrls={allImagesUrls} />
          </QuestPlayFrameImage>
        </div>
        <div style={{}}>
          <QuestPlayFrameText fitHeight={false}>
            <div style={{ padding: 5 }}>{locationText}</div>
          </QuestPlayFrameText>
        </div>

        <div
          style={{
            display: paramsStrings.filter((x) => x.trim()).length > 0 ? undefined : "none",
          }}
        >
          <QuestPlayFrameText fitHeight={false}>
            <div
              style={{
                padding: 5,
              }}
            >
              {params}
            </div>
          </QuestPlayFrameText>
        </div>
        <div
          style={
            {
              //
            }
          }
        >
          <QuestPlayFrameText fitHeight={false}>
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

  return (
    <div className="bootstrap-style">
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
          assertNever(isMobile)
        )}
      </div>
    </div>
  );
}