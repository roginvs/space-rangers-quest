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
const FRAME_PICTURE_SIZE_X = 1093;
const FRAME_PICTURE_SIZE_Y = 825;

const IMAGE_PADDING_X = 20;
const IMAGE_PADDING_Y = 25;

export const QuestPlayFrame2: React.FC<{
  height: number | string;
}> = ({ children, height }) => {
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
        // left-top
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CORNER_WIDTH,
          height: CORNER_HEIGHT + CORNER_HEIGHT_2,
          background: "url('/questplay/frame.png')",
        }}
      />
      <div
        // left-top
        style={{
          position: "absolute",
          left: CORNER_WIDTH,
          top: 0,
          width: CORNER_WIDTH_2,
          height: CORNER_HEIGHT,
          background: `url('/questplay/frame.png') -${CORNER_WIDTH}px 0px`,
        }}
      />

      <div
        // left-bottom
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: CORNER_WIDTH,
          height: CORNER_HEIGHT + CORNER_HEIGHT_2,
          background: `url('/questplay/frame.png') left bottom`,
        }}
      />
      <div
        //left-bottom
        style={{
          position: "absolute",
          left: CORNER_WIDTH,
          bottom: 0,
          width: CORNER_WIDTH_2,
          height: CORNER_HEIGHT,
          background: `url('/questplay/frame.png') -${CORNER_WIDTH}px bottom`,
        }}
      />

      <div
        //left
        style={{
          position: "absolute",
          left: 0,
          top: CORNER_HEIGHT + CORNER_HEIGHT_2,
          bottom: CORNER_HEIGHT + CORNER_HEIGHT_2,
          width: CORNER_WIDTH,
          background: `url('/questplay/frame.png') -0px center`,
          backgroundSize:
            `${FRAME_PICTURE_SIZE_X}px ` +
            `${FRAME_PICTURE_SIZE_Y - 2 * (CORNER_HEIGHT + CORNER_HEIGHT_2)}%`,
        }}
      />
    </div>
  );
};
