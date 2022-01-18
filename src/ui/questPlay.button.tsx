import * as React from "react";
import "./questPlay.button.css";

export const GamePlayButton: React.FC<{
  right: number;
  bottom: number;
  onClick: () => void;
}> = ({ children, right, bottom, onClick }) => {
  return (
    <button
      className="gameplay-button"
      style={{
        right,
        bottom,
      }}
    >
      <div className="gameplay-button-background" />
      <div className="gameplay-button-content">{children}</div>
    </button>
  );
};
