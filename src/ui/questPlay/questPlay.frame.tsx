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
v_      |_  _|____|___________|_
|       |    |                ^
|_      |____|                \ CORNER_HEIGHT
^       |    |
        |    |
        |
        |
        |
        |
*/

const FRAME_PIC_CORNER_WIDTH = 75;
const FRAME_PIC_CORNER_HEIGHT = 55;
const FRAME_PIC_CORNER_WIDTH_2 = 80;
const FRAME_PIC_CORNER_HEIGHT_2 = 120;
const FRAME_PIC_SIZE_X = 1093;
const FRAME_PIC_SIZE_Y = 825;

const FRAME_HEIGHT = 35;
const FRAME_WIDTH = 35;

const PIC_SCALING_X = FRAME_WIDTH / FRAME_PIC_CORNER_WIDTH;
const PIC_SCALING_Y = FRAME_HEIGHT / FRAME_PIC_CORNER_HEIGHT;

const IMAGE_PADDING_X = 20;
const IMAGE_PADDING_Y = 25;

export const QuestPlayFrame2: React.FC<{
  height: number | string;
}> = ({ children, height }) => {
  const backgroundSize =
    `${FRAME_PIC_SIZE_X * PIC_SCALING_X}px ` + `${FRAME_PIC_SIZE_Y * PIC_SCALING_Y}px`;
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
          width: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          height: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          backgroundImage: "url('/questplay/frame.png')",
          backgroundSize,
        }}
      />

      <div
        // left-top-top
        style={{
          position: "absolute",
          left: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          top: 0,
          width: FRAME_PIC_CORNER_WIDTH_2 * PIC_SCALING_X,
          height: FRAME_PIC_CORNER_HEIGHT * PIC_SCALING_Y,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundPosition: `${-FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X}px ` + `0px`,
          backgroundSize,
        }}
      />

      <div
        // bottom-left
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          height: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundSize,
          backgroundPosition: "left bottom",
        }}
      />

      <div
        // bottom-left-left
        style={{
          position: "absolute",
          left: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          bottom: 0,
          width: FRAME_PIC_CORNER_WIDTH_2 * PIC_SCALING_X,
          height: FRAME_PIC_CORNER_HEIGHT * PIC_SCALING_Y,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundSize,
          backgroundPosition: `-${FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X}px bottom`,
        }}
      />

      <div
        //left
        style={{
          position: "absolute",
          left: 0,
          top: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          bottom: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          width: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundPosition: `-0px center`,

          backgroundSize:
            `${FRAME_PIC_SIZE_X * PIC_SCALING_X}px ` +
            `${
              (FRAME_PIC_SIZE_Y - 2 * (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2)) *
              PIC_SCALING_Y
            }%`,
        }}
      />

      <div
        // top-right
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          height: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          backgroundImage: "url('/questplay/frame.png')",
          backgroundPosition: `+${FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X}px top`,
          backgroundSize,
        }}
      />

      <div
        // top-right-right
        style={{
          position: "absolute",
          right: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          top: 0,
          width: FRAME_PIC_CORNER_WIDTH_2 * PIC_SCALING_X,
          height: FRAME_PIC_CORNER_HEIGHT * PIC_SCALING_Y,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundPosition:
            `-${
              (FRAME_PIC_SIZE_X - FRAME_PIC_CORNER_WIDTH - FRAME_PIC_CORNER_WIDTH_2) * PIC_SCALING_X
            }px ` + `0px`,
          backgroundSize,
        }}
      />

      <div
        // bottom-right
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          height: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundSize,
          backgroundPosition: "right bottom",
        }}
      />

      <div
        // bottom-rigt-right
        style={{
          position: "absolute",
          right: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          bottom: 0,
          width: FRAME_PIC_CORNER_WIDTH_2 * PIC_SCALING_X,
          height: FRAME_PIC_CORNER_HEIGHT * PIC_SCALING_Y,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundSize,
          backgroundPosition: `-${
            (FRAME_PIC_SIZE_X - FRAME_PIC_CORNER_WIDTH - FRAME_PIC_CORNER_WIDTH_2) * PIC_SCALING_X
          }px bottom`,
        }}
      />

      {/*
      <div
        //left
        style={{
          position: "absolute",
          left: 0,
          top: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          bottom: (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2) * PIC_SCALING_Y,
          width: FRAME_PIC_CORNER_WIDTH * PIC_SCALING_X,
          backgroundImage: `url('/questplay/frame.png')`,
          backgroundPosition: `-0px center`,

          backgroundSize:
            `${FRAME_PIC_SIZE_X * PIC_SCALING_X}px ` +
            `${
              (FRAME_PIC_SIZE_Y - 2 * (FRAME_PIC_CORNER_HEIGHT + FRAME_PIC_CORNER_HEIGHT_2)) *
              PIC_SCALING_Y
            }%`,
        }}
      />
      */}
    </div>
  );
};
