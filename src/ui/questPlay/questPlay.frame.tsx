import * as React from "react";

const FRAME_WIDTH = 30;
const FRAME_HEIGHT = 30;

const backgroundSize = "100% 100%";

export const FRAME_BORDER_X = FRAME_WIDTH / 2;
export const FRAME_BORDER_Y = FRAME_HEIGHT / 2;

const QuestPlayFrameBackground: React.FC<{}> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: FRAME_BORDER_X,
      top: FRAME_BORDER_Y,
      right: FRAME_BORDER_X,
      bottom: FRAME_BORDER_Y,
      backgroundColor: "black",
      opacity: 0.8,
    }}
  >
    {children}
  </div>
);

const QuestPlayFrameTiles = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3,
        backgroundImage: "url('/questplay/frame-left-top.png')",
        backgroundSize,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: FRAME_WIDTH,
        top: 0,
        width: FRAME_WIDTH * 2,
        height: FRAME_HEIGHT,
        backgroundImage: "url('/questplay/frame-left-top-2.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        left: FRAME_WIDTH * 3,
        right: FRAME_WIDTH * 3,
        top: 0,
        height: FRAME_HEIGHT,
        backgroundImage: "url('/questplay/frame-top.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        right: FRAME_WIDTH,
        top: 0,
        width: FRAME_WIDTH * 2,
        height: FRAME_HEIGHT,
        backgroundImage: "url('/questplay/frame-right-top-2.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3,
        backgroundImage: "url('/questplay/frame-right-top.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        left: 0,
        top: FRAME_HEIGHT * 3,
        bottom: FRAME_HEIGHT * 3,
        width: FRAME_WIDTH,
        backgroundImage: "url('/questplay/frame-left.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        right: 0,
        top: FRAME_HEIGHT * 3,
        bottom: FRAME_HEIGHT * 3,
        width: FRAME_WIDTH,
        backgroundImage: "url('/questplay/frame-right.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3,
        backgroundImage: "url('/questplay/frame-left-bottom.png')",
        backgroundSize,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: FRAME_WIDTH,
        bottom: 0,
        width: FRAME_WIDTH * 2,
        height: FRAME_HEIGHT,
        backgroundImage: "url('/questplay/frame-left-bottom-2.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        left: FRAME_WIDTH * 3,
        right: FRAME_WIDTH * 3,
        bottom: 0,
        height: FRAME_HEIGHT,
        backgroundImage: "url('/questplay/frame-bottom.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        right: FRAME_WIDTH,
        bottom: 0,
        width: FRAME_WIDTH * 2,
        height: FRAME_HEIGHT,
        backgroundImage: "url('/questplay/frame-right-bottom-2.png')",
        backgroundSize,
      }}
    />

    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3,
        backgroundImage: "url('/questplay/frame-right-bottom.png')",
        backgroundSize,
      }}
    />
  </>
);
export const QuestPlayFrameImage: React.FC<{
  fitHeight: boolean;
}> = ({ children, fitHeight }) => {
  return (
    <div
      style={{
        width: "100%",
        height: fitHeight ? "100%" : undefined,
        position: "relative",
      }}
    >
      <div
        style={{
          paddingLeft: FRAME_BORDER_X,
          paddingTop: FRAME_BORDER_Y,
          paddingRight: FRAME_BORDER_X,
          paddingBottom: FRAME_BORDER_Y,
          height: fitHeight ? "100%" : undefined,
        }}
      >
        {children}
      </div>

      <QuestPlayFrameTiles />
    </div>
  );
};

export const QuestPlayFrameText: React.FC<{
  fitHeight: boolean;
}> = ({ children, fitHeight }) => {
  return (
    <div
      style={{
        height: fitHeight ? "100%" : undefined,
        width: "100%",
        position: "relative",
        minHeight: 100,
      }}
    >
      <QuestPlayFrameBackground />
      <QuestPlayFrameTiles />
      <div
        style={{
          paddingLeft: FRAME_WIDTH,
          paddingRight: FRAME_WIDTH,
          paddingTop: FRAME_HEIGHT,
          paddingBottom: FRAME_HEIGHT,
          position: "relative",
          height: fitHeight ? "100%" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
