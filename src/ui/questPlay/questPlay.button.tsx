import classNames from "classnames";
import * as React from "react";
import "./questPlay.button.css";

export const GamePlayButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ children, onClick, disabled }) => {
  return (
    <button className="gameplay-button" onClick={onClick} disabled={disabled}>
      <div className="gameplay-button-background" />
      <div
        className={classNames("gameplay-button-content", {
          "gameplay-button-content-disabled": disabled,
        })}
      >
        {children}
      </div>
    </button>
  );
};
