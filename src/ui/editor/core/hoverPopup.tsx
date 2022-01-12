import * as React from "react";

const DISTANCE = 40;

export const HoverPopup: React.FC<{
  clientX: number;
  clientY: number;
}> = ({ clientX, clientY, children }) => {
  const windowX = window.innerWidth;
  const windowY = window.innerHeight;

  const isLeft = clientX < windowX / 2;
  const isTop = clientY < windowY / 2;

  const isVerticalCenter = clientY > windowY * 0.25 && clientY < windowY * 0.75;

  return (
    <div
      style={{
        position: "fixed",
        left: isLeft ? clientX + DISTANCE : undefined,
        right: isLeft ? undefined : windowX - clientX + DISTANCE,
        top: isVerticalCenter ? "50%" : isTop ? clientY + DISTANCE : undefined,
        bottom: isVerticalCenter ? undefined : isTop ? undefined : windowY - clientY + DISTANCE,
        transform: isVerticalCenter ? "translateY(-50%)" : undefined,
        backgroundColor: "#e7e298",
        borderRadius: 5,
        margin: 30,
        padding: 10,
        boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)",
      }}
    >
      {children}
    </div>
  );
};
