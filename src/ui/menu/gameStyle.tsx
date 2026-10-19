import * as React from "react";

import { useDarkTheme } from "../questPlay/questPlay.metatheme";
import { QuestPlayFrameTiles } from "../common/gameFrame";
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
 * Inner background of the menu frames: subtle vertical gradient + soft
 * diagonal "waves" (small amplitude sheen)
 */
const MENU_FRAME_BACKGROUND = [
  "repeating-linear-gradient(105deg, rgba(255, 255, 255, 0.012) 0px, rgba(160, 200, 210, 0.03) 120px, rgba(255, 255, 255, 0.015) 240px, rgba(0, 0, 0, 0.025) 360px)",
  "linear-gradient(180deg, rgba(25, 33, 37, 0.94) 0%, rgba(13, 17, 19, 0.95) 55%, rgba(7, 9, 11, 0.97) 100%)",
].join(", ");

/**
 * Metallic frame panel with the gradient background (menu only, quest play keeps flat black)
 */
const MenuFrame: React.FC<{
  fitHeight?: boolean;
}> = ({ children, fitHeight }) => {
  const frameVert = MENU_FRAME_BORDER;
  const frameHor = MENU_FRAME_BORDER;
  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        minHeight: 110,
        height: fitHeight ? "100%" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: frameVert,
          top: frameHor,
          right: frameVert,
          bottom: frameHor,
          background: MENU_FRAME_BACKGROUND,
        }}
      />
      <QuestPlayFrameTiles frameBorderX={MENU_FRAME_BORDER} frameBorderY={MENU_FRAME_BORDER} />
      <div
        style={{
          paddingLeft: frameHor * 2,
          paddingRight: frameHor * 2,
          paddingTop: frameVert * 2,
          paddingBottom: frameVert * 2,
          position: "relative",
          height: fitHeight ? "100%" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * A regular frame panel for the menu content
 */
export const GameStyleFrame: React.FC<{
  fitHeight?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, fitHeight, className, style }) => {
  return (
    <div className={className} style={style}>
      <MenuFrame fitHeight={fitHeight}>
        <div className="game-menu-frame-inner">{children}</div>
      </MenuFrame>
    </div>
  );
};

/**
 * A small frame panel, used for quest list rows
 */
export const GameStyleFrameSmall: React.FC<{ className?: string }> = ({ children, className }) => {
  return (
    <div className={className}>
      <MenuFrame fitHeight={false}>
        <div className="game-menu-row-inner">{children}</div>
      </MenuFrame>
    </div>
  );
};
