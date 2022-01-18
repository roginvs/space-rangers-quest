import * as React from "react";

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
