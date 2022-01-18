import * as React from "react";
import "./questPlay.button.css";

export const GamePlayButton: React.FC<{
  onClick: () => void;
}> = ({ children, onClick }) => {
  return (
    <button className="gameplay-button" onClick={onClick}>
      <div className="gameplay-button-background" />
      <div className="gameplay-button-content">{children}</div>
    </button>
  );
};
