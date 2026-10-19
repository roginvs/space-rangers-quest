import * as React from "react";

import { useDarkTheme } from "../questPlay/questPlay.metatheme";
import { QuestPlayFrameText } from "../common/gameFrame";
import "./gameMenu.css";

/**
 * Full screen wrapper with the same visuals as the quest play screen
 * (background, colors, dark theme color)
 */
export const GameStyleRoot: React.FC<{}> = ({ children }) => {
  useDarkTheme();
  return <div className="game-root game-style-root">{children}</div>;
};

const MENU_FRAME_BORDER = 10;

/**
 * A panel with the same metallic frame as in the quest play screen
 */
export const GameStyleFrame: React.FC<{
  fitHeight?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, fitHeight, className, style }) => {
  return (
    <div className={className} style={style}>
      <QuestPlayFrameText fitHeight={fitHeight || false} frameBorderX={MENU_FRAME_BORDER} frameBorderY={MENU_FRAME_BORDER}>
        <div className="game-menu-frame-inner">{children}</div>
      </QuestPlayFrameText>
    </div>
  );
};

/**
 * A small frame panel, used for quest cards (smaller paddings)
 */
/**
 * A small frame panel, used for quest list rows
 */
export const GameStyleFrameSmall: React.FC<{ className?: string }> = ({ children, className }) => {
  return (
    <div className={className}>
      <QuestPlayFrameText fitHeight={false} frameBorderX={MENU_FRAME_BORDER} frameBorderY={MENU_FRAME_BORDER}>
        <div className="game-menu-row-inner">{children}</div>
      </QuestPlayFrameText>
    </div>
  );
};
