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

  return (
    <div
      style={{
        position: "fixed",
        left: isLeft ? clientX + DISTANCE : undefined,
        right: isLeft ? undefined : windowX - clientX + DISTANCE,
        top: isTop ? clientY + DISTANCE : undefined,
        bottom: isTop ? undefined : windowY - clientY + DISTANCE,
      }}
    >
      {children}
    </div>
  );
};
