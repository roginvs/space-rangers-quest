import * as React from "react";
import "./questPlay.button.css";

export const GamePlayButton: React.FC<{
  i: number;
  onClick: () => void;
}> = ({ children, i, onClick }) => {
  return (
    <button
      className="gameplay-button"
      style={{
        right: 10 + i * 65,
        bottom: 10,
      }}
      onClick={onClick}
    >
      <div className="gameplay-button-background" />
      <div className="gameplay-button-content">{children}</div>
    </button>
  );
};
