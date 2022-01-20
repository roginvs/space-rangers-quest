import * as React from "react";

/**
 * This is hacky implementation of frame.
 * This component will take all space from parent which must be positioned
 */
export const QuestPlayFrame: React.FC<{
  left: number;
  top: number;
  right: number;
  bottom: number;
  onTop: boolean;
}> = ({ children, left, top, right, bottom, onTop }) => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "5%",
          top: "5%",
          right: "5%",
          bottom: "5%",
          backgroundColor: "black",
          opacity: 0.8,
        }}
      ></div>
      {!onTop && (
        <div
          style={{
            position: "absolute",
            left,
            top,
            right,
            bottom,
          }}
        >
          {children}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          right: 10,
          bottom: 10,
          backgroundImage: "url('/questplay/frame.png')",
          backgroundSize: "100% 100%",
        }}
      ></div>
      {onTop && (
        <div
          style={{
            position: "absolute",
            left,
            top,
            right,
            bottom,
          }}
        >
          {children}
        </div>
      )}
    </>
  );
};

/*

  CORNER_HEIGHT_2
/
|
|
|            <----> CORNER_WIDTH_2           
|
|       <----> CORNER_WIDTH
|       ______________________v_
|       |    |    |           |
v_      |____|____|___________|_
|       |    |                ^
|_      |____|                \ CORNER_HEIGHT
^       |    |
        |    |
        |
        |
        |
        |
*/

const CORNER_WIDTH = 75;
const CORNER_HEIGHT = 55;
const CORNER_WIDTH_2 = 80;
const CORNER_HEIGHT_2 = 120;

const IMAGE_PADDING_X = 20;
const IMAGE_PADDING_Y = 25;

export const QuestPlayFrame2: React.FC<{
  height: number | string;
}> = ({ children, height }) => {
  const DEBUG_BORDER = "1px solid black";
  return (
    <div
      style={{
        height,
        width: "100%",
        position: "relative",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CORNER_WIDTH,
          height: CORNER_HEIGHT + CORNER_HEIGHT_2,
          border: DEBUG_BORDER,
          background: "url('/questplay/frame.png')",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: CORNER_WIDTH,
          top: 0,
          width: CORNER_WIDTH_2,
          height: CORNER_HEIGHT,
          border: DEBUG_BORDER,
          background: `url('/questplay/frame.png') -${CORNER_WIDTH}px 0px`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: CORNER_WIDTH,
          height: CORNER_HEIGHT + CORNER_HEIGHT_2,
          border: DEBUG_BORDER,
          background: `url('/questplay/frame.png') left bottom`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: CORNER_WIDTH,
          bottom: 0,
          width: CORNER_WIDTH_2,
          height: CORNER_HEIGHT,
          border: DEBUG_BORDER,
          background: `url('/questplay/frame.png') -${CORNER_WIDTH}px bottom`,
        }}
      />
    </div>
  );
};
