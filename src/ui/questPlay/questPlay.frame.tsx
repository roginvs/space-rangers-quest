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

  CORNER_HEIGHT
/
|
|
|            <----> CORNER_WIDTH_2           
|
|       <----> CORNER_WIDTH
|_      ______________________v 
^       |    |    |           |
|       |    |____|___________|
|       |    |                ^
v_      |____|                \ CORNER_HEIGHT_2
        |    |
        |    |
        |
        |
        |
        |
*/

const CORNER_WIDTH = 80;
const CORNER_HEIGHT = 180;
const CORNER_WIDTH_2 = 100;
const CORNER_HEIGHT_2 = 55;

export const QuestPlayFrame2: React.FC<{
  height: number | string;
}> = ({ children, height }) => {
  return (
    <div
      style={{
        height,
        width: "100%",
      }}
    ></div>
  );
};
