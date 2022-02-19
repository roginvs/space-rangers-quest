import * as React from "react";

const backgroundSize = "100% 100%";

interface FrameBorderProps {
  frameBorderX: number;
  frameBorderY: number;
}

function getFrameSize({ frameBorderX, frameBorderY }: FrameBorderProps) {
  const frameWidth = frameBorderX * 2;
  const frameHeight = frameBorderY * 2;
  return { frameWidth, frameHeight };
}

const QuestPlayFrameBackground: React.FC<FrameBorderProps> = ({
  children,
  frameBorderX,
  frameBorderY,
}) => (
  <div
    style={{
      position: "absolute",
      left: frameBorderX,
      top: frameBorderY,
      right: frameBorderX,
      bottom: frameBorderY,
      backgroundColor: "black",
      opacity: 0.8,
    }}
  >
    {children}
  </div>
);

const QuestPlayFrameTiles = ({ frameBorderX, frameBorderY }: FrameBorderProps) => {
  const { frameWidth, frameHeight } = getFrameSize({ frameBorderX, frameBorderY });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: frameWidth,
          height: frameHeight * 3,
          backgroundImage: "url('/questplay/frame-left-top.png')",
          backgroundSize,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: frameWidth,
          top: 0,
          width: frameWidth * 2,
          height: frameHeight,
          backgroundImage: "url('/questplay/frame-left-top-2.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: frameWidth * 3,
          right: frameWidth * 3,
          top: 0,
          height: frameHeight,
          backgroundImage: "url('/questplay/frame-top.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: frameWidth,
          top: 0,
          width: frameWidth * 2,
          height: frameHeight,
          backgroundImage: "url('/questplay/frame-right-top-2.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: frameWidth,
          height: frameHeight * 3,
          backgroundImage: "url('/questplay/frame-right-top.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: frameHeight * 3,
          bottom: frameHeight * 3,
          width: frameWidth,
          backgroundImage: "url('/questplay/frame-left.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 0,
          top: frameHeight * 3,
          bottom: frameHeight * 3,
          width: frameWidth,
          backgroundImage: "url('/questplay/frame-right.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: frameWidth,
          height: frameHeight * 3,
          backgroundImage: "url('/questplay/frame-left-bottom.png')",
          backgroundSize,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: frameWidth,
          bottom: 0,
          width: frameWidth * 2,
          height: frameHeight,
          backgroundImage: "url('/questplay/frame-left-bottom-2.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: frameWidth * 3,
          right: frameWidth * 3,
          bottom: 0,
          height: frameHeight,
          backgroundImage: "url('/questplay/frame-bottom.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: frameWidth,
          bottom: 0,
          width: frameWidth * 2,
          height: frameHeight,
          backgroundImage: "url('/questplay/frame-right-bottom-2.png')",
          backgroundSize,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: frameWidth,
          height: frameHeight * 3,
          backgroundImage: "url('/questplay/frame-right-bottom.png')",
          backgroundSize,
        }}
      />
    </>
  );
};

export const QuestPlayFrameImage: React.FC<
  {
    fitHeight: boolean;
  } & FrameBorderProps
> = ({ children, fitHeight, frameBorderX, frameBorderY }) => {
  return (
    <div
      style={{
        width: "100%",
        height: fitHeight ? "100%" : undefined,
        position: "relative",
      }}
    >
      <QuestPlayFrameBackground frameBorderX={frameBorderX} frameBorderY={frameBorderY} />
      <div
        style={{
          paddingLeft: frameBorderX,
          paddingTop: frameBorderY,
          paddingRight: frameBorderX,
          paddingBottom: frameBorderY,
          height: fitHeight ? "100%" : undefined,
        }}
      >
        {children}
      </div>
      <QuestPlayFrameTiles frameBorderX={frameBorderX} frameBorderY={frameBorderY} />
    </div>
  );
};

/**
 * It renders children over the frame. This is needed for scroll to work
 */
export const QuestPlayFrameText: React.FC<
  {
    fitHeight: boolean;
  } & FrameBorderProps
> = ({ children, fitHeight, frameBorderX, frameBorderY }) => {
  const { frameWidth, frameHeight } = getFrameSize({ frameBorderX, frameBorderY });

  return (
    <div
      style={{
        height: fitHeight ? "100%" : undefined,
        width: "100%",
        position: "relative",
        minHeight: 100,
      }}
    >
      <QuestPlayFrameBackground frameBorderX={frameBorderX} frameBorderY={frameBorderY} />
      <QuestPlayFrameTiles frameBorderX={frameBorderX} frameBorderY={frameBorderY} />
      <div
        style={{
          paddingLeft: frameWidth,
          paddingRight: frameWidth,
          paddingTop: frameHeight,
          paddingBottom: frameHeight,
          position: "relative",
          height: fitHeight ? "100%" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
